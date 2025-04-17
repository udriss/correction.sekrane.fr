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
    
    // Condition pour filtrer les corrections inactives
    const activeCondition = showInactive ? '' : "c.status = 'ACTIVE'";
    
    // Create filter objects for different queries
    const filters = {
      classId,
      subClassId,
      activityId,
      studentId,
      showInactive
    };

    // 1. Récupération des statistiques globales des corrections
    // Pour les stats globales, nous devons rejoindre avec activities_autres pour normaliser les points
    let globalStatsQuery = `
      SELECT 
        COUNT(c.id) as total_corrections,
        COUNT(DISTINCT c.student_id) as total_students,
        COUNT(DISTINCT c.activity_id) as total_activities
      FROM 
        corrections_autres c
    `;

    let globalWhereConditions = [];
    let globalParams: any[] = [];

    // Ajout du filtre d'activité
    if (!showInactive) {
      globalWhereConditions.push("c.status = 'ACTIVE'");
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

    const basicGlobalStats = await query<any[]>(globalStatsQuery, globalParams);

    // Maintenant, nous allons calculer les statistiques normalisées pour les notes
    let normalizedGradesQuery = `
      SELECT 
        c.id, 
        c.grade,
        c.activity_id,
        a.points
      FROM 
        corrections_autres c
      JOIN
        activities_autres a ON c.activity_id = a.id
    `;

    let normalizedGradesConditions = [...globalWhereConditions];
    let normalizedGradesParams = [...globalParams];

    if (normalizedGradesConditions.length > 0) {
      normalizedGradesQuery += ` WHERE ${normalizedGradesConditions.join(' AND ')}`;
    }

    const gradesData = await query<any[]>(normalizedGradesQuery, normalizedGradesParams);

    // Calculer les statistiques de notes normalisées
    let totalNormalizedGrade = 0;
    let maxNormalizedGrade = 0;
    let minNormalizedGrade = 20;
    let validGradeCount = 0;

    gradesData.forEach(item => {
      if (item.grade !== null && item.grade !== undefined) {
        // Convertir le tableau de points maximums
        let maxPoints: number[] = [];
        try {
          maxPoints = Array.isArray(item.points) 
            ? item.points 
            : JSON.parse(item.points || '[]');
        } catch (e) {
          console.error('Erreur lors du parsing des points:', e);
          return;
        }

        // Calculer le total des points maximum pour cette activité
        const totalMaxPoints = maxPoints.reduce((sum, points) => sum + points, 0);
        
        // Normaliser la note sur 20
        if (totalMaxPoints > 0) {
          const normalizedGrade = (item.grade / totalMaxPoints) * 20;
          totalNormalizedGrade += normalizedGrade;
          
          if (normalizedGrade > maxNormalizedGrade) maxNormalizedGrade = normalizedGrade;
          if (normalizedGrade < minNormalizedGrade) minNormalizedGrade = normalizedGrade;
          
          validGradeCount++;
        }
      }
    });

    // Calculer la moyenne normalisée
    const averageNormalizedGrade = validGradeCount > 0 ? totalNormalizedGrade / validGradeCount : 0;

    // Combiner les statistiques de base avec les statistiques de notes normalisées
    const globalStats = {
      ...basicGlobalStats[0],
      average_grade: averageNormalizedGrade,
      highest_grade: maxNormalizedGrade,
      lowest_grade: minNormalizedGrade
    };

    // 2. Récupérer toutes les corrections avec leurs activités pour calculer les pourcentages normalisés
    let normalizedStatsQuery = `
      SELECT 
        c.id,
        c.activity_id,
        c.points_earned,
        a.points,
        a.parts_names
      FROM 
        corrections_autres c
      JOIN
        activities_autres a ON c.activity_id = a.id
    `;

    let normalizedWhereConditions = [];
    let normalizedParams: any[] = [];

    if (!showInactive) {
      normalizedWhereConditions.push("c.status = 'ACTIVE'");
    }

    if (classId) {
      normalizedStatsQuery += `
        JOIN students s ON c.student_id = s.id
        JOIN class_students cs ON s.id = cs.student_id
      `;
      normalizedWhereConditions.push('cs.class_id = ?');
      normalizedParams.push(classId);
      
      if (subClassId) {
        normalizedWhereConditions.push('cs.sub_class = ?');
        normalizedParams.push(subClassId);
      }
    }

    if (activityId) {
      normalizedWhereConditions.push('c.activity_id = ?');
      normalizedParams.push(activityId);
    }

    if (studentId) {
      normalizedWhereConditions.push('c.student_id = ?');
      normalizedParams.push(studentId);
    }

    if (normalizedWhereConditions.length > 0) {
      normalizedStatsQuery += ` WHERE ${normalizedWhereConditions.join(' AND ')}`;
    }

    const normalizedCorrections = await query<any[]>(normalizedStatsQuery, normalizedParams);

    // Calculer les pourcentages normalisés pour chaque correction
    const correctionPercentages = normalizedCorrections.map(correction => {
      let pointsEarned: number[] = [];
      let maxPoints: number[] = [];
      
      try {
        // Convertir les strings JSON en tableaux
        pointsEarned = Array.isArray(correction.points_earned) 
          ? correction.points_earned 
          : JSON.parse(correction.points_earned || '[]');
        
        maxPoints = Array.isArray(correction.points) 
          ? correction.points 
          : JSON.parse(correction.points || '[]');
      } catch (e) {
        console.error('Erreur lors du parsing des points:', e);
        return { 
          id: correction.id, 
          activity_id: correction.activity_id,
          percentage: 0 
        };
      }
      
      // Calculer le pourcentage global pour cette correction
      const totalEarned = pointsEarned.reduce((sum, points) => sum + points, 0);
      const totalMax = maxPoints.reduce((sum, points) => sum + points, 0);
      
      const percentage = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
      
      return {
        id: correction.id,
        activity_id: correction.activity_id,
        percentage
      };
    });

    // Calcul du pourcentage moyen global
    const averagePercentage = correctionPercentages.length > 0
      ? correctionPercentages.reduce((sum, item) => sum + item.percentage, 0) / correctionPercentages.length
      : 0;

    // 3. Regrouper les résultats par partie (si les noms de parties sont identiques)
    const partResults: Record<string, { earned: number, max: number, count: number }> = {};
    
    normalizedCorrections.forEach(correction => {
      let pointsEarned: number[] = [];
      let maxPoints: number[] = [];
      let partsNames: string[] = [];
      
      try {
        pointsEarned = Array.isArray(correction.points_earned) 
          ? correction.points_earned 
          : JSON.parse(correction.points_earned || '[]');
        
        maxPoints = Array.isArray(correction.points) 
          ? correction.points 
          : JSON.parse(correction.points || '[]');
          
        partsNames = Array.isArray(correction.parts_names) 
          ? correction.parts_names 
          : JSON.parse(correction.parts_names || '[]');
      } catch (e) {
        console.error('Erreur lors du parsing des données:', e);
        return;
      }
      
      // Traiter chaque partie si elle a un nom
      partsNames.forEach((name, index) => {
        if (!name) return; // Ignorer les parties sans nom
        
        if (!partResults[name]) {
          partResults[name] = { earned: 0, max: 0, count: 0 };
        }
        
        // Ajouter les points de cette partie
        if (pointsEarned[index] !== undefined && maxPoints[index] !== undefined) {
          partResults[name].earned += pointsEarned[index];
          partResults[name].max += maxPoints[index];
          partResults[name].count += 1;
        }
      });
    });
    
    // Calculer les pourcentages par partie
    const partPercentages = Object.entries(partResults).map(([name, data]) => {
      const percentage = data.max > 0 ? (data.earned / data.max) * 100 : 0;
      return {
        name,
        percentage,
        count: data.count
      };
    }).sort((a, b) => b.count - a.count); // Trier par nombre d'occurrences

    // 4. Statistiques par activité avec pourcentages normalisés
    let activityStatsQuery = `
      SELECT 
        a.id as activity_id,
        a.name as activity_name,
        a.points,
        a.parts_names,
        COUNT(c.id) as correction_count
      FROM 
        activities_autres a
      LEFT JOIN 
        corrections_autres c ON a.id = c.activity_id
    `;

    let activityWhereConditions = [];
    let activityParams: any[] = [];

    // Filtre pour les corrections actives
    if (!showInactive) {
      activityWhereConditions.push("(c.status = 'ACTIVE' OR c.status IS NULL)");
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

    const rawActivityStats = await query<any[]>(activityStatsQuery, activityParams);

    // Calculer les pourcentages de réussite pour chaque activité
    const activityStats = rawActivityStats.map(activity => {
      const activityCorrections = correctionPercentages.filter(
        c => c.activity_id === activity.activity_id
      );
      
      const averagePercentage = activityCorrections.length > 0
        ? activityCorrections.reduce((sum, item) => sum + item.percentage, 0) / activityCorrections.length
        : 0;
      
      return {
        ...activity,
        average_percentage: averagePercentage
      };
    });

    // 5. Statistiques par classe
    let classStatsQuery = `
      SELECT 
        cl.id as class_id,
        cl.name as class_name,
        COUNT(DISTINCT c.id) as correction_count,
        (
          SELECT COUNT(DISTINCT cs_inner.student_id) 
          FROM class_students cs_inner 
          WHERE cs_inner.class_id = cl.id
        ) as student_count
      FROM 
        classes cl
      LEFT JOIN 
        class_students cs ON cl.id = cs.class_id
      LEFT JOIN 
        students s ON cs.student_id = s.id
      LEFT JOIN 
        corrections_autres c ON s.id = c.student_id
    `;

    let classWhereConditions = [];
    let classParams: any[] = [];

    // Filtre pour les corrections actives
    if (!showInactive) {
      classWhereConditions.push("(c.status = 'ACTIVE' OR c.id IS NULL)");
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

    const rawClassStats = await query<any[]>(classStatsQuery, classParams);
    
    // Récupérer les pourcentages moyens pour chaque classe
    const classPercentages: Record<number, { total: number, count: number, totalGrade: number, gradeCount: number }> = {};
    
    // Préparation de la requête pour récupérer les données des pourcentages par classe
    let classPercentagesQuery = `
      SELECT 
        cs.class_id,
        c.id as correction_id,
        c.points_earned,
        c.grade,
        a.points
      FROM 
        corrections_autres c
      JOIN 
        activities_autres a ON c.activity_id = a.id
      JOIN 
        students s ON c.student_id = s.id
      JOIN 
        class_students cs ON s.id = cs.student_id
    `;
    
    let classPercentagesConditions = [];
    let classPercentagesParams: any[] = [];
    
    if (!showInactive) {
      classPercentagesConditions.push("c.status = 'ACTIVE'");
    }
    
    if (classId) {
      classPercentagesConditions.push('cs.class_id = ?');
      classPercentagesParams.push(classId);
      
      if (subClassId) {
        classPercentagesConditions.push('cs.sub_class = ?');
        classPercentagesParams.push(subClassId);
      }
    }
    
    if (activityId) {
      classPercentagesConditions.push('c.activity_id = ?');
      classPercentagesParams.push(activityId);
    }
    
    if (studentId) {
      classPercentagesConditions.push('c.student_id = ?');
      classPercentagesParams.push(studentId);
    }
    
    if (classPercentagesConditions.length > 0) {
      classPercentagesQuery += ` WHERE ${classPercentagesConditions.join(' AND ')}`;
    }
    
    const classPercentagesData = await query<any[]>(classPercentagesQuery, classPercentagesParams);
    
    // Calculer le pourcentage moyen et la note moyenne pour chaque classe
    classPercentagesData.forEach(item => {
      let pointsEarned: number[] = [];
      let maxPoints: number[] = [];
      
      try {
        pointsEarned = Array.isArray(item.points_earned) 
          ? item.points_earned 
          : JSON.parse(item.points_earned || '[]');
        
        maxPoints = Array.isArray(item.points) 
          ? item.points 
          : JSON.parse(item.points || '[]');
      } catch (e) {
        console.error('Erreur lors du parsing des points pour les classes:', e);
        return;
      }
      
      const totalEarned = pointsEarned.reduce((sum, points) => sum + points, 0);
      const totalMax = maxPoints.reduce((sum, points) => sum + points, 0);
      
      const percentage = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
      
      if (!classPercentages[item.class_id]) {
        classPercentages[item.class_id] = { total: 0, count: 0, totalGrade: 0, gradeCount: 0 };
      }
      
      classPercentages[item.class_id].total += percentage;
      classPercentages[item.class_id].count += 1;
      
      // Calcul de la note normalisée
      if (item.grade !== null && item.grade !== undefined && totalMax > 0) {
        const normalizedGrade = (item.grade / totalMax) * 20;
        classPercentages[item.class_id].totalGrade += normalizedGrade;
        classPercentages[item.class_id].gradeCount += 1;
      }
    });
    
    // Fusionner les stats avec les pourcentages calculés
    const classStats = rawClassStats.map(cls => {
      const classData = classPercentages[cls.class_id] || { total: 0, count: 0, totalGrade: 0, gradeCount: 0 };
      const averagePercentage = classData.count > 0 ? classData.total / classData.count : 0;
      const averageGrade = classData.gradeCount > 0 ? classData.totalGrade / classData.gradeCount : 0;
      
      return {
        ...cls,
        average_percentage: averagePercentage,
        average_grade: averageGrade
      };
    });

    // 6. Évolution des pourcentages de réussite au fil du temps (par mois)
    let evolQuery = `
      SELECT 
        DATE_FORMAT(c.submission_date, '%Y-%m') as month,
        c.id,
        c.activity_id,
        c.points_earned,
        a.points
      FROM 
        corrections_autres c
      JOIN
        activities_autres a ON c.activity_id = a.id
      WHERE
        c.submission_date IS NOT NULL
    `;

    let evolWhereConditions = [];
    let evolParams: any[] = [];

    // Filtre pour les corrections actives
    if (!showInactive) {
      evolWhereConditions.push("c.status = 'ACTIVE'");
    }

    // Add joins if filtering by class
    if (classId) {
      evolQuery += `
        JOIN students s ON c.student_id = s.id
        JOIN class_students cs ON s.id = cs.student_id
      `;
      evolWhereConditions.push('cs.class_id = ?');
      evolParams.push(classId);
      
      // Add sub-class filter if provided
      if (subClassId) {
        evolWhereConditions.push('cs.sub_class = ?');
        evolParams.push(subClassId);
      }
    }

    if (activityId) {
      evolWhereConditions.push('c.activity_id = ?');
      evolParams.push(activityId);
    }

    if (studentId) {
      evolWhereConditions.push('c.student_id = ?');
      evolParams.push(studentId);
    }

    if (evolWhereConditions.length > 0) {
      evolQuery += ` AND ${evolWhereConditions.join(' AND ')}`;
    }

    evolQuery += ` ORDER BY c.submission_date ASC`;

    const monthlyCorrections = await query<any[]>(evolQuery, evolParams);

    // Regrouper par mois et calculer les pourcentages
    const monthlyResults: Record<string, { earned: number, max: number, count: number }> = {};
    
    monthlyCorrections.forEach(correction => {
      const month = correction.month;
      let pointsEarned: number[] = [];
      let maxPoints: number[] = [];
      
      try {
        pointsEarned = Array.isArray(correction.points_earned) 
          ? correction.points_earned 
          : JSON.parse(correction.points_earned || '[]');
        
        maxPoints = Array.isArray(correction.points) 
          ? correction.points 
          : JSON.parse(correction.points || '[]');
      } catch (e) {
        console.error('Erreur lors du parsing des points:', e);
        return;
      }
      
      if (!monthlyResults[month]) {
        monthlyResults[month] = { earned: 0, max: 0, count: 0 };
      }
      
      const totalEarned = pointsEarned.reduce((sum, points) => sum + points, 0);
      const totalMax = maxPoints.reduce((sum, points) => sum + points, 0);
      
      monthlyResults[month].earned += totalEarned;
      monthlyResults[month].max += totalMax;
      monthlyResults[month].count += 1;
    });
    
    // Calculer les pourcentages mensuels
    const gradeEvolution = Object.entries(monthlyResults).map(([month, data]) => {
      const percentage = data.max > 0 ? (data.earned / data.max) * 100 : 0;
      // Calculer également une note normalisée sur 20 pour la compatibilité avec GradeEvolutionChart
      const normalizedGrade = data.max > 0 ? (data.earned / data.max) * 20 : 0;
      
      return {
        month,
        percentage,
        correction_count: data.count,
        average_grade: normalizedGrade // Ajouter ce champ pour la compatibilité
      };
    }).sort((a, b) => a.month.localeCompare(b.month));

    // 7. Top des activités par pourcentage de réussite
    const topActivities = [...activityStats]
      .filter(activity => activity.correction_count > 2)
      .sort((a, b) => b.average_percentage - a.average_percentage)
      .slice(0, 10)
      .map(activity => ({
        ...activity,
        // Ajouter le champ average_grade pour assurer la compatibilité avec TopActivitiesChart
        average_grade: activity.average_percentage / 5 // Convertir le pourcentage en note sur 20
      }));

    // 8. Métadonnées pour les filtres
    const classes = await query<any[]>(`
      SELECT id, name FROM classes ORDER BY name
    `);
    
    const activities = await query<any[]>(`
      SELECT id, name FROM activities_autres ORDER BY name
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

    // 9. Récupérer le nombre total d'activités inactives
    let inactiveCountQuery = `
      SELECT COUNT(*) as count
      FROM corrections_autres
      WHERE status = 'DEACTIVATED'
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

    // 10. Calculer la distribution des notes
    // Utiliser les données de gradesData pour créer une distribution des notes
    const gradeDistribution = calculateGradeDistribution(gradesData);

    return NextResponse.json({
      globalStats: {
        ...globalStats,
        average_percentage: averagePercentage
      },
      gradeDistribution, // Ajout de la distribution des notes
      partPercentages,
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
        showInactive
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

// Fonction pour calculer la distribution des notes
function calculateGradeDistribution(gradesData: any[]): Array<{ grade_range: string, count: number }> {
  // Créer des tranches de notes (0-2, 2-4, etc.)
  const distribution: { [key: string]: number } = {
    '0-2': 0,
    '2-4': 0,
    '4-6': 0,
    '6-8': 0,
    '8-10': 0,
    '10-12': 0,
    '12-14': 0,
    '14-16': 0,
    '16-18': 0,
    '18-20': 0
  };

  gradesData.forEach(item => {
    if (item.grade !== null && item.grade !== undefined) {
      // Convertir le tableau de points maximums
      let maxPoints: number[] = [];
      try {
        maxPoints = Array.isArray(item.points) 
          ? item.points 
          : JSON.parse(item.points || '[]');
      } catch (e) {
        console.error('Erreur lors du parsing des points pour la distribution:', e);
        return;
      }

      // Calculer le total des points maximum pour cette activité
      const totalMaxPoints = maxPoints.reduce((sum, points) => sum + points, 0);
      
      // Normaliser la note sur 20
      if (totalMaxPoints > 0) {
        const normalizedGrade = (item.grade / totalMaxPoints) * 20;
        
        // Déterminer la plage pour cette note
        const range = Math.floor(normalizedGrade / 2) * 2;
        const rangeKey = `${range}-${range + 2}`;
        
        // Incrémenter le compteur pour cette plage
        if (distribution[rangeKey] !== undefined) {
          distribution[rangeKey]++;
        } else if (normalizedGrade === 20) {
          // Cas spécial pour la note de 20, qui va dans la plage 18-20
          distribution['18-20']++;
        }
      }
    }
  });

  // Convertir l'objet en tableau pour le retour
  return Object.entries(distribution).map(([grade_range, count]) => ({
    grade_range,
    count
  }));
}