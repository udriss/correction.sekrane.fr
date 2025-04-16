import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }

    return await withConnection(async (connection) => {
      // Récupérer toutes les corrections autres avec les informations associées
      const [rows] = await connection.query(`
        SELECT 
          c.*,
          a.name AS activity_name, 
          a.points,
          a.parts_names,
          s.first_name AS student_first_name,
          s.last_name AS student_last_name,
          CONCAT(s.first_name, ' ', s.last_name) AS student_name,
          cl.name AS class_name,
          cl.id AS class_id,
          c.created_at,
          c.updated_at,
          sc.code AS share_code,
          cs.sub_class AS student_sub_class
        FROM 
          corrections_autres c
        LEFT JOIN 
          activities_autres a ON c.activity_id = a.id
        LEFT JOIN 
          students s ON c.student_id = s.id
        LEFT JOIN 
          classes cl ON c.class_id = cl.id
        LEFT JOIN
          share_codes sc ON c.id = sc.correction_id
        LEFT JOIN
          class_students cs ON c.student_id = cs.student_id AND c.class_id = cs.class_id
        ORDER BY 
          c.submission_date DESC, c.created_at DESC
      `);
      
      // Si aucune correction n'est trouvée, retourner un tableau vide
      if (!Array.isArray(rows) || (rows as any[]).length === 0) {
        return NextResponse.json([]);
      }
      
      // Formater les résultats pour le frontend
      const formattedCorrections = (rows as any[]).map(correction => {
        // Analyser points_earned qui est stocké en JSON dans la base de données
        let points_earned = [];
        try {
          if (correction.points_earned) {
            if (typeof correction.points_earned === 'string') {
              points_earned = JSON.parse(correction.points_earned);
            } else if (Array.isArray(correction.points_earned)) {
              points_earned = correction.points_earned;
            }
          }
        } catch (e) {
          console.warn('Failed to parse points_earned:', e);
          points_earned = [];
        }

        // Analyser les points de l'activité
        let activityPoints = [];
        try {
          if (correction.points) {
            if (typeof correction.points === 'string') {
              activityPoints = JSON.parse(correction.points);
            } else if (Array.isArray(correction.points)) {
              activityPoints = correction.points;
            }
          }
        } catch (e) {
          console.warn('Failed to parse activity points:', e);
          activityPoints = [];
        }

        // Analyser les noms des parties
        let partsNames = [];
        try {
          if (correction.parts_names) {
            if (typeof correction.parts_names === 'string') {
              partsNames = JSON.parse(correction.parts_names);
            } else if (Array.isArray(correction.parts_names)) {
              partsNames = correction.parts_names;
            }
          }
        } catch (e) {
          console.warn('Failed to parse parts_names:', e);
          partsNames = [];
        }

        // Calculer le pourcentage de réussite si possible
        let scorePercentage = 0;
        if (Array.isArray(points_earned) && Array.isArray(activityPoints) && activityPoints.length > 0) {
          const totalEarned = points_earned.reduce((sum, point) => sum + (Number(point) || 0), 0);
          const totalPossible = activityPoints.reduce((sum, point) => sum + (Number(point) || 0), 0);
          scorePercentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
        }

        return {
          id: correction.id,
          activity_id: correction.activity_id,
          activity_name: correction.activity_name || 'Activité inconnue',
          student_id: correction.student_id,
          student_name: correction.student_name || 'Étudiant inconnu',
          student_first_name: correction.student_first_name || '',
          student_last_name: correction.student_last_name || '',
          class_id: correction.class_id,
          class_name: correction.class_name || 'Sans classe',
          grade: (() => {
            const numericGrade = Number(correction.grade);
            return isNaN(numericGrade) ? 0 : numericGrade;
          })(),
          submission_date: correction.submission_date || new Date(),
          points_earned: points_earned,
          status: correction.status || 'pending',
          penalty: Number(correction.penalty) || null,
          content: correction.content,
          created_at: correction.created_at,
          updated_at: correction.updated_at,
          content_data: (() => {
            try {
              if (!correction.content_data) return null;
              if (typeof correction.content_data === 'object') return correction.content_data;
              return JSON.parse(correction.content_data);
            } catch (e) {
              console.warn('Failed to parse content_data:', e);
              return null;
            }
          })(),
          deadline: correction.deadline,
          sub_class: correction.sub_class || null,
          shareCode: correction.share_code || null,
          student_sub_class: correction.student_sub_class || null,
          active: correction.active !== undefined ? correction.active : undefined,
          final_grade: correction.final_grade !== undefined ? correction.final_grade : undefined,
          score_percentage: Math.round(scorePercentage * 100) / 100,
          parts_names: partsNames,
          activity_points: activityPoints
        };
      });

      return NextResponse.json(formattedCorrections);
    });
  } catch (error) {
    console.error('Error fetching corrections_autres:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      details: error 
    }, { status: 500 });
  }
}