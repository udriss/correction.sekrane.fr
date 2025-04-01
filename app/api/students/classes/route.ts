import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { getUser } from '@/lib/auth';
import authOptions from '@/lib/auth';

// GET endpoint pour récupérer toutes les associations étudiant-classe
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

    // 1. Récupération des données principales étudiant-classe
    const studentClasses = await query(`
      SELECT 
        sc.student_id, 
        sc.class_id, 
        c.name as class_name,
        c.academic_year,
        c.nbre_subclasses,
        sc.sub_class
      FROM 
        class_students sc
      JOIN 
        classes c ON sc.class_id = c.id
      ORDER BY
        sc.student_id DESC
    `);

    // 2. Récupération du nombre d'étudiants par classe pour fournir des infos contextuelles
    const classStats = await query(`
      SELECT 
        c.id as class_id,
        COUNT(DISTINCT sc.student_id) as student_count
      FROM 
        classes c
      LEFT JOIN 
        class_students sc ON c.id = sc.class_id
      GROUP BY 
        c.id
    `);

    // Map pour accéder facilement aux stats de classe
    const classStatsMap: Record<number, { student_count: number }> = {};
    // @ts-ignore - Ignorer l'erreur de type car nous savons que classStats est un tableau
    classStats.forEach((stat: any) => {
      classStatsMap[stat.class_id] = {
        student_count: stat.student_count
      };
    });

    // 3. Enrichissement des données avec les statistiques
    const enrichedStudentClasses = (studentClasses as any[]).map((relation: any) => ({
      student_id: relation.student_id,
      class_id: relation.class_id,
      class_name: relation.class_name,
      academic_year: relation.year,
      is_primary: true,
      sub_class: relation.group_number,
      nbre_subclasses: relation.nbre_subclasses,
      class_stats: {
        student_count: classStatsMap[relation.class_id]?.student_count || 0
      }
    }));
    
    return NextResponse.json(enrichedStudentClasses);
  } catch (error) {
    console.error('Erreur lors de la récupération des associations étudiant-classe:', error);
    return NextResponse.json(
      { message: 'Erreur serveur', error: (error as Error).message },
      { status: 500 }
    );
  }
}
