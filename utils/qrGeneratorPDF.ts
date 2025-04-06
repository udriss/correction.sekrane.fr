import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Correction, Student, CorrectionWithShareCode } from '@/lib/types';
import { createLogEntry } from '@/lib/services/logsService';

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
  generateShareCode: (correctionId: string | number) => Promise<{ isNew: boolean; code: string }>;
  getExistingShareCode: (correctionId: string | number) => Promise<{ exists: boolean; code?: string }>;
  onSuccess?: (updatedCorrections: CorrectionWithShareCode[]) => void;
  students?: (Student | SimpleStudent)[]; // Accepte les deux formats d'étudiants
  activities?: Activity[]; // Ajouter un tableau d'activités optionnel
}

// Fonction utilitaire pour récupérer le nom complet d'un étudiant
function getStudentFullName(studentId: number | null, students: (Student | SimpleStudent)[]): string {
  if (!studentId) return 'Sans nom';
  const student = students.find(s => s.id === studentId);
  if (!student) return 'Sans nom';
  return `${student.first_name} ${student.last_name}`;
}

// Fonction utilitaire pour récupérer le nom d'une activité
function getActivityName(activityId: number | null, activities: Activity[]): string {
  if (!activityId) return 'Activité inconnue';
  const activity = activities.find(a => a.id === activityId);
  if (!activity) return `Activité ${activityId}`;
  return activity.name;
}

export async function generateQRCodePDF({
  corrections,
  group,
  generateShareCode,
  getExistingShareCode,
  onSuccess,
  students = [], // Valeur par défaut : tableau vide
  activities = [] // Valeur par défaut : tableau vide
}: QRCodePDFOptions): Promise<string | null> {
  try {
    if (!corrections || corrections.length === 0) {
      throw new Error('No corrections provided');
    }

    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Créer un dictionnaire des codes de partage pour chaque correction
    // au lieu de modifier directement les objets corrections
    const shareCodes: Record<number, string> = {};
    
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
    
    // Titre principal (uniquement le nom de l'activité)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(activityName, 105, 20, { align: 'center' });
    
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
      
      doc.text(baremeText, 105, 35, { align: 'center' });
    }
    
    // Date et nombre de corrections
    doc.setFontSize(12);
    const formattedDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`${formattedDate}`, 105, 42, { align: 'center' });
    doc.text(`${corrections.length} corrections`, 105, 48, { align: 'center' });
    
    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20; // Augmentation de la marge pour laisser plus d'espace
    const qrSize = 35; // Taille des QR codes
    const itemsPerRow = 2; // 2 codes par ligne
    const rowsPerPage = 2; // 2 lignes par page
    const rowHeight = qrSize + 55; // QR code + espace pour le texte
    
    // Hauteur de l'en-tête sur la première page
    const headerHeight = 75;
    
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
    
    // Generate QR codes for each correction
    for (let i = 0; i < corrections.length; i++) {
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
      }
      
      const correction = corrections[i];
      
      // Get share code for this correction
      let shareCode;
      
      try {
        // Appel à l'API pour vérifier si un code de partage existe déjà
        const existingShareResponse = await fetch(`/api/corrections/${correction.id}/share`);
        const existingShareData = await existingShareResponse.json();
        
        if (existingShareData.exists && existingShareData.code) {
          // Un code existe déjà, l'utiliser
          shareCode = existingShareData.code;
        } else {
          // Aucun code existant, en générer un nouveau via l'API
          const generateResponse = await fetch(`/api/corrections/${correction.id}/share`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!generateResponse.ok) {
            throw new Error(`Impossible de générer un code de partage pour la correction ${correction.id}`);
          }
          
          const result = await generateResponse.json();
          shareCode = result.code;
        }
      } catch (error) {
        console.error(`Erreur lors de la gestion du code de partage pour la correction ${correction.id}:`, error);
        shareCode = `ERROR-${correction.id}`;
      }
      
      // Stocker le code dans notre dictionnaire au lieu de modifier l'objet correction
      if (correction.id) {
        shareCodes[correction.id] = shareCode;
      }
      
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
      
      // Add text below QR code
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      
      // Récupérer le nom de l'étudiant à partir de son ID et de la liste des étudiants
      const studentName = getStudentFullName(correction.student_id, students);
      
      doc.text(studentName, x + qrSize / 2, y + qrSize + 10, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Remove http://, https://, and www. prefixes from qrData for display
      const displayUrl = qrData.replace(/^(https?:\/\/)?(www\.)?/i, '');
      doc.text(displayUrl, x + qrSize / 2, y + qrSize + 18, { align: 'center' });
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
      
      // Créer l'entrée de log
      await createLogEntry({
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
          correction_ids: correctionIds,
          pages_count: pageNumber,
          group_name: group?.name || null
        }
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
