import { Theme, PaletteColor } from '@mui/material/styles';

/**
 * Types de couleurs de base pour les notes (sans les variantes)
 */
export type GradeColorBase = 
  | 'success' 
  | 'primary' 
  | 'info' 
  | 'warning' 
  | 'error'
  | 'primary.light'
  | 'warning.light'
  | 'success.light'
  | 'info.light'
  | 'error.light';

/**
 * Types incluant les variantes pour accéder via SX
 */
export type GradeColorWithVariant = GradeColorBase;

/**
 * Retourne la couleur correspondant à la note sur une échelle de 0 à 20
 * Version simplifiée sans variantes pour les props MUI standard
 * @param grade - La note (0-20)
 * @returns Identifiant de couleur MUI de base
 */
export const getGradeColor = (grade: number): GradeColorBase => {
  if (grade >= 16) return 'success.light';    // 16-20
  if (grade >= 14) return 'primary.light';    // 14-16
  if (grade >= 12) return 'info';       // 12-14
  if (grade >= 10) return 'warning';    // 10-12
  if (grade >= 5) return 'warning';     // 5-10
  return 'error';                       // 0-5
};

/**
 * Retourne la couleur avec variante (pour usage dans sx prop)
 * @param grade - La note (0-20)
 * @returns Couleur avec variante si nécessaire
 */
export const getGradeColorWithVariant = (grade: number): GradeColorWithVariant => {
  if (grade >= 16) return 'success.light';       // 16-20
  if (grade >= 14) return 'primary.light'; // 14-16
  if (grade >= 12) return 'info';          // 12-14
  if (grade >= 10) return 'warning.light'; // 10-12
  if (grade >= 5) return 'warning';        // 5-10
  return 'error';                          // 0-5
};

/**
 * Retourne le libellé correspondant à la note
 * @param grade - La note (0-20)
 * @returns Description textuelle de la note
 */
export const getGradeLabel = (grade: number): string => {
  if (grade >= 16) return 'Très bien';     // 16-20
  if (grade >= 14) return 'Bien';          // 14-16
  if (grade >= 12) return 'Assez bien';    // 12-14
  if (grade >= 10) return 'Moyen';         // 10-12
  if (grade >= 5) return 'Insuffisant';    // 5-10
  return 'Très insuffisant';               // 0-5
};

/**
 * Vérifie si un objet est un PaletteColor valide avec les propriétés attendues
 */
const isPaletteColor = (obj: any): obj is PaletteColor => {
  return obj && typeof obj === 'object' && 'light' in obj && 'main' in obj && 'dark' in obj;
};

/**
 * Convertit un type de couleur en propriété utilisable par MUI
 * @param colorType - Type de couleur (peut inclure des variantes comme '.light')
 * @returns Objet avec les propriétés color et/ou sx pour MUI
 */
export const getMuiColorProps = (colorType: GradeColorWithVariant) => {
  // Si c'est une couleur avec variante (comme 'primary.light')
  if (colorType.includes('.')) {
    const [base, variant] = colorType.split('.');
    return {
      color: base as GradeColorBase,
      sx: { color: (theme: Theme) => {
        // Accès typé et sécurisé à la palette
        const paletteColor = theme.palette[base as keyof typeof theme.palette];
        
        // Vérifier explicitement si c'est un PaletteColor valide
        if (isPaletteColor(paletteColor) && variant in paletteColor) {
          return paletteColor[variant as 'light' | 'main' | 'dark'];
        }
        return theme.palette.text.primary; // Valeur par défaut en cas d'erreur
      }}
    };
  }
  
  // Sinon, c'est une couleur standard
  return { color: colorType as GradeColorBase };
};

/**
 * Retourne la couleur à utiliser dans la propriété sx d'un composant MUI
 * @param grade - La note (0-20)
 * @param theme - Le thème MUI
 */
export const getGradeColorForSx = (grade: number, theme: Theme) => {
  const colorType = getGradeColorWithVariant(grade);
  
  if (colorType.includes('.')) {
    const [base, variant] = colorType.split('.');
    // Accéder correctement à la palette avec vérification du type
    const paletteColor = theme.palette[base as keyof typeof theme.palette];
    
    // Utiliser la fonction de vérification pour s'assurer que c'est un PaletteColor valide
    if (isPaletteColor(paletteColor) && variant in paletteColor) {
      return paletteColor[variant as 'light' | 'main' | 'dark'];
    }
    return theme.palette.text.primary; // Fallback en cas d'erreur
  }
  
  // Pour les couleurs sans variante
  const paletteColor = theme.palette[colorType as keyof typeof theme.palette];
  if (isPaletteColor(paletteColor)) {
    return paletteColor.main;
  }
  return theme.palette.text.primary; // Fallback en cas d'erreur
};

/**
 * Calcule le pourcentage de réussite normalisé en utilisant percentage_grade ou un fallback
 * @param correction - La correction à évaluer
 * @param activity - L'activité associée (optionnelle)
 * @returns Le pourcentage de réussite (0-100)
 * 
 * Cette fonction priorise l'utilisation du champ percentage_grade qui est calculé automatiquement
 * par le système en tenant compte des parties désactivées. Si ce champ n'est pas disponible,
 * elle effectue un calcul de fallback basé sur final_grade et les parties actives.
 */
export const getPercentageGrade = (correction: any, activity?: any): number => {
  // Vérifications de sécurité
  if (!correction) return 0;
  
  // Priorité à percentage_grade si disponible
  if (correction.percentage_grade !== null && correction.percentage_grade !== undefined) {
    const percentage = Number(correction.percentage_grade);
    return isNaN(percentage) || !isFinite(percentage) ? 0 : Math.max(0, Math.min(100, percentage));
  }
  
  // Fallback: calcul manuel basé sur final_grade et parties actives
  if (correction.final_grade && activity?.points) {
    // Calculer le total des points actifs
    let totalActivePoints = 0;
    activity.points.forEach((points: number, idx: number) => {
      if (!correction.disabled_parts || !correction.disabled_parts[idx]) {
        totalActivePoints += points || 0;
      }
    });
    
    if (totalActivePoints > 0) {
      const finalGrade = parseFloat(String(correction.final_grade));
      if (!isNaN(finalGrade) && isFinite(finalGrade)) {
        const percentage = (finalGrade / totalActivePoints) * 100;
        return Math.max(0, Math.min(100, Math.round(percentage * 100) / 100));
      }
    }
  }
  
  return 0;
};

/**
 * Calcule la note normalisée sur 20 en utilisant le système percentage_grade
 * @param correction - La correction à évaluer
 * @param activity - L'activité associée (optionnelle)
 * @returns La note sur 20
 * 
 * Cette fonction convertit le pourcentage de réussite en note sur 20, 
 * permettant une normalisation cohérente peu importe le barème original de l'activité.
 */
export const getNormalizedGradeOn20 = (correction: any, activity?: any): number => {
  const percentageGrade = getPercentageGrade(correction, activity);
  return (percentageGrade / 100) * 20;
};
