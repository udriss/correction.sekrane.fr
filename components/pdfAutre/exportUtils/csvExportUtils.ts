// csvExportUtils.ts - Utilitaires pour l'export des données en CSV
import { Student, CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';
import { formatGrade } from './formatUtils';
import { escapeCSV } from '../types';

// Fonction pour télécharger un fichier CSV
export const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' }); // Ajouter BOM pour UTF-8
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Génère un CSV détaillé standard
export const generateDetailedCSV = (
  corrections: CorrectionAutreEnriched[],
  getStudentById: (studentId: number | null) => Student | undefined,
  getActivityById: (activityId: number) => ActivityAutre | undefined,
  classesMap: Map<number | null, any>
): string => {
  // En-tête CSV
  let csv = "Étudiant,Classe,Activité,Points par partie,Note,Statut\n";
  
  // --- Trier les corrections par nom d'étudiant ---
  const sortedCorrections = [...corrections].sort((a, b) => {
    const studentA = getStudentById(a.student_id);
    const studentB = getStudentById(b.student_id);
    
    const nameA = studentA ? `${studentA.last_name} ${studentA.first_name}` : '';
    const nameB = studentB ? `${studentB.last_name} ${studentB.first_name}` : '';
    
    if (!nameA && !nameB) return 0;
    if (!nameA) return 1;
    if (!nameB) return -1;
    
    return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
  });
  
  // Lignes pour chaque correction
  sortedCorrections.forEach(c => {
    const student = getStudentById(c.student_id);
    const activity = getActivityById(c.activity_id);
    const className = classesMap.get(c.class_id)?.name || `Classe ${c.class_id}`;
    
    // Formatage des données
    const isPlaceholder = (c.placeholder && c.status === 'NON_NOTE');
    
    let statusDisplay, pointsDisplay, gradeDisplay;
    
    // Déterminer le statut
    statusDisplay = c.status ? 
      (c.status === 'NON_NOTE' ? 'NON NOTÉ' : 
      c.status === 'ABSENT' ? 'ABSENT' : 
      c.status === 'NON_RENDU' ? 'NON RENDU' : 
      c.status === 'DEACTIVATED' ? 'DÉSACTIVÉ' : c.status) 
      : (c.active === 0 ? 'DÉSACTIVÉ' : 'ACTIVE');
    
    // Déterminer les points
    pointsDisplay = isPlaceholder ? 'N/A' : 
      (Array.isArray(c.points_earned) && c.points_earned.length > 0 ? 
        c.points_earned.join(' ; ') : 'N/A');
    
    // Déterminer la note
    if (isPlaceholder) {
      gradeDisplay = 'N/A';
    } else if (statusDisplay !== 'ACTIVE' && statusDisplay !== c.status) {
      gradeDisplay = statusDisplay;
    } else if (c.percentage_grade !== null && c.percentage_grade !== undefined) {
      // Afficher la note normalisée sur 20 ET la note originale
      const normalized = (Number(c.percentage_grade) / 100) * 20;
      const originalGrade = c.grade !== undefined ? Number(c.grade) : 0;
      
      // Calculer le barème original à partir de l'activité en tenant compte des parties désactivées
      let originalTotal = 20; // Fallback à 20 si pas de barème défini
      if (activity && activity.points) {
        // Parser les parties désactivées
        const disabledParts = c.disabled_parts && Array.isArray(c.disabled_parts) 
          ? c.disabled_parts 
          : null;
        
        // Calculer le total en excluant les parties désactivées
        originalTotal = activity.points.reduce((sum: number, points: number, index: number) => {
          // Exclure les parties désactivées du calcul du barème original
          if (disabledParts && disabledParts[index]) {
            return sum;
          }
          return sum + points;
        }, 0);
        
        // Si toutes les parties sont désactivées, utiliser le fallback
        if (originalTotal === 0) {
          originalTotal = 20;
        }
      }
      
      gradeDisplay = `${formatGrade(normalized, true)} / 20 [${formatGrade(originalGrade, true)} / ${originalTotal}]`;
    } else if (c.grade !== undefined) {
      gradeDisplay = `${formatGrade(c.grade, true)} / 20`;
    } else {
      gradeDisplay = 'NON NOTÉ';
    }
    
    // Ajouter la ligne au CSV
    csv += `${escapeCSV(student ? `${student.first_name} ${student.last_name}` : 'N/A')},`;
    csv += `${escapeCSV(className)},`;
    csv += `${escapeCSV(activity?.name || `Activité ${c.activity_id}`)},`;
    csv += `${escapeCSV(pointsDisplay)},`;
    csv += `${escapeCSV(gradeDisplay)},`;
    csv += `${escapeCSV(statusDisplay)}\n`;
  });
  
  return csv;
};

// Génère un CSV simplifié (format tableau croisé: étudiants en lignes, activités en colonnes)
export const generateSimplifiedCSV = (
  corrections: CorrectionAutreEnriched[],
  getStudentById: (studentId: number | null) => Student | undefined,
  getActivityById: (activityId: number) => ActivityAutre | undefined
): string => {
  // Structurer les données: étudiants en lignes, activités en colonnes
  const studentsMap = new Map<number, Student>();  // Pour garder l'ordre des étudiants
  const activitiesMap = new Map<number, ActivityAutre>();  // Pour garder l'ordre des activités
  const gradeMatrix: { [studentId: number]: { [activityId: number]: string } } = {};
  
  // --- Trier d'abord les corrections par nom d'étudiant ---
  const sortedCorrections = [...corrections].sort((a, b) => {
    const studentA = getStudentById(a.student_id);
    const studentB = getStudentById(b.student_id);
    
    const nameA = studentA ? `${studentA.last_name} ${studentA.first_name}` : '';
    const nameB = studentB ? `${studentB.last_name} ${studentB.first_name}` : '';
    
    if (!nameA && !nameB) return 0;
    if (!nameA) return 1;
    if (!nameB) return -1;
    
    return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
  });
  
  // Remplir nos mappages et préparer la matrice de notes
  sortedCorrections.forEach(c => {
    const student = getStudentById(c.student_id);
    const activity = getActivityById(c.activity_id);
    
    if (student && student.id) {
      studentsMap.set(student.id, student);
      if (!gradeMatrix[student.id]) {
        gradeMatrix[student.id] = {};
      }
    }
    
    if (activity) {
      activitiesMap.set(activity.id, activity);
    }
    
    // Déterminer la valeur à afficher
    let displayValue = 'NON NOTÉ';
    // Vérifier si c'est un placeholder
    const isPlaceholder = (c.placeholder && c.status === 'NON_NOTE');
    if (isPlaceholder) {
      displayValue = 'N/A';
    } else if (c.status) {
      switch (c.status) {
        case 'ACTIVE':
          if (c.percentage_grade !== null && c.percentage_grade !== undefined) {
            // Afficher la note normalisée sur 20 ET la note originale
            const normalized = (Number(c.percentage_grade) / 100) * 20;
            const originalGrade = c.grade !== undefined ? Number(c.grade) : 0;
            
            // Calculer le barème original à partir de l'activité en tenant compte des parties désactivées
            let originalTotal = 20; // Fallback à 20 si pas de barème défini
            if (activity && activity.points) {
              // Parser les parties désactivées
              const disabledParts = c.disabled_parts && Array.isArray(c.disabled_parts) 
                ? c.disabled_parts 
                : null;
              
              // Calculer le total en excluant les parties désactivées
              originalTotal = activity.points.reduce((sum: number, points: number, index: number) => {
                // Exclure les parties désactivées du calcul du barème original
                if (disabledParts && disabledParts[index]) {
                  return sum;
                }
                return sum + points;
              }, 0);
              
              // Si toutes les parties sont désactivées, utiliser le fallback
              if (originalTotal === 0) {
                originalTotal = 20;
              }
            }
            
            displayValue = `${formatGrade(normalized, true)}/20 [${formatGrade(originalGrade, true)}/${originalTotal}]`;
          } else if (c.grade !== undefined) {
            displayValue = `${formatGrade(c.grade, true)}/20`;
          } else {
            displayValue = 'NON NOTÉ';
          }
          break;
        case 'NON_NOTE':
          displayValue = 'NON NOTÉ';
          break;
        case 'ABSENT':
          displayValue = 'ABSENT';
          break;
        case 'NON_RENDU':
          displayValue = 'NON RENDU';
          break;
        case 'DEACTIVATED':
          displayValue = 'DÉSACTIVÉ';
          break;
        default:
          if (c.percentage_grade !== null && c.percentage_grade !== undefined) {
            // Afficher la note normalisée sur 20 ET la note originale
            const normalized = (Number(c.percentage_grade) / 100) * 20;
            const originalGrade = c.grade !== undefined ? Number(c.grade) : 0;
            
            // Calculer le barème original à partir de l'activité en tenant compte des parties désactivées
            let originalTotal = 20; // Fallback à 20 si pas de barème défini
            if (activity && activity.points) {
              // Parser les parties désactivées
              const disabledParts = c.disabled_parts && Array.isArray(c.disabled_parts) 
                ? c.disabled_parts 
                : null;
              
              // Calculer le total en excluant les parties désactivées
              originalTotal = activity.points.reduce((sum: number, points: number, index: number) => {
                // Exclure les parties désactivées du calcul du barème original
                if (disabledParts && disabledParts[index]) {
                  return sum;
                }
                return sum + points;
              }, 0);
              
              // Si toutes les parties sont désactivées, utiliser le fallback
              if (originalTotal === 0) {
                originalTotal = 20;
              }
            }
            
            displayValue = `${formatGrade(normalized, true)}/20 [${formatGrade(originalGrade, true)}/${originalTotal}]`;
          } else if (c.grade !== undefined) {
            displayValue = `${formatGrade(c.grade, true)}/20`;
          } else {
            displayValue = 'NON NOTÉ';
          }
      }
    } else if (c.active === 0) {
      displayValue = 'DÉSACTIVÉ';
    } else if (c.percentage_grade !== null && c.percentage_grade !== undefined) {
      // Afficher la note normalisée sur 20 ET la note originale
      const normalized = (Number(c.percentage_grade) / 100) * 20;
      const originalGrade = c.grade !== undefined ? Number(c.grade) : 0;
      
      // Calculer le barème original à partir de l'activité en tenant compte des parties désactivées
      let originalTotal = 20; // Fallback à 20 si pas de barème défini
      if (activity && activity.points) {
        // Parser les parties désactivées
        const disabledParts = c.disabled_parts && Array.isArray(c.disabled_parts) 
          ? c.disabled_parts 
          : null;
        
        // Calculer le total en excluant les parties désactivées
        originalTotal = activity.points.reduce((sum: number, points: number, index: number) => {
          // Exclure les parties désactivées du calcul du barème original
          if (disabledParts && disabledParts[index]) {
            return sum;
          }
          return sum + points;
        }, 0);
        
        // Si toutes les parties sont désactivées, utiliser le fallback
        if (originalTotal === 0) {
          originalTotal = 20;
        }
      }
      
      displayValue = `${formatGrade(normalized, true)}/20 [${formatGrade(originalGrade, true)}/${originalTotal}]`;
    } else if (c.grade !== undefined) {
      displayValue = `${formatGrade(c.grade, true)}/20`;
    }
    
    // Stocker la valeur dans la matrice
    if (student && student.id && activity) {
      gradeMatrix[student.id][activity.id] = displayValue;
    }
  });
  
  // Convertir en CSV
  let csv = "Étudiant";
  
  // En-tête : noms des activités
  const activityIds = Array.from(activitiesMap.keys());
  activityIds.forEach(activityId => {
    const activity = activitiesMap.get(activityId);
    csv += `,${escapeCSV(activity?.name || `Activité ${activityId}`)}`;
  });
  csv += "\n";
  
  // Lignes : étudiants et leurs notes
  const studentIds = Array.from(studentsMap.keys());
  studentIds.forEach(studentId => {
    const student = studentsMap.get(studentId);
    csv += `${escapeCSV(`${student?.first_name || ''} ${student?.last_name || ''}`)}`;
    
    // Ajouter les notes pour chaque activité
    activityIds.forEach(activityId => {
      const value = gradeMatrix[studentId] && gradeMatrix[studentId][activityId] 
        ? gradeMatrix[studentId][activityId] 
        : 'NON ÉVALUÉ';
      csv += `,${escapeCSV(value)}`;
    });
    
    csv += "\n";
  });
  
  return csv;
};