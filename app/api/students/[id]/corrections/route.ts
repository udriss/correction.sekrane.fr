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
           a.experimental_points, 
           a.theoretical_points,
           cl.name AS class_name,
           s.first_name AS student_first_name,
           s.last_name AS student_last_name,
           CONCAT(s.first_name, ' ', s.last_name) AS student_name
         FROM 
           corrections c
         LEFT JOIN 
           activities a ON c.activity_id = a.id
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

        return {
          id: correction.id,
          activity_id: correction.activity_id,
          content: correction.content,
          content_data: parsedContentData,
          created_at: correction.created_at,
          updated_at: correction.updated_at,
          grade: correction.grade,
          penalty: correction.penalty,
          deadline: correction.deadline,
          submission_date: correction.submission_date,
          experimental_points_earned: correction.experimental_points_earned,
          theoretical_points_earned: correction.theoretical_points_earned,
          group_id: correction.group_id,
          class_id: correction.class_id,
          student_id: correction.student_id,
          student_name: correction.student_name || 'Étudiant inconnu',
          student_first_name: correction.student_first_name || '',
          student_last_name: correction.student_last_name || '',
          activity_name: correction.activity_name || 'Activité inconnue',
          class_name: correction.class_name || 'Sans classe',
          experimental_points: correction.experimental_points || 0,
          theoretical_points: correction.theoretical_points || 0
        };
      });
      
      return NextResponse.json(formattedCorrections);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des corrections:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des corrections', details: String(error) },
      { status: 500 }
    );
  }
}
