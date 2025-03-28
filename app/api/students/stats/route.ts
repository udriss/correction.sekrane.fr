import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { getUser } from '@/lib/auth';
import authOptions from '@/lib/auth';

// GET endpoint pour récupérer les statistiques de tous les étudiants
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Requête principale pour obtenir les données de base par étudiant
    const studentsStats = await query<any[]>(`
      SELECT 
        s.id as student_id,
        COUNT(c.id) as total_corrections,
        IFNULL(AVG(c.grade), 0) as average_grade,
        IFNULL(MAX(c.grade), 0) as highest_grade,
        IFNULL(MIN(c.grade), 0) as lowest_grade,
        IFNULL(SUM(c.experimental_points_earned), 0) as total_experimental_points,
        IFNULL(SUM(c.theoretical_points_earned), 0) as total_theoretical_points,
        IFNULL(AVG(c.experimental_points_earned), 0) as average_experimental_points,
        IFNULL(AVG(c.theoretical_points_earned), 0) as average_theoretical_points
      FROM 
        students s
      LEFT JOIN 
        corrections c ON s.id = c.student_id
      GROUP BY 
        s.id
    `);

    // Récupérer les corrections récentes pour chaque étudiant
    // Cette approche nécessite un post-traitement côté serveur plutôt qu'une requête SQL complexe
    const recentCorrections = await query<any[]>(`
      SELECT 
        c.student_id,
        c.id,
        c.grade,
        c.submission_date,
        a.name as activity_name
      FROM 
        corrections c
      JOIN 
        activities a ON c.activity_id = a.id
      ORDER BY 
        c.submission_date DESC
    `);

    // Organiser les corrections récentes par étudiant (limité à 5 par étudiant)
    const correctionsByStudent: Record<number, any[]> = {};
    
    // @ts-ignore - Ignorer l'erreur de type car nous savons que recentCorrections est un tableau
    recentCorrections.forEach((correction: any) => {
      const studentId = correction.student_id;
      
      if (!correctionsByStudent[studentId]) {
        correctionsByStudent[studentId] = [];
      }
      
      // Ne garder que les 5 corrections les plus récentes par étudiant
      if (correctionsByStudent[studentId].length < 5) {
        correctionsByStudent[studentId].push({
          id: correction.id,
          activity_name: correction.activity_name || 'Activité sans nom',
          grade: correction.grade,
          submission_date: correction.submission_date
        });
      }
    });

    // Enrichir les statistiques des étudiants avec leurs corrections récentes
    const enrichedStats = studentsStats.map((stats: any) => ({
      student_id: stats.student_id,
      total_corrections: stats.total_corrections,
      average_grade: stats.average_grade,
      highest_grade: stats.highest_grade,
      lowest_grade: stats.lowest_grade,
      total_experimental_points: stats.total_experimental_points,
      total_theoretical_points: stats.total_theoretical_points,
      average_experimental_points: stats.average_experimental_points,
      average_theoretical_points: stats.average_theoretical_points,
      recent_corrections: correctionsByStudent[stats.student_id] || []
    }));
    
    return NextResponse.json(enrichedStats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des étudiants:', error);
    return NextResponse.json(
      { message: 'Erreur serveur', error: (error as Error).message },
      { status: 500 }
    );
  }
}
