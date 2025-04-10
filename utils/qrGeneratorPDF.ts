import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Correction, Student, CorrectionWithShareCode } from '@/lib/types';

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
    
    // Compter les corrections actives et inactives
    const activeCorrections = corrections.filter(c => c.active !== 0);
    const inactiveCorrections = corrections.filter(c => c.active === 0);
    let statusText = `${corrections.length} corrections`;
    if (inactiveCorrections.length > 0) {
      statusText += ` (dont ${inactiveCorrections.length} inactives)`;
    }
    doc.text(statusText, 105, 48, { align: 'center' });
    
    // Ajouter une légende pour les corrections inactives si nécessaire
    if (inactiveCorrections.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(204, 102, 0); // Couleur orange warning
      doc.text("Les corrections inactives sont marquées \"INACTIVE\"", 105, 55, { align: 'center' });
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
    const headerHeight = inactiveCorrections.length > 0 ? 80 : 75; // Ajuster si légende présente
    
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
        
        // Ajouter une légende pour les corrections inactives sur chaque page si nécessaire
        if (inactiveCorrections.length > 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(10);
          doc.setTextColor(204, 102, 0); // Couleur orange warning
          doc.text("Les corrections inactives sont marquées \"INACTIVE\"", 105, 38, { align: 'center' });
          doc.setTextColor(0, 0, 0); // Remettre la couleur noire
          doc.setFont('helvetica', 'normal');
        }
      }
      
      const correction = corrections[i];
      const isActive = correction.active !== 0; // Considérer la correction comme active par défaut
      
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
      
      // Pour les corrections inactives, ajouter un badge distinctif
      if (!isActive) {
        // Ajouter un fond orange clair transparent
        doc.setFillColor(255, 233, 204); // Fond orange très clair
        doc.roundedRect(x - 2, y - 2, qrSize + 4, qrSize + 4, 2, 2, 'F');
        
        // Ajouter une bordure orange
        doc.setDrawColor(204, 102, 0); // Couleur orange warning
        doc.setLineWidth(0.5);
        doc.roundedRect(x - 2, y - 2, qrSize + 4, qrSize + 4, 2, 2, 'S');
        
        // Ajouter un badge "INACTIVE"
        const badgeWidth = 30;
        const badgeHeight = 8;
        
        // Position du badge en bas à droite du QR code
        const badgeX = x + qrSize - badgeWidth + 2;
        const badgeY = y + qrSize - badgeHeight + 2;
        
        // Dessiner le badge
        doc.setFillColor(204, 102, 0); // Couleur orange warning
        doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F');
        
        // Ajouter le texte "INACTIVE"
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255); // Texte blanc
        doc.text("INACTIVE", badgeX + badgeWidth/2, badgeY + badgeHeight/2 + 1, { align: 'center', baseline: 'middle' });
        
        // Remettre les couleurs par défaut
        doc.setDrawColor(0, 0, 0);
        doc.setTextColor(0, 0, 0);
      }
      
      // Add text below QR code
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      
      // Récupérer le nom de l'étudiant à partir de son ID et de la liste des étudiants
      const studentName = getStudentFullName(correction.student_id, students);
      
      // Ajouter une indication visuelle pour les corrections inactives dans le nom
      if (!isActive) {
        doc.setTextColor(204, 102, 0); // Couleur orange warning
      }
      
      doc.text(studentName, x + qrSize / 2, y + qrSize + 10, { align: 'center' });
      
      // Remettre la couleur de texte normale
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Remove http://, https://, and www. prefixes from qrData for display
      const displayUrl = qrData.replace(/^(https?:\/\/)?(www\.)?/i, '');
      doc.text(displayUrl, x + qrSize / 2, y + qrSize + 18, { align: 'center' });
      
      // Afficher la note pour les corrections actives
      if (isActive && correction.grade !== undefined) {
        const grade = typeof correction.grade === 'number' ? correction.grade.toFixed(1) : correction.grade;
        doc.setFont('helvetica', 'bold');
        
        // Choisir la couleur en fonction de la note
        if (parseFloat(grade) >= 14) {
          doc.setTextColor(46, 125, 50); // Vert pour les bonnes notes
        } else if (parseFloat(grade) >= 10) {
          doc.setTextColor(25, 118, 210); // Bleu pour les notes moyennes
        } else {
          doc.setTextColor(211, 47, 47); // Rouge pour les notes basses
        }
        
        doc.text(`Note: ${grade}/20`, x + qrSize / 2, y + qrSize + 25, { align: 'center' });
        doc.setTextColor(0, 0, 0); // Remettre la couleur noire
        doc.setFont('helvetica', 'normal');
      } else if (!isActive) {
        // Pour les corrections inactives, afficher un message
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(204, 102, 0); // Couleur orange warning
        doc.text("Correction inactive", x + qrSize / 2, y + qrSize + 25, { align: 'center' });
        doc.setTextColor(0, 0, 0); // Remettre la couleur noire
        doc.setFont('helvetica', 'normal');
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
            inactive_count: inactiveCorrections.length,
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
