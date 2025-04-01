/**
 * Utilitaire pour parser les fichiers CSV de données étudiants
 * Gère différents formats: NOM;Prénom;Email ou analyse automatique pour les formats à une colonne
 */

interface ParsedStudentData {
  firstName: string;
  lastName: string;
  email?: string;
}

/**
 * Parse une ligne de CSV pour en extraire les informations d'étudiant
 * 
 * @param line Ligne du CSV à analyser
 * @returns Object contenant firstName, lastName et email (optionnel)
 */
export function parseNameLine(line: string): ParsedStudentData {
  // Gérer les CSV correctement (les virgules dans les champs entre guillemets)
  const parts = line.split(/[,;](?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map(part => part.trim().replace(/^"|"$/g, ''));
  
  // Format à plusieurs colonnes: NOM, Prénom, Email
  if (parts.length >= 2) {
    return {
      lastName: parts[0],
      firstName: parts[1],
      email: parts.length > 2 ? parts[2] : undefined
    };
  } 
  // Format à une seule colonne contenant à la fois le nom et le prénom
  else {
    // Détection du format: analyse les majuscules pour déterminer
    const words = parts[0].split(/\s+/);
    
    // Si le premier mot est en majuscules, c'est probablement NOM Prénom
    if (words[0] === words[0].toUpperCase() && words.length > 1) {
      return {
        firstName: words.slice(1).join(' '),
        lastName: words[0]
      };
    } 
    // Si le dernier mot est en majuscules, c'est probablement Prénom NOM
    else if (words[words.length - 1] === words[words.length - 1].toUpperCase() && words.length > 1) {
      return {
        firstName: words.slice(0, -1).join(' '),
        lastName: words[words.length - 1]
      };
    }
    // Si aucun pattern évident, on divise en deux parties
    else {
      const midpoint = Math.ceil(words.length / 2);
      return {
        lastName: words.slice(0, midpoint).join(' '),
        firstName: words.slice(midpoint).join(' ')
      };
    }
  }
}

/**
 * Parse le contenu intégral d'un fichier CSV pour en extraire les informations d'étudiants
 * 
 * @param text Contenu du fichier CSV
 * @returns Array d'objets contenant firstName, lastName et email (optionnel)
 */
export function parseCSVContent(text: string): ParsedStudentData[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines.map(line => parseNameLine(line));
}
