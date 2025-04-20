// qrCodeExportUtils.ts - Utilitaires pour l'export des QR codes
import { CorrectionAutreEnriched, ActivityAutre, Student } from '@/lib/types';
import { ArrangementType as PdfArrangementType, SubArrangementType } from '@/components/pdfAutre/types';

// Type d'arrangement compatible avec qrGeneratorPDFAutre.ts
type QRCodeArrangementType = 'student' | 'class' | 'subclass' | 'activity';

// Fonction pour générer un PDF de QR codes pour toutes les corrections
export const generateQRCodePDF = async (
  corrections: CorrectionAutreEnriched[],
  uniqueActivities: { id: number | string; name: string }[],
  filterActivity: number | 'all',
  includeAllStudents: boolean,
  allStudents: any[],
  students: Student[],
  arrangement: PdfArrangementType,
  subArrangement: SubArrangementType,
  activities: ActivityAutre[],
  getActivityById: (activityId: number) => ActivityAutre | undefined,
  getStudentById: (studentId: number | null) => Student | undefined,
  enqueueSnackbar: (message: string, options: any) => void,
  setError: (error: Error | string | null) => void,
  setErrorDetails: (error: any | null) => void,
  groupedData: any
) => {
  try {
    enqueueSnackbar('Génération du PDF de QR codes en cours...', { variant: 'info' });
    
    // Récupérer d'abord les codes de partage pour les corrections qui n'en ont pas
    const correctionsWithoutQR = corrections.filter(c => 
      !('shareCode' in c) || !(c as any).shareCode
    );
  
    if (correctionsWithoutQR.length > 0) {
      // Créer des codes de partage en lot
      const correctionIds = correctionsWithoutQR.map(c => c.id);
      await fetch('/api/share/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correctionIds }),
      });
    }
    
    // Générer le titre du PDF
    const activityName = filterActivity !== 'all'
      ? uniqueActivities.find((a) => a.id === filterActivity)?.name
      : 'Toutes les activités';
    
    // Préparer les données d'étudiants à utiliser
    const studentsToUse = includeAllStudents && allStudents.length > 0
      ? allStudents
      : students;
    
    // Importer la fonction de génération de QR codes
    const { generateQRCodePDF } = await import('@/utils/qrGeneratorPDFAutre');
    
    // Convertir l'arrangement si nécessaire pour s'assurer de la compatibilité
    const qrArrangement: QRCodeArrangementType | undefined = 
      arrangement === 'none' ? undefined : arrangement as QRCodeArrangementType;
    
    // Générer le PDF avec les paramètres d'organisation
    await generateQRCodePDF({
      corrections,
      group: {
        name: 'Toutes les classes',
        activity_name: activityName || 'Activité'
      },
      students: studentsToUse,
      activities,
      includeDetails: true,
      // Paramètres pour l'organisation
      arrangement: qrArrangement,
      subArrangement,
      groupedData,
    });
    
    // Afficher message de succès
    enqueueSnackbar('PDF des QR codes généré avec succès', { variant: 'success' });
    
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    setError('Erreur lors de la génération du PDF de QR codes');
    setErrorDetails(error);
  }
};