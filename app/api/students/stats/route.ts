import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { getUser } from '@/lib/auth';
import authOptions from '@/lib/auth';

// Fonction utilitaire pour normaliser une note sur 20
const normalizeGrade = (grade: number, maxPoints: number): number => {
  if (!maxPoints || maxPoints === 0) return 0;
  return (grade * 20) / maxPoints;
};

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

    // Récupérer tous les étudiants
    const students = await query<any[]>(`
      SELECT id, first_name, last_name
      FROM students
      ORDER BY last_name, first_name
    `);

    // Pour chaque étudiant, récupérer ses statistiques normalisées
    const enrichedStats = await Promise.all(students.map(async (student) => {
      // Récupérer les données des corrections pour cet étudiant
      const correctionData = await query<any[]>(`
        SELECT 
          c.id,
          c.grade,
          c.points_earned,
          c.submission_date,
          a.name as activity_name,
          a.points,
          a.parts_names
        FROM 
          corrections_autres c
        LEFT JOIN 
          activities_autres a ON c.activity_id = a.id
        WHERE 
          c.student_id = ?
        ORDER BY 
          c.submission_date DESC, c.updated_at DESC
      `, [student.id]);

      // Variables pour stocker les statistiques normalisées
      let normalizedGrades: number[] = [];
      let normalizedPartStats = {
        averages: [] as number[],
        totals: [] as number[]
      };
      
      // Initialiser les tableaux pour stocker les sommes et les compteurs
      const sums: number[] = [];
      const counts: number[] = [];
      
      // Parcourir chaque correction pour calculer les statistiques
      correctionData.forEach((correction) => {
        const pointsEarned = correction.points_earned || [];
        const maxPoints = correction.points || [];
        
        // Calculer les points totaux pour cette correction
        const totalEarned = pointsEarned.reduce(
          (sum: number, points: number) => sum + (typeof points === 'number' ? points : 0), 
          0
        );
        const totalMax = maxPoints.reduce(
          (sum: number, points: number) => sum + (typeof points === 'number' ? points : 0), 
          0
        );
        
        // Normaliser la note totale sur 20 et l'ajouter au tableau
        const normalizedGrade = normalizeGrade(totalEarned, totalMax);
        if (!isNaN(normalizedGrade)) {
          normalizedGrades.push(normalizedGrade);
        }
        
        // Accumuler les points normalisés pour chaque partie
        pointsEarned.forEach((points: number, index: number) => {
          if (!sums[index]) sums[index] = 0;
          if (!counts[index]) counts[index] = 0;
          
          if (typeof points === 'number' && !isNaN(points) && 
              typeof maxPoints[index] === 'number' && maxPoints[index] > 0) {
            // Normaliser les points de cette partie sur 20 avant de les additionner
            const normalizedPoints = normalizeGrade(points, maxPoints[index]);
            sums[index] += normalizedPoints;
            counts[index]++;
          }
        });
      });
      
      // Calculer les moyennes normalisées pour chaque partie
      normalizedPartStats.averages = sums.map((sum, index) => 
        counts[index] > 0 ? sum / counts[index] : 0
      );
      
      // Stocker les totaux normalisés pour chaque partie
      normalizedPartStats.totals = sums;

      // Récupérer uniquement les 5 corrections les plus récentes
      const recentCorrections = correctionData.slice(0, 5).map(c => {
        const pointsEarned = c.points_earned || [];
        const maxPoints = c.points || [];
        const totalEarned = pointsEarned.reduce(
          (sum: number, p: number) => sum + (typeof p === 'number' ? p : 0), 
          0
        );
        const totalMax = maxPoints.reduce(
          (sum: number, p: number) => sum + (typeof p === 'number' ? p : 0), 
          0
        );
        
        return {
          id: c.id,
          activity_name: c.activity_name || 'Activité sans nom',
          grade: normalizeGrade(totalEarned, totalMax),
          original_grade: totalEarned,
          max_points: totalMax,
          submission_date: c.submission_date,
          points_earned: pointsEarned,
          points: maxPoints,
          parts_names: c.parts_names || []
        };
      });

      // Calculer les statistiques globales pour l'étudiant
      return {
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        first_name: student.first_name,
        last_name: student.last_name,
        total_corrections: correctionData.length,
        average_grade: normalizedGrades.length > 0 ? 
          normalizedGrades.reduce((sum, grade) => sum + grade, 0) / normalizedGrades.length : 
          0,
        highest_grade: normalizedGrades.length > 0 ? 
          Math.max(...normalizedGrades) : 
          0,
        lowest_grade: normalizedGrades.length > 0 ? 
          Math.min(...normalizedGrades) : 
          0,
        parts_averages: normalizedPartStats.averages,
        parts_totals: normalizedPartStats.totals,
        recent_corrections: recentCorrections
      };
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
