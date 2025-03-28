import { NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the activity ID from parameters
    const { id } = await params;
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json(
        { error: 'ID d\'activité invalide' },
        { status: 400 }
      );
    }

    return await withConnection(async (connection) => {
      // Get all classes associated with this activity
      const [rows] = await connection.query(
        `SELECT c.*
         FROM classes c
         JOIN class_activities ca ON c.id = ca.class_id
         WHERE ca.activity_id = ?`,
        [activityId]
      );
      
      return NextResponse.json(rows);
    });
  } catch (error) {
    console.error('Error fetching associated classes:', error);
    return NextResponse.json(
      { error: 'Error fetching associated classes' },
      { status: 500 }
    );
  }
}
