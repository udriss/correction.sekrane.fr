import { NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Attendre la résolution des paramètres
    const { id } = await params;
    
    // Vérifier que l'ID est un nombre valide
    const activityId = parseInt(id, 10);
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID d\'activité invalide' }, { status: 400 });
    }

    // Récupérer toutes les corrections pour cette activité
    return await withConnection(async (connection) => {
      const [rows] = await connection.query(
        `SELECT c.*, CONCAT(s.first_name, ' ', s.last_name) as student_name 
         FROM corrections c
         LEFT JOIN students s ON c.student_id = s.id
         WHERE c.activity_id = ? ORDER BY c.created_at DESC`,
        [activityId]
      );
      
      return NextResponse.json(rows);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des corrections:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des corrections' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate basic required fields
    if (!body.activity_id) {
      return Response.json({ error: 'Activity ID is required' }, { status: 400 });
    }
    
    return await withConnection(async (connection) => {
      // Structure correction data according to the Correction interface
      const correctionData = {
        activity_id: body.activity_id,
        student_id: body.student_id || null,
        content: body.content || '',
        content_data: body.content_data ? JSON.stringify(body.content_data) : null,
        grade: null as number | null, // Will calculate below
        penalty: body.penalty || null,
        deadline: body.deadline || new Date().toISOString().split('T')[0],
        submission_date: body.submission_date || new Date().toISOString().split('T')[0],
        experimental_points_earned: parseFloat(body.experimental_points_earned) || 0,
        theoretical_points_earned: parseFloat(body.theoretical_points_earned) || 0,
        class_id: body.class_id ? parseInt(body.class_id) : null,
        group_id: null as number | null
      };
      
      // Set default group_id = 0 if neither class_id nor group_id is provided
      if (body.group_id !== undefined) {
        correctionData.group_id = parseInt(body.group_id) || 0;
      } else if (!correctionData.class_id) {
        // If no class_id and no group_id is specified, set group_id = 0 as default
        correctionData.group_id = 0;
      }
      
      // Calculate grade
      const grade = (correctionData.experimental_points_earned + correctionData.theoretical_points_earned);
      correctionData.grade = grade;
      
      // Check if student_id is valid before inserting
      let studentId = body.student_id || null;
      
      // Explicitly check for negative IDs and set them to null
      if (studentId !== null && (studentId < 0 || typeof studentId !== 'number')) {
        console.log(`Ignoring invalid student ID: ${studentId}`);
        studentId = null;
      } else if (studentId !== null) {
        const [students] = await connection.query(
          'SELECT id FROM students WHERE id = ?',
          [studentId]
        );
        
        // If student doesn't exist, set to NULL
        if (!Array.isArray(students) || (students as any[]).length === 0) {
          studentId = null;
        }
      }
      
      // Insert correction with validated student_id
      const [result] = await connection.query(
        `INSERT INTO corrections 
         (activity_id, student_id, content, content_data, grade, penalty, deadline, 
          submission_date, experimental_points_earned, theoretical_points_earned, 
          class_id, group_id, created_at, updated_at )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          correctionData.activity_id,
          studentId, // Use the validated student ID
          correctionData.content,
          correctionData.content_data,
          correctionData.grade,
          correctionData.penalty,
          correctionData.deadline,
          correctionData.submission_date,
          correctionData.experimental_points_earned,
          correctionData.theoretical_points_earned,
          correctionData.class_id,
          correctionData.group_id
        ]
      );
      
      const correctionId = (result as any).insertId;

      // If class_id is provided, update class_activities table to establish relationship
      if (correctionData.class_id) {
        try {
          // Check if activity is already associated with the class
          const [existingActivityLinks] = await connection.query(
            'SELECT * FROM class_activities WHERE class_id = ? AND activity_id = ?',
            [correctionData.class_id, correctionData.activity_id]
          );
          
          // If not already linked, create the association between class and activity
          if (!Array.isArray(existingActivityLinks) || (existingActivityLinks as any[]).length === 0) {
            await connection.query(
              'INSERT INTO class_activities (class_id, activity_id, created_at) VALUES (?, ?, NOW())',
              [correctionData.class_id, correctionData.activity_id]
            );
            console.log(`Associated activity ${correctionData.activity_id} with class ${correctionData.class_id}`);
          }
        } catch (err) {
          // Log error but don't fail the request
          console.error('Error updating class_activities table:', err);
        }
      }

      // After inserting the correction, fetch it to return the complete data
      const [rows] = await connection.query(
        `SELECT c.*, a.name as activity_name,
         CONCAT(s.first_name, ' ', s.last_name) as student_name
         FROM corrections c
         JOIN activities a ON c.activity_id = a.id
         LEFT JOIN students s ON c.student_id = s.id
         WHERE c.id = ?`,
        [correctionId]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return Response.json({ error: 'Failed to retrieve the created correction' }, { status: 500 });
      }
      
      return Response.json(rows[0]);
    });
    
  } catch (error) {
    console.error('Error creating correction:', error);
    return Response.json({ error: 'Server error', details: String(error) }, { status: 500 });
  }
}
