import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Correction, Student } from '@/lib/types';

// Ajout d'une interface pour les activités
interface Activity {
  id: number;
  name: string;
}

// Define the options type for the function
interface QRCodePDFOptions {
  corrections: Correction[];
  group: { name: string; activity_name?: string } | null;
  generateShareCode: (correctionId: string) => Promise<{ isNew: boolean; code: string }>;
  getExistingShareCode: (correctionId: string) => Promise<{ exists: boolean; code?: string }>;
  onSuccess?: (updatedCorrections: Correction[]) => void;
  students?: Student[]; // Ajouter un tableau d'étudiants optionnel
  activities?: Activity[]; // Ajouter un tableau d'activités optionnel
}

// Fonction utilitaire pour récupérer le nom complet d'un étudiant
function getStudentFullName(studentId: number | null, students: Student[]): string {
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
    
    // Title and header
    const groupName = group?.name || 'Group';
    
    // Utiliser la fonction getActivityName pour récupérer le nom de l'activité
    const firstCorrection = corrections[0];
    const activityId = firstCorrection?.activity_id;
    // Utiliser l'activité spécifiée dans le groupe, sinon la récupérer depuis la liste des activités
    const activityName = group?.activity_name || getActivityName(activityId, activities);
    
    const title = `${activityName} - ${groupName}`;
    const date = new Date().toLocaleDateString('fr-FR');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(title, 105, 20, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Generated on ${date}`, 105, 28, { align: 'center' });
    doc.text(`${corrections.length} corrections`, 105, 34, { align: 'center' });
    
    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const qrSize = 40; // in mm
    const itemsPerRow = 2;
    const rowHeight = qrSize + 30; // QR code + text space
    
    let x = margin;
    let y = 50; // Starting position after header
    let pageNumber = 1;
    
    // Generate QR codes for each correction
    for (let i = 0; i < corrections.length; i++) {
      const correction = corrections[i];
      
      // If this QR code won't fit on the page, start a new page
      if (y + rowHeight > pageHeight - margin) {
        doc.addPage();
        pageNumber++;
        y = margin + 15; // Reset y position for the new page
        
        // Add header to new page
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`${title} (continued)`, 105, 20, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }
      
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
      
      // Calculate position
      x = margin + (i % itemsPerRow) * ((pageWidth - margin * 2) / itemsPerRow);
      
      // Add QR code to PDF
      doc.addImage(qrCodeDataURL, 'PNG', x, y, qrSize, qrSize);
      
      // Add text below QR code
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      
      // Récupérer le nom de l'étudiant à partir de son ID et de la liste des étudiants
      // Utiliser student_name si disponible, sinon calculer le nom depuis les données étudiants
      const studentName = getStudentFullName(correction.student_id, students);
      
      doc.text(studentName, x + qrSize / 2, y + qrSize + 10, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(shareCode, x + qrSize / 2, y + qrSize + 18, { align: 'center' });
      
      // Add grade if available
      if (correction.grade !== null && correction.grade !== undefined) {
        doc.setFontSize(11);
        doc.text(`Note: ${correction.grade}/20`, x + qrSize / 2, y + qrSize + 25, { align: 'center' });
      }
      
      // Move to next row if needed
      if ((i + 1) % itemsPerRow === 0) {
        y += rowHeight;
      }
    }
    
    // Add page numbers
    for (let i = 0; i < pageNumber; i++) {
      doc.setPage(i + 1);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Page ${i + 1} of ${pageNumber}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }
    
    // Save PDF
    const fileName = `${groupName.replace(/\s+/g, '_')}_QRCodes_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
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
