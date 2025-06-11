import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    // Await the params
    const { id } = await params;
    const studentId = parseInt(id);
    
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'ID étudiant invalide' }, { status: 400 });
    }

    // Vérifier que l'étudiant existe
    return await withConnection(async (connection) => {
      // Vérifier si l'étudiant existe
      const [studentResult] = await connection.query(
        'SELECT id FROM students WHERE id = ?',
        [studentId]
      );

      if (!Array.isArray(studentResult) || (studentResult as any[]).length === 0) {
        return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
      }

      // Récupérer toutes les corrections pour cet étudiant avec informations sur l'activité
      const [corrections] = await connection.query(
        `SELECT 
           c.*,
           a.name AS activity_name, 
           a.points,
           a.parts_names,
           cl.name AS class_name,
           s.first_name AS student_first_name,
           s.last_name AS student_last_name,
           CONCAT(s.first_name, ' ', s.last_name) AS student_name
         FROM 
           corrections_autres c
         LEFT JOIN 
           activities_autres a ON c.activity_id = a.id
         LEFT JOIN
           classes cl ON c.class_id = cl.id
         LEFT JOIN
           students s ON c.student_id = s.id
         WHERE 
           c.student_id = ?
         ORDER BY 
           c.submission_date DESC, c.created_at DESC`,
        [studentId]
      );

      // Si aucune correction n'est trouvée, retourner un tableau vide
      if (!Array.isArray(corrections) || (corrections as any[]).length === 0) {
        return NextResponse.json([]);
      }

      // Formater les résultats pour le frontend avec une gestion plus robuste du content_data
      const formattedCorrections = (corrections as any[]).map(correction => {
        // Gérer le parsing de content_data de manière sécurisée
        let parsedContentData = null;
        if (correction.content_data) {
          try {
            // Vérifier si content_data est déjà un objet
            if (typeof correction.content_data === 'object') {
              parsedContentData = correction.content_data;
            } else {
              parsedContentData = JSON.parse(correction.content_data);
            }
          } catch (error) {
            console.error("Erreur de parsing JSON pour content_data:", error);
            // En cas d'erreur, conserver la donnée brute
            parsedContentData = { raw: correction.content_data };
          }
        }

        // Parser les points et parts_names qui sont stockés en JSON dans la base de données
        let points = [];
        try {
          points = correction.points ? correction.points : [];
        } catch (e) {
          console.error("Erreur lors du parsing des points:", e);
          points = [];
        }

        let partsNames = [];
        try {
          partsNames = correction.parts_names ? correction.parts_names : [];
        } catch (e) {
          console.error("Erreur lors du parsing des parts_names:", e);
          partsNames = [];
        }

        let pointsEarned = [];
        try {
          pointsEarned = correction.points_earned ? correction.points_earned : [];
        } catch (e) {
          console.error("Erreur lors du parsing des points_earned:", e);
          pointsEarned = [];
        }

        // Parser les parties désactivées
        let disabledParts = null;
        try {
          if (correction.disabled_parts) {
            if (typeof correction.disabled_parts === 'string') {
              disabledParts = JSON.parse(correction.disabled_parts);
            } else {
              disabledParts = correction.disabled_parts;
            }
          }
        } catch (e) {
          console.error("Erreur lors du parsing des disabled_parts:", e);
          disabledParts = null;
        }

        return {
          id: correction.id,
          activity_id: correction.activity_id,
          content: correction.content,
          content_data: parsedContentData,
          created_at: correction.created_at,
          updated_at: correction.updated_at,
          grade: correction.grade,
          penalty: correction.penalty,
          bonus: correction.bonus,
          deadline: correction.deadline,
          submission_date: correction.submission_date,
          points: points,
          parts_names: partsNames,
          points_earned: pointsEarned,
          final_grade: correction.final_grade,
          percentage_grade: correction.percentage_grade, // Nouveau champ pour le pourcentage normalisé
          disabled_parts: disabledParts, // Parties désactivées
          group_id: correction.group_id,
          class_id: correction.class_id,
          student_id: correction.student_id,
          student_name: correction.student_name || 'Étudiant inconnu',
          student_first_name: correction.student_first_name || '',
          student_last_name: correction.student_last_name || '',
          activity_name: correction.activity_name || 'Activité inconnue',
          class_name: correction.class_name || 'Sans classe',
          status: correction.status || 'ACTIVE'
        };
      });
      
      return NextResponse.json(formattedCorrections);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des corrections:', error);
    let errorMessage = '';
    let errorDetails = '';
    
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json(
      { 
        error: error,
        details: errorDetails,
        status: 500,
        statusText: 'Internal Server Error'
      }, 
      { status: 500 }
    );
  }
}
