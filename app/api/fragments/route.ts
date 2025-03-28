import { NextRequest, NextResponse } from 'next/server';
import { query, withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth"; // Update import to use default export
import { getUser } from '@/lib/auth'; // For your custom auth
import { RowDataPacket } from 'mysql2';

// Define interfaces for our database objects
interface FragmentRow extends RowDataPacket {
  id: number;
  content: string;
  category: string;
  tags?: string;
  activity_id?: number | null;
  user_id?: string;
  created_at: string;
  activity_name?: string;
  usage_count?: number;
  isOwner?: boolean;
}

// Define a type for the processed fragment with parsed tags
interface ProcessedFragment extends Omit<FragmentRow, 'tags'> {
  tags: string[];
}

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const userOnly = searchParams.get('userOnly') === 'true';
  const activityId = searchParams.get('activityId');
  const categoryFilter = searchParams.get('category');
  const search = searchParams.get('search');
  
  try {
    // Get user session to check authentication status
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    
    return await withConnection(async (connection) => {
      // Simple query to check if fragments_categories table exists
      const fragmentCategoriesTableExists = await doesTableExist(connection, 'fragments_categories');
      
      // Simplified query - always include category_ids field
      let query = `
        SELECT f.*, a.name as activity_name,
        (SELECT COUNT(*) FROM correction_fragments WHERE fragment_id = f.id) as usage_count
        ${fragmentCategoriesTableExists ? 
          ', (SELECT GROUP_CONCAT(fc.category_id) FROM fragments_categories fc WHERE fc.fragment_id = f.id) as category_ids' : 
          ', NULL as category_ids'}
        FROM fragments f
        LEFT JOIN activities a ON f.activity_id = a.id
        WHERE 1=1
      `;
      
      // Prepare parameters array
      let params: any[] = [];
      
      // Add filters to the query
      if (userOnly && userId) {
        query += " AND f.user_id = ?";
        params.push(userId);
      }
      
      if (activityId) {
        query += " AND f.activity_id = ?";
        params.push(activityId);
      }
      
      // If category filter is applied, update it to work with fragment_categories
      if (categoryFilter && fragmentCategoriesTableExists) {
        query += " AND EXISTS (SELECT 1 FROM fragments_categories fc WHERE fc.fragment_id = f.id AND fc.category_id = ?)";
        params.push(categoryFilter);
      } else if (categoryFilter) {
        // Fallback for old structure
        query += " AND f.category = ?";
        params.push(categoryFilter);
      }
      
      if (search) {
        query += " AND (f.content LIKE ? OR f.category LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }
      
      // Add sorting
      query += " ORDER BY f.created_at DESC";
      
      // Execute the query
      try {
        const [rows] = await connection.query<FragmentRow[]>(query, params);
        
        // Process the rows to parse tags and add category information
        const fragments = Array.isArray(rows) ? rows.map((row: FragmentRow) => {
          // Create a new object for the processed fragment
          const processedFragment: ProcessedFragment = {
            ...row,
            tags: [],
            categories: [] // Initialize categories array
          };
          
          // Parse tags if they exist
          if (row.tags && typeof row.tags === 'string') {
            try {
              processedFragment.tags = JSON.parse(row.tags);
            } catch (e) {
              console.error('Error parsing tags:', e);
              processedFragment.tags = [];
            }
          }
          
          // Process category_ids if they exist (from the fragments_categories table)
          if (fragmentCategoriesTableExists && row.category_ids) {
            processedFragment.categories = row.category_ids.split(',')
              .filter((id: string) => id.trim() !== '')
              .map((id: string) => parseInt(id));
          } else {
            // Initialize with empty array if no categories are found
            processedFragment.categories = [];
          }
          
          // Add a flag indicating if the current user owns this fragment
          // Convert both to strings for comparison to ensure proper matching
          if (userId) {
            const userIdStr = String(userId);
            const fragmentUserIdStr = String(row.user_id);
            processedFragment.isOwner = userIdStr === fragmentUserIdStr;
            
            if (userIdStr === fragmentUserIdStr) {
              console.log(`Fragment ${row.id} is owned by current user`);
            }
          } else {
            processedFragment.isOwner = false;
          }
          
          return processedFragment;
        }) : [];
        
        return NextResponse.json(fragments);
      } catch (sqlError: any) {
        // Handle SQL error and provide detailed error information
        console.error('SQL Error in fragments query:', sqlError);
        return NextResponse.json(
          { 
            error: 'Erreur lors de la récupération des fragments',
            sqlMessage: sqlError.sqlMessage || null,
            code: sqlError.code || null,
            sql: sqlError.sql || null
          },
          { status: 500 }
        );
      }
    });
  } catch (error: any) {
    console.error('Error fetching fragments:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des fragments',
        details: error.message || 'Unknown error',
        stack: error.stack || null
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try to get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);

    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    // Clone the request to avoid "body is disturbed" error
    const clonedRequest = request.clone();
    // Get fragment data from request body
    const fragmentData = await clonedRequest.json();
    
    // Validate required fields
    if (!fragmentData.content) {
      return NextResponse.json(
        { error: 'Un contenu est requis' },
        { status: 400 }
      );
    }

    return await withConnection(async (connection) => {
      // Prepare tags for storage (convert array to JSON string)
      let tagsJson = '[]';
      if (fragmentData.tags && Array.isArray(fragmentData.tags)) {
        tagsJson = JSON.stringify(fragmentData.tags);
      }
      
      // Properly process activity_id to ensure it's handled correctly
      let activityId = null;
      if (fragmentData.activity_id) {
        // Parse to integer if it's a string
        if (typeof fragmentData.activity_id === 'string') {
          activityId = parseInt(fragmentData.activity_id, 10);
        } else {
          activityId = fragmentData.activity_id;
        }
        
        // Validate that it's a valid number
        if (isNaN(activityId)) {
          activityId = null;
        }
      }
      console.log('fragmentData ID:', fragmentData);

      // Insert the new fragment - removing direct category field usage
      try {
        // Check for fragments_categories table
        const fragmentCategoriesTableExists = await doesTableExist(connection, 'fragments_categories');
        
        // Insert the fragment without any category information
        const [result] = await connection.query(
          `INSERT INTO fragments 
          (content, tags, activity_id, user_id, created_at) 
          VALUES (?, ?, ?, ?, NOW())`,
          [
            fragmentData.content,
            tagsJson,
            activityId,
            userId
          ]
        );
        
        // Get the inserted ID
        const insertId = (result as any).insertId;
        
        // Process categories if the table exists and categories are provided
        if (fragmentData.categories && 
            Array.isArray(fragmentData.categories) && fragmentData.categories.length > 0 &&
            fragmentCategoriesTableExists) {
          try {
            // Filter out invalid categories and prepare values for insertion
            const categoryValues = fragmentData.categories
              .filter((categoryId: number | string) => categoryId && Number(categoryId) > 0)
              .map((categoryId: number | string) => [insertId, Number(categoryId)]);
            
            if (categoryValues.length > 0) {
              // Use INSERT IGNORE to prevent duplicate key errors
              await connection.query(
                `INSERT INTO fragments_categories (fragment_id, category_id) VALUES ?`,
                [categoryValues]
              );
              
              console.log(`Added ${categoryValues.length} categories to fragment ${insertId}`);
            }
          } catch (categoryError) {
            console.error('Error adding category associations:', categoryError);
            // Continue without failing the whole request
          }
        }
        
        // Build query to fetch the newly created fragment with all its data
        let fragmentQuery = `
          SELECT f.*, a.name as activity_name
          ${fragmentCategoriesTableExists ? 
            ', (SELECT GROUP_CONCAT(fc.category_id) FROM fragments_categories fc WHERE fc.fragment_id = f.id) as category_ids' :
            ', NULL as category_ids'}
          FROM fragments f
          LEFT JOIN activities a ON f.activity_id = a.id
          WHERE f.id = ?
        `;
        
        // Fetch the created fragment
        const [fragments] = await connection.query<FragmentRow[]>(fragmentQuery, [insertId]);
        
        if (!fragments || fragments.length === 0) {
          return NextResponse.json(
            { error: 'Erreur lors de la création du fragment' },
            { status: 500 }
          );
        }
        
        const newFragment = fragments[0];
        
        // Process category_ids in the response
        let categoryIds: number[] = [];
        if (newFragment.category_ids && typeof newFragment.category_ids === 'string') {
          categoryIds = newFragment.category_ids.split(',')
            .filter(id => id.trim() !== '')
            .map(id => parseInt(id, 10));
        } else if (newFragment.category_id) {
          // Include the legacy category_id for backward compatibility
          categoryIds = [Number(newFragment.category_id)];
        }
        
        // Add categories to the processed fragment
        const processedFragment: ProcessedFragment = {
          ...newFragment,
          tags: [],
          categories: categoryIds
        };
        
        // Parse tags to return a properly typed object
        if (newFragment.tags && typeof newFragment.tags === 'string') {
          try {
            processedFragment.tags = JSON.parse(newFragment.tags);
          } catch (e) {
            console.error('Error parsing tags:', e);
            processedFragment.tags = [];
          }
        }
        
        // Add isOwner flag
        processedFragment.isOwner = true;
        
        // Return the processed fragment
        return NextResponse.json(processedFragment, { status: 201 });
      } catch (sqlError: any) {
        // Propagate SQL errors with detailed information
        console.error('SQL Error creating fragment:', sqlError);
        return NextResponse.json(
          { 
            error: 'Erreur lors de la création du fragment', 
            sqlMessage: sqlError.sqlMessage || null,
            code: sqlError.code || null,
          },
          { status: 500 }
        );
      }
    });
  } catch (error: any) {
    console.error('Error creating fragment:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du fragment',
        details: error.message || 'Unknown error',
        sqlMessage: error.sqlMessage || null,
        code: error.code || null,
      },
      { status: 500 }
    );
  }
}

// Add the PUT method to handle fragment updates
export async function PUT(request: NextRequest) {
  try {
    // Get user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get fragment data from request body
    const fragmentData = await request.json();
    
    // Ensure we have an ID
    if (!fragmentData.id) {
      return NextResponse.json(
        { error: 'Fragment ID is required for updates' },
        { status: 400 }
      );
    }
    
    const fragmentId = fragmentData.id;
    
    return await withConnection(async (connection) => {
      // Check fragment ownership
      const [ownerRows] = await connection.query(
        'SELECT user_id, content FROM fragments WHERE id = ?',
        [fragmentId]
      );
      
      if (!Array.isArray(ownerRows) || ownerRows.length === 0) {
        return NextResponse.json(
          { error: 'Fragment not found' },
          { status: 404 }
        );
      }
      
      const owner = ownerRows[0] as any;
      
      // Compare user IDs as strings to avoid type issues
      const userIdStr = String(userId);
      const fragmentUserIdStr = String(owner.user_id);
      
      // Verify ownership
      if (userIdStr !== fragmentUserIdStr) {
        return NextResponse.json(
          { error: 'You are not authorized to modify this fragment' },
          { status: 403 }
        );
      }
      
      // Prepare tags for storage
      let tagsJson = '[]';
      if (fragmentData.tags && Array.isArray(fragmentData.tags)) {
        tagsJson = JSON.stringify(fragmentData.tags);
      }
      
      // Update the fragment with current timestamp
      await connection.query(
        `UPDATE fragments
         SET content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          fragmentData.content,
          tagsJson,
          fragmentId
        ]
      );
      
      // Handle categories through junction table
      
      if (fragmentData.categories) {
        // Make sure we're accessing the categories correctly
        const categories = fragmentData.categories;
        console.log('Categories in PUT request:', categories);
        
        // Delete existing associations
        await connection.query(
          'DELETE FROM fragments_categories WHERE fragment_id = ?', 
          [fragmentId]
        );
        
        // Add new associations
        if (Array.isArray(categories) && categories.length > 0) {
          const categoryValues = categories
            .filter((categoryId: number | string) => categoryId && Number(categoryId) > 0)
            .map((categoryId: number | string) => [fragmentId, Number(categoryId)]);
          
          if (categoryValues.length > 0) {
            await connection.query(
              `INSERT INTO fragments_categories (fragment_id, category_id) VALUES ?`,
              [categoryValues]
            );
            console.log(`Added ${categoryValues.length} categories to fragment ${fragmentId}`);
          }
        }
      }
      
      // Get the updated fragment with all its data
      const [fragments] = await connection.query<FragmentRow[]>(
        `SELECT f.*, a.name as activity_name, 
        '(SELECT GROUP_CONCAT(fc.category_id) 
        FROM fragments_categories fc WHERE fc.fragment_id = f.id) as category_ids'
         FROM fragments f
         LEFT JOIN activities a ON f.activity_id = a.id
         WHERE f.id = ?`,
        [fragmentId]
      );
      
      if (!fragments || fragments.length === 0) {
        return NextResponse.json(
          { error: 'Fragment not found after update' },
          { status: 404 }
        );
      }
      
      const updatedFragment = fragments[0];
      
      // Process the fragment for the response
      const processedFragment: ProcessedFragment = {
        ...updatedFragment,
        tags: [],
        categories: []
      };
      
      // Parse tags if they exist
      if (updatedFragment.tags && typeof updatedFragment.tags === 'string') {
        try {
          processedFragment.tags = JSON.parse(updatedFragment.tags);
        } catch (e) {
          console.error('Error parsing tags', e);
          processedFragment.tags = [];
        }
      }
      
      // Process category_ids if they exist
      if (updatedFragment.category_ids) {
        processedFragment.categories = updatedFragment.category_ids.split(',')
          .filter((id: string) => id.trim() !== '')
          .map((id: string) => parseInt(id));
      }
      
      // Add owner flag
      processedFragment.isOwner = true;
      
      // Add modified flag
      if (updatedFragment.updated_at && updatedFragment.created_at) {
        const createdDate = new Date(updatedFragment.created_at);
        const updatedDate = new Date(updatedFragment.updated_at);
        processedFragment.isModified = updatedDate > createdDate;
      } else {
        processedFragment.isModified = false;
      }
      
      return NextResponse.json(processedFragment);
    });
  } catch (error: any) {
    console.error('Error updating fragment:', error);
    return NextResponse.json(
      { 
        error: 'Error updating fragment',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to check if a table exists
async function doesTableExist(connection: any, tableName: string): Promise<boolean> {
  const [result] = await connection.query(`
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = ?
    LIMIT 1
  `, [tableName]);
  
  return Array.isArray(result) && result.length > 0;
}

