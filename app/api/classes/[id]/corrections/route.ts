import { NextRequest, NextResponse } from 'next/server';
import { query, withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

// Get all corrections for a class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }

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
    
    // Get corrections with their activity information and include points data
    const corrections = await query(`
      SELECT 
        c.*,
        a.id as activity_id,
        a.name as activity_name,
        a.points as activity_points,
        a.parts_names as activity_parts_names,
        CONCAT(s.first_name, ' ', s.last_name) as student_name
      FROM 
        corrections_autres c
      JOIN
        activities_autres a ON c.activity_id = a.id
      LEFT JOIN
        students s ON c.student_id = s.id
      WHERE 
        c.class_id = ?
    `, [classId]);
    
    // Format the response to match the CorrectionAutreEnriched structure
    const formattedCorrections = (corrections as any[]).map(c => ({
      ...c,
      // Calculate score percentage if possible
      score_percentage: c.grade !== null && c.grade !== undefined 
        ? Number(((c.grade / 20) * 100).toFixed(2))
        : null
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
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }
    
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
          'UPDATE corrections_autres SET class_id = ? WHERE id = ?',
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
