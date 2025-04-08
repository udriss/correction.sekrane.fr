import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { getUser } from '@/lib/auth';
import authOptions from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'authentification requise' },
        { status: 401 }
      );
    }

    // Récupérer les paramètres de filtre
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    const subClassId = url.searchParams.get('subClassId');
    const activityId = url.searchParams.get('activityId');
    const studentId = url.searchParams.get('studentId');
    const showInactive = url.searchParams.get('showInactive') === 'true';
    
    // Create filter objects for different queries
    const filters = {
      classId,
      subClassId,
      activityId,
      studentId,
      showInactive
    };

    // Condition pour filtrer les corrections inactives
    const activeCondition = showInactive ? '' : 'c.active = 1';

    // 1. Récupération des statistiques globales des corrections
    // For global stats, we need to join with other tables to apply class filter
    let globalStatsQuery = `
      SELECT 
        COUNT(c.id) as total_corrections,
        IFNULL(AVG(c.grade), 0) as average_grade,
        IFNULL(MAX(c.grade), 0) as highest_grade,
        IFNULL(MIN(c.grade), 0) as lowest_grade,
        IFNULL(AVG(c.experimental_points_earned), 0) as avg_experimental_points,
        IFNULL(AVG(c.theoretical_points_earned), 0) as avg_theoretical_points,
        COUNT(DISTINCT c.student_id) as total_students,
        COUNT(DISTINCT c.activity_id) as total_activities
      FROM 
        corrections c
    `;


    let globalWhereConditions = [];
    let globalParams: any[] = [];

    // Ajout du filtre d'activité
    if (!showInactive) {
      globalWhereConditions.push('c.active = 1');
    }

    // For global stats, we need to add joins if filtering by class
    if (classId) {
      globalStatsQuery += `
        JOIN students s ON c.student_id = s.id
        JOIN class_students cs ON s.id = cs.student_id
      `;
      globalWhereConditions.push('cs.class_id = ?');
      globalParams.push(classId);
      
      // Add sub-class filter if provided
      if (subClassId) {
        globalWhereConditions.push('cs.sub_class = ?');
        globalParams.push(subClassId);
      }
    }

    if (activityId) {
      globalWhereConditions.push('c.activity_id = ?');
      globalParams.push(activityId);
    }

    if (studentId) {
      globalWhereConditions.push('c.student_id = ?');
      globalParams.push(studentId);
    }

    if (globalWhereConditions.length > 0) {
      globalStatsQuery += ` WHERE ${globalWhereConditions.join(' AND ')}`;
    }

    const globalStats = await query<any[]>(globalStatsQuery, globalParams);

    // 2. Distribution des notes par tranches
    let gradeDistQuery = `
      SELECT 
        CASE 
          WHEN c.grade < 5 THEN '0-5'
          WHEN c.grade < 10 THEN '5-10'
          WHEN c.grade < 12 THEN '10-12'
          WHEN c.grade < 14 THEN '12-14'
          WHEN c.grade < 16 THEN '14-16'
          WHEN c.grade < 18 THEN '16-18'
          ELSE '18-20'
        END as grade_range,
        COUNT(*) as count
      FROM 
        corrections c
    `;

    let gradeDistWhereConditions = [];
    let gradeDistParams: any[] = [];

    // Ajout du filtre d'activité
    if (!showInactive) {
      gradeDistWhereConditions.push('c.active = 1');
    }

    // Add joins if filtering by class
    if (classId) {
      gradeDistQuery += `
        JOIN students s ON c.student_id = s.id
        JOIN class_students cs ON s.id = cs.student_id
      `;
      gradeDistWhereConditions.push('cs.class_id = ?');
      gradeDistParams.push(classId);
      
      // Add sub-class filter if provided
      if (subClassId) {
        gradeDistWhereConditions.push('cs.sub_class = ?');
        gradeDistParams.push(subClassId);
      }
    }

    if (activityId) {
      gradeDistWhereConditions.push('c.activity_id = ?');
      gradeDistParams.push(activityId);
    }

    if (studentId) {
      gradeDistWhereConditions.push('c.student_id = ?');
      gradeDistParams.push(studentId);
    }

    if (gradeDistWhereConditions.length > 0) {
      gradeDistQuery += ` WHERE ${gradeDistWhereConditions.join(' AND ')}`;
    }

    gradeDistQuery += `
      GROUP BY 
        grade_range
      ORDER BY 
        CASE grade_range
          WHEN '0-5' THEN 1
          WHEN '5-10' THEN 2
          WHEN '10-12' THEN 3
          WHEN '12-14' THEN 4
          WHEN '14-16' THEN 5
          WHEN '16-18' THEN 6
          WHEN '18-20' THEN 7
        END
    `;

    const gradeDistribution = await query<any[]>(gradeDistQuery, gradeDistParams);

    // 3. Statistiques par activité
    let activityStatsQuery = `
      SELECT 
        a.id as activity_id,
        a.name as activity_name,
        COUNT(c.id) as correction_count,
        IFNULL(AVG(c.grade), 0) as average_grade,
        IFNULL(MAX(c.grade), 0) as highest_grade,
        IFNULL(MIN(c.grade), 0) as lowest_grade
      FROM 
        activities a
      LEFT JOIN 
        corrections c ON a.id = c.activity_id
    `;

    let activityWhereConditions = [];
    let activityParams: any[] = [];

    // Filtre pour les corrections actives
    if (!showInactive) {
      activityWhereConditions.push('(c.active = 1 OR c.active IS NULL)');
    }

    // Add joins if filtering by class
    if (classId) {
      activityStatsQuery += `
        LEFT JOIN students s ON c.student_id = s.id
        LEFT JOIN class_students cs ON s.id = cs.student_id
      `;
      activityWhereConditions.push('(cs.class_id = ? OR c.id IS NULL)');
      activityParams.push(classId);
      
      // Add sub-class filter if provided
      if (subClassId) {
        activityWhereConditions.push('(cs.sub_class = ? OR c.id IS NULL)');
        activityParams.push(subClassId);
      }
    }

    if (activityId) {
      activityWhereConditions.push('a.id = ?');
      activityParams.push(activityId);
    }

    if (studentId) {
      activityWhereConditions.push('(c.student_id = ? OR c.id IS NULL)');
      activityParams.push(studentId);
    }

    if (activityWhereConditions.length > 0) {
      activityStatsQuery += ` WHERE ${activityWhereConditions.join(' AND ')}`;
    }

    activityStatsQuery += `
      GROUP BY 
        a.id
      ORDER BY 
        correction_count DESC
    `;

    const activityStats = await query<any[]>(activityStatsQuery, activityParams);

    // 4. Statistiques par classe
    let classStatsQuery = `
      SELECT 
        cl.id as class_id,
        cl.name as class_name,
        COUNT(DISTINCT c.id) as correction_count,
        COUNT(DISTINCT s.id) as student_count,
        IFNULL(AVG(c.grade), 0) as average_grade
      FROM 
        classes cl
      LEFT JOIN 
        class_students cs ON cl.id = cs.class_id
      LEFT JOIN 
        students s ON cs.student_id = s.id
      LEFT JOIN 
        corrections c ON s.id = c.student_id
    `;

    let classWhereConditions = [];
    let classParams: any[] = [];

    // Filtre pour les corrections actives
    if (!showInactive) {
      classWhereConditions.push('(c.active = 1 OR c.id IS NULL)');
    }

    if (classId) {
      classWhereConditions.push('cl.id = ?');
      classParams.push(classId);
      
      // Add sub-class filter
      if (subClassId) {
        classWhereConditions.push('cs.sub_class = ?');
        classParams.push(subClassId);
      }
    }

    if (activityId) {
      classWhereConditions.push('(c.activity_id = ? OR c.id IS NULL)');
      classParams.push(activityId);
    }

    if (studentId) {
      classWhereConditions.push('(c.student_id = ? OR c.id IS NULL)');
      classParams.push(studentId);
    }

    if (classWhereConditions.length > 0) {
      classStatsQuery += ` WHERE ${classWhereConditions.join(' AND ')}`;
    }

    classStatsQuery += `
      GROUP BY 
        cl.id
      ORDER BY 
        correction_count DESC
    `;

    const classStats = await query<any[]>(classStatsQuery, classParams);

    // 5. Évolution des notes au fil du temps (par mois)
    let gradeEvolQuery = `
      SELECT 
        DATE_FORMAT(c.submission_date, '%Y-%m') as month,
        COUNT(*) as correction_count,
        IFNULL(AVG(c.grade), 0) as average_grade
      FROM 
        corrections c
    `;

    let gradeEvolWhereConditions = ['c.submission_date IS NOT NULL'];
    let gradeEvolParams: any[] = [];

    // Filtre pour les corrections actives
    if (!showInactive) {
      gradeEvolWhereConditions.push('c.active = 1');
    }

    // Add joins if filtering by class
    if (classId) {
      gradeEvolQuery += `
        JOIN students s ON c.student_id = s.id
        JOIN class_students cs ON s.id = cs.student_id
      `;
      gradeEvolWhereConditions.push('cs.class_id = ?');
      gradeEvolParams.push(classId);
      
      // Add sub-class filter if provided
      if (subClassId) {
        gradeEvolWhereConditions.push('cs.sub_class = ?');
        gradeEvolParams.push(subClassId);
      }
    }

    if (activityId) {
      gradeEvolWhereConditions.push('c.activity_id = ?');
      gradeEvolParams.push(activityId);
    }

    if (studentId) {
      gradeEvolWhereConditions.push('c.student_id = ?');
      gradeEvolParams.push(studentId);
    }

    gradeEvolQuery += ` WHERE ${gradeEvolWhereConditions.join(' AND ')}`;
    gradeEvolQuery += `
      GROUP BY 
        month
      ORDER BY 
        month ASC
    `;

    const gradeEvolution = await query<any[]>(gradeEvolQuery, gradeEvolParams);

    // 6. Top des activités par note moyenne
    let topActivitiesQuery = `
      SELECT 
        a.id as activity_id,
        a.name as activity_name,
        COUNT(c.id) as correction_count,
        IFNULL(AVG(c.grade), 0) as average_grade
      FROM 
        activities a
      JOIN 
        corrections c ON a.id = c.activity_id
    `;

    let topActWhereConditions = [];
    let topActParams: any[] = [];

    // Filtre pour les corrections actives
    if (!showInactive) {
      topActWhereConditions.push('c.active = 1');
    }

    // Add joins if filtering by class
    if (classId) {
      topActivitiesQuery += `
        JOIN students s ON c.student_id = s.id
        JOIN class_students cs ON s.id = cs.student_id
      `;
      topActWhereConditions.push('cs.class_id = ?');
      topActParams.push(classId);
      
      // Add sub-class filter if provided
      if (subClassId) {
        topActWhereConditions.push('cs.sub_class = ?');
        topActParams.push(subClassId);
      }
    }

    if (activityId) {
      topActWhereConditions.push('a.id = ?');
      topActParams.push(activityId);
    }

    if (studentId) {
      topActWhereConditions.push('c.student_id = ?');
      topActParams.push(studentId);
    }

    if (topActWhereConditions.length > 0) {
      topActivitiesQuery += ` WHERE ${topActWhereConditions.join(' AND ')}`;
    }

    topActivitiesQuery += `
      GROUP BY 
        a.id
      HAVING 
        correction_count > 2
      ORDER BY 
        average_grade DESC
      LIMIT 10
    `;

    const topActivities = await query<any[]>(topActivitiesQuery, topActParams);

    // 7. Métadonnées pour les filtres
    const classes = await query<any[]>(`
      SELECT id, name FROM classes ORDER BY name
    `);
    
    const activities = await query<any[]>(`
      SELECT id, name FROM activities ORDER BY name
    `);
    
    // Récupérer les sous-classes pour la classe sélectionnée
    let subClasses: { id: number; name: string }[] = [];
    if (classId) {
      // First get the number of subclasses for this class
      const classInfo = await query<any[]>(`
        SELECT nbre_subclasses FROM classes 
        WHERE id = ?
      `, [classId]);
      
      if (classInfo.length > 0 && classInfo[0].nbre_subclasses > 0) {
        // Create array of sub-classes based on the number
        subClasses = Array.from({ length: classInfo[0].nbre_subclasses }, (_, i) => ({
          id: i + 1,
          name: `Groupe ${i + 1}`
        }));
      }
    }
    
    // Récupérer les étudiants en fonction des filtres de classe et sous-classe
    let students: { id: number; name: string }[] = [];
    if (classId) {
      let studentsQuery = `
        SELECT s.id, CONCAT(s.first_name, ' ', s.last_name) AS name
        FROM students s
        JOIN class_students cs ON s.id = cs.student_id
        WHERE cs.class_id = ?
      `;
      
      const studentsParams = [classId];
      
      if (subClassId) {
        studentsQuery += ` AND cs.sub_class = ?`;
        studentsParams.push(subClassId);
      }
      
      studentsQuery += ` ORDER BY s.last_name, s.first_name`;
      
      students = await query<any[]>(studentsQuery, studentsParams);
    }

    // 8. Récupérer le nombre total d'activités inactives
    let inactiveCountQuery = `
      SELECT COUNT(*) as count
      FROM corrections
      WHERE active = 0
    `;
    
    let inactiveCountParams: any[] = [];
    
    if (classId) {
      inactiveCountQuery += `
        AND student_id IN (
          SELECT student_id 
          FROM class_students 
          WHERE class_id = ?
      `;
      inactiveCountParams.push(classId);
      
      if (subClassId) {
        inactiveCountQuery += ` AND sub_class = ?`;
        inactiveCountParams.push(subClassId);
      }
      
      inactiveCountQuery += `)`;
    }
    
    if (activityId) {
      inactiveCountQuery += ` AND activity_id = ?`;
      inactiveCountParams.push(activityId);
    }
    
    if (studentId) {
      inactiveCountQuery += ` AND student_id = ?`;
      inactiveCountParams.push(studentId);
    }
    
    const inactiveCount = await query<any[]>(inactiveCountQuery, inactiveCountParams);

    return NextResponse.json({
      globalStats: globalStats[0] || {},
      gradeDistribution,
      activityStats,
      classStats,
      gradeEvolution,
      topActivities,
      inactiveCount: inactiveCount[0]?.count || 0,
      metaData: {
        classes,
        activities,
        subClasses,
        students,
        showInactive // Ajouter l'état actuel du filtre
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques globales:', error);
    return NextResponse.json(
      { message: 'Erreur serveur', error: (error as Error).message },
      { status: 500 }
    );
  }
}