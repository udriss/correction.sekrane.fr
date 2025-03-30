import { Theme, PaletteColor } from '@mui/material/styles';

/**
 * Types de couleurs de base pour les notes (sans les variantes)
 */
export type GradeColorBase = 
  | 'success' 
  | 'primary' 
  | 'info' 
  | 'warning' 
  | 'error';

/**
 * Types incluant les variantes pour accéder via SX
 */
export type GradeColorWithVariant = GradeColorBase | 'primary.light' | 'warning.light';

/**
 * Retourne la couleur correspondant à la note sur une échelle de 0 à 20
 * Version simplifiée sans variantes pour les props MUI standard
 * @param grade - La note (0-20)
 * @returns Identifiant de couleur MUI de base
 */
export const getGradeColor = (grade: number): GradeColorBase => {
  if (grade >= 16) return 'success';    // 16-20
  if (grade >= 14) return 'primary';    // 14-16
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
  if (grade >= 16) return 'success';       // 16-20
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
