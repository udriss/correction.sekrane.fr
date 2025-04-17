import { NextRequest, NextResponse } from 'next/server';
import { getCorrectionAutreById, updateCorrectionAutre, deleteCorrectionAutre, calculateGrade } from '@/lib/correctionAutre';
import { getActivityAutreById } from '@/lib/activityAutre';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { withConnection } from '@/lib/db';
import { createLogEntry } from '@/lib/services/logsService';
import { CorrectionAutre } from '@/lib/types';

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

    const { id } = await params;    
    const idNumber = parseInt(id);
    
    if (isNaN(idNumber)) {
      return NextResponse.json({ error: 'ID de correction invalide' }, { status: 400 });
    }

    // Récupérer la correction
    const correction = await getCorrectionAutreById(idNumber);
    if (!correction) {
      return NextResponse.json({ error: 'CorrectionNotFound: Correction autre non trouvée' }, { status: 404 });
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
          classInfo = classRows[0] as any;
        }
        
        // Récupérer la sous-classe si student_id existe
        if (correction.student_id) {
          const [subClassRows] = await connection.query(
            'SELECT sub_class FROM class_students WHERE class_id = ? AND student_id = ?',
            [correction.class_id, correction.student_id]
          );
          
          if (Array.isArray(subClassRows) && subClassRows.length > 0) {
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
        'SELECT active, grade, penalty FROM corrections_autres WHERE id = ?',
        [idNumber]
      );
      
      let activeStatus = 1; // Par défaut, une correction est active (1)
      
      if (Array.isArray(activeStatusResult) && activeStatusResult.length > 0) {
        // La valeur peut être 0, 1, true, false ou null
        const activeValue = (activeStatusResult[0] as any).active;
        // Convertir en nombre entier: 0 si activeValue est 0, false ou null, 1 sinon
        activeStatus = (activeValue === 0 || activeValue === false || activeValue === null) ? 0 : 1;
      }
      
      // Combiner toutes les données
      return NextResponse.json({
        ...correction,
        active: activeStatus,
        class_name: classInfo ? classInfo.name : null,
        sub_class: subClass,
        student_data: studentData
      });
    });
  } catch (error) {
    console.error('CorrectionFetchError:', error);
    return NextResponse.json({ error: 'CorrectionFetchError: Erreur lors de la récupération de la correction autre', details: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
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
    
    // Await params.id avant de l'utiliser
    const { id } = await params;
    const correctionId = parseInt(id);
    
    if (isNaN(correctionId)) {
      return NextResponse.json({ error: 'InvalidCorrectionID: ID de correction invalide' }, { status: 400 });
    }

    const body = await request.json();
    
    return await withConnection(async (connection) => {
      // Récupérer la correction existante
      const correction = await getCorrectionAutreById(correctionId);
      if (!correction) {
        return NextResponse.json({ error: 'CorrectionNotFound: Correction autre non trouvée' }, { status: 404 });
      }
      
      // Préparer les données à mettre à jour
      const updateData: Partial<CorrectionAutre> = {};
      
      // Gérer les champs de base
      if (body.student_id !== undefined) {
        updateData.student_id = body.student_id;
      }
      
      // Gérer l'association avec une classe
      if (body.class_id !== undefined) {
        updateData.class_id = body.class_id !== null ? parseInt(body.class_id) : null;
      }
      
      // Gérer les points obtenus (tableau)
      if (body.points_earned !== undefined) {
        updateData.points_earned = Array.isArray(body.points_earned) ? body.points_earned : [];
      }
      
      // Gérer la pénalité
      if (body.penalty !== undefined) {
        updateData.penalty = parseFloat(body.penalty) || 0;
      }
      
      // Gérer la note
      if (body.grade !== undefined) {
        updateData.grade = parseFloat(body.grade) || 0;
      }
      
      // Gérer le contenu
      if (body.content !== undefined) {
        updateData.content = body.content;
      }
      
      // Gérer content_data qui peut avoir différents formats
      if (body.content_data !== undefined || body.fragments !== undefined || body.items !== undefined) {
        // Récupérer d'abord les données existantes
        const [existingData] = await connection.query(
          'SELECT content_data FROM corrections_autres WHERE id = ?',
          [correctionId]
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

        // S'assurer que contentData est bien un objet et non une chaîne
        if (typeof contentData === 'string') {
          try {
            contentData = JSON.parse(contentData);
          } catch (e) {
            console.error('Erreur de parsing contentData:', e);
            contentData = {};
          }
        }

        // S'assurer que content_data est bien un Record<string, any>
        updateData.content_data = typeof contentData === 'object' && contentData !== null 
          ? contentData as Record<string, any> 
          : {};
      }
      
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'NoValidData: Aucun champ valide à mettre à jour' }, { status: 400 });
      }
      
      // Mettre à jour la correction
      await updateCorrectionAutre(correctionId, updateData);
      
      // Récupérer la correction mise à jour pour la retourner
      const [updatedData] = await connection.query(
        `SELECT c.*, a.name as activity_name, 
         CONCAT(s.first_name, ' ', s.last_name) as student_name
         FROM corrections_autres c
         JOIN activities_autres a ON c.activity_id = a.id
         LEFT JOIN students s ON c.student_id = s.id
         WHERE c.id = ?`,
        [correctionId]
      );
      
      if (!Array.isArray(updatedData) || updatedData.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'Correction autre mise à jour avec succès'
        });
      }
      
      // Formater la correction pour la retourner
      const updatedCorrection = updatedData[0] as any;
      
      // Parser content_data pour le retour
      try {
        if (updatedCorrection.content_data && typeof updatedCorrection.content_data === 'string') {
          updatedCorrection.content_data = JSON.parse(updatedCorrection.content_data);
        }
        
        if (updatedCorrection.points_earned && typeof updatedCorrection.points_earned === 'string') {
          updatedCorrection.points_earned = JSON.parse(updatedCorrection.points_earned);
        }
      } catch (e) {
        console.error('Erreur de parsing données après mise à jour:', e);
      }
      
      return NextResponse.json(updatedCorrection);
    });
  } catch (error) {
    console.error('CorrectionUpdateError:', error);
    return NextResponse.json(
      { error: 'CorrectionUpdateError: Erreur lors de la mise à jour de la correction autre', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id } = await params;
    const correctionId = parseInt(id);
    if (isNaN(correctionId)) {
      return NextResponse.json({ error: 'InvalidCorrectionID: ID de correction invalide' }, { status: 400 });
    }
    
    // Utiliser withConnection au lieu de pool.query directement
    return await withConnection(async (connection) => {
      // Récupérer d'abord la correction pour la retourner après suppression
      const [rows] = await connection.query(
        `SELECT c.*, a.name as activity_name, CONCAT(s.first_name, ' ', s.last_name) as student_name 
         FROM corrections_autres c
         LEFT JOIN activities_autres a ON c.activity_id = a.id
         LEFT JOIN students s ON c.student_id = s.id
         WHERE c.id = ?`, 
        [id]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return new NextResponse(JSON.stringify({ error: 'CorrectionNotFound: Correction autre non trouvée' }), {
          status: 404,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      }
      
      const correction = rows[0] as any;
      
      // Supprimer la correction
      await connection.query('DELETE FROM corrections_autres WHERE id = ?', [id]);
      
      // Enregistrer un log de suppression
      await createLogEntry({
        action_type: 'DELETE_CORRECTION_AUTRE',
        description: `Suppression de la correction autre #${id}${correction.student_name ? ` pour ${correction.student_name}` : ''} - ${correction.activity_name || 'Activité inconnue'}`,
        entity_type: 'correction_autre',
        entity_id: parseInt(id),
        user_id: customUser?.id,
        username: customUser?.username,
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
        action_type: 'DELETE_CORRECTION_AUTRE_ERROR',
        description: `Erreur lors de la suppression d'une correction autre: ${(error as Error).message}`,
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
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }
    


    const { id } = await params;
    const correctionId = parseInt(id);
    if (isNaN(correctionId)) {
      return NextResponse.json({ error: 'ID de correction invalide' }, { status: 400 });
    }

    const data = await request.json();
    
    // Récupérer la correction existante pour comparaison
    const oldCorrection = await getCorrectionAutreById(correctionId);
    if (!oldCorrection) {
      return NextResponse.json({ error: 'Correction autre non trouvée' }, { status: 404 });
    }

    // Préparation des données à mettre à jour
    const updateData: Partial<CorrectionAutre> = {};
    
    if (data.points_earned !== undefined) {
      updateData.points_earned = Array.isArray(data.points_earned) ? data.points_earned : [];
    }
    
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline;
    }
    
    if (data.submission_date !== undefined) {
      updateData.submission_date = data.submission_date;
    }
    
    if (data.penalty !== undefined) {
      updateData.penalty = parseFloat(data.penalty) || 0;
    }
    
    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    if (data.content_data !== undefined) {
      // S'assurer que content_data est bien un objet et non une chaîne
      if (typeof data.content_data === 'string') {
        try {
          updateData.content_data = JSON.parse(data.content_data) as Record<string, any>;
        } catch (e) {
          console.error('Erreur de parsing content_data:', e);
          updateData.content_data = {};
        }
      } else {
        // S'assurer que l'objet est bien un Record<string, any>
        updateData.content_data = typeof data.content_data === 'object' && data.content_data !== null
          ? data.content_data as Record<string, any>
          : {};
      }
    }
    
    if (data.grade !== undefined) {
      updateData.grade = parseFloat(data.grade) || 0;
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 });
    }

    // Recalculer la note si les points ou la pénalité changent
    if (updateData.points_earned !== undefined || updateData.penalty !== undefined || data.recalculate_grade === true) {
      // Récupérer l'activité pour le calcul de la note
      const activity = await getActivityAutreById(oldCorrection.activity_id || 0);
      
      if (activity) {
        // Utiliser les points mis à jour ou ceux existants
        const points = updateData.points_earned !== undefined ? 
          updateData.points_earned : 
          oldCorrection.points_earned;
          
        // Utiliser la pénalité mise à jour ou celle existante
        const penalty = updateData.penalty !== undefined ?
          updateData.penalty :
          oldCorrection.penalty || 0;
          
        // Calculer la note avec la fonction dédiée importée
        const calculatedResult = calculateGrade(activity.points, points, penalty);
        
        // Mettre à jour à la fois la note brute et la note finale
        updateData.grade = calculatedResult.grade;
        updateData.final_grade = calculatedResult.final_grade;
      }
    }

    // Mettre à jour la correction
    await updateCorrectionAutre(correctionId, updateData);
    
    // Récupérer la correction mise à jour
    const updatedCorrection = await getCorrectionAutreById(correctionId);
    
    // Logger les modifications
    const changes: Record<string, { old: any; new: any }> = {};
    
    // Vérifier les changements de notes/points
    if (data.points_earned !== undefined) {
      changes['points_earned'] = {
        old: oldCorrection.points_earned,
        new: updatedCorrection?.points_earned
      };
    }
    
    if (data.penalty !== undefined) {
      changes['penalty'] = {
        old: oldCorrection.penalty,
        new: updatedCorrection?.penalty
      };
    }
    
    // Si des modifications de notes ont été effectuées, créer un log
    if (Object.keys(changes).length > 0) {
      await createLogEntry({
        action_type: 'UPDATE_GRADE_AUTRE',
        description: `Modification des notes pour la correction autre #${correctionId}`,
        entity_type: 'correction_autre',
        entity_id: correctionId,
        user_id: customUser?.id,
        username: customUser?.username,
        metadata: {
          changes,
          old_grade: oldCorrection.grade,
          new_grade: updatedCorrection?.grade,
          old_final_grade: oldCorrection.final_grade,
          new_final_grade: updatedCorrection?.final_grade,
          activity_id: oldCorrection.activity_id,
          student_id: oldCorrection.student_id
        }
      });
    }
    
    // Vérifier les changements de dates
    const dateChanges: Record<string, { old: any; new: any }> = {};
    
    if (data.deadline !== undefined) {
      dateChanges['deadline'] = {
        old: oldCorrection.deadline,
        new: updatedCorrection?.deadline
      };
    }
    
    if (data.submission_date !== undefined) {
      dateChanges['submission_date'] = {
        old: oldCorrection.submission_date,
        new: updatedCorrection?.submission_date
      };
    }
    
    // Si des modifications de dates ont été effectuées, créer un log
    if (Object.keys(dateChanges).length > 0) {
      await createLogEntry({
        action_type: 'UPDATE_DATES_AUTRE',
        description: `Modification des dates pour la correction autre #${correctionId}`,
        entity_type: 'correction_autre',
        entity_id: correctionId,
        user_id: customUser?.id,
        username: customUser?.username,
        metadata: {
          changes: dateChanges,
          activity_id: oldCorrection.activity_id,
          student_id: oldCorrection.student_id
        }
      });
    }

    return NextResponse.json(updatedCorrection);
  } catch (error) {
    console.error('Error updating correction_autre:', error);
    
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la correction autre' },
      { status: 500 }
    );
  }
}