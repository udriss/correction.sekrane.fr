import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { getUser } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the activity ID from route params
    const { id } = await params;
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Check if activity exists
    const [activityResult] = await db.query(
      'SELECT * FROM activities WHERE id = ?',
      [activityId]
    );
    
    const activities = activityResult as any[];
    
    if (activities.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }
    
    // Get all groups with correction count using LEFT JOIN - fixing the wrong join condition
    const [result] = await db.query(`
      SELECT 
        cg.id,
        cg.name,
        cg.description,
        cg.created_at,
        COUNT(c.id) as correction_count
      FROM 
        correction_groups cg
      LEFT JOIN
        corrections c ON c.group_id = cg.id
      WHERE 
        cg.activity_id = ?
      GROUP BY
        cg.id
      ORDER BY 
        cg.name
    `, [activityId]);

    // If no data found, return an empty array
    if (!result) {
      return NextResponse.json([]);
    }
    
    // Safely serialize the result
    try {
      // Handle both single object and array responses
      let serializedResult;
      if (Array.isArray(result)) {
        serializedResult = JSON.parse(JSON.stringify(result));
        // Ensure correction_count is a number
        serializedResult = serializedResult.map((group: any) => ({
          ...group,
          correction_count: parseInt(group.correction_count) || 0
        }));
      } else {
        // If it's a single object, wrap it in an array
        const singleGroup = JSON.parse(JSON.stringify(result));
        singleGroup.correction_count = parseInt(singleGroup.correction_count) || 0;
        serializedResult = [singleGroup];
      }
      
      return NextResponse.json(serializedResult);
    } catch (parseError) {
      console.error('Error serializing groups data:', parseError);
      // Return empty array if serialization fails
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error retrieving activity groups:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve activity groups' },
      { status: 500 }
    );
  }
}