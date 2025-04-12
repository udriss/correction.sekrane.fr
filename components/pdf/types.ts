// Types communs pour les exports PDF
import { Student } from '@/lib/types';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';

export type ArrangementType = 'student' | 'class' | 'subclass' | 'activity';
export type SubArrangementType = 'student' | 'class' | 'subclass' | 'activity' | 'none';
export type ExportFormat = 'pdf' | 'csv' | 'xlsx';
export type ViewType = 'detailed' | 'simplified';

// Interface pour les valeurs de cellules pour l'affichage des notes
export interface CellValues {
  totalGradeDisplay: string | number;
  expGradeDisplay: string | number;
  theoGradeDisplay: string | number;
  statusDisplay: string;
}

// Interface pour les styles de cellule
export interface CellStyle {
  color: string;
  backgroundColor: string;
  fontStyle: 'normal' | 'italic' | 'bold' | 'bolditalic';
}

export interface ExportPDFComponentProps {
  classData: any;
  corrections: ProviderCorrection[];
  activities: any[];
  students: Student[];
  filterActivity: number | 'all';
  setFilterActivity: (value: number | 'all') => void;
  filterSubClass: string | 'all';
  setFilterSubClass: (value: string | 'all') => void;
  uniqueSubClasses: { id: number | string; name: string }[];
  uniqueActivities: { id: number | string; name: string }[];
  getActivityById: (activityId: number) => any;
  getStudentById: (studentId: number | null) => Student | undefined;
}

// Utilitaires de formatage
export const formatGrade = (grade: number | null): string => {
  if (grade === null || grade === undefined) return '-';
  
  // Vérifier que grade est bien un nombre
  const numGrade = Number(grade);
  if (isNaN(numGrade)) return '-';
  
  // Si la note est un entier (sans décimale), l'afficher tel quel sans ".0"
  if (Number.isInteger(numGrade)) {
    return numGrade.toString();
  }
  
  // Sinon, afficher avec maximum 1 décimale
  return numGrade.toFixed(1).replace(/\.0$/, '');
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
export const getCorrectionCellValues = (correction: any, activity: any): any => {
  // Déterminer le statut
  if (correction.status) {
    switch (correction.status) {
      case 'NON_NOTE':
        return {
          experimentalDisplay: 'NON NOTÉ',
          theoreticalDisplay: 'NON NOTÉ',
          totalGradeDisplay: 'NON NOTÉ'
        };
      case 'NON_RENDU':
        return {
          experimentalDisplay: 'NON RENDU',
          theoreticalDisplay: 'NON RENDU',
          totalGradeDisplay: 'NON RENDU'
        };
      case 'ABSENT':
        return {
          experimentalDisplay: 'ABSENT',
          theoreticalDisplay: 'ABSENT',
          totalGradeDisplay: 'ABSENT'
        };
      case 'DEACTIVATED':
        return {
          experimentalDisplay: 'DÉSACTIVÉ',
          theoreticalDisplay: 'DÉSACTIVÉ',
          totalGradeDisplay: 'DÉSACTIVÉ'
        };
      default:
        // Statut ACTIVE ou autre, formater normalement
        break;
    }
  } 
  // Compatibilité avec l'ancien système - vérifier si la correction est inactive
  else if (correction.active === 0) {
    return {
      experimentalDisplay: 'DÉSACTIVÉ',
      theoreticalDisplay: 'DÉSACTIVÉ',
      totalGradeDisplay: 'DÉSACTIVÉ'
    };
  }
  
  // Pour les corrections actives, formater les valeurs numériques
  const isActive = isCorrectionActive(correction);
  
  const expPoints = correction.experimental_points_earned !== undefined 
    ? parseFloat(correction.experimental_points_earned.toString()) 
    : 0;
    
  const theoPoints = correction.theoretical_points_earned !== undefined 
    ? parseFloat(correction.theoretical_points_earned.toString()) 
    : 0;
  
  const grade = correction.grade !== undefined 
    ? parseFloat(correction.grade.toString()) 
    : 0;
  
  // Formater les points expérimentaux
  const experimentalDisplay = isActive 
    ? `${formatGrade(expPoints)}/${activity?.experimental_points || '?'}`
    : 'DÉSACTIVÉ';
  
  // Formater les points théoriques
  const theoreticalDisplay = isActive
    ? `${formatGrade(theoPoints)}/${activity?.theoretical_points || '?'}`
    : 'DÉSACTIVÉ';
  
  // Formater la note totale
  const totalGradeDisplay = isActive
    ? `${formatGrade(grade)}/20`
    : 'DÉSACTIVÉ';
  
  return {
    experimentalDisplay,
    theoreticalDisplay,
    totalGradeDisplay,
    grade
  };
};

// Fonction pour déterminer le style d'une cellule en fonction de la valeur
export const getCorrectionCellStyle = (cellValue: any): {
  color: string;
  backgroundColor: string;
  fontStyle: 'normal' | 'italic' | 'bold' | 'bolditalic';
} => {
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
export const getStatusLabel = (correction: ProviderCorrection): string => {
  if ((correction as any).placeholder || correction.status === 'NON_NOTE') {
    return "NON NOTÉ";
  } else if (correction.status) {
    switch (correction.status) {
      case 'ACTIVE': return `${formatGrade(correction.grade || 0)}/20`;
      case 'ABSENT': return 'ABSENT';
      case 'NON_RENDU': return 'NON RENDU';
      case 'DEACTIVATED': return 'DÉSACTIVÉ';
      default: return `${formatGrade(correction.grade || 0)}/20`;
    }
  } else {
    // Compatibilité avec l'ancien système utilisant le champ active
    return correction.active === 0 ? 'DÉSACTIVÉ' : `${formatGrade(correction.grade || 0)}/20`;
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