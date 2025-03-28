import { NextRequest, NextResponse } from 'next/server';
import { query, withConnection } from '@/lib/db';

// Get activities for a class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    const classId = parseInt(id);
    
    if (isNaN(classId)) {
      return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
    }
    
    // Check if the class exists
    const classExists = await query('SELECT id FROM classes WHERE id = ?', [classId]);
    
    if (!classExists || (classExists as any[]).length === 0) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    
    // Get activities for the class using a JOIN
    const activities = await query(`
      SELECT 
        a.id, 
        a.name, 
        a.content, 
        a.experimental_points, 
        a.theoretical_points,
        a.created_at, 
        a.updated_at
      FROM 
        class_activities ca
      JOIN 
        activities a ON ca.activity_id = a.id
      WHERE 
        ca.class_id = ?
    `, [classId]);
    
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

// Associate activities with a class
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    const classId = parseInt(id);
    
    if (isNaN(classId)) {
      return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
    }
    
    const { activity_ids } = await request.json();
    
    if (!Array.isArray(activity_ids) || activity_ids.length === 0) {
      return NextResponse.json({ error: 'Activity IDs array is required' }, { status: 400 });
    }
    
    // Check if the class exists
    const classExists = await query('SELECT id FROM classes WHERE id = ?', [classId]);
    
    if (!classExists || (classExists as any[]).length === 0) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    
    // Use withConnection to handle multiple inserts
    const result = await withConnection(async (connection) => {
      // Build values for multi-insert
      const placeholders = activity_ids.map(() => '(?, ?)').join(', ');
      const params = activity_ids.flatMap(activityId => [classId, Number(activityId)]);
      
      // Insert associations (ignoring duplicates)
      await connection.query(
        `INSERT IGNORE INTO class_activities (class_id, activity_id) VALUES ${placeholders}`,
        params
      );
      
      // Count how many were actually inserted (by checking what exists now)
      const [countResult] = await connection.query(
        'SELECT COUNT(*) as count FROM class_activities WHERE class_id = ?',
        [classId]
      );
      
      return { count: (countResult as any[])[0].count };
    });
    
    return NextResponse.json({ 
      message: `Activities associated with class`,
      count: result.count
    }, { status: 201 });
  } catch (error) {
    console.error('Error associating activities with class:', error);
    return NextResponse.json({ 
      error: 'Failed to associate activities with class' 
    }, { status: 500 });
  }
}


// Remove an activity from a class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    const classId = parseInt(id);
    const url = new URL(request.url);
    const activityId = parseInt(url.searchParams.get('activityId') || '');
    
    if (isNaN(classId) || isNaN(activityId)) {
      return NextResponse.json({ 
        error: 'Invalid class ID or activity ID' 
      }, { status: 400 });
    }
    
    // Delete the association
    await query(
      'DELETE FROM class_activities WHERE class_id = ? AND activity_id = ?', 
      [classId, activityId]
    );
    
    return NextResponse.json({ message: 'Activity removed from class' });
  } catch (error) {
    console.error('Error removing activity from class:', error);
    return NextResponse.json({ 
      error: 'Failed to remove activity from class' 
    }, { status: 500 });
  }
}