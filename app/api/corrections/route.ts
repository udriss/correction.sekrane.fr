import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { createLogEntry } from '@/lib/services/logsService';
import { getUser } from '@/lib/auth';

export async function GET(
  request: NextRequest
) {
  try {
    // Get query parameters from the URL
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Parse specific IDs if provided (for recent or batch corrections)
    const idsParam = searchParams.get('ids');
    let specificIds: number[] = [];
    
    if (idsParam) {
      specificIds = idsParam.split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id));
    }
    
    // Parse activity ID if provided
    const activityIdParam = searchParams.get('activity_id');
    let activityId: number | null = null;
    
    if (activityIdParam) {
      activityId = parseInt(activityIdParam, 10);
      if (isNaN(activityId)) {
        return NextResponse.json({ error: 'ID d\'activité invalide' }, { status: 400 });
      }
    }

    // Build query based on parameters
    return await withConnection(async (connection) => {
      let query = `
        SELECT c.*, 
               CONCAT(s.first_name, ' ', s.last_name) as student_name,
               a.name as activity_name,
               cl.name as class_name
        FROM corrections c
        LEFT JOIN students s ON c.student_id = s.id
        LEFT JOIN activities a ON c.activity_id = a.id
        LEFT JOIN classes cl ON c.class_id = cl.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      
      // Add activity filter if needed
      if (activityId) {
        query += " AND c.activity_id = ?";
        params.push(activityId);
      }
      
      // Add specific IDs filter if needed
      if (specificIds.length > 0) {
        query += ` AND c.id IN (${specificIds.map(() => '?').join(',')})`;
        params.push(...specificIds);
      }
      
      // Add order by
      query += " ORDER BY c.submission_date DESC";
      
      const [rows] = await connection.query(query, params);
      
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

export async function POST(request: NextRequest) {
  return await withConnection(async (connection) => {
    try {
      const data = await request.json();
      const user = await getUser(request);
      
      // Validate activity_id - allow "0" as a valid ID
      const activity_id = data.activity_id || 0;
      
      // Ensure activity_id is a number in database queries
      const numericActivityId = parseInt(activity_id.toString(), 10);
      
      // Validate basic required fields
      if (!data.activity_id) {
        return Response.json({ error: 'Activity ID is required' }, { status: 400 });
      }
      
      // Structure correction data according to the Correction interface
      const correctionData = {
        activity_id: numericActivityId,
        student_id: data.student_id || null,
        content: data.content || '',
        content_data: data.content_data ? JSON.stringify(data.content_data) : null,
        grade: null as number | null, // Will calculate below
        penalty: data.penalty || null,
        deadline: data.deadline || new Date().toISOString().split('T')[0],
        submission_date: data.submission_date || new Date().toISOString(), // Now includes time
        experimental_points_earned: parseFloat(data.experimental_points_earned) || 0,
        theoretical_points_earned: parseFloat(data.theoretical_points_earned) || 0,
        class_id: data.class_id ? parseInt(data.class_id) : null,
        group_id: null as number | null
      };
      
      // Set default group_id = 0 if neither class_id nor group_id is provided
      if (data.group_id !== undefined) {
        correctionData.group_id = parseInt(data.group_id) || 0;
      } else if (!correctionData.class_id) {
        // If no class_id and no group_id is specified, set group_id = 0 as default
        correctionData.group_id = 0;
      }
      
      // Calculate grade
      const grade = (correctionData.experimental_points_earned + correctionData.theoretical_points_earned);
      correctionData.grade = grade;
      
      // Check if student_id is valid before inserting
      let studentId = data.student_id || null;
      let studentName = null;
      
      // Explicitly check for negative IDs and set them to null
      if (studentId !== null && (studentId < 0 || typeof studentId !== 'number')) {
        studentId = null;
      } else if (studentId !== null) {
        const [students] = await connection.query(
          'SELECT id, CONCAT(first_name, " ", last_name) as student_name FROM students WHERE id = ?',
          [studentId]
        );
        
        // If student doesn't exist, set to NULL
        if (!Array.isArray(students) || (students as any[]).length === 0) {
          studentId = null;
        } else {
          studentName = (students[0] as any).student_name;
        }
      }
      
      // Get activity name for logging
      let activityName = "Activité inconnue";
      if (numericActivityId > 0) {
        const [activities] = await connection.query(
          'SELECT name FROM activities WHERE id = ?',
          [numericActivityId]
        );
        
        if (Array.isArray(activities) && (activities as any[]).length > 0) {
          activityName = (activities[0] as any).name;
        }
      }
      
      // Insert correction with validated student_id and numeric activity_id
      const [result] = await connection.query(
        `INSERT INTO corrections 
         (activity_id, student_id, content, content_data, grade, penalty, deadline, 
          submission_date, experimental_points_earned, theoretical_points_earned, 
          class_id, group_id, created_at, updated_at )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          numericActivityId, // Use numeric value
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
      
      // Logging de la création de correction
      await createLogEntry({
        action_type: 'CREATE_CORRECTION',
        description: `Nouvelle correction ajoutée${studentName ? ` pour ${studentName}` : ''} - ${activityName}`,
        entity_type: 'correction',
        entity_id: correctionId,
        user_id: user?.id,
        username: user?.username,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        metadata: {
          activity_id: numericActivityId,
          activity_name: activityName,
          student_id: studentId,
          student_name: studentName,
          class_id: correctionData.class_id,
          grade: correctionData.grade,
          has_penalty: correctionData.penalty !== null && correctionData.penalty > 0,
          experimental_points: correctionData.experimental_points_earned,
          theoretical_points: correctionData.theoretical_points_earned
        }
      });

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
            
            // Log de l'association classe-activité
            const [classes] = await connection.query(
              'SELECT name FROM classes WHERE id = ?',
              [correctionData.class_id]
            );
            
            const className = Array.isArray(classes) && classes.length > 0 
              ? (classes[0] as any).name 
              : 'Classe inconnue';
              
            await createLogEntry({
              action_type: 'LINK_CLASS_ACTIVITY',
              description: `Association de l'activité "${activityName}" à la classe "${className}"`,
              entity_type: 'class_activity',
              user_id: user?.id,
              username: user?.username,
              metadata: {
                class_id: correctionData.class_id,
                class_name: className,
                activity_id: numericActivityId,
                activity_name: activityName
              }
            });
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
    } catch (error) {
      console.error('Error creating correction:', error);
      
      // Log de l'erreur
      try {
        const user = await getUser(request);
        await createLogEntry({
          action_type: 'CREATE_CORRECTION_ERROR',
          description: `Erreur lors de l'ajout d'une correction: ${(error as Error).message}`,
          user_id: user?.id,
          username: user?.username,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        });
      } catch (logError) {
        console.error('Error creating log entry:', logError);
      }
      
      return Response.json({ error: 'Server error', details: String(error) }, { status: 500 });
    }
  });
}
