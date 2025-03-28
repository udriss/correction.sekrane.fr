import { NextRequest, NextResponse } from 'next/server';
import { query, withConnection } from '@/lib/db';

// Get all corrections for a class
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
    
    // Get corrections with their activity information
    const corrections = await query(`
      SELECT 
        c.*,
        a.id as activity_id,
        a.name as activity_name
      FROM 
        corrections c
      JOIN
        activities a ON c.activity_id = a.id
      WHERE 
        c.class_id = ?
    `, [classId]);
    
    // Format the response to match the expected structure
    const formattedCorrections = (corrections as any[]).map(c => ({
      ...c,
      activity: {
        id: c.activity_id,
        name: c.activity_name
      },
      activity_name: undefined // Remove redundant field
    }));
    
    return NextResponse.json(formattedCorrections);
  } catch (error) {
    console.error('Error fetching class corrections:', error);
    return NextResponse.json({ error: 'Failed to fetch corrections' }, { status: 500 });
  }
}

// Associate corrections with a class
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
    
    const { correction_ids } = await request.json();
    
    if (!Array.isArray(correction_ids) || correction_ids.length === 0) {
      return NextResponse.json({ error: 'Correction IDs array is required' }, { status: 400 });
    }
    
    // Check if the class exists
    const classExists = await query('SELECT id FROM classes WHERE id = ?', [classId]);
    
    if (!classExists || (classExists as any[]).length === 0) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    
    // Update each correction to set the class_id
    await withConnection(async (connection) => {
      for (const correctionId of correction_ids) {
        await connection.query(
          'UPDATE corrections SET class_id = ? WHERE id = ?',
          [classId, Number(correctionId)]
        );
      }
    });
    
    return NextResponse.json({ 
      message: `${correction_ids.length} corrections associated with class`,
      count: correction_ids.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error associating corrections with class:', error);
    return NextResponse.json({ error: 'Failed to associate corrections with class' }, { status: 500 });
  }
}
