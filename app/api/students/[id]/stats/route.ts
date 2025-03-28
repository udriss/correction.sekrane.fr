import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { getUser } from '@/lib/auth';
import authOptions from '@/lib/auth';

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
      FROM corrections 
      WHERE student_id = ?
    `, [studentId]);
    
    const totalCorrections = totalCorrectionsResult[0]?.total || 0;

    // Get correction stats
    const correctionStatsResult = await query<any[]>(`
      SELECT 
        AVG(grade) as avg_grade,
        AVG(experimental_points_earned) as avg_exp_points,
        AVG(theoretical_points_earned) as avg_theo_points,
        SUM(experimental_points_earned) as sum_exp_points,
        SUM(theoretical_points_earned) as sum_theo_points,
        MAX(grade) as max_grade,
        MIN(grade) as min_grade
      FROM corrections 
      WHERE student_id = ?
    `, [studentId]);
    
    const stats = correctionStatsResult[0] || {};

    // Get recent activity
    const recentCorrections = await query<any[]>(`
      SELECT c.id, c.grade, c.submission_date, a.name as activity_name
      FROM corrections c
      LEFT JOIN activities a ON c.activity_id = a.id
      WHERE c.student_id = ?
      ORDER BY c.updated_at DESC
      LIMIT 5
    `, [studentId]);

    // Build the stats object
    const responseData = {
      total_corrections: totalCorrections,
      average_grade: stats.avg_grade || null,
      highest_grade: stats.max_grade || null,
      lowest_grade: stats.min_grade || null,
      total_experimental_points: stats.sum_exp_points || 0,
      total_theoretical_points: stats.sum_theo_points || 0,
      average_experimental_points: stats.avg_exp_points || 0,
      average_theoretical_points: stats.avg_theo_points || 0,
      recent_corrections: recentCorrections.map(c => ({
      id: c.id,
      activity_name: c.activity_name || 'Unnamed activity',
      grade: c.grade,
      submission_date: c.submission_date
      }))
    };
    
    // Log the data
    // console.log('Student stats response:', responseData);
    
    // Return the stats
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error getting student stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}