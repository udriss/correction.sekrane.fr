import { NextRequest, NextResponse } from 'next/server';
import { query, withConnection } from '@/lib/db';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentification
    const session = await getServerSession(authOptions);
    const customUser = await getUser(req);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    // Récupérer l'ID de la correction à dupliquer
    const { id } = await params;
    const correctionId = parseInt(id);
    
    if (isNaN(correctionId)) {
      return NextResponse.json(
        { error: 'ID de correction invalide' },
        { status: 400 }
      );
    }
    
    // Récupérer les données de la requête
    const body = await req.json();
    const { 
      studentId, 
      classId, 
      groupName, 
      overwriteExisting, 
      existingCorrectionId 
    } = body;
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'ID étudiant requis' },
        { status: 400 }
      );
    }
    
    // Utiliser une transaction pour gérer toutes les opérations
    return await withConnection(async (connection) => {
      // 1. Récupérer les données de la correction originale
      const [correctionRows] = await connection.query(
        `SELECT * FROM corrections WHERE id = ?`, 
        [correctionId]
      );
      
      if (!correctionRows || (correctionRows as any[]).length === 0) {
        throw new Error('Correction introuvable');
      }
      
      const originalCorrection = (correctionRows as any[])[0];
      
      let newCorrectionId;
      let groupId = null;
      
      // Gérer le cas où un nom de groupe est fourni
      if (groupName) {
        // Vérifier si le groupe existe déjà
        const [existingGroups] = await connection.query(
          `SELECT id FROM groups WHERE name = ?`,
          [groupName]
        );
        
        if ((existingGroups as any[]).length > 0) {
          // Utiliser le groupe existant
          groupId = (existingGroups as any[])[0].id;
        } else {
          // Créer un nouveau groupe
          const [groupResult] = await connection.query(
            `INSERT INTO groups (name, created_at, updated_at)
            VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [groupName]
          );
          
          groupId = (groupResult as any).insertId;
        }
        
        // Associer l'étudiant au groupe
        const [existingGroupAssociation] = await connection.query(
          `SELECT * FROM group_students WHERE student_id = ? AND group_id = ?`,
          [studentId, groupId]
        );
        
        if ((existingGroupAssociation as any[]).length === 0) {
          // Créer l'association
          await connection.query(
            `INSERT INTO group_students (student_id, group_id, created_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [studentId, groupId]
          );
        }
      }
      
      // 2. Vérifier si l'utilisateur souhaite écraser une correction existante
      if (overwriteExisting && existingCorrectionId) {
        // Mettre à jour la correction existante avec les nouvelles données
        await connection.query(
          `UPDATE corrections SET 
            content = ?, 
            content_data = ?,
            grade = ?, 
            penalty = ?, 
            deadline = ?, 
            submission_date = ?, 
            theoretical_points_earned = ?, 
            experimental_points_earned = ?,
            class_id = ?,
            group_id = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
          [
            originalCorrection.content,
            JSON.stringify(originalCorrection.content_data), // Convertir en JSON string comme pour l'INSERT
            originalCorrection.grade,
            originalCorrection.penalty,
            originalCorrection.deadline,
            originalCorrection.submission_date,
            originalCorrection.theoretical_points_earned,
            originalCorrection.experimental_points_earned,
            classId || originalCorrection.class_id,
            groupId || originalCorrection.group_id,
            existingCorrectionId
          ]
        );
        
        newCorrectionId = existingCorrectionId;
      } else {
        // Créer une nouvelle correction avec les données de l'étudiant spécifié
        const [insertResult] = await connection.query(
          `INSERT INTO corrections (
            activity_id, student_id, content, content_data, grade, penalty, 
            created_at, updated_at, deadline, submission_date,
            theoretical_points_earned, experimental_points_earned,
            class_id, group_id
          ) 
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?)`,
          [
            originalCorrection.activity_id,
            studentId,
            originalCorrection.content,
            JSON.stringify(originalCorrection.content_data), // Convertir en JSON string
            originalCorrection.grade,
            originalCorrection.penalty,
            originalCorrection.deadline,
            originalCorrection.submission_date,
            originalCorrection.theoretical_points_earned,
            originalCorrection.experimental_points_earned,
            classId || null,
            groupId || null
          ]
        );
        
        newCorrectionId = (insertResult as any).insertId;
      }
      
      // Si une classe est spécifiée, associer l'étudiant à cette classe
      if (classId) {
        // Vérifier si l'association existe déjà
        const [existingAssociation] = await connection.query(
          `SELECT * FROM class_students WHERE student_id = ? AND class_id = ?`,
          [studentId, classId]
        );
        
        if ((existingAssociation as any[]).length === 0) {
          // Créer l'association
          await connection.query(
            `INSERT INTO class_students (student_id, class_id, created_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [studentId, classId]
          );
        }
      }
      
      // Récupérer les informations sur l'activité et l'étudiant pour le log
      const [activityResults] = await connection.query(
        `SELECT a.name as activity_name FROM corrections c
         JOIN activities a ON c.activity_id = a.id
         WHERE c.id = ?`,
        [correctionId]
      );
      
      const [studentResults] = await connection.query(
        `SELECT CONCAT(first_name, ' ', last_name) as student_name FROM students
         WHERE id = ?`,
        [studentId]
      );
      
      const activityName = Array.isArray(activityResults) && activityResults.length > 0
        ? (activityResults[0] as any).activity_name || 'Activité inconnue'
        : 'Activité inconnue';
      
      const studentName = Array.isArray(studentResults) && studentResults.length > 0
        ? (studentResults[0] as any).student_name || 'Étudiant inconnu'
        : 'Étudiant inconnu';
      
      const mode = overwriteExisting ? 'OVERWRITE' : 'CREATE_NEW';
      
      // Créer l'entrée de log pour la duplication
      await createLogEntry({
        action_type: `DUPLICATE_CORRECTION_${mode}`,
        description: `Correction ${overwriteExisting ? 'écrasée' : 'dupliquée'} depuis #${correctionId} pour ${studentName} - ${activityName}`,
        entity_type: 'correction',
        entity_id: newCorrectionId,
        user_id: typeof userId === 'string' ? parseInt(userId) : userId,
        username: customUser?.username,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        metadata: {
          original_correction_id: correctionId,
          new_correction_id: newCorrectionId,
          overwrite: overwriteExisting === true,
          activity_name: activityName,
          student_id: studentId,
          student_name: studentName,
          class_id: classId,
          group_id: groupId,
          group_name: groupName
        }
      });
      
      return NextResponse.json({
        success: true,
        correctionId: newCorrectionId
      });
    });
  } catch (error) {
    console.error('Erreur lors de la duplication de la correction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur de duplication' },
      { status: 500 }
    );
  }
}
