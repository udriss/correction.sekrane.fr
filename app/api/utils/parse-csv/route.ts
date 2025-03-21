import { NextRequest, NextResponse } from 'next/server';

interface Student {
  name: string;
  firstName?: string;
  lastName?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer le fichier CSV depuis FormData
    const formData = await request.formData();
    const file = formData.get('csvFile') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier CSV fourni' }, { status: 400 });
    }

    // Lecture du fichier CSV
    const fileContent = await file.text();
    
    // Détecter le délimiteur du CSV (virgule ou point-virgule)
    const delimiter = detectDelimiter(fileContent);
    
    // Parser le contenu en lignes et colonnes
    const rows = fileContent.split(/\r?\n/).filter(row => row.trim());
    
    // Traitement des lignes pour extraire les prénoms
    let students: Student[] = rows.map((row, index) => {
      // Si première ligne = entête, l'ignorer pour les petits fichiers (moins de 5 lignes)
      if (index === 0 && rows.length > 5 && isHeaderRow(row)) {
        return null; // Sera filtré plus tard
      }
      
      // Récupérer la première colonne
      const columns = parseCSVLine(row, delimiter);
      const fullName = columns[0] || '';
      const nameInfo = extractNameInfo(fullName);

      return {
        // Utiliser uniquement le prénom si disponible, sinon utiliser le nom complet
        name: nameInfo.firstName || fullName.trim(),
        firstName: nameInfo.firstName,
        lastName: nameInfo.lastName
      };
    }).filter(Boolean) as Student[]; // Filtrer les lignes d'entête null

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Erreur lors du traitement du fichier CSV:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du fichier CSV' },
      { status: 500 }
    );
  }
}

function isHeaderRow(row: string): boolean {
  // Un en-tête contient souvent des mots comme "nom", "prénom", "classe"
  const lowerRow = row.toLowerCase();
  return lowerRow.includes('nom') || 
         lowerRow.includes('prenom') || 
         lowerRow.includes('prénom') || 
         lowerRow.includes('classe') ||
         lowerRow.includes('élève');
}

// Détecter le délimiteur le plus utilisé dans le fichier
function detectDelimiter(content: string): string {
  const firstLine = content.split(/\r?\n/)[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  
  if (tabCount > semicolonCount && tabCount > commaCount) {
    return '\t';
  } else if (semicolonCount >= commaCount) {
    return ';';
  } else {
    return ',';
  }
}

// Extraire le prénom à partir du nom complet
function extractNameInfo(fullName: string): { firstName: string, lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' };
  
  // Normaliser les tirets doubles et espaces multiples
  const normalizedName = fullName.replace(/--+/g, '-').replace(/\s+/g, ' ').trim();
  
  // APPROCHE PRINCIPALE: Rechercher les parties contenant des minuscules (prénoms)
  // Dans la convention française, les prénoms ont toujours des minuscules,
  // alors que les noms peuvent être entièrement en majuscules
  const parts = normalizedName.split(/\s+/);
  const firstNameParts = parts.filter(part => /[a-z]/.test(part));
  const lastNameParts = parts.filter(part => !/[a-z]/.test(part));
  
  if (firstNameParts.length > 0) {
    // On a trouvé des parties avec minuscules (prénoms)
    const firstName = firstNameParts.join(' ');
    const lastName = lastNameParts.join(' ');
    return {
      firstName,
      lastName
    };
  }
  
  // PLAN B: Si aucune partie ne contient de minuscules, essayer d'autres patterns
  
  // Cas 1: Format "NOM Prénom" (le prénom commence par une majuscule suivie de minuscules)
  const matches = normalizedName.match(/^([A-Z\-\s]+)\s+([A-Z][a-zÀ-ÿ\-\s]+)$/);
  if (matches) {
    return { 
      firstName: matches[2].trim(), 
      lastName: matches[1].trim()
    };
  }
  
  // Cas 2: Format "NOM prénom" (le prénom commence directement par une minuscule)
  const matches2 = normalizedName.match(/^([A-Z\-\s]+)\s+([a-zÀ-ÿ\-\s]+)$/);
  if (matches2) {
    // Capitaliser le prénom
    const firstName = matches2[2].trim().charAt(0).toUpperCase() + matches2[2].trim().slice(1);
    return { 
      firstName, 
      lastName: matches2[1].trim()
    };
  }
  
  // Cas 3: Format "Prénom NOM"
  const matches3 = normalizedName.match(/^([A-Z][a-zÀ-ÿ\-\s]+)\s+([A-Z\-\s]+)$/);
  if (matches3) {
    return { 
      firstName: matches3[1].trim(), 
      lastName: matches3[2].trim()
    };
  }
  
  // Cas 4: Tout en majuscules mais avec des espaces - essayer de détecter le pattern
  if (normalizedName === normalizedName.toUpperCase()) {
    const parts = normalizedName.split(/\s+/);
    if (parts.length >= 2) {
      // Convention française courante: le prénom est le dernier mot quand tout est en majuscules
      const firstName = parts[parts.length-1].charAt(0) + parts[parts.length-1].slice(1).toLowerCase();
      const lastName = parts.slice(0, parts.length-1).join(' ');
      return {
        firstName,
        lastName
      };
    }
  }
  
  // Par défaut, retourner le texte tel quel comme prénom si on n'a pas pu l'identifier
  return { 
    firstName: normalizedName, 
    lastName: ''
  };
}

// Parser une ligne CSV en gérant les guillemets
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Gérer les guillemets échappés (doublés)
      if (i + 1 < line.length && line[i + 1] === '"') {
        currentField += '"';
        i++; // Sauter le prochain guillemet
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // Fin de champ, ajouter à la liste
      result.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // Ajouter le dernier champ
  result.push(currentField.trim());
  
  return result;
}
