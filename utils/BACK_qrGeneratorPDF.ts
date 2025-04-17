import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Correction, Student, CorrectionWithShareCode } from '@/lib/types';
import {CellStyle } from '@/components/pdf/types';
import { ActivityAutre } from '@/lib/types';
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
  corrections: Partial<Correction>[] | any[]; // Pour accepter les deux types de correction
  group: { name: string; activity_name?: string } | null;
  // generateShareCode?: (correctionId: string | number) => Promise<{ isNew: boolean; code: string }>;
  // getExistingShareCode?: (correctionId: string | number) => Promise<{ exists: boolean; code?: string }>;
  onSuccess?: (updatedCorrections: CorrectionWithShareCode[]) => void;
  students?: (Student | SimpleStudent)[]; // Accepte les deux formats d'étudiants
  activities?: ActivityAutre[]; // Ajouter un tableau d'activités optionnel
  includeDetails?: boolean; // Nouvelle option pour contrôler l'affichage des détails
  arrangement?: string; // Type d'arrangement (class, student, activity, subclass)
  subArrangement?: string; // Sous-arrangement (student, activity, class, subclass, none)
  groupedData?: any; // Données déjà organisées selon l'arrangement choisi
}

/**
 * Trie un tableau de corrections par nom d'étudiant (ordre alphabétique)
 * @param corrections Tableau de corrections à trier
 * @param students Liste des étudiants pour récupérer les noms complets
 * @returns Tableau de corrections triées par nom d'étudiant
 */
function sortCorrectionsByStudentName(
  corrections: Partial<Correction>[] | any[],
  students: (Student | SimpleStudent)[]
): Partial<Correction>[] | any[] {
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
  corrections: Partial<Correction>[] | any[],
  arrangement: string = 'class',
  subArrangement: string = 'student',
  students: (Student | SimpleStudent)[] = [],
  activities: Activity[] = []
): any {
  // Cas où aucune sous-organisation n'est nécessaire
  if (subArrangement === 'none' || subArrangement === '') {
    return sortCorrectionsByStudentName(corrections, students);
  }
  
  // Vérifier d'abord l'arrangement principal
  switch (arrangement) {
    case 'sub_class': 
      // Organisation principale par sous-classe (groupe)
      const resultBySubClass: Record<string, Partial<Correction>[] | any[]> = {};
      
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
      const resultByActivity: Record<string, Partial<Correction>[] | any[]> = {};
      
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
        const result: Record<string, Partial<Correction>[] | any[]> = {};
        
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
        const result: Record<string, Partial<Correction>[] | any[]> = {};
        
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

// Fonction utilitaire pour récupérer le nom d'une vité
function getActivityName(activityId: number | null, activities: Activity[]): string {
  if (!activityId) return 'Activité inconnue';
  const activity = activities.find(a => a.id === activityId);
  if (!activity) return `Activité ${activityId}`;
  return activity.name;
}

export async function generateQRCodePDF({
  corrections,
  group,
  //generateShareCode,
  //getExistingShareCode,
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

    
    
    // Trier les corrections par nom d'étudiant
    let sortedCorrections = sortCorrectionsByStudentName(corrections, students);

    // Organiser les corrections selon l'arrangement et le sous-arrangement spécifiés
    let organizedData = organizeBySubArrangement(
      sortedCorrections,
      arrangement,
      subArrangement,
      students,
      activities
    );

    
    

    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Créer un dictionnaire des codes de partage pour chaque correction
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
        
        if (response.ok) {
          
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
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    let subtitle = className;
    
    // Ajouter le groupe au sous-titre si disponible
    if (group && group.name && group.name.includes('Groupe')) {
      subtitle += ` - ${group.name}`;
    } else if (firstCorrection?.sub_class) {
      subtitle += ` - Groupe ${firstCorrection.sub_class}`;
    }
    
    doc.text(subtitle, 105, 28, { align: 'center' });
    
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
    
    // Date et nombre de corrections
    doc.setFontSize(12);
    const formattedDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    // doc.text(`${formattedDate}`, 105, 42, { align: 'center' });
    
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
    
    // Gérer les différents types d'organisation des données
    let alreadyProcessed = false;
    
    // Si nous avons des données organisées sous forme de structure hiérarchique (objet avec sous-groupes)
    if (typeof organizedData === 'object' && !Array.isArray(organizedData)) {
      alreadyProcessed = true;
      
      // Traiter chaque sous-groupe séparément
      let groupKeys = Object.keys(organizedData);
      
      // Trier les clés de groupes si nécessaire (par exemple, pour les sous-classes "Groupe 1", "Groupe 2", etc.)
      if (subArrangement === 'subclass') {
        groupKeys = groupKeys.sort((a, b) => {
          // Si le format est "Groupe X", trier numériquement
          const numA = parseInt(a.replace(/[^0-9]/g, ''));
          const numB = parseInt(b.replace(/[^0-9]/g, ''));
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          // Sinon, trier alphabétiquement
          return a.localeCompare(b, 'fr', { sensitivity: 'base' });
        });
      }
      
      for (let groupIndex = 0; groupIndex < groupKeys.length; groupIndex++) {
        const groupName = groupKeys[groupIndex];
        const groupCorrections = organizedData[groupName];
        
        // Si ce n'est pas le premier groupe, ajouter une nouvelle page
        if (groupIndex > 0) {
          doc.addPage();
          pageNumber++;
        }
        
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
            groupTitle = `${className} - Activité: ${groupName}`;
            break;
          case 'student':
            groupTitle = `${className} - ${groupName}`;
            break;
          default:
            groupTitle = `${className} - ${groupName}`;
        }
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.text(groupTitle, 105, 58, { align: 'center' });
        
        // Nombre de corrections dans ce groupe
        doc.setFontSize(12);
        doc.text(`${groupCorrections.length} corrections`, 105, 62, { align: 'center' });
        
        // Générer les QR codes pour ce groupe
        for (let i = 0; i < groupCorrections.length; i++) {
          // Calculer la position sur la page
          const itemsPerPage = itemsPerRow * rowsPerPage;
          const isNewPage = i > 0 && i % itemsPerPage === 0;
          
          if (isNewPage) {
            doc.addPage();
            pageNumber++;
            
            // Add header to new page
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text(activityName, 105, 20, { align: 'center' });
            
            // Sous-titre sur les pages suivantes
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.text(groupTitle, 105, 28, { align: 'center' });
          }
          
          const correction = groupCorrections[i];
          
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
          const positionInPage = i % itemsPerPage;
          const rowIndex = Math.floor(positionInPage / itemsPerRow);
          const colIndex = positionInPage % itemsPerRow;
          
          // Position X basée sur la colonne 
          const x = colPosition[colIndex] - qrSize/2; // Centrer sur la position de la colonne
          
          // Position Y pour les pages du groupe
          const y = topMarginOtherPages + (rowIndex * rowHeight);
          
          // Add QR code to PDF
          doc.addImage(qrCodeDataURL, 'PNG', x, y, qrSize, qrSize);
          
          // Ajouter style visuel et informations pour cette correction
          addCorrectionStylingAndInfo(doc, correction, isActive, correctionStatus, x, y, qrSize, qrData, students, includeDetails);
        }
      }
    }
    
    // Si les données n'ont pas déjà été traitées, utiliser la liste triée standard
    if (!alreadyProcessed) {
      // Pour les arrangements standards, génère les QR codes pour chaque correction
      const correctionsList = sortedCorrections;
      
      for (let i = 0; i < correctionsList.length; i++) {
        // Calculer la position sur la page
        const itemsPerPage = itemsPerRow * rowsPerPage;
        const isNewPage = i > 0 && i % itemsPerPage === 0;
        
        if (isNewPage) {
          doc.addPage();
          pageNumber++;
          
          // Add header to new page
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
        let y;
        if (pageNumber === 1) {
          // Pour la première page, utiliser le centrage spécifique
          y = topMarginFirstPage + (rowIndex * rowHeight);
        } else {
          // Pour les pages suivantes
          y = topMarginOtherPages + (rowIndex * rowHeight);
        }
        
        // Add QR code to PDF
        doc.addImage(qrCodeDataURL, 'PNG', x, y, qrSize, qrSize);
        
        // Ajouter style visuel et informations pour cette correction
        addCorrectionStylingAndInfo(doc, correction, isActive, correctionStatus, x, y, qrSize, qrData, students, includeDetails);
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
    
    // Enregistrer un log pour l'export PDF
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
            group_name: group?.name || null
          }
        })
      });
    } catch (logError) {
      // Ne pas bloquer l'exécution en cas d'erreur de journalisation
      console.error('Error creating log entry for PDF export:', logError);
    }
    
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
          } as Correction & { shareCode: string };
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

/**
 * Ajoute le style et les informations pour une correction spécifique près de son QR code
 */
function addCorrectionStylingAndInfo(
  doc: jsPDF, 
  correction: Correction, 
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
  
  // Ajouter le nom de l'étudiant sous le QR code
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  
  // Récupérer le nom de l'étudiant depuis la correction ou depuis la liste des étudiants
  let studentName;
  
  if (correction.student_id) {
    // Chercher le nom de l'étudiant dans la liste fournie
    const student = students.find(s => s.id === correction.student_id);
    studentName = student ? getStudentFullName(correction.student_id, students, includeDetails) : `ID: ${correction.student_id}`;
  } else {
    studentName = 'Étudiant inconnu';
  }
  
  // Position du texte (centré sous le QR code)
  const textX = x + qrSize / 2;
  const textY = y + qrSize + 8;
  
  // Ajouter le nom de l'étudiant
  doc.text(studentName, textX, textY, { align: 'center' });
  
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
    
    // ID de correction
    if (correction.id) {
      doc.text(`ID: ${correction.id}`, textX, textY + (isActive ? 6 : 12), { align: 'center' });
    }
    
    // Note si disponible
    if (correction.grade !== undefined && correction.grade !== null) {
      const gradeY = textY + (isActive ? 11 : 17);
      
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
        gradeText += `/ ${points}`;
      }
      
      doc.text(gradeText, textX, gradeY, { align: 'center' });
    }
    
    // URL encodée dans le QR code (en très petit)
    doc.setFontSize(6);
    doc.text(qrData.substring(0, 25) + '...', textX, textY + (isActive ? (correction.grade !== undefined ? 16 : 11) : (correction.grade !== undefined ? 22 : 17)), { align: 'center' });
  }
}
