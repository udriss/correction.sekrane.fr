// Types communs pour les exports PDF des corrections avec barème dynamique
import { Student } from '@/lib/types';
import { CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';

export type ArrangementType = 'student' | 'class' | 'subclass' | 'activity';
export type SubArrangementType = 'student' | 'class' | 'subclass' | 'activity' | 'none';
export type ExportFormat = 'pdf' | 'csv' | 'xlsx';
export type ViewType = 'detailed' | 'simplified';

// Interface pour les valeurs de cellules pour l'affichage des notes
export interface CellValues {
  pointsDisplay: string;
  totalGradeDisplay: string | number;
  statusDisplay: string;
}

// Interface pour les styles de cellule
export interface CellStyle {
  color: string;
  backgroundColor: string;
  fontStyle: 'normal' | 'italic' | 'bold' | 'bolditalic';
}

export interface ExportPDFComponentAutreProps {
  classData: any;
  corrections: CorrectionAutreEnriched[];
  activities: ActivityAutre[];
  students: Student[];
  filterActivity: number | 'all';
  setFilterActivity: (value: number | 'all') => void;
  filterSubClass: string | 'all';
  setFilterSubClass: (value: string | 'all') => void;
  uniqueSubClasses: { id: number | string; name: string }[];
  uniqueActivities: { id: number | string; name: string }[];
  getActivityById: (activityId: number) => ActivityAutre | undefined;
  getStudentById: (studentId: number | null) => Student | undefined;
}

// Types pour les props du composant d'export PDF pour toutes les corrections
export interface ExportPDFComponentAllCorrectionsAutreProps {
  corrections: CorrectionAutreEnriched[];
  activities: ActivityAutre[];
  students: Student[];
  filterActivity: number | 'all';
  setFilterActivity: (value: number | 'all') => void;
  uniqueActivities: { id: number | string; name: string }[];
  getActivityById: (activityId: number) => ActivityAutre | undefined;
  getStudentById: (studentId: number | null) => Student | undefined;
  getAllClasses?: () => Promise<any[]>; // Fonction optionnelle pour récupérer toutes les classes si nécessaire
}

// Utilitaires de formatage
export const formatGrade = (grade: number | null, useComma: boolean = false): string => {
  if (grade === null || grade === undefined) return '-';
  
  // Vérifier que grade est bien un nombre
  const numGrade = Number(grade);
  if (isNaN(numGrade)) return '-';
  
  // Si la note est un entier (sans décimale), l'afficher tel quel sans ".0"
  if (Number.isInteger(numGrade)) {
    return numGrade.toString();
  }
  
  // Sinon, afficher avec maximum 1 décimale
  const formattedWithDot = numGrade.toFixed(1).replace(/\.0$/, '');
  
  // Remplacer le point par une virgule si demandé
  return useComma ? formattedWithDot.replace('.', ',') : formattedWithDot;
};

// Fonction pour déterminer si une correction est active en fonction de son statut
export const isCorrectionActive = (correction: any): boolean => {
  // Priorité à correction.status si disponible
  if (correction.status) {
    return correction.status === 'ACTIVE';
  }
  // Compatibilité avec l'ancien système (correction.active)
  return correction.active !== 0;
};

// Fonction pour obtenir les valeurs à afficher dans une cellule en fonction du statut de la correction
export const getCorrectionCellValues = (correction: CorrectionAutreEnriched, activity: ActivityAutre, useCommaFormat: boolean = false): CellValues => {
  // Vérifier d'abord si c'est un placeholder avec status NON_NOTE
  if ((correction as any).placeholder && correction.status === 'NON_NOTE') {
    return {
      pointsDisplay: 'N/A',
      totalGradeDisplay: 'N/A',
      statusDisplay: 'NON NOTÉ'
    };
  }

  // Déterminer le statut
  if (correction.status) {
    switch (correction.status) {
      case 'NON_NOTE':
        return {
          pointsDisplay: 'NON NOTÉ',
          totalGradeDisplay: 'NON NOTÉ',
          statusDisplay: 'NON NOTÉ'
        };
      case 'NON_RENDU':
        return {
          pointsDisplay: 'NON RENDU',
          totalGradeDisplay: 'NON RENDU',
          statusDisplay: 'NON RENDU'
        };
      case 'ABSENT':
        return {
          pointsDisplay: 'ABSENT',
          totalGradeDisplay: 'ABSENT',
          statusDisplay: 'ABSENT'
        };
      case 'DEACTIVATED':
        return {
          pointsDisplay: 'DÉSACTIVÉ',
          totalGradeDisplay: 'DÉSACTIVÉ',
          statusDisplay: 'DÉSACTIVÉ'
        };
      default:
        // Statut ACTIVE ou autre, formater normalement
        break;
    }
  } 
  // Compatibilité avec l'ancien système - vérifier si la correction est inactive
  else if (correction.active === 0) {
    return {
      pointsDisplay: 'DÉSACTIVÉ',
      totalGradeDisplay: 'DÉSACTIVÉ',
      statusDisplay: 'DÉSACTIVÉ'
    };
  }
  
  // Pour les corrections actives, formater les valeurs numériques
  const isActive = isCorrectionActive(correction);
  
  const grade = correction.grade != null
    ? parseFloat(correction.grade.toString())
    : 0;
  
  // Formater les points
  const pointsDisplay = isActive 
    ? Array.isArray(correction.points_earned) 
      ? correction.points_earned.join(' / ')
      : 'N/A'
    : 'DÉSACTIVÉ';
  
  // Formater la note totale
  const totalGradeDisplay = isActive
    ? `${formatGrade(grade, useCommaFormat)}`
    : 'DÉSACTIVÉ';
  
  return {
    pointsDisplay,
    totalGradeDisplay,
    statusDisplay: isActive ? 'ACTIVE' : 'DÉSACTIVÉ'
  };
};

// Fonction pour déterminer le style d'une cellule en fonction de la valeur
export const getCorrectionCellStyle = (cellValue: any): CellStyle => {
  // Valeur par défaut
  const defaultStyle = {
    color: '000000', // Noir
    backgroundColor: 'FFFFFF', // Blanc
    fontStyle: 'normal' as const
  };
  
  // Si c'est une chaîne, vérifier les statuts spéciaux
  if (typeof cellValue === 'string') {
    if (cellValue === 'NON NOTÉ') {
      return {
        color: 'CC0000', // Rouge
        backgroundColor: 'FFEEEE', // Rouge très pâle
        fontStyle: 'italic'
      };
    }
    if (cellValue === 'NON RENDU') {
      return {
        color: 'CC6600', // Orange foncé
        backgroundColor: 'FFF2E6', // Orange très pâle
        fontStyle: 'italic'
      };
    }
    if (cellValue === 'ABSENT') {
      return {
        color: '006600', // Vert foncé
        backgroundColor: 'EEFFEE', // Vert très pâle
        fontStyle: 'bolditalic'
      };
    }
    if (cellValue === 'DÉSACTIVÉ') {
      return {
        color: '666666', // Gris
        backgroundColor: 'F2F2F2', // Gris très pâle
        fontStyle: 'italic'
      };
    }
  }
  
  // Pour les notes numériques, extraire la valeur numérique et appliquer un dégradé de couleur
  let numericValue = -1;
  
  if (typeof cellValue === 'number') {
    numericValue = cellValue;
  } else if (typeof cellValue === 'string') {
    // Essayer d'extraire un nombre de la chaîne (ex: "14.5/20" -> 14.5)
    const match = cellValue.match(/^(\d+(\.\d+)?)\//);
    if (match) {
      numericValue = parseFloat(match[1]);
    }
  }
  
  // Appliquer un style basé sur la valeur numérique
  if (numericValue >= 0) {
    if (numericValue < 5) {
      return {
        color: '000000', // Noir
        backgroundColor: 'FFCCCC', // Rouge clair
        fontStyle: 'normal'
      };
    } else if (numericValue < 10) {
      return {
        color: '000000', // Noir
        backgroundColor: 'FFEECC', // Orange clair
        fontStyle: 'normal'
      };
    } else if (numericValue < 15) {
      return {
        color: '000000', // Noir
        backgroundColor: 'EEFFEE', // Vert clair
        fontStyle: 'normal'
      };
    } else {
      return {
        color: '000000', // Noir
        backgroundColor: 'CCFFCC', // Vert clair
        fontStyle: 'bold' // En gras pour les excellentes notes
      };
    }
  }
  
  return defaultStyle;
};

// Fonction pour convertir un statut en texte lisible
export const getStatusLabel = (correction: CorrectionAutreEnriched): string => {
  if ((correction as any).placeholder) {
    return "NON NOTÉ";
  } else if (correction.status) {
    switch (correction.status) {
      case 'ACTIVE': return `${formatGrade(correction.grade || 0)}`;
      case 'NON_NOTE': return 'NON NOTÉ';
      case 'ABSENT': return 'ABSENT';
      case 'NON_RENDU': return 'NON RENDU';
      case 'DEACTIVATED': return 'DÉSACTIVÉ';
      default: return `${formatGrade(correction.grade || 0)}`;
    }
  } else {
    // Compatibilité avec l'ancien système utilisant le champ active
    return correction.active === 0 ? 'DÉSACTIVÉ' : `${formatGrade(correction.grade || 0)}`;
  }
};

// Utilitaire pour échapper les caractères spéciaux dans le CSV
export const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  // Si la valeur contient des virgules, des guillemets ou des sauts de ligne, l'entourer de guillemets
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Remplacer les guillemets par des guillemets doublés (standard CSV)
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

// Fonction pour créer un objet placeholder représentant un étudiant sans correction
// Adaptée pour le système de notation avec points_earned (tableau de nombres)
export const createEmptyCorrectionAutre = (
  studentId: number, 
  activityId: number, 
  classId: number | null,
  studentName: string = 'Non défini',
  activityName: string = 'Non défini',
  className: string = classId ? `Classe ${classId}` : 'Classe non attribuée',
  pointsCount: number = 0
): CorrectionAutreEnriched => {
  return {
    id: -1, // ID négatif pour signifier qu'il s'agit d'un placeholder
    student_id: studentId,
    activity_id: activityId,
    class_id: classId,
    // Propriétés supplémentaires requises par le type CorrectionAutre
    student_name: studentName,
    activity_name: activityName,
    class_name: className,
    submission_date: new Date().toISOString(),
    // Initialisation d'un tableau de zéros pour points_earned
    points_earned: new Array(pointsCount).fill(0),
    grade: 0,
    active: 1, // Actif par défaut
    status: 'NON_NOTE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    group_id: null,
    placeholder: true // Propriété spéciale pour identifier un placeholder
  };
};