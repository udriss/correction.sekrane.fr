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
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    return await withConnection(async (connection) => {
      // Récupérer toutes les corrections avec les informations associées, y compris les sous-classes
      const [rows] = await connection.query(`
        SELECT 
          c.*,
          a.name AS activity_name, 
          a.experimental_points, 
          a.theoretical_points,
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
          corrections c
        LEFT JOIN 
          activities a ON c.activity_id = a.id
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
      const formattedCorrections = (rows as any[]).map(correction => ({
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
        experimental_points_earned: Number(correction.experimental_points_earned) || 0,
        theoretical_points_earned: Number(correction.theoretical_points_earned) || 0,
        status: correction.status || 'pending',
        experimental_points: Number(correction.experimental_points) || 0,
        theoretical_points: Number(correction.theoretical_points) || 0,
        penality: Number(correction.penalty) || null, // Ajout du champ penality (issu du champ penalty en DB)
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
        shareCode: correction.share_code || null, // Ajout du champ shareCode
        student_sub_class: correction.student_sub_class || null // Ajout du champ student_sub_class
      }));

      return NextResponse.json(formattedCorrections);
    });
  } catch (error) {
    console.error('Error fetching corrections:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des corrections' }, { status: 500 });
  }
}
