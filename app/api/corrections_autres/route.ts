import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { createLogEntry } from '@/lib/services/logsService';
import { createCorrectionAutre } from '@/lib/correctionAutre';
import { getActivityAutreById } from '@/lib/activityAutre';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

export async function GET(
  request: NextRequest
) {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'utilisateur non authentifié',
        details: { 
          reason: 'auth_required',
          message: 'Vous devez être connecté pour accéder à cette ressource'
        }
      }, { status: 401 });
    }
    
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
        return NextResponse.json({ 
          error: 'ID d\'activité invalide',
          details: { 
            param: 'activity_id',
            value: activityIdParam,
            reason: 'invalid_format'
          }
        }, { status: 400 });
      }
    }

    // Build query based on parameters
    return await withConnection(async (connection) => {
      let query = `
        SELECT c.*, 
               CONCAT(s.first_name, ' ', s.last_name) as student_name,
               a.name as activity_name,
               cl.name as class_name
        FROM corrections_autres c
        LEFT JOIN students s ON c.student_id = s.id
        LEFT JOIN activities_autres a ON c.activity_id = a.id
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
    console.error('Erreur lors de la récupération des corrections autres:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      details: error 
    }, { status: 500 });
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
        return Response.json({ error: 'ID d\'activité requis' }, { status: 400 });
      }
      
      // Get the activity to check parts_names and points
      const activity = await getActivityAutreById(numericActivityId);
      if (!activity && numericActivityId !== 0) {
        return Response.json({ error: 'activité introuvable' }, { status: 404 });
      }
      
      // Initialize points_earned as an empty array or use provided data
      let points_earned = [];
      if (activity) {
        // Initialize with zeros matching the number of parts in the activity
        points_earned = Array(activity.points.length).fill(0);
        
        // If points_earned is provided in the request, use it (after validation)
        if (data.points_earned && Array.isArray(data.points_earned)) {
          if (data.points_earned.length === activity.points.length) {
            points_earned = data.points_earned.map((p: any) => parseFloat(p) || 0);
          }
        }
      }
      
      // Structure correction data according to the CorrectionAutre interface
      const correctionData = {
        activity_id: numericActivityId,
        student_id: data.student_id || null,
        content: data.content || '',
        penalty: data.penalty || null,
        deadline: data.deadline || new Date().toISOString().split('T')[0],
        submission_date: data.submission_date || new Date().toISOString().split('T')[0],
        class_id: data.class_id ? parseInt(data.class_id) : null,
      };
      
      // Check if student_id is valid before inserting
      let studentId = data.student_id || null;
      let studentName = null;
      
      // Explicitly check for negative IDs and set them to null
      // Convert studentId to number if it's a string
      if (studentId !== null && typeof studentId === 'string') {
        studentId = parseInt(studentId, 10);
      }
      if (studentId !== null && (isNaN(studentId) || studentId < 0 || typeof studentId !== 'number')) {
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
      if (activity) {
        activityName = activity.name;
      }
      
      // Create correction
      const correctionId = await createCorrectionAutre({
        ...correctionData,
        student_id: studentId
      });
      
      // Update the points_earned after creation
      if (points_earned.length > 0) {
        await connection.query(
          'UPDATE corrections_autres SET points_earned = ? WHERE id = ?',
          [JSON.stringify(points_earned), correctionId]
        );
      }
      
      // Logging de la création de correction
      await createLogEntry({
        action_type: 'CREATE_CORRECTION_AUTRE',
        description: `Nouvelle correction (autre) ajoutée${studentName ? ` pour ${studentName}` : ''} - ${activityName}`,
        entity_type: 'correction_autre',
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
          has_penalty: correctionData.penalty !== null && correctionData.penalty > 0
        }
      });

      // If class_id is provided, update class_activities table to establish relationship
      if (correctionData.class_id) {
        try {
          // Check if activity is already associated with the class
          const [existingActivityLinks] = await connection.query(
            'SELECT * FROM class_activities_autres WHERE class_id = ? AND activity_id = ?',
            [correctionData.class_id, correctionData.activity_id]
          );
          
          // If not already linked, create the association between class and activity
          if (!Array.isArray(existingActivityLinks) || (existingActivityLinks as any[]).length === 0) {
            await connection.query(
              'INSERT INTO class_activities_autres (class_id, activity_id, created_at) VALUES (?, ?, NOW())',
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
              action_type: 'LINK_CLASS_ACTIVITY_AUTRE',
              description: `Association de l'activité autre "${activityName}" à la classe "${className}"`,
              entity_type: 'class_activity_autre',
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
          console.error('Error updating class_activities_autres table:', err);
        }
      }

      // After inserting the correction, fetch it to return the complete data
      const [rows] = await connection.query(
        `SELECT c.*, a.name as activity_name,
         CONCAT(s.first_name, ' ', s.last_name) as student_name
         FROM corrections_autres c
         JOIN activities_autres a ON c.activity_id = a.id
         LEFT JOIN students s ON c.student_id = s.id
         WHERE c.id = ?`,
        [correctionId]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return Response.json({ error: 'Impossible de récupérer les corrections ajoutées' }, { status: 500 });
      }
      
      return Response.json(rows[0]);
    } catch (error) {
      console.error('Error creating correction autre:', error);
      
      // Log de l'erreur
      try {
        const user = await getUser(request);
        await createLogEntry({
          action_type: 'CREATE_CORRECTION_AUTRE_ERROR',
          description: `Erreur lors de l'ajout d'une correction autre: ${(error as Error).message}`,
          user_id: user?.id,
          username: user?.username,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        });
      } catch (logError) {
        console.error('Error creating log entry:', logError);
      }
      
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error 
      }, { status: 500 });
    }
  });
}