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
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const idNumber = parseInt(id);
    
    if (isNaN(idNumber)) {
      return NextResponse.json({ error: 'ID de correction invalide' }, { status: 400 });
    }

    // Récupérer la correction
    const correction = await getCorrectionById(idNumber);
    if (!correction) {
      return NextResponse.json({ error: 'Correction non trouvée' }, { status: 404 });
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
      
      // Combiner toutes les données
      return NextResponse.json({
        ...correction,
        class_name: classInfo ? classInfo.name : null,
        sub_class: subClass,
        student_data: studentData
      });
    });
  } catch (error) {
    console.error('Error fetching correction:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération de la correction' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid correction ID' }, { status: 400 });
    }

    const body = await request.json();
    
    
    return await withConnection(async (connection) => {
      // Construire la requête SQL dynamiquement
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      
      // Gérer les champs de base
      if (body.student_id !== undefined) {
        updateFields.push('student_id = ?');
        updateValues.push(body.student_id);
      }
      
      // Gérer l'association avec une classe
      if (body.class_id !== undefined) {
        const classId = parseInt(body.class_id);
        if (!isNaN(classId)) {
          updateFields.push('class_id = ?');
          updateValues.push(classId);
          
        } else if (body.class_id === null) {
          // Permet de supprimer l'association avec une classe
          updateFields.push('class_id = NULL');
        }
      }
      
      // Variables pour calculer le grade total si nécessaire
      let expGradeUpdated = false;
      let theoGradeUpdated = false;
      let expGrade = 0;
      let theoGrade = 0;
      
      if (body.experimental_points_earned !== undefined) {
        expGrade = parseFloat(body.experimental_points_earned) || 0;
        updateFields.push('experimental_points_earned = ?');
        updateValues.push(expGrade);
        expGradeUpdated = true;
      }
      
      if (body.theoretical_points_earned !== undefined) {
        theoGrade = parseFloat(body.theoretical_points_earned) || 0;
        updateFields.push('theoretical_points_earned = ?');
        updateValues.push(theoGrade);
        theoGradeUpdated = true;
      }
      
      // Si l'une des notes a changé, récupérer les valeurs actuelles si nécessaire
      if (expGradeUpdated || theoGradeUpdated) {
        if (expGradeUpdated && !theoGradeUpdated) {
          const [currentData] = await connection.query(
            'SELECT theoretical_points_earned FROM corrections WHERE id = ?',
            [idNumber]
          );
          if (Array.isArray(currentData) && currentData.length > 0) {
            theoGrade = parseFloat((currentData[0] as any).theoretical_points_earned) || 0;
          }
        } else if (!expGradeUpdated && theoGradeUpdated) {
          const [currentData] = await connection.query(
            'SELECT experimental_points_earned FROM corrections WHERE id = ?',
            [idNumber]
          );
          if (Array.isArray(currentData) && currentData.length > 0) {
            expGrade = parseFloat((currentData[0] as any).experimental_points_earned) || 0;
          }
        }
        
        // Calculer et ajouter le grade total
        const totalGrade = expGrade + theoGrade;
        updateFields.push('grade = ?');
        updateValues.push(totalGrade);
        
      }
      
      if (body.content !== undefined) {
        updateFields.push('content = ?');
        updateValues.push(body.content);
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

        updateFields.push('content_data = ?');
        updateValues.push(JSON.stringify(contentData));
        
      }
      
      if (updateFields.length === 0) {
        return NextResponse.json({ error: 'Aucun champ valide à mettre à jour' }, { status: 400 });
      }
      
      // Ajouter l'ID à la fin des valeurs
      updateValues.push(idNumber);
      
      const [result] = await connection.query(
        `UPDATE corrections SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
        updateValues
      );
      
      if ((result as any).affectedRows === 0) {
        return NextResponse.json({ error: 'Correction non trouvée ou non modifiée' }, { status: 404 });
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
      
      return NextResponse.json(updatedCorrection);
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la correction:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la correction', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Utiliser withConnection au lieu de pool.query directement
    return await withConnection(async (connection) => {
      // Récupérer d'abord la correction pour la retourner après suppression
      const [rows] = await connection.query('SELECT * FROM corrections WHERE id = ?', [id]);
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return new NextResponse(JSON.stringify({ error: 'Correction non trouvée' }), {
          status: 404,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      }
      
      const correction = rows[0] as any;
      
      // Supprimer la correction
      await connection.query('DELETE FROM corrections WHERE id = ?', [id]);
      
      return new NextResponse(JSON.stringify(correction), {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la correction:', error);
    return new NextResponse(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const { id } = await Promise.resolve(params);
    
    const body = await request.json();
    

    // Convertir explicitement les valeurs numériques si présentes
    if (body.experimental_points_earned !== undefined) {
      body.experimental_points_earned = parseFloat(body.experimental_points_earned);
    }
    
    if (body.theoretical_points_earned !== undefined) {
      body.theoretical_points_earned = parseFloat(body.theoretical_points_earned);
    }

    // Recalculer la note totale si l'une des notes a été modifiée
    if (body.experimental_points_earned !== undefined || body.theoretical_points_earned !== undefined) {
      return await withConnection(async (connection) => {
        // Récupérer les valeurs actuelles si nécessaire
        const [currentData] = await connection.query(
          'SELECT experimental_points_earned, theoretical_points_earned, activity_id FROM corrections WHERE id = ?',
          [id]
        );
        
        if (!Array.isArray(currentData) || currentData.length === 0) {
          return NextResponse.json({ error: 'Correction non trouvée' }, { status: 404 });
        }
        
        const current = currentData[0] as any;
        
        // Utiliser les nouvelles valeurs ou conserver les anciennes
        const expPoints = body.experimental_points_earned !== undefined 
          ? body.experimental_points_earned 
          : parseFloat(current.experimental_points_earned) || 0;
          
        const theoPoints = body.theoretical_points_earned !== undefined 
          ? body.theoretical_points_earned 
          : parseFloat(current.theoretical_points_earned) || 0;
        
        // Calculer la note totale (grade)
        const grade = expPoints + theoPoints;
        
        // Mettre à jour la correction
        await connection.query(
          `UPDATE corrections 
           SET experimental_points_earned = ?, 
               theoretical_points_earned = ?, 
               grade = ?,
               updated_at = NOW()
           WHERE id = ?`,
          [expPoints, theoPoints, grade, id]
        );
        
        // Récupérer la correction mise à jour
        const [rows] = await connection.query(
          `SELECT c.*, a.name as activity_name,
           CONCAT(s.first_name, ' ', s.last_name) as student_name
           FROM corrections c 
           JOIN activities a ON c.activity_id = a.id 
           LEFT JOIN students s ON c.student_id = s.id
           WHERE c.id = ?`,
          [id]
        );
        
        if (!Array.isArray(rows) || rows.length === 0) {
          return NextResponse.json({ error: 'Correction non trouvée après mise à jour' }, { status: 404 });
        }
        
        return NextResponse.json(rows[0]);
      });
    }
    
    // Pour les autres types de mises à jour (student_id, content, content_data)
    return await withConnection(async (connection) => {
      // Construire dynamiquement la requête SQL
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      
      // Ajouter chaque champ présent dans body
      if (body.student_id !== undefined) {
        updateFields.push('student_id = ?');
        updateValues.push(body.student_id);
      }
      
      if (body.content !== undefined) {
        updateFields.push('content = ?');
        updateValues.push(body.content);
      }
      
      if (body.content_data !== undefined) {
        updateFields.push('content_data = ?');
        updateValues.push(typeof body.content_data === 'object' 
          ? JSON.stringify(body.content_data) 
          : body.content_data);
      }
      
      if (updateFields.length === 0) {
        return NextResponse.json({ error: 'Aucun champ valide à mettre à jour' }, { status: 400 });
      }
      
      // Ajouter l'ID à la fin des valeurs
      updateValues.push(id);
      
      // Exécuter la requête de mise à jour
      await connection.query(
        `UPDATE corrections SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
        updateValues
      );
      
      // Récupérer la correction mise à jour
      const [rows] = await connection.query(
        `SELECT c.*, a.name as activity_name,
         CONCAT(s.first_name, ' ', s.last_name) as student_name
         FROM corrections c 
         JOIN activities a ON c.activity_id = a.id 
         LEFT JOIN students s ON c.student_id = s.id
         WHERE c.id = ?`,
        [id]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ error: 'Correction non trouvée après mise à jour' }, { status: 404 });
      }
      
      const updatedCorrection = rows[0] as any;
      
      // Parser content_data pour le retour si nécessaire
      if (updatedCorrection.content_data && typeof updatedCorrection.content_data === 'string') {
        try {
          updatedCorrection.content_data = JSON.parse(updatedCorrection.content_data);
        } catch (e) {
          console.error('Erreur de parsing content_data après mise à jour:', e);
        }
      }
      
      return NextResponse.json(updatedCorrection);
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la correction:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: String(error) }, { status: 500 });
  }
}