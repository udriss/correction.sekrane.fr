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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params as needed in Next.js 15
    const { id } = await params;
    const studentId = parseInt(id);
    
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

    
    
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    // Verify the student exists using query function
    const students = await query<any[]>(`
      SELECT * FROM students WHERE id = ?
    `, [studentId]);

    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get total corrections count
    const totalCorrectionsResult = await query<any[]>(`
      SELECT COUNT(*) as total 
      FROM corrections_autres 
      WHERE student_id = ?
    `, [studentId]);
    
    const totalCorrections = totalCorrectionsResult[0]?.total || 0;

    // Get correction stats with the new points system
    const correctionStatsResult = await query<any[]>(`
      SELECT 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'grade', grade,
            'points_earned', points_earned,
            'points', (
              SELECT points 
              FROM activities_autres 
              WHERE id = corrections_autres.activity_id
            )
          )
        ) as all_points
      FROM corrections_autres
      WHERE student_id = ?
      GROUP BY student_id
    `, [studentId]);
    
    const stats = correctionStatsResult[0] || {};
    
    // Variables pour stocker les statistiques normalisées
    let normalizedGrades: number[] = [];
    let normalizedPartStats = {
      averages: [] as number[],
      totals: [] as number[]
    };
    
    if (stats.all_points) {
      try {
        const allPoints = stats.all_points;
        
        // Initialiser les tableaux pour stocker les sommes et les compteurs
        const sums: number[] = [];
        const counts: number[] = [];
        
        // Parcourir chaque correction
        allPoints.forEach((correction: any) => {
          if (correction.points_earned && correction.points) {
            const pointsEarned = correction.points_earned;
            const maxPoints = correction.points;
            
            // Calculer les points totaux pour cette correction
            const totalEarned = pointsEarned.reduce((sum: number, points: number) => sum + (typeof points === 'number' ? points : 0), 0);
            const totalMax = maxPoints.reduce((sum: number, points: number) => sum + (typeof points === 'number' ? points : 0), 0);
            
            // Normaliser la note totale sur 20 et l'ajouter au tableau
            const normalizedGrade = normalizeGrade(totalEarned, totalMax);
            if (!isNaN(normalizedGrade)) {
              normalizedGrades.push(normalizedGrade);
            }
            
            // Accumuler les points normalisés pour chaque partie
            pointsEarned.forEach((points: number, index: number) => {
              if (!sums[index]) sums[index] = 0;
              if (!counts[index]) counts[index] = 0;
              
              if (typeof points === 'number' && !isNaN(points) && typeof maxPoints[index] === 'number' && maxPoints[index] > 0) {
                // Normaliser les points de cette partie sur 20 avant de les additionner
                const normalizedPoints = normalizeGrade(points, maxPoints[index]);
                sums[index] += normalizedPoints;
                counts[index]++;
              }
            });
          }
        });
        
        // Calculer les moyennes normalisées
        normalizedPartStats.averages = sums.map((sum, index) => 
          counts[index] > 0 ? sum / counts[index] : 0
        );
        
        // Stocker les totaux normalisés
        normalizedPartStats.totals = sums;
        
      } catch (e) {
        console.error('Erreur lors du traitement des points:', e);
      }
    }

    // Get recent activity with activity names from activities_autres
    const recentCorrections = await query<any[]>(`
      SELECT 
        c.id, 
        c.grade, 
        c.submission_date, 
        a.name as activity_name,
        c.points_earned,
        a.points,
        a.parts_names
      FROM corrections_autres c
      LEFT JOIN activities_autres a ON c.activity_id = a.id
      WHERE c.student_id = ?
      ORDER BY c.submission_date DESC, c.updated_at DESC
      LIMIT 5
    `, [studentId]);

    // Build the stats object with normalized grades
    const responseData = {
      total_corrections: totalCorrections,
      average_grade: normalizedGrades.length > 0 ? 
        normalizedGrades.reduce((sum, grade) => sum + grade, 0) / normalizedGrades.length : 
        null,
      highest_grade: normalizedGrades.length > 0 ? 
        Math.max(...normalizedGrades) : 
        null,
      lowest_grade: normalizedGrades.length > 0 ? 
        Math.min(...normalizedGrades) : 
        null,
      parts_averages: normalizedPartStats.averages,
      parts_totals: normalizedPartStats.totals,
      recent_corrections: recentCorrections.map(c => {
        const pointsEarned = c.points_earned || [];
        const maxPoints = c.points || [];
        const totalEarned = pointsEarned.reduce((sum: number, p: number) => sum + (typeof p === 'number' ? p : 0), 0);
        const totalMax = maxPoints.reduce((sum: number, p: number) => sum + (typeof p === 'number' ? p : 0), 0);
        
        return {
          id: c.id,
          activity_name: c.activity_name || 'Unnamed activity',
          grade: normalizeGrade(totalEarned, totalMax),
          original_grade: totalEarned,
          max_points: totalMax,
          submission_date: c.submission_date,
          points_earned: pointsEarned,
          points: maxPoints,
          parts_names: c.parts_names || []
        };
      })
    };
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error getting student stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}