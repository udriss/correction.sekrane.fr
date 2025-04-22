import { NextRequest, NextResponse } from 'next/server';
import { getCorrectionById } from '@/lib/correction';
import { withConnection } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier l'authentification
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'AuthenticationRequired: Non autorisé' }, { status: 401 });
    }
    
    const idNumber = parseInt(id);
    
    if (isNaN(idNumber)) {
      return NextResponse.json({ error: 'InvalidCorrectionID: ID de correction invalide' }, { status: 400 });
    }

    // Récupérer la correction
    const correction = await getCorrectionById(idNumber);
    if (!correction) {
      return NextResponse.json({ error: 'CorrectionNotFound: Correction introuvable' }, { status: 404 });
    }

    return await withConnection(async (connection) => {
      // Récupérer les informations de classe si class_id existe
      let classInfo = null;
      let subClass = null;
      
      if (correction.class_id) {
        // Récupérer les informations de la classe
        const [classRows] = await connection.query(
          'SELECT * FROM classes WHERE id = ?',
          [correction.class_id]
        );
        
        if (Array.isArray(classRows) && classRows.length > 0) {
          classInfo = classRows[0] as any; // Ajouter un cast en any pour résoudre l'erreur de typage
        }
        
        // Récupérer la sous-classe si student_id existe
        if (correction.student_id) {
          const [subClassRows] = await connection.query(
            'SELECT sub_class FROM class_students WHERE class_id = ? AND student_id = ?',
            [correction.class_id, correction.student_id]
          );
          
          if (Array.isArray(subClassRows) && subClassRows.length > 0) {
            // Ajouter un cast en any pour résoudre l'erreur de typage
            subClass = (subClassRows[0] as any).sub_class;
          }
        }
      }
      
      // Récupérer les informations de l'étudiant si student_id existe
      let studentData = null;
      if (correction.student_id) {
        const [studentRows] = await connection.query(
          'SELECT * FROM students WHERE id = ?',
          [correction.student_id]
        );
        
        if (Array.isArray(studentRows) && studentRows.length > 0) {
          studentData = studentRows[0];
        }
      }
      
      // S'assurer que la propriété 'active' est incluse dans la réponse
      // Pour être sûr d'avoir la valeur la plus à jour, on peut la récupérer directement depuis la base
      const [activeStatusResult] = await connection.query(
        'SELECT active, grade, penalty FROM corrections WHERE id = ?',
        [idNumber]
      );
      
      let activeStatus = 1; // Par défaut, une correction est active (1)
      let finalGrade = null; // Initialiser la note finale à null
      
      if (Array.isArray(activeStatusResult) && activeStatusResult.length > 0) {
        // La valeur peut être 0, 1, true, false ou null
        const activeValue = (activeStatusResult[0] as any).active;
        // Convertir en nombre entier: 0 si activeValue est 0, false ou null, 1 sinon
        activeStatus = (activeValue === 0 || activeValue === false || activeValue === null) ? 0 : 1;
        
        // Calculer la note finale selon la nouvelle règle
        const grade = parseFloat((activeStatusResult[0] as any).grade) || 0;
        const penalty = parseFloat((activeStatusResult[0] as any).penalty) || 0;
        
        // Nouvelle logique pour final_grade
        if (grade < 5) {
          // Si la note est déjà inférieure à 5, on garde la note originale
          finalGrade = grade;
        } else {
          // Sinon on prend le max entre grade-penalty et 5
          finalGrade = Math.max(grade - penalty, 5);
        }
      }
      
      // Combiner toutes les données
      return NextResponse.json({
        ...correction,
        active: activeStatus,
        final_grade: finalGrade, // Ajouter le champ final_grade
        class_name: classInfo ? classInfo.name : null,
        sub_class: subClass,
        student_data: studentData
      });
    });
  } catch (error) {
    console.error('CorrectionFetchError:', error);
    return NextResponse.json({ error: 'CorrectionFetchError: Erreur lors de la récupération de la correction', details: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params.id avant de l'utiliser
    const { id } = await params;
    const correctionId = id;
    const idNumber = parseInt(correctionId);
    
    if (isNaN(idNumber)) {
      return NextResponse.json({ error: 'InvalidCorrectionID: ID de correction invalide' }, { status: 400 });
    }

    const body = await request.json();
    
    
    return await withConnection(async (connection) => {
      // Récupérer la correction actuelle
      const [oldCorrectionResult] = await connection.query(
        'SELECT * FROM corrections WHERE id = ?',
        [idNumber]
      );
      
      if (!Array.isArray(oldCorrectionResult) || oldCorrectionResult.length === 0) {
        return NextResponse.json({ error: 'CorrectionNotFound: Correction introuvable' }, { status: 404 });
      }
      
      const oldCorrection = oldCorrectionResult[0] as any;
      
      // Construire la requête SQL dynamiquement
      const fieldsToUpdate: string[] = [];
      const params: any[] = [];
      
      // Gérer les champs de base
      if (body.student_id !== undefined) {
        fieldsToUpdate.push('student_id = ?');
        params.push(body.student_id);
      }
      
      // Gérer l'association avec une classe
      if (body.class_id !== undefined) {
        const classId = parseInt(body.class_id);
        if (!isNaN(classId)) {
          fieldsToUpdate.push('class_id = ?');
          params.push(classId);
          
        } else if (body.class_id === null) {
          // Permet de supprimer l'association avec une classe
          fieldsToUpdate.push('class_id = NULL');
        }
      }
      
      // Helper pour analyser les nombres en toute sécurité
      const parseNumberSafely = (value: any): number => {
        if (value === null || value === undefined) return 0;
        const parsed = parseFloat(String(value));
        return isNaN(parsed) ? 0 : parsed;
      };
      
      // Points gagnés (la nouvelle approche)
      let pointsEarned = parseNumberSafely(oldCorrection.points_earned);
      if (body.points_earned !== undefined && !isNaN(parseFloat(String(body.points_earned)))) {
        pointsEarned = parseFloat(String(body.points_earned));
        fieldsToUpdate.push('points_earned = ?');
        params.push(pointsEarned);
      }
      
      // Pénalité
      let penaltyPoints = parseNumberSafely(oldCorrection.penalty);
      if (body.penalty !== undefined && !isNaN(parseFloat(String(body.penalty)))) {
        penaltyPoints = parseFloat(String(body.penalty));
        fieldsToUpdate.push('penalty = ?');
        params.push(penaltyPoints);
      }
      
      // Mettre à jour la note totale (qui est maintenant simplement points_earned)
      fieldsToUpdate.push('grade = ?');
      params.push(pointsEarned);
      
      // Calculer la note finale selon la règle
      let finalGrade;
      if (pointsEarned < 5) {
        // Si la note est inférieure à 5, on garde la note originale
        finalGrade = pointsEarned;
      } else {
        // Sinon on applique la règle du maximum
        finalGrade = Math.max(pointsEarned - penaltyPoints, 5);
      }

      fieldsToUpdate.push('final_grade = ?');
      params.push(finalGrade);
      
      // Gérer les autres champs
      if (body.content !== undefined) {
        fieldsToUpdate.push('content = ?');
        params.push(body.content);
      }
      
      // Gérer content_data qui peut avoir différents formats
      if (body.content_data !== undefined || body.fragments !== undefined || body.items !== undefined) {
        // Récupérer d'abord les données existantes
        const [existingData] = await connection.query(
          'SELECT content_data FROM corrections WHERE id = ?',
          [idNumber]
        );
        
        let contentData = {};
        
        // Extraire les données existantes si disponibles
        if (Array.isArray(existingData) && existingData.length > 0) {
          const existing = existingData[0] as any;
          if (existing.content_data) {
            try {
              contentData = typeof existing.content_data === 'string' 
                  ? JSON.parse(existing.content_data) 
                  : existing.content_data;
            } catch (e) {
              console.warn('Erreur lors du parsing de content_data existant:', e);
              contentData = {};
            }
          }
        }
        
        // Mettre à jour avec les nouvelles données selon le format reçu
        if (body.content_data) {
          // Format content_data complet (peut inclure items ou fragments)
          contentData = { ...contentData, ...body.content_data };
        } else if (body.fragments) {
          // Format ancien avec fragments uniquement
          contentData = { ...contentData, fragments: body.fragments };
        } else if (body.items) {
          // Format avec items uniquement
          contentData = { ...contentData, items: body.items };
        }

        fieldsToUpdate.push('content_data = ?');
        params.push(JSON.stringify(contentData));
      }
      
      // Gérer le statut (active)
      if (body.active !== undefined) {
        const activeValue = body.active === true || body.active === 1 ? 1 : 0;
        fieldsToUpdate.push('active = ?');
        params.push(activeValue);
      }
      
      // Gérer le statut de correction
      if (body.status !== undefined) {
        fieldsToUpdate.push('status = ?');
        params.push(body.status);
      }
      
      if (fieldsToUpdate.length === 0) {
        return NextResponse.json({ error: 'NoValidData: Aucun champ valide à mettre à jour' }, { status: 400 });
      }
      
      // Ajouter l'ID à la fin des valeurs
      params.push(idNumber);
      
      const [result] = await connection.query(
        `UPDATE corrections SET ${fieldsToUpdate.join(', ')}, updated_at = NOW() WHERE id = ?`,
        params
      );
      
      if ((result as any).affectedRows === 0) {
        return NextResponse.json({ error: 'CorrectionNotFound: Correction introuvable ou non modifiée' }, { status: 404 });
      }
      
      // Récupérer la correction mise à jour pour la retourner
      const [updatedData] = await connection.query(
        `SELECT c.*, a.name as activity_name, 
         CONCAT(s.first_name, ' ', s.last_name) as student_name
         FROM corrections c
         JOIN activities a ON c.activity_id = a.id
         LEFT JOIN students s ON c.student_id = s.id
         WHERE c.id = ?`,
        [idNumber]
      );
      
      if (!Array.isArray(updatedData) || updatedData.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'Correction mise à jour avec succès',
          affected_rows: (result as any).affectedRows
        });
      }
      
      // Formater la correction pour la retourner
      const updatedCorrection = updatedData[0] as any;
      
      // Parser content_data pour le retour
      try {
        if (updatedCorrection.content_data && typeof updatedCorrection.content_data === 'string') {
          updatedCorrection.content_data = JSON.parse(updatedCorrection.content_data);
        }
      } catch (e) {
        console.error('Erreur de parsing content_data après mise à jour:', e);
      }
      
      // Si final_grade n'est pas disponible, le calculer
      if (updatedCorrection.final_grade === undefined || updatedCorrection.final_grade === null) {
        const grade = parseFloat(updatedCorrection.grade) || 0;
        const penalty = parseFloat(updatedCorrection.penalty) || 0;
        
        // Appliquer la règle
        if (grade < 5) {
          updatedCorrection.final_grade = grade;
        } else {
          updatedCorrection.final_grade = Math.max(grade - penalty, 5);
        }
      }
      
      return NextResponse.json(updatedCorrection);
    });
  } catch (error) {
    console.error('CorrectionUpdateError:', error);
    return NextResponse.json(
      { error: 'CorrectionUpdateError: Erreur lors de la mise à jour de la correction', details: String(error) },
      { status: 500 }
    );
  }
}

import { createLogEntry } from '@/lib/services/logsService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'AuthenticationRequired: Authentification requise' }, { status: 401 });
    }
    
    const correctionId = parseInt(id);
    if (isNaN(correctionId)) {
      return NextResponse.json({ error: 'InvalidCorrectionID: ID de correction invalide' }, { status: 400 });
    }
    
    // Utiliser withConnection au lieu de pool.query directement
    return await withConnection(async (connection) => {
      // Récupérer d'abord la correction pour la retourner après suppression
      const [rows] = await connection.query(
        `SELECT c.*, a.name as activity_name, CONCAT(s.first_name, ' ', s.last_name) as student_name 
         FROM corrections c
         LEFT JOIN activities a ON c.activity_id = a.id
         LEFT JOIN students s ON c.student_id = s.id
         WHERE c.id = ?`, 
        [id]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return new NextResponse(JSON.stringify({ error: 'CorrectionNotFound: Correction introuvable' }), {
          status: 404,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      }
      
      const correction = rows[0] as any;
      
      // Supprimer la correction
      await connection.query('DELETE FROM corrections WHERE id = ?', [id]);
      
      // Enregistrer un log de suppression
      await createLogEntry({
        action_type: 'DELETE_CORRECTION',
        description: `Suppression de la correction #${id}${correction.student_name ? ` pour ${correction.student_name}` : ''} - ${correction.activity_name || 'Activité inconnue'}`,
        entity_type: 'correction',
        entity_id: parseInt(id),
        user_id: user?.id,
        username: user?.username,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        metadata: {
          activity_id: correction.activity_id,
          activity_name: correction.activity_name,
          student_id: correction.student_id,
          student_name: correction.student_name,
          class_id: correction.class_id,
          grade: correction.grade
        }
      });
      
      return new NextResponse(JSON.stringify(correction), {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    });
  } catch (error) {
    console.error('CorrectionDeleteError:', error);
    
    // Log de l'erreur
    try {
      const user = await getUser(request);
      await createLogEntry({
        action_type: 'DELETE_CORRECTION_ERROR',
        description: `Erreur lors de la suppression d'une correction: ${(error as Error).message}`,
        user_id: user?.id,
        username: user?.username,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
    } catch (logError) {
      console.error('Error creating log entry:', logError);
    }
    
    return new NextResponse(JSON.stringify({ error: 'CorrectionDeleteError: Erreur serveur lors de la suppression' }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const correctionId = id;

    const data = await request.json();

    // Valider les données et récupérer l'ancienne correction pour comparaison
    const oldCorrectionAndResult = await withConnection(async (connection) => {
      // Récupérer l'ancienne correction pour le logging
      const [oldCorrectionResult] = await connection.query(
        'SELECT * FROM corrections WHERE id = ?',
        [correctionId]
      );
      
      const oldCorrection = Array.isArray(oldCorrectionResult) && oldCorrectionResult.length > 0
        ? oldCorrectionResult[0]
        : null;
        
      if (!oldCorrection) {
        return { success: false, message: 'Correction introuvable' };
      }

      // Construire l'ensemble des champs à mettre à jour
      const fieldsToUpdate = [];
      const params = [];
      
      if (data.experimental_points_earned !== undefined) {
        fieldsToUpdate.push('experimental_points_earned = ?');
        params.push(data.experimental_points_earned);
      }
      
      if (data.theoretical_points_earned !== undefined) {
        fieldsToUpdate.push('theoretical_points_earned = ?');
        params.push(data.theoretical_points_earned);
      }
      
      if (data.deadline !== undefined) {
        fieldsToUpdate.push('deadline = ?');
        params.push(data.deadline);
      }
      
      if (data.submission_date !== undefined) {
        fieldsToUpdate.push('submission_date = ?');
        params.push(data.submission_date);
      }
      
      if (data.penalty !== undefined) {
        fieldsToUpdate.push('penalty = ?');
        params.push(data.penalty);
      }
      
      if (data.content !== undefined) {
        fieldsToUpdate.push('content = ?');
        params.push(JSON.stringify(data.content));
      }
      
      // Variables pour calculer la note finale
      let expGrade = parseFloat((oldCorrection as any).experimental_points_earned) || 0;
      let theoGrade = parseFloat((oldCorrection as any).theoretical_points_earned) || 0;
      let penalty = parseFloat((oldCorrection as any).penalty) || 0;
      let calculatedGrade = false;
      
      // Mettre à jour les valeurs en fonction des paramètres fournis
      if (data.experimental_points_earned !== undefined) {
        expGrade = parseFloat(data.experimental_points_earned) || 0;
        calculatedGrade = true;
      }
      
      if (data.theoretical_points_earned !== undefined) {
        theoGrade = parseFloat(data.theoretical_points_earned) || 0;
        calculatedGrade = true;
      }
      
      if (data.penalty !== undefined) {
        penalty = parseFloat(data.penalty) || 0;
        calculatedGrade = true;
      }
      
      // Calculer la note totale si nécessaire
      if (calculatedGrade) {
        const totalGrade = expGrade + theoGrade;
        fieldsToUpdate.push('grade = ?');
        params.push(totalGrade);
        
        // Calculer la note finale selon la nouvelle règle
        let finalGrade;
        if (totalGrade < 5) {
          // Si la note est déjà inférieure à 5, on garde la note originale
          finalGrade = totalGrade;
        } else {
          // Sinon on applique la règle du maximum
          finalGrade = Math.max(totalGrade - penalty, 5);
        }
        
        fieldsToUpdate.push('final_grade = ?');
        params.push(finalGrade);
      } else if (data.grade !== undefined) {
        // Permettre également de mettre à jour directement la note
        const grade = parseFloat(data.grade) || 0;
        fieldsToUpdate.push('grade = ?');
        params.push(grade);
        
        // Calculer la note finale selon la nouvelle règle
        let finalGrade;
        if (grade < 5) {
          // Si la note est inférieure à 5, garder cette note
          finalGrade = grade;
        } else {
          // Sinon appliquer la règle du maximum avec 5
          finalGrade = Math.max(grade - penalty, 5);
        }
        
        fieldsToUpdate.push('final_grade = ?');
        params.push(finalGrade);
      }
      
      if (fieldsToUpdate.length === 0) {
        return { success: false, message: 'Aucune donnée à mettre à jour' };
      }
      
      params.push(correctionId);
      
      // Exécuter la mise à jour
      await connection.query(
        `UPDATE corrections SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
        params
      );
      
      // Récupérer la correction mise à jour
      const [result] = await connection.query(
        'SELECT * FROM corrections WHERE id = ?',
        [correctionId]
      );
      
      return { 
        success: true, 
        data: Array.isArray(result) && result.length > 0 ? result[0] : null,
        oldCorrection 
      };
    });
    
    if (!oldCorrectionAndResult.success) {
      return NextResponse.json(
        { error: oldCorrectionAndResult.message },
        { status: 404 }
      );
    }
    
    const { data: updatedCorrection, oldCorrection } = oldCorrectionAndResult;
    
    // Logger les modifications
    const changes: Record<string, { old: any; new: any }> = {};
    
    // Vérifier les changements de notes
    if (data.experimental_points_earned !== undefined && 
        (oldCorrection as any).experimental_points_earned !== data.experimental_points_earned) {
      changes['experimental_points_earned'] = {
        old: (oldCorrection as any).experimental_points_earned,
        new: data.experimental_points_earned
      };
    }
    
    if (data.theoretical_points_earned !== undefined && 
        (oldCorrection as any).theoretical_points_earned !== data.theoretical_points_earned) {
      changes['theoretical_points_earned'] = {
        old: (oldCorrection as any).theoretical_points_earned,
        new: data.theoretical_points_earned
      };
    }
    
    if (data.penalty !== undefined && 
        (oldCorrection as any).penalty !== data.penalty) {
      changes['penalty'] = {
        old: (oldCorrection as any).penalty,
        new: data.penalty
      };
    }
    
    // Si des modifications de notes ont été effectuées, créer un log
    if (Object.keys(changes).length > 0) {
      await createLogEntry({
        action_type: 'UPDATE_GRADE',
        description: `Modification des notes pour la correction #${correctionId}`,
        entity_type: 'correction',
        entity_id: parseInt(correctionId),
        user_id: user.id,
        username: user.username,
        metadata: {
          changes,
          old_grade: (oldCorrection as any).grade,
          new_grade: (updatedCorrection as any).grade,
          old_final_grade: (oldCorrection as any).final_grade,
          new_final_grade: (updatedCorrection as any).final_grade,
          activity_id: (oldCorrection as any).activity_id,
          student_id: (oldCorrection as any).student_id
        }
      });
    }
    
    // Vérifier les changements de dates
    const dateChanges: Record<string, { old: any; new: any }> = {};
    
    if (data.deadline !== undefined && 
        (oldCorrection as any).deadline !== data.deadline) {
      dateChanges['deadline'] = {
        old: (oldCorrection as any).deadline,
        new: data.deadline
      };
    }
    
    if (data.submission_date !== undefined && 
        (oldCorrection as any).submission_date !== data.submission_date) {
      dateChanges['submission_date'] = {
        old: (oldCorrection as any).submission_date,
        new: data.submission_date
      };
    }
    
    // Si des modifications de dates ont été effectuées, créer un log
    if (Object.keys(dateChanges).length > 0) {
      await createLogEntry({
        action_type: 'UPDATE_DATES',
        description: `Modification des dates pour la correction #${correctionId}`,
        entity_type: 'correction',
        entity_id: parseInt(correctionId),
        user_id: user.id,
        username: user.username,
        metadata: {
          changes: dateChanges,
          activity_id: (oldCorrection as any).activity_id,
          student_id: (oldCorrection as any).student_id
        }
      });
    }

    // Si final_grade n'est pas disponible, le calculer
    // Vérifier si updatedCorrection existe et le traiter comme un objet typé
    if (updatedCorrection && typeof updatedCorrection === 'object') {
      const correctionData = updatedCorrection as any;
      
      if (!correctionData.final_grade) {
        const grade = parseFloat(correctionData.grade) || 0;
        const penalty = parseFloat(correctionData.penalty) || 0;
        
        // Appliquer la nouvelle règle
        if (grade < 5) {
          correctionData.final_grade = grade;
        } else {
          correctionData.final_grade = Math.max(grade - penalty, 5);
        }
      }
    }

    return NextResponse.json(updatedCorrection);
  } catch (error) {
    console.error('Error updating correction:', error);
    
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la correction' },
      { status: 500 }
    );
  }
}
