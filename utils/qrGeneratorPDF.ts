import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Correction } from '@/lib/types';
import { svg2pdf } from 'svg2pdf.js';

interface Group {
  name?: string;
  activity_name?: string;
  description?: string;
  [key: string]: any;
}

interface Activity {
  id?: number;
  name?: string;
  description?: string;
  experimental_points?: number;
  theoretical_points?: number;
  [key: string]: any;
}

interface GeneratePdfOptions {
  corrections: Correction[];
  group: Group | null;
  activity?: Activity | null;
  generateShareCode: (correctionId: string) => Promise<{ code?: string }>;
  getExistingShareCode: (correctionId: string) => Promise<{ exists: boolean; code?: string }>;
  onSuccess?: (updatedCorrections: Correction[]) => void;
}

/**
 * Génère un QR Code haute résolution en PNG
 * @param url URL à encoder dans le QR code
 * @returns Promise avec l'URL de données du QR code en PNG
 */
async function generateHighResQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 1000,          // Largeur élevée pour une meilleure qualité
    margin: 2,            // Marge pour la lisibilité
    scale: 8,             // Échelle élevée pour une meilleure netteté
    errorCorrectionLevel: 'H', // Niveau élevé de correction d'erreur pour une meilleure lecture
    color: {
      dark: '#000000',    // Noir pour un contraste maximal
      light: '#ffffff'    // Blanc pur pour le fond
    }
  });
}

/**
 * Génère un PDF avec des QR codes haute résolution pour chaque étudiant
 */
export async function generateQRCodePDF({
  corrections,
  group,
  activity,
  generateShareCode,
  getExistingShareCode,
  onSuccess
}: GeneratePdfOptions): Promise<string | null> {
  try {
    const doc = new jsPDF();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://correction.sekrane.fr';
    
    // Dimensions de la page
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;
    
    // --- PAGE DE GARDE ---
    
    // En-tête avec date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleDateString()}`, pageWidth - margin, margin, { align: "right" });
    
    // Titre du document
    yPosition = 60;
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("FEEDBACK ÉTUDIANTS", pageWidth / 2, yPosition, { align: "center" });
    
    // Titre du groupe
    yPosition += 20;
    doc.setFontSize(18);
    doc.text(`${group?.name || "Groupe de corrections"}`, pageWidth / 2, yPosition, { align: "center" });
    
    // Encadré d'informations
    yPosition += 40;
    const infoBoxWidth = pageWidth - (margin * 2);
    const infoBoxHeight = 120;
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, yPosition, infoBoxWidth, infoBoxHeight, 5, 5, 'FD');
    
    // Informations sur l'activité
    yPosition += 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Détails de l'activité", pageWidth / 2, yPosition, { align: "center" });
    
    // Nom de l'activité
    yPosition += 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Activité :", margin + 5, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(activity?.name || group?.activity_name || "Non spécifiée", margin + 70, yPosition);
    
    // Points 
    yPosition += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Points :", margin + 5, yPosition);
    doc.setFont("helvetica", "normal");
  
    // Calculer les points totaux
    const expPoints = activity?.experimental_points || 
                      corrections[0]?.experimental_points || NaN;
    const theoPoints = activity?.theoretical_points || 
                       corrections[0]?.theoretical_points || NaN;
    const totalPoints = expPoints + theoPoints;
                     
    doc.text(`${expPoints} expérimentaux + ${theoPoints} théoriques = ${totalPoints} points`, margin + 70, yPosition);
    
    // Informations sur le nombre d'étudiants
    yPosition += 10;
    doc.setFont("helvetica", "normal");
    doc.text("Nombre d'étudiants :", margin + 5, yPosition);
    doc.text(`${corrections.length}`, margin + 70, yPosition);
    

    
    // Description de l'activité
    yPosition += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Description :", margin + 5, yPosition);
    
    // Ajouter la description avec gestion du texte long
    const description = activity?.description || 
                        group?.description || 
                        "Aucune description disponible.";
    
                        
    doc.setFont("helvetica", "normal");
    
    // Traitement du texte long avec retour à la ligne automatique
    const splitDescription = doc.splitTextToSize(description, infoBoxWidth - 80);
    doc.text(splitDescription, margin + 70, yPosition);
    
    // Pied de page avec instructions
    yPosition = pageHeight - 50;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text("Ce document contient des QR codes personnalisés pour chaque étudiant.", pageWidth / 2, yPosition, { align: "center" });
    
    yPosition += 10;
    doc.text("Chaque page suivante doit être distribuée individuellement à l'étudiant concerné.", pageWidth / 2, yPosition, { align: "center" });
    

    // Liste mise à jour des corrections avec leurs codes de partage
    const updatedCorrections = [...corrections];
    
    // --- PAGES POUR CHAQUE ÉTUDIANT ---
    
    // Taille et position fixe pour les QR codes
    const qrSize = 150;  // Taille plus grande pour une meilleure lisibilité
    const qrX = (pageWidth - qrSize) / 2; // Centré horizontalement
    
    // Générer une page pour chaque étudiant
    for (let i = 0; i < corrections.length; i++) {
      const correction = updatedCorrections[i];
      
      // Ajouter une nouvelle page pour chaque étudiant
      doc.addPage();
      
      // En-tête de la page
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(70, 70, 70);
      doc.text(`${group?.name || "Groupe de corrections"}`, pageWidth / 2, margin + 10, { align: "center" });
      
      // Nom de l'activité
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Activité: ${activity?.name || group?.activity_name || ""}`, pageWidth / 2, margin + 25, { align: "center" });
      
      // Séparateur
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, margin + 35, pageWidth - margin, margin + 35);
      
      // Nom de l'étudiant
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(correction.student_name || "Nom indisponible", pageWidth / 2, margin + 55, { align: "center" });
      
      // Message d'introduction
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Scannez ce code pour accéder à votre feedback personnalisé", pageWidth / 2, margin + 75, { align: "center" });
      
      // Vérifier ou générer un code de partage
      let shareCode = (correction as any).shareCode;
      if (!shareCode) {
        // Vérifier d'abord s'il existe un code
        const existingShareCheck = await getExistingShareCode(String(correction.id));
        
        if (existingShareCheck.exists && existingShareCheck.code) {
          shareCode = existingShareCheck.code;
        } else {
          // Sinon, générer un nouveau code
          const shareResult = await generateShareCode(String(correction.id));
          if (!shareResult.code) {
            throw new Error(`Impossible de générer un code de partage pour ${correction.student_name}`);
          }
          shareCode = shareResult.code;
        }
        
        // Mettre à jour la correction
        updatedCorrections[i] = {
          ...correction,
          shareCode
        } as any;
      }
      
      // URL complète du feedback
      const feedbackUrl = `${baseUrl}/feedback/${shareCode}`;
      
      // Positionner le QR code
      const qrY = margin + 90;
      
      try {
        // Générer le QR code haute résolution
        console.log(`Génération du QR code pour: ${correction.student_name}`);
        const qrDataUrl = await generateHighResQRCode(feedbackUrl);
        
        // Ajouter le QR code au PDF
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        console.log(`QR code ajouté avec succès pour: ${correction.student_name}`);
      } catch (error) {
        console.error(`Erreur lors de la génération du QR code pour ${correction.student_name}:`, error);
      }
      
      // URL du feedback sous le QR code
      yPosition = qrY + qrSize + 20;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("URL du feedback:", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 8;
      doc.text(feedbackUrl, pageWidth / 2, yPosition, { align: "center" });
      
      // Instructions en bas de page
      yPosition = pageHeight - 30;
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text("Ce QR code est personnel et vous donne accès à votre feedback individuel.", pageWidth / 2, yPosition, { align: "center" });
    }
    
    // Appeler le callback avec les corrections mises à jour si fourni
    if (onSuccess) {
      onSuccess(updatedCorrections as any);
    }
    
    // Sauvegarder le PDF
    const fileName = `feedback-codes-${group?.name?.replace(/\s+/g, '-') || 'groupe'}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return fileName;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return null;
  }
}
