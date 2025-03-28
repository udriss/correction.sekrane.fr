import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth'; // Add import for custom auth
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
  updated_at?: string; // Add updated_at field
  activity_name?: string;
  usage_count?: number;
  isOwner?: boolean;
}

// Define a type for the processed fragment with parsed tags
interface ProcessedFragment extends Omit<FragmentRow, 'tags'> {
  tags: string[];
  isModified?: boolean; // Add flag to indicate if fragment was modified
  categories?: any[]; // Added for category support
}


// Get a specific fragment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    const fragmentId = parseInt(id);
    
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;

    return await withConnection(async (connection) => {
      try {
        // Check if the correction_fragments table exists
        const [tableExists] = await connection.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_name = 'correction_fragments'
        `);
        
        // Use different queries based on whether the table exists
        let usageCountQuery = '0';
        if (Array.isArray(tableExists) && tableExists[0] && (tableExists[0] as any).count > 0) {
          usageCountQuery = '(SELECT COUNT(*) FROM correction_fragments WHERE fragment_id = f.id)';
        }

        // Check if fragments_categories table exists
        const fragmentCategoriesTableExists = await doesTableExist(connection, 'fragments_categories');
        
        // Simplified query with categories
        const [rows] = await connection.query<FragmentRow[]>(
          `SELECT f.*, a.name as activity_name,
          ${usageCountQuery} as usage_count
          ${fragmentCategoriesTableExists ? 
            ', (SELECT GROUP_CONCAT(fc.category_id) FROM fragments_categories fc WHERE fc.fragment_id = f.id) as category_ids' :
            ', NULL as category_ids'}
          FROM fragments f
          LEFT JOIN activities a ON f.activity_id = a.id
          WHERE f.id = ?`,
          [fragmentId]
        );
        
        if (!rows || rows.length === 0) {
          return NextResponse.json(
            { error: 'Fragment non trouvé' },
            { status: 404 }
          );
        }
        
        const fragment = rows[0];

        
        // Create a new object with the correct types
        const processedFragment: ProcessedFragment = {
          ...fragment,
          tags: [] // Initialize with empty array
        };
        
        // Parse tags if they exist
        if (fragment.tags && typeof fragment.tags === 'string') {
          try {
            processedFragment.tags = JSON.parse(fragment.tags);
          } catch (e) {
            console.error('Error parsing tags', e);
            // Keep the default empty array
          }
        }
        
        // Check if fragment has been modified by comparing dates
        if (fragment.updated_at && fragment.created_at) {
          const createdDate = new Date(fragment.created_at);
          const updatedDate = new Date(fragment.updated_at);
          processedFragment.isModified = updatedDate > createdDate;
        } else {
          processedFragment.isModified = false;
        }
        
        // Convert both to strings for comparison to ensure proper matching
        if (userId) {
          const userIdStr = String(userId);
          const fragmentUserIdStr = String(fragment.user_id);
          processedFragment.isOwner = userIdStr === fragmentUserIdStr;
        } else {
          processedFragment.isOwner = false;
        }

        // Add categories from junction table
        if (fragmentCategoriesTableExists && fragment.category_ids) {
          processedFragment.categories = fragment.category_ids.split(',')
            .filter((id: string) => id.trim() !== '')
            .map((id: string) => parseInt(id));
        }
        
        return NextResponse.json(processedFragment);
      } catch (sqlError: any) {
        console.error('SQL Error fetching fragment:', sqlError);
        return NextResponse.json(
          { 
            error: 'Erreur lors de la récupération du fragment', 
            sqlMessage: sqlError.sqlMessage || null,
            code: sqlError.code || null,
            sql: sqlError.sql || null
          },
          { status: 500 }
        );
      }
    });
  } catch (error) {
    console.error('Error fetching fragment:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du fragment' },
      { status: 500 }
    );
  }
}

// Update a fragment
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await the params
    const { id } = await params;
    const fragmentId = parseInt(id);

    // Parse the JSON body to get fragmentData
    const fragmentData = await request.json();
    
    // Get user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request as NextRequest);
    
    // Use either auth system
    const userId = session?.user?.id || customUser?.id;
    
    // Check if user is authenticated
    if (!userId) {
      console.error('[Auth Error] No valid session or user ID');
      
      return NextResponse.json(
        { error: 'Authentication required', details: 'No valid user ID found' },
        { status: 401 }
      );
    }
    
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
      
      // Convert both to strings for comparison to ensure proper matching
      const userIdStr = String(userId);
      const fragmentUserIdStr = String(owner.user_id);
      
      // Check ownership using string comparison
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
      
      // Update fragment with current timestamp for updated_at
      await connection.query(
        `UPDATE fragments
         SET content = ?, tags = ?, activity_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          fragmentData.content,
          tagsJson,
          fragmentData.activity_id || null,
          fragmentId
        ]
      );
      
      // Handle categories through junction table
      const fragmentCategoriesTableExists = await doesTableExist(connection, 'fragments_categories');
      
      if (fragmentCategoriesTableExists && fragmentData.categories) {
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
      
      // Get updated fragment with categories
      const [rows] = await connection.query<FragmentRow[]>(
        `SELECT f.*, a.name as activity_name
         ${fragmentCategoriesTableExists ? 
          ', (SELECT GROUP_CONCAT(fc.category_id) FROM fragments_categories fc WHERE fc.fragment_id = f.id) as category_ids' :
          ', NULL as category_ids'}
         FROM fragments f
         LEFT JOIN activities a ON f.activity_id = a.id
         WHERE f.id = ?`,
        [fragmentId]
      );
      
      if (!rows || rows.length === 0) {
        return NextResponse.json(
          { error: 'Fragment non trouvé après mise à jour' },
          { status: 404 }
        );
      }
      
      const updatedFragment = rows[0];
      
      // Create a processed fragment with correct types
      const processedFragment: ProcessedFragment = {
        ...updatedFragment,
        tags: [], // Initialize with empty array
        categories: [] // Initialize categories with empty array
      };
      
      // Parse tags if they exist
      if (updatedFragment.tags && typeof updatedFragment.tags === 'string') {
        try {
          processedFragment.tags = JSON.parse(updatedFragment.tags);
        } catch (e) {
          console.error('Error parsing tags', e);
          // Keep the default empty array
        }
      }
      
      // Process category_ids if they exist
      if (fragmentCategoriesTableExists && updatedFragment.category_ids) {
        processedFragment.categories = updatedFragment.category_ids.split(',')
          .filter((id: string) => id.trim() !== '')
          .map((id: string) => parseInt(id));
      }
      
      // Add isModified flag by comparing dates
      if (updatedFragment.updated_at && updatedFragment.created_at) {
        const createdDate = new Date(updatedFragment.created_at);
        const updatedDate = new Date(updatedFragment.updated_at);
        processedFragment.isModified = updatedDate > createdDate;
      } else {
        processedFragment.isModified = false;
      }
      
      // Add isOwner flag
      processedFragment.isOwner = true;
      
      // Fetch categories associated with this fragment
      const [categoryRows] = await connection.query(
        `SELECT c.id, c.name 
         FROM categories c
         JOIN fragments_categories fc ON c.id = fc.category_id
         WHERE fc.fragment_id = ?`,
        [fragmentId]
      );
      
      // Add categories to the response
      processedFragment.categories = Array.isArray(categoryRows) ? categoryRows : [];
      
      return NextResponse.json(processedFragment);
    });
  } catch (error) {
    console.error('[Error] Error updating fragment:', error);
    return NextResponse.json(
      { error: 'Error updating fragment', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Delete a fragment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    const fragmentId = parseInt(id);
    
    // Try to get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request as NextRequest);
    
    // Use either auth system, starting with NextAuth then falling back to custom auth
    const userId = session?.user?.id || customUser?.id;

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    return await withConnection(async (connection) => {
      // First, check if user owns the fragment
      const [ownerRows] = await connection.query(
        'SELECT user_id FROM fragments WHERE id = ?',
        [fragmentId]
      );
      
      if (!Array.isArray(ownerRows) || ownerRows.length === 0) {
        return NextResponse.json(
          { error: 'Fragment non trouvé' },
          { status: 404 }
        );
      }
      
      const owner = ownerRows[0] as any;
      
      // Convert both to strings for comparison to ensure proper matching
      const userIdStr = String(userId);
      const fragmentUserIdStr = String(owner.user_id);
      
      // Check ownership using string comparison
      if (userIdStr !== fragmentUserIdStr) {
        return NextResponse.json(
          { error: 'Vous n\'êtes pas autorisé à supprimer ce fragment' },
          { status: 403 }
        );
      }
      
      // Check if fragment is in use
      try {
        const [usageRows] = await connection.query(
          // Fix the query - use 'f.id' instead of 'fragment_id'
          'SELECT COUNT(*) as count FROM correction_fragments f WHERE f.fragment_id = ?',
          [fragmentId]
        );
        
        const usage = Array.isArray(usageRows) && usageRows.length > 0 ? (usageRows[0] as any).count : 0;
        
        // If fragment is in use, don't delete it
        if (usage > 0) {
          return NextResponse.json(
            { 
              error: 'Ce fragment est utilisé dans des corrections et ne peut pas être supprimé',
              usageCount: usage
            },
            { status: 409 }
          );
        }
      } catch (sqlError: any) {
        // Check if the error is about missing table or column
        if (sqlError.code === 'ER_NO_SUCH_TABLE' || sqlError.code === 'ER_BAD_FIELD_ERROR') {
          console.log(`SQL Error: ${sqlError.sqlMessage}, treating as no usages`);
          // Continue with deletion since there are no usages
        } else {
          // For other SQL errors, propagate them
          throw sqlError;
        }
      }
      
      // Delete fragment category associations first (fix table name)
      await connection.query(
        'DELETE FROM fragments_categories WHERE fragment_id = ?',
        [fragmentId]
      );
      
      // Delete the fragment
      await connection.query(
        'DELETE FROM fragments WHERE id = ?',
        [fragmentId]
      );
      
      return NextResponse.json({ success: true, message: 'Fragment supprimé avec succès' });
    });
  } catch (error: any) {
    console.error('Error deleting fragment:', error);
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Erreur lors de la suppression du fragment', 
        details: error.message || 'Unknown error',
        sqlMessage: error.sqlMessage || null,
        code: error.code || null
      },
      { status: 500 }
    );
  }
}

// Helper function to check if a table exists (same as in route.ts)
async function doesTableExist(connection: any, tableName: string): Promise<boolean> {
  const [result] = await connection.query(`
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = ?
    LIMIT 1
  `, [tableName]);
  
  return Array.isArray(result) && result.length > 0;
}
