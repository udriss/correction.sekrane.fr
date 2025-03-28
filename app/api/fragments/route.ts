import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
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
      // Build the query based on filters
      let query = `
        SELECT f.*, a.name as activity_name,
        (SELECT COUNT(*) FROM correction_fragments WHERE fragment_id = f.id) as usage_count
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
      
      if (categoryFilter) {
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
        
        // Process the rows to parse tags if they exist
        const fragments = Array.isArray(rows) ? rows.map((row: FragmentRow) => {
          
          // Create a new object for the processed fragment
          const processedFragment: ProcessedFragment = {
            ...row,
            tags: [] // Initialize with an empty array
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
    if (!fragmentData.content || !fragmentData.category) {
      return NextResponse.json(
        { error: 'Le contenu et la catégorie sont requis' },
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

      
      // Insert the new fragment using the user ID we got
      try {
        const [result] = await connection.query(
          `INSERT INTO fragments 
          (content, category, tags, activity_id, user_id, created_at) 
          VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            fragmentData.content,
            fragmentData.category,
            tagsJson,
            activityId, // Use the properly processed activity_id
            userId // Use the ID we determined above
          ]
        );
        
        // Get the inserted ID
        const insertId = (result as any).insertId;
        
        // Fetch the created fragment
        const [rows] = await connection.query<FragmentRow[]>(
          `SELECT f.*, a.name as activity_name
           FROM fragments f
           LEFT JOIN activities a ON f.activity_id = a.id
           WHERE f.id = ?`,
          [insertId]
        );
        
        if (!rows || rows.length === 0) {
          return NextResponse.json(
            { error: 'Erreur lors de la création du fragment' },
            { status: 500 }
          );
        }
        
        const newFragment = rows[0];
        
        // Parse tags to return a properly typed object
        const processedFragment: ProcessedFragment = {
          ...newFragment,
          tags: []
        };
        
        // Parse tags if they exist
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
        
        // Return the processed fragment directly, not after parsing it again
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
