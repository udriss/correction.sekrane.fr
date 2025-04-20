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
    
    // 1. Get all students in this class
    const students = await query(`
      SELECT
        s.id, 
        s.first_name,
        s.last_name,
        s.email
      FROM
        students s
      JOIN
        class_students cs ON s.id = cs.student_id
      WHERE
        cs.class_id = ?
    `, [classId]);
    
    // Structure to hold student corrections data
    const studentsCorrectionsData = [];
    
    // 2. For each student, get all their corrections (both for this class and others)
    for (const student of students as any[]) {
      // Get all corrections for this student
      const allCorrections = await query(`
        SELECT 
          c.*,
          a.id as activity_id,
          a.name as activity_name,
          a.points as activity_points,
          a.parts_names as activity_parts_names,
          c.class_id
        FROM 
          corrections_autres c
        JOIN
          activities_autres a ON c.activity_id = a.id
        WHERE 
          c.student_id = ?
      `, [student.id]);
      
      // Format the corrections
      const formattedCorrections = (allCorrections as any[]).map(c => ({
        ...c,
        // Calculate score percentage if possible
        score_percentage: c.grade !== null && c.grade !== undefined 
          ? Number(((c.grade / 20) * 100).toFixed(2))
          : null
      }));
      
      // Filter corrections for the current class
      const classCorrections = formattedCorrections.filter(c => c.class_id === classId);
      
      // Count total corrections and class-specific corrections
      const totalCorrections = formattedCorrections.length;
      const classCorrectionsCount = classCorrections.length;
      
      // Add to the result array
      studentsCorrectionsData.push({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        student_email: student.email,
        class_corrections: classCorrections,
        class_corrections_count: classCorrectionsCount,
        total_corrections_count: totalCorrections,
        all_corrections: formattedCorrections
      });
    }
    
    return NextResponse.json(studentsCorrectionsData);
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
