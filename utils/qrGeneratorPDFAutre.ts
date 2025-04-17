// filepath: /var/www/correction.sekrane.fr/utils/qrGeneratorPDFAutre.ts
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { CorrectionAutreEnriched, Student, CorrectionWithShareCode } from '@/lib/types';
import { CellStyle } from '@/components/pdf/types';
import { ActivityAutre } from '@/lib/types';

// Types d'arrangement et sous-arrangement
type ArrangementType = 'student' | 'class' | 'subclass' | 'activity';
type SubArrangementType = 'student' | 'activity' | 'class' | 'subclass' | 'none';

// Ajout d'une interface pour les activités
interface Activity {
  id: number;
  name: string;
}

// Interface pour les étudiants simplifiés (utilisés dans les composants UI)
interface SimpleStudent {
  id: number;
  first_name: string;
  last_name: string;
  group?: string;
  [key: string]: any; // Pour permettre d'autres propriétés
}

// Define the options type for the function
interface QRCodePDFOptions {
  corrections: Partial<CorrectionAutreEnriched>[] | any[]; // Pour accepter les deux types de correction
  group: { name: string; activity_name?: string } | null;
  // generateShareCode?: (correctionId: string | number) => Promise<{ isNew: boolean; code: string }>;
  // getExistingShareCode?: (correctionId: string | number) => Promise<{ exists: boolean; code?: string }>;
  onSuccess?: (updatedCorrections: CorrectionWithShareCode[]) => void;
  students?: (Student | SimpleStudent)[]; // Accepte les deux formats d'étudiants
  activities?: ActivityAutre[]; // Ajouter un tableau d'activités optionnel
  includeDetails?: boolean; // Nouvelle option pour contrôler l'affichage des détails
  arrangement?: ArrangementType; // Type d'arrangement (class, student, activity, subclass)
  subArrangement?: SubArrangementType; // Sous-arrangement (student, activity, class, subclass, none)
  groupedData?: any; // Données déjà organisées selon l'arrangement choisi
}

/**
 * Trie un tableau de corrections par nom d'étudiant (ordre alphabétique)
 * @param corrections Tableau de corrections à trier
 * @param students Liste des étudiants pour récupérer les noms complets
 * @returns Tableau de corrections triées par nom d'étudiant
 */
function sortCorrectionsByStudentName(
  corrections: Partial<CorrectionAutreEnriched>[] | any[],
  students: (Student | SimpleStudent)[]
): Partial<CorrectionAutreEnriched>[] | any[] {
  return [...corrections].sort((a, b) => {
    // Obtenir les noms complets des étudiants à partir de leurs IDs
    const studentA = students.find(s => s.id === a.student_id);
    const studentB = students.find(s => s.id === b.student_id);
    
    // Créer des chaînes comparables pour le tri alphabétique
    const nameA = studentA 
      ? `${studentA.last_name} ${studentA.first_name}`
      : (a.student_name || `Étudiant ${a.student_id}`);
    const nameB = studentB 
      ? `${studentB.last_name} ${studentB.first_name}`
      : (b.student_name || `Étudiant ${b.student_id}`);
    
    // Comparer les noms avec le tri français (insensible à la casse et aux accents)
    return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
  });
}

/**
 * Organise les corrections selon l'arrangement principal et le sous-arrangement,
 * puis trie chaque groupe par ordre alphabétique des noms d'étudiants.
 * 
 * @param corrections Tableau de corrections à organiser
 * @param arrangement Type d'arrangement principal ('class', 'student', 'activity', 'sub_class')
 * @param subArrangement Type de sous-arrangement ('student', 'activity', 'class', 'subclass')
 * @param students Liste des étudiants pour récupérer les noms complets
 * @param activities Liste des activités pour récupérer les noms
 * @returns Corrections organisées selon l'arrangement demandé
 */
function organizeBySubArrangement(
  corrections: Partial<CorrectionAutreEnriched>[] | any[],
  arrangement: ArrangementType = 'class',
  subArrangement: SubArrangementType = 'student',
  students: (Student | SimpleStudent)[] = [],
  activities: Activity[] = []
): any {
  // Cas où aucune sous-organisation n'est nécessaire
  if (subArrangement === 'none') {
    return sortCorrectionsByStudentName(corrections, students);
  }
  
  // Vérifier d'abord l'arrangement principal
  switch (arrangement) {
    case 'subclass': 
      // Organisation principale par sous-classe (groupe)
      const resultBySubClass: Record<string, Partial<CorrectionAutreEnriched>[] | any[]> = {};
      
      // Regrouper les corrections par sous-classe
      corrections.forEach(correction => {
        const subClassName = correction.sub_class 
          ? `Groupe ${correction.sub_class}` 
          : 'Sans groupe';
        
        if (!resultBySubClass[subClassName]) {
          resultBySubClass[subClassName] = [];
        }
        
        resultBySubClass[subClassName].push(correction);
      });
      
      // Trier chaque groupe par ordre alphabétique
      Object.keys(resultBySubClass).forEach(group => {
        resultBySubClass[group] = sortCorrectionsByStudentName(resultBySubClass[group], students);
      });
      return resultBySubClass;
      
    case 'activity':
      // Organisation principale par activité
      const resultByActivity: Record<string, Partial<CorrectionAutreEnriched>[] | any[]> = {};
      
      // Regrouper les corrections par activité
      corrections.forEach(correction => {
        const activityName = getActivityName(correction.activity_id, activities);
        
        if (!resultByActivity[activityName]) {
          resultByActivity[activityName] = [];
        }
        
        resultByActivity[activityName].push(correction);
      });
      
      // Trier chaque activité par ordre alphabétique
      Object.keys(resultByActivity).forEach(activity => {
        resultByActivity[activity] = sortCorrectionsByStudentName(resultByActivity[activity], students);
      });
      return resultByActivity;
      
    default:
      // Traiter le sous-arrangement
      if (subArrangement === 'subclass') {
        const result: Record<string, Partial<CorrectionAutreEnriched>[] | any[]> = {};
        
        // Regrouper les corrections par sous-classe
        corrections.forEach(correction => {
          const subClassName = correction.sub_class 
            ? `Groupe ${correction.sub_class}` 
            : 'Sans groupe';
          
          if (!result[subClassName]) {
            result[subClassName] = [];
          }
          
          result[subClassName].push(correction);
        });
        
        // Trier chaque groupe par ordre alphabétique
        Object.keys(result).forEach(group => {
          result[group] = sortCorrectionsByStudentName(result[group], students);
        });
        return result;
      }
      
      // Pour tous les arrangements avec activité comme sous-arrangement
      if (subArrangement === 'activity') {
        const result: Record<string, Partial<CorrectionAutreEnriched>[] | any[]> = {};
        
        // Regrouper les corrections par activité
        corrections.forEach(correction => {
          const activityName = getActivityName(correction.activity_id, activities);
          
          if (!result[activityName]) {
            result[activityName] = [];
          }
          
          result[activityName].push(correction);
        });
        
        // Trier chaque activité par ordre alphabétique
        Object.keys(result).forEach(activity => {
          result[activity] = sortCorrectionsByStudentName(result[activity], students);
        });
        return result;
      }
      
      // Pour tous les autres cas, simplement trier par nom d'étudiant
      return sortCorrectionsByStudentName(corrections, students);
  }
}

/**
 * Organise les corrections par sous-arrangement au sein d'un groupe
 */
function organizeGroupBySubArrangement(
  groupCorrections: Partial<CorrectionAutreEnriched>[] | any[],
  subArrangement: SubArrangementType,
  students: (Student | SimpleStudent)[],
  activities: Activity[]
): Record<string, Partial<CorrectionAutreEnriched>[] | any[]> | Partial<CorrectionAutreEnriched>[] | any[] {
  if (subArrangement === 'none') {
    return sortCorrectionsByStudentName(groupCorrections, students);
  }

  const result: Record<string, Partial<CorrectionAutreEnriched>[] | any[]> = {};

  switch (subArrangement) {
    case 'activity':
      // Regrouper les corrections par activité
      groupCorrections.forEach(correction => {
        const activityName = getActivityName(correction.activity_id, activities);
        
        if (!result[activityName]) {
          result[activityName] = [];
        }
        
        result[activityName].push(correction);
      });
      break;

    case 'student':
      // Regrouper les corrections par étudiant
      groupCorrections.forEach(correction => {
        let studentName = 'Étudiant inconnu';
        
        if (correction.student_id) {
          const student = students.find(s => s.id === correction.student_id);
          studentName = student 
            ? `${student.last_name} ${student.first_name}`
            : `Étudiant ${correction.student_id}`;
        }
        
        if (!result[studentName]) {
          result[studentName] = [];
        }
        
        result[studentName].push(correction);
      });
      break;

    case 'class':
      // Regrouper les corrections par classe
      groupCorrections.forEach(correction => {
        const className = correction.class_name || `Classe ${correction.class_id || 'inconnue'}`;
        
        if (!result[className]) {
          result[className] = [];
        }
        
        result[className].push(correction);
      });
      break;

    case 'subclass':
      // Regrouper les corrections par sous-classe
      groupCorrections.forEach(correction => {
        const subClassName = correction.sub_class 
          ? `Groupe ${correction.sub_class}` 
          : 'Sans groupe';
        
        if (!result[subClassName]) {
          result[subClassName] = [];
        }
        
        result[subClassName].push(correction);
      });
      break;
  }

  // Trier les corrections au sein de chaque sous-groupe
  Object.keys(result).forEach(key => {
    result[key] = sortCorrectionsByStudentName(result[key], students);
  });

  return result;
}

// Fonction utilitaire pour récupérer le nom complet d'un étudiant
function getStudentFullName(studentId: number | null, students: (Student | SimpleStudent)[], includeDetails: boolean = true): string {
  if (!studentId) return 'Sans nom';
  const student = students.find(s => s.id === studentId);
  if (!student) return 'Sans nom';
  
  // Afficher uniquement le prénom + la première lettre du nom si includeDetails est false
  if (!includeDetails) {
    return `${student.first_name} ${student.last_name.charAt(0)}.`;
  }
  
  // Sinon afficher le nom complet
  return `${student.first_name} ${student.last_name}`;
}

// Fonction utilitaire pour récupérer le nom d'une activité
function getActivityName(activityId: number | null, activities: Activity[]): string {
  if (!activityId) return 'Activité inconnue';
  const activity = activities.find(a => a.id === activityId);
  if (!activity) return `Activité ${activityId}`;
  return activity.name;
}

// Déterminer les options de sous-arrangement disponibles
function getAvailableSubArrangements(arrangement: ArrangementType): SubArrangementType[] {
  switch (arrangement) {
    case 'student':
      return ['activity', 'class', 'subclass', 'none'];
    case 'class':
      return ['student', 'activity', 'subclass', 'none'];
    case 'subclass':
      return ['student', 'activity', 'class', 'none'];
    case 'activity':
      return ['student', 'class', 'subclass', 'none'];
    default:
      return ['none'];
  }
}

// Fonction pour convertir une couleur hexadécimale en RGB
function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  // Supprimer le # si présent
  hex = hex.replace(/^#/, '');
  
  // Convertir les formats courts (3 caractères) en formats longs (6 caractères)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Vérifier la longueur
  if (hex.length !== 6) {
    return null;
  }
  
  // Extraire les composantes
  const bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

// Fonction utilitaire pour appliquer un style au texte dans le PDF
function applyStatusStyleToPDF(doc: any, style: CellStyle, statusText: string): void {
  // Convertir les couleurs hexadécimales en RGB
  const rgbColor = hexToRgb(style.color);
  
  if (rgbColor) {
    doc.setTextColor(rgbColor.r, rgbColor.g, rgbColor.b);
  }
  
  // Appliquer le style de police
  switch (style.fontStyle) {
    case 'bold':
      doc.setFont('helvetica', 'bold');
      break;
    case 'italic':
      doc.setFont('helvetica', 'italic');
      break;
    case 'bolditalic':
      doc.setFont('helvetica', 'bolditalic');
      break;
    default:
      doc.setFont('helvetica', 'normal');
  }
}

/**
 * Ajoute le style et les informations pour une correction spécifique près de son QR code
 * ou ajoute un indicateur visuel pour les étudiants sans correction
 */
function addCorrectionStylingAndInfo(
  doc: jsPDF, 
  correction: CorrectionAutreEnriched, 
  isActive: boolean, 
  correctionStatus: string, 
  x: number, 
  y: number, 
  qrSize: number, 
  qrData: string, 
  students: SimpleStudent[], 
  includeDetails: boolean,
  activities: ActivityAutre[] = []
) {
  // Vérifier si c'est une correction placeholder (sans QR code)
  const isPlaceholder = correction.placeholder === true || correction.noQRCode === true;
  
  if (isPlaceholder) {
    // Dessiner un carré avec un motif hachuré pour indiquer l'absence de correction
    doc.setDrawColor(200, 0, 0); // Rouge pour la bordure
    doc.setLineWidth(1);
    doc.rect(x, y, qrSize, qrSize);
    
    // Ajouter des hachures diagonales
    doc.setDrawColor(200, 0, 0);
    doc.setLineWidth(0.5);
    
    // Diagonales dans les deux sens
    for (let i = 0; i <= qrSize; i += 5) {
      doc.line(x + i, y, x, y + i); // Diagonale descendante
      doc.line(x + qrSize - i, y, x + qrSize, y + i); // Diagonale montante
    }
    
    // Ajouter un X au milieu
    doc.setLineWidth(1.5);
    doc.line(x + 5, y + 5, x + qrSize - 5, y + qrSize - 5);
    doc.line(x + qrSize - 5, y + 5, x + 5, y + qrSize - 5);
    
    // Ajouter un message "NON NOTÉ" au centre du carré
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(200, 0, 0);
    doc.text('NON NOTÉ', x + qrSize/2, y + qrSize/2, { align: 'center' });
    
    // Réinitialiser les couleurs
    doc.setDrawColor(0, 0, 0);
    doc.setTextColor(0, 0, 0);
  } else {
    // Traitement standard avec QR code
    // Ajouter un cadre autour du QR code avec une couleur selon le statut
    doc.setDrawColor(0, 0, 0); // Noir par défaut
    let borderColor = '000000'; // Noir en hexadécimal
    
    // Si la correction a un statut spécial (non actif), changer la couleur
    if (!isActive) {
      doc.setDrawColor(204, 102, 0); // Orange warning
      borderColor = 'CC6600'; // Orange en hexadécimal
    }
    
    // Dessiner le cadre
    doc.setLineWidth(0.5);
    doc.rect(x - 1, y - 1, qrSize + 2, qrSize + 2);
  }
  
  // Récupérer le nom de l'étudiant depuis la correction ou depuis la liste des étudiants
  let studentName;
  
  if (correction.student_id) {
    // Chercher le nom de l'étudiant dans la liste fournie
    const student = students.find(s => s.id === correction.student_id);
    studentName = student ? getStudentFullName(correction.student_id, students, includeDetails) : `ID: ${correction.student_id}`;
  } else {
    studentName = 'Étudiant inconnu';
  }
  
  // Position du texte (centré sous le QR code/carré)
  const textX = x + qrSize / 2;
  const textY = y + qrSize + 8;
  
  // Ajouter le nom de l'étudiant
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(studentName, textX, textY, { align: 'center' });
  
  // Si la correction n'a pas de QR code, c'est terminé
  if (isPlaceholder) {
    // Ajouter le nom de l'activité si pertinent
    if (includeDetails && correction.activity_id) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      const activityName = getActivityName(correction.activity_id, activities);
      doc.text(activityName, textX, textY + 6, { align: 'center' });
      doc.setFont('helvetica', 'normal');
    }
    
    return;
  }
  
  // Si le statut n'est pas actif, ajouter le statut sous le nom
  if (!isActive) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(204, 102, 0); // Orange warning
    
    // Traduire le statut en français
    let statusText = correctionStatus;
    switch (correctionStatus) {
      case 'NON_NOTE':
        statusText = 'Non notée';
        break;
      case 'ABSENT':
        statusText = 'Absent(e)';
        break;
      case 'NON_RENDU':
        statusText = 'Non rendu';
        break;
      case 'DEACTIVATED':
      case 'INACTIVE':
        statusText = 'Désactivée';
        break;
    }
    
    doc.text(statusText, textX, textY + 6, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Remettre la couleur noire
    doc.setFont('helvetica', 'normal');
  }
  
  // Ajouter les détails si demandé
  if (includeDetails) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    
    // Note si disponible
    if (correction.grade !== undefined && correction.grade !== null) {
      const gradeY = textY + (isActive ? 6 : 12);
      
      // Formater la note (2 décimales max)
      let formattedGrade = correction.grade.toString();
      if (formattedGrade.includes('.')) {
        formattedGrade = parseFloat(formattedGrade).toFixed(2);
        // Supprimer les zéros inutiles à la fin (.00 -> 0, 14.50 -> 14.5)
        formattedGrade = formattedGrade.replace(/\.?0+$/, '');
      }
      
      // Trouver l'activité correspondante pour obtenir les points
      const activity = correction.activity_id ? activities.find(a => a.id === correction.activity_id) : null;
      const points = activity?.points;
      
      // Ajouter le barème si disponible
      let gradeText = `Note: ${formattedGrade}`;
      if (points !== undefined) {
        gradeText += `Barème : [${points}]`;
      }
      
      doc.text(gradeText, textX, gradeY, { align: 'center' });
    }
    
    // URL encodée dans le QR code (en très petit)
    doc.setFontSize(8);
    doc.text(qrData, textX, textY + (isActive ? (correction.grade !== undefined ? 11 : 6) : (correction.grade !== undefined ? 16 : 12)), { align: 'center' });
  }
}

/**
 * Récupère les codes de partage pour les corrections
 */
async function getShareCodes(corrections: Partial<CorrectionAutreEnriched>[] | any[]): Promise<Record<number, string>> {
  const shareCodes: Record<number, string> = {};
  
  // Vérifier d'abord si certaines corrections n'ont pas de code de partage
  const correctionsWithoutQR = corrections.filter(c => 
    !('shareCode' in c) || !(c as any).shareCode
  );
  
  // Si des corrections n'ont pas de code de partage, en créer en lot
  if (correctionsWithoutQR.length > 0) {
    try {
      // Créer des codes de partage en lot
      const correctionIds = correctionsWithoutQR.map(c => c.id);
      const response = await fetch('/api/share/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correctionIds }),
      });
      
      if (!response.ok) {
        console.error('Erreur lors de la création des codes de partage');
      }
    } catch (error) {
      console.error('Erreur lors de la création des codes de partage:', error);
    }
  }
  
  // Récupérer tous les codes de partage en une seule requête
  try {
    // Collecter les IDs des corrections
    const correctionIds = corrections
      .filter(c => c.id !== undefined)
      .map(c => c.id);
      
    // Récupérer les codes de partage en lot
    const queryParams = new URLSearchParams();
    correctionIds.forEach(id => queryParams.append('correctionIds[]', id.toString()));
    
    const shareResponse = await fetch(`/api/share/batch?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (shareResponse.ok) {
      const shareData = await shareResponse.json();
      // Stocker les codes de partage dans le dictionnaire
      for (const [correctionId, code] of Object.entries(shareData)) {
        shareCodes[Number(correctionId)] = code as string;
      }
    } else {
      console.warn('Impossible de récupérer les codes de partage en lot');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des codes de partage:', error);
  }
  
  return shareCodes;
}

/**
 * Crée un journal d'exportation PDF
 */
async function createExportLog(
  corrections: Partial<CorrectionAutreEnriched>[] | any[], 
  activityName: string, 
  subtitle: string, 
  activityId: number | null, 
  classId: number | null, 
  className: string,
  fileName: string,
  activeCorrections: Partial<CorrectionAutreEnriched>[] | any[],
  nonActiveCorrections: Partial<CorrectionAutreEnriched>[] | any[],
  pageNumber: number,
  groupName: string | null
) {
  try {
    // Récupérer l'utilisateur actuel depuis l'API
    const userResponse = await fetch('/api/auth/session');
    let userId = null;
    let username = null;
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      userId = userData?.user?.id;
      username = userData?.user?.username || userData?.user?.name;
    }
    
    // Collecter les IDs des corrections exportées
    const correctionIds = corrections
      .filter(c => c.id !== undefined)
      .map(c => c.id);
    
    // Créer l'entrée de log via l'API au lieu d'utiliser createLogEntry directement
    await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action_type: 'EXPORT_PDF_QR_CODES',
        description: `Export PDF des QR codes pour ${corrections.length} corrections - ${activityName} ${subtitle}`,
        entity_type: 'pdf_export',
        user_id: userId,
        username: username,
        metadata: {
          file_name: fileName,
          activity_id: activityId,
          activity_name: activityName,
          class_id: classId,
          class_name: className,
          corrections_count: corrections.length,
          active_count: activeCorrections.length,
          inactive_count: nonActiveCorrections.length,
          correction_ids: correctionIds,
          pages_count: pageNumber,
          group_name: groupName
        }
      })
    });
  } catch (logError) {
    // Ne pas bloquer l'exécution en cas d'erreur de journalisation
    console.error('Error creating log entry for PDF export:', logError);
  }
}

/**
 * Génère les en-têtes de la première page du PDF
 */
function generatePDFHeader(
  doc: jsPDF,
  activityName: string,
  subtitle: string,
  experimentalPoints: number | null,
  theoreticalPoints: number | null,
  statusText: string,
  nonActiveCorrections: Partial<CorrectionAutreEnriched>[] | any[]
) {
  // Titre principal (activité)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(activityName, 105, 20, { align: 'center' });
  
  // Sous-titre (classe et éventuellement groupe)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(subtitle, 105, 28, { align: 'center' });
  
  // Nombre de corrections
  doc.setFontSize(12);
  doc.text(statusText, 105, 33, { align: 'center' });
  
  // Ajouter une légende pour les corrections avec statut spécial si nécessaire
  if (nonActiveCorrections.length > 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(204, 102, 0); // Couleur orange warning
    doc.text("Les corrections avec statut spécial sont marquées avec leur statut", 105, 37, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Remettre la couleur noire
    doc.setFont('helvetica', 'normal');
  }
  
  // Afficher le barème expérimental et théorique si disponible
  if (experimentalPoints !== null || theoreticalPoints !== null) {
    doc.setFontSize(12);
    let baremeText = "Barème : ";
    
    if (experimentalPoints !== null) {
      baremeText += `${experimentalPoints} points expérimentaux`;
    }
    
    if (experimentalPoints !== null && theoreticalPoints !== null) {
      baremeText += " + ";
    }
    
    if (theoreticalPoints !== null) {
      baremeText += `${theoreticalPoints} points théoriques`;
    }
    
    doc.text(baremeText, 105, 47, { align: 'center' });
  }
}

/**
 * Génère les en-têtes des pages suivantes du PDF
 */
function generateSubsequentPageHeader(
  doc: jsPDF,
  activityName: string,
  subtitle: string,
  nonActiveCorrections: Partial<CorrectionAutreEnriched>[] | any[]
) {
  // Ajouter un en-tête à la nouvelle page
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(activityName, 105, 20, { align: 'center' });
  
  // Sous-titre sur les pages suivantes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(subtitle, 105, 28, { align: 'center' });
  
  // Ajouter une légende pour les corrections avec statut spécial sur chaque page
  if (nonActiveCorrections.length > 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(204, 102, 0); // Couleur orange warning
    doc.text("Les corrections avec statut spécial sont marquées avec leur statut", 105, 38, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Remettre la couleur noire
    doc.setFont('helvetica', 'normal');
  }
}

/**
 * Génère le PDF pour un sous-groupe spécifique de corrections
 * avec prise en compte du sous-arrangement
 */
async function generatePDFForGroup(
  doc: jsPDF,
  groupName: string,
  groupCorrections: Partial<CorrectionAutreEnriched>[] | any[],
  shareCodes: Record<number, string>,
  students: (Student | SimpleStudent)[],
  includeDetails: boolean,
  activities: ActivityAutre[],
  pageNumber: number,
  itemsPerRow: number,
  rowsPerPage: number,
  colPosition: number[],
  topMarginOtherPages: number,
  pageWidth: number,
  margin: number,
  qrSize: number,
  className: string,
  activityName: string,
  subArrangement: SubArrangementType
) {
  // Titre de la page pour ce groupe
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(activityName, 105, 20, { align: 'center' });
  
  // Sous-titre avec le nom du groupe
  let groupTitle;
  
  // Adapter le titre selon le type de sous-arrangement
  switch(subArrangement) {
    case 'subclass':
      groupTitle = `${className} - ${groupName}`;
      break;
    case 'activity':
      groupTitle = `${className} - ${groupName}`;
      break;
    case 'student':
      groupTitle = `${className} - ${groupName}`;
      break;
    default:
      groupTitle = `${className} - ${groupName}`;
  }
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(groupTitle, 105, 28, { align: 'center' });
  
  // Nombre de corrections dans ce groupe
  doc.setFontSize(12);
  doc.text(`${groupCorrections.length} corrections`, 105, 33, { align: 'center' });
  
  // Si le sous-arrangement est 'none', on affiche toutes les corrections directement
  if (subArrangement === 'none') {
    return await generateQRCodesForCorrections(
      doc,
      groupCorrections,
      shareCodes,
      students,
      includeDetails,
      activities,
      pageNumber,
      itemsPerRow,
      rowsPerPage,
      colPosition,
      topMarginOtherPages,
      qrSize
    );
  }
  
  // Organiser les corrections selon le sous-arrangement
  const organizedCorrections = organizeGroupBySubArrangement(
    groupCorrections,
    subArrangement,
    students,
    activities
  );
  
  // Si aucune organisation hiérarchique n'a été effectuée, traiter comme 'none'
  if (Array.isArray(organizedCorrections)) {
    return await generateQRCodesForCorrections(
      doc,
      organizedCorrections,
      shareCodes,
      students,
      includeDetails,
      activities,
      pageNumber,
      itemsPerRow,
      rowsPerPage,
      colPosition,
      topMarginOtherPages,
      qrSize
    );
  }
  
  // Traiter les corrections organisées par sous-groupes
  const subGroupKeys = Object.keys(organizedCorrections);
  
  // Trier les clés de sous-groupes si nécessaire
  const sortedSubGroupKeys = subGroupKeys.sort((a, b) => {
    // Si le format est "Groupe X", trier numériquement
    if (a.includes('Groupe') && b.includes('Groupe')) {
      const numA = parseInt(a.replace(/[^0-9]/g, ''));
      const numB = parseInt(b.replace(/[^0-9]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
    }
    // Sinon, trier alphabétiquement
    return a.localeCompare(b, 'fr', { sensitivity: 'base' });
  });
  
  let isFirstSubGroup = true;
  
  for (const subGroupKey of sortedSubGroupKeys) {
    const subGroupCorrections = organizedCorrections[subGroupKey];
    
    // Ajouter une page pour chaque sous-groupe, sauf le premier
    if (!isFirstSubGroup) {
      doc.addPage();
      pageNumber++;
    } else {
      isFirstSubGroup = false;
    }
    
    // Titre du sous-groupe
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    
    // Adapter le titre du sous-groupe selon le type
    let subGroupTitle;
    
    switch(subArrangement) {
      case 'activity':
        subGroupTitle = `Activité: ${subGroupKey}`;
        break;
      case 'student':
        subGroupTitle = `Étudiant: ${subGroupKey}`;
        break;
      case 'class':
        subGroupTitle = `Classe: ${subGroupKey}`;
        break;
      case 'subclass':
        subGroupTitle = `Sous-groupe: ${subGroupKey}`;
        break;
      default:
        subGroupTitle = subGroupKey;
    }
    
    doc.text(subGroupTitle, 105, 40, { align: 'center' });
    
    // Nombre de corrections dans ce sous-groupe
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`${subGroupCorrections.length} corrections`, 105, 46, { align: 'center' });
    
    // Générer les QR codes pour ce sous-groupe
    pageNumber = await generateQRCodesForCorrections(
      doc,
      subGroupCorrections,
      shareCodes,
      students,
      includeDetails,
      activities,
      pageNumber,
      itemsPerRow,
      rowsPerPage,
      colPosition,
      topMarginOtherPages + 15, // Ajuster pour le titre supplémentaire
      qrSize,
      true // Ne pas ajouter d'en-tête pour les sous-pages
    );
  }
  
  return pageNumber;
}

/**
 * Génère les QR codes pour une liste de corrections
 */
async function generateQRCodesForCorrections(
  doc: jsPDF,
  corrections: Partial<CorrectionAutreEnriched>[] | any[],
  shareCodes: Record<number, string>,
  students: (Student | SimpleStudent)[],
  includeDetails: boolean,
  activities: ActivityAutre[],
  startPageNumber: number,
  itemsPerRow: number,
  rowsPerPage: number,
  colPosition: number[],
  topMargin: number,
  qrSize: number,
  skipHeader: boolean = false
): Promise<number> {
  let pageNumber = startPageNumber;
  const itemsPerPage = itemsPerRow * rowsPerPage;
  
  for (let i = 0; i < corrections.length; i++) {
    // Calculer si une nouvelle page est nécessaire
    const isNewPage = i > 0 && i % itemsPerPage === 0;
    
    if (isNewPage) {
      doc.addPage();
      pageNumber++;
      
      // Ajouter un en-tête si nécessaire
      if (!skipHeader) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        // Ici, vous pouvez ajouter un en-tête spécifique si nécessaire
      }
    }
    
    const correction = corrections[i];
    
    // Vérifier si c'est une correction placeholder (sans QR code)
    const isPlaceholder = correction.placeholder === true || correction.noQRCode === true;
    
    // Déterminer le statut de la correction
    let correctionStatus = 'ACTIVE';
    let isActive = true;
    
    if (correction.status) {
      // Utiliser directement le statut s'il est défini
      correctionStatus = correction.status;
      isActive = correction.status === 'ACTIVE';
    } else if (correction.active === 0) {
      // Compatibilité avec l'ancien format
      correctionStatus = 'INACTIVE';
      isActive = false;
    }
    
    // Calculer les positions en fonction de la page et de l'item
    const positionInPage = i % itemsPerPage;
    const rowIndex = Math.floor(positionInPage / itemsPerRow);
    const colIndex = positionInPage % itemsPerRow;
    
    // Position X basée sur la colonne 
    const x = colPosition[colIndex] - qrSize/2; // Centrer sur la position de la colonne
    
    // Position Y pour les pages
    const y = topMargin + (rowIndex * (qrSize + 55));
    
    // Générer et ajouter QR code uniquement si ce n'est pas un placeholder
    let qrData = '';
    if (!isPlaceholder) {
      // Get share code for this correction
      let shareCode = correction.id && shareCodes[correction.id] 
        ? shareCodes[correction.id] 
        : `TEMP-${correction.id}`;
      
      // Generate QR code URL
      qrData = `${window.location.origin}/feedback/${shareCode}`;
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1
      });
      
      // Add QR code to PDF
      doc.addImage(qrCodeDataURL, 'PNG', x, y, qrSize, qrSize);
    }
    
    // Ajouter style visuel et informations pour cette correction
    addCorrectionStylingAndInfo(doc, correction as CorrectionAutreEnriched, isActive, correctionStatus, x, y, qrSize, qrData, students, includeDetails, activities);
  }
  
  return pageNumber;
}

/**
 * Génère des QR codes pour les corrections dans un PDF
 */
export async function generateQRCodePDF({
  corrections,
  group,
  onSuccess,
  students = [], // Valeur par défaut : tableau vide
  activities = [], // Valeur par défaut : tableau vide
  includeDetails = true, // Valeur par défaut : afficher les détails complets
  arrangement = 'class', // Valeur par défaut : organisation par classe
  subArrangement = 'student' // Valeur par défaut : sous-organisation par étudiant
}: QRCodePDFOptions): Promise<string | null> {
  try {
    if (!corrections || corrections.length === 0) {
      throw new Error('No corrections provided');
    }

    console.log('corrections', corrections);
    
    // Trier les corrections par nom d'étudiant
    let sortedCorrections = sortCorrectionsByStudentName(corrections, students);

    // Organiser les corrections selon l'arrangement et le sous-arrangement spécifiés
    let organizedData = organizeBySubArrangement(
      sortedCorrections,
      arrangement as ArrangementType,
      subArrangement as SubArrangementType,
      students,
      activities
    );

    console.log('arrangement', arrangement);
    console.log('subArrangement', subArrangement);

    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Récupérer les codes de partage pour toutes les corrections
    const shareCodes = await getShareCodes(corrections);
    
    // Récupérer les informations pertinentes
    const firstCorrection = corrections[0];
    const activityId = firstCorrection?.activity_id;
    const classId = firstCorrection?.class_id;
    
    // Utiliser l'activité spécifiée dans le groupe, sinon la récupérer depuis la liste des activités
    const activityName = group?.activity_name || getActivityName(activityId, activities);
    
    // Récupérer le nom de la classe à partir du premier élément des corrections
    const className = firstCorrection?.class_name || group?.name || 'Classe inconnue';
    
    // Récupérer les barèmes si disponibles
    const experimentalPoints = firstCorrection?.experimental_points || null;
    const theoreticalPoints = firstCorrection?.theoretical_points || null;
    
    // Sous-titre (classe et éventuellement groupe)
    let subtitle = className;
    
    // Ajouter le groupe au sous-titre si disponible
    if (group && group.name && group.name.includes('Groupe')) {
      subtitle += ` - ${group.name}`;
    } else if (firstCorrection?.sub_class) {
      subtitle += ` - Groupe ${firstCorrection.sub_class}`;
    }
    
    // Compter les corrections selon leur statut
    const activeCorrections = corrections.filter(c => c.status === 'ACTIVE' || (!c.status && c.active !== 0));
    const nonActiveCorrections = corrections.filter(c => c.status !== 'ACTIVE' && (c.status || c.active === 0));
    
    // Créer un texte de statut détaillé
    let statusText = `${corrections.length} corrections`;
    
    const statusCounts: Record<string, number> = {
      'NON_NOTE': 0,
      'ABSENT': 0,
      'NON_RENDU': 0,
      'DEACTIVATED': 0,
      'INACTIVE': 0  // Pour la rétrocompatibilité avec les anciennes corrections
    };
    
    // Compter chaque type de statut
    corrections.forEach(c => {
      if (c.status) {
        if (statusCounts[c.status] !== undefined) {
          statusCounts[c.status]++;
        }
      } else if (c.active === 0) {
        statusCounts['INACTIVE']++;
      }
    });
    
    // Ajouter les statuts non-actifs au texte de statut si présents
    if (nonActiveCorrections.length > 0) {
      const statusDetails = [];
      
      if (statusCounts['NON_NOTE'] > 0) statusDetails.push(`${statusCounts['NON_NOTE']} non notées`);
      if (statusCounts['ABSENT'] > 0) statusDetails.push(`${statusCounts['ABSENT']} absents`);
      if (statusCounts['NON_RENDU'] > 0) statusDetails.push(`${statusCounts['NON_RENDU']} non rendues`);
      if (statusCounts['DEACTIVATED'] > 0) statusDetails.push(`${statusCounts['DEACTIVATED']} désactivées`);
      if (statusCounts['INACTIVE'] > 0) statusDetails.push(`${statusCounts['INACTIVE']} inactives`);
      
      statusText += ` (dont ${statusDetails.join(', ')})`;
    }
    
    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20; // Augmentation de la marge pour laisser plus d'espace
    const qrSize = 35; // Taille des QR codes
    const itemsPerRow = 2; // 2 codes par ligne
    const rowsPerPage = 2; // 2 lignes par page
    const rowHeight = qrSize + 55; // QR code + espace pour le texte
    
    // Hauteur de l'en-tête sur la première page
    const headerHeight = nonActiveCorrections.length > 0 ? 80 : 75; // Ajuster si légende présente
    
    // Calcul de l'espace vertical disponible sur la première page
    const availableSpaceFirstPage = pageHeight - headerHeight - margin;
    
    // Calcul des positions horizontales des colonnes, symétriques par rapport aux marges
    // Pour 2 colonnes : 1/3 et 2/3 de l'espace disponible entre les marges
    const horizontalSpacing = (pageWidth - 2.5 * margin);
    const colPosition = [
      margin + horizontalSpacing / 5,               // Première colonne (1/5 de l'espace depuis la marge gauche)
      pageWidth - margin - horizontalSpacing / 5    // Deuxième colonne (1/5 de l'espace depuis la marge droite)
    ];
    
    // Calcul de l'espacement vertical pour la première page
    // Pour centrer les lignes dans l'espace disponible
    const topMarginFirstPage = headerHeight + (availableSpaceFirstPage - (rowsPerPage * rowHeight)) / 2;
    
    // Espacement vertical pour les pages suivantes
    const topMarginOtherPages = margin + (pageHeight - 1*margin - (rowsPerPage * rowHeight)) / 2;
    
    let pageNumber = 1;
    
    // Appliquer l'en-tête pour la première page
    generatePDFHeader(doc, activityName, subtitle, experimentalPoints, theoreticalPoints, statusText, nonActiveCorrections);
    
    // Ajouter une nouvelle page après l'en-tête
    doc.addPage();
    pageNumber++;
    
    // Génération du PDF selon le type d'arrangement
    if (typeof organizedData === 'object' && !Array.isArray(organizedData)) {
      // Traitement structuré par cas pour les données hiérarchiques
      const groupKeys = Object.keys(organizedData);
      
      // Trier les clés de groupes si nécessaire (par exemple, pour les sous-classes "Groupe 1", "Groupe 2", etc.)
      const sortedGroupKeys = groupKeys.sort((a, b) => {
        // Si le format est "Groupe X", trier numériquement
        const numA = parseInt(a.replace(/[^0-9]/g, ''));
        const numB = parseInt(b.replace(/[^0-9]/g, ''));
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        // Sinon, trier alphabétiquement
        return a.localeCompare(b, 'fr', { sensitivity: 'base' });
      });
      
      for (let groupIndex = 0; groupIndex < sortedGroupKeys.length; groupIndex++) {
        const groupName = sortedGroupKeys[groupIndex];
        const groupCorrections = organizedData[groupName];
        
        // Si ce n'est pas le premier groupe, ajouter une nouvelle page
        if (groupIndex > 0) {
          doc.addPage();
          pageNumber++;
        }
        
        // Génération du PDF pour ce groupe spécifique
        pageNumber = await generatePDFForGroup(
          doc,
          groupName,
          groupCorrections,
          shareCodes,
          students,
          includeDetails,
          activities,
          pageNumber,
          itemsPerRow,
          rowsPerPage,
          colPosition,
          topMarginOtherPages,
          pageWidth,
          margin,
          qrSize,
          className,
          activityName,
          subArrangement as SubArrangementType
        );
      }
    } else {
      // Traitement standard pour les données non hiérarchiques (tableau simple)
      const correctionsList = sortedCorrections;
      
      const itemsPerPage = itemsPerRow * rowsPerPage;
      
      for (let i = 0; i < correctionsList.length; i++) {
        // Calculer la position sur la page
        const isNewPage = i > 0 && i % itemsPerPage === 0;
        
        if (isNewPage) {
          doc.addPage();
          pageNumber++;
          
          // Ajouter un en-tête aux pages suivantes
          generateSubsequentPageHeader(doc, activityName, subtitle, nonActiveCorrections);
        }
        
        const correction = correctionsList[i];
        
        // Déterminer le statut de la correction
        let correctionStatus = 'ACTIVE';
        let isActive = true;
        
        if (correction.status) {
          // Utiliser directement le statut s'il est défini
          correctionStatus = correction.status;
          isActive = correction.status === 'ACTIVE';
        } else if (correction.active === 0) {
          // Compatibilité avec l'ancien format
          correctionStatus = 'INACTIVE';
          isActive = false;
        }
        
        // Get share code for this correction
        let shareCode = correction.id && shareCodes[correction.id] 
          ? shareCodes[correction.id] 
          : `TEMP-${correction.id}`;
        
        // Generate QR code URL
        const qrData = `${window.location.origin}/feedback/${shareCode}`;
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 1
        });
        
        // Calculer les positions en fonction de la page et de l'item
        const pageOffset = Math.floor(i / itemsPerPage) * itemsPerPage;
        const positionInPage = i - pageOffset;
        const rowIndex = Math.floor(positionInPage / itemsPerRow);
        const colIndex = positionInPage % itemsPerRow;
        
        // Position X basée sur la colonne 
        const x = colPosition[colIndex] - qrSize/2; // Centrer sur la position de la colonne
        
        // Position Y basée sur la ligne et la page
        let y = topMarginOtherPages + (rowIndex * rowHeight);
        
        // Add QR code to PDF
        doc.addImage(qrCodeDataURL, 'PNG', x, y, qrSize, qrSize);
        
        // Ajouter style visuel et informations pour cette correction
        addCorrectionStylingAndInfo(doc, correction as CorrectionAutreEnriched, isActive, correctionStatus, x, y, qrSize, qrData, students, includeDetails, activities);
      }
    }
    
    // Add page numbers in French
    for (let i = 0; i < pageNumber; i++) {
      doc.setPage(i + 1);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Page ${i + 1} sur ${pageNumber}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }
    
    // Save PDF with appropriate filename
    const sanitizedActivityName = activityName.replace(/\s+/g, '_');
    const sanitizedClassName = className.replace(/\s+/g, '_');
    const fileName = `${sanitizedActivityName}_${sanitizedClassName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    // Créer un log pour l'export
    await createExportLog(
      corrections,
      activityName,
      subtitle,
      activityId,
      classId,
      className,
      fileName,
      activeCorrections,
      nonActiveCorrections,
      pageNumber,
      group?.name || null
    );
    
    // Pour le callback onSuccess, créer un nouvel array avec les shareCode ajoutés
    // seulement si le callback est fourni
    if (onSuccess && typeof onSuccess === 'function') {
      // Créer une copie profonde des corrections avec les codes de partage
      const updatedCorrectionsWithShareCodes = corrections.map(correction => {
        if (correction.id && shareCodes[correction.id]) {
          // Utiliser une assertion de type pour éviter l'erreur TypeScript
          return {
            ...correction,
            shareCode: shareCodes[correction.id]
          } as CorrectionAutreEnriched & { shareCode: string };
        }
        return correction;
      });
      
      onSuccess(updatedCorrectionsWithShareCodes as any);
    }
    
    return fileName;
  } catch (error) {
    console.error('Error generating QR code PDF:', error);
    return null;
  }
}