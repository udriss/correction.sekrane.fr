import React, { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Student, ActivityAutre, CorrectionAutreEnriched } from '@/lib/types';
import QRCode from 'qrcode';

// Définition des styles pour le document PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subHeader: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  qrCodeWrapper: {
    margin: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    border: '1px solid #eee',
    height: 230, // Hauteur fixe pour uniformité
    width: '30%', // Trois QR codes par ligne
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  qrCodeContainer: {
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCode: {
    width: 120,
    height: 120,
  },
  qrDetails: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 10,
  },
  studentName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  activityName: {
    fontSize: 10,
    color: '#333',
  },
  date: {
    fontSize: 8,
    color: '#666',
    marginTop: 3,
  },
  qrCodesRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#999',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
});

interface QRCodePdfDocumentAutreProps {
  corrections: CorrectionAutreEnriched[];
  shareCodes: Record<string, string>;
  includeDetails: boolean;
  className: string;
  students: Student[];
  activities: ActivityAutre[];
}

const QRCodePdfDocumentAutre: React.FC<QRCodePdfDocumentAutreProps> = ({
  corrections,
  shareCodes,
  includeDetails,
  className,
  students,
  activities
}) => {
  // Fonction pour générer une image QR code à partir d'une URL
  const generateQRCodeImage = async (url: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H',
        width: 120,
        margin: 1,
      });
    } catch (error) {
      console.error("Erreur lors de la génération du QR code:", error);
      return '';
    }
  };

  // Préparation des données de QR codes
  const [qrCodeImages, setQrCodeImages] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const loadQRCodes = async () => {
      const imagePromises = corrections
        .filter(correction => shareCodes[correction.id])
        .map(async (correction) => {
          try {
            const shareUrl = `${window.location.origin}/share/${shareCodes[correction.id]}`;
            const imageUrl = await generateQRCodeImage(shareUrl);
            return { id: correction.id, imageUrl };
          } catch (error) {
            console.error(`Erreur lors de la génération du QR code pour ${correction.id}:`, error);
            return { id: correction.id, imageUrl: '' };
          }
        });
      
      const results = await Promise.all(imagePromises);
      const imagesMap: Record<string, string> = {};
      
      results.forEach(result => {
        imagesMap[result.id] = result.imageUrl;
      });
      
      setQrCodeImages(imagesMap);
    };
    
    loadQRCodes();
  }, [corrections, shareCodes]);
  
  // Préparation des données de QR codes après résolution des promesses
  const qrCodes = React.useMemo(() => {
    return corrections
      .filter(correction => shareCodes[correction.id] && qrCodeImages[correction.id]) // Filtrer les corrections avec codes de partage et images générées
      .map(correction => {
        const student = students.find(s => s.id === correction.student_id);
        const activity = activities.find(a => a.id === correction.activity_id);
        
        // URL pour le QR code
        const shareUrl = `${window.location.origin}/share/${shareCodes[correction.id]}`;
        
        return {
          id: correction.id,
          url: shareUrl,
          imageUrl: qrCodeImages[correction.id],
          studentName: student ? `${student.first_name} ${student.last_name}` : 'Étudiant inconnu',
          activityName: activity?.name || 'Activité inconnue',
          date: correction.submission_date || '-',
        };
      });
  }, [corrections, shareCodes, students, activities, qrCodeImages]);

  // Grouper les QR codes par pages (9 par page)
  const qrCodePages = React.useMemo(() => {
    const pages = [];
    const codesPerPage = 9; // 3x3 grid
    
    for (let i = 0; i < qrCodes.length; i += codesPerPage) {
      pages.push(qrCodes.slice(i, i + codesPerPage));
    }
    
    return pages;
  }, [qrCodes]);

  return (
    <Document>
      {qrCodePages.map((pageQrCodes, pageIndex) => (
        <Page key={`page-${pageIndex}`} size="A4" style={styles.page}>
          <Text style={styles.header}>QR Codes - {className}</Text>
          
          <Text style={styles.subHeader}>
            Page {pageIndex + 1} sur {qrCodePages.length} - {corrections.length} correction(s)
          </Text>
          
          <View style={styles.qrCodesRow}>
            {pageQrCodes.map((qrCode, index) => (
              <View key={`qr-${qrCode.id}-${index}`} style={styles.qrCodeWrapper}>
                <View style={styles.qrCodeContainer}>
                  <Image
                    style={styles.qrCode}
                    src={{ uri: qrCode.imageUrl, method: 'GET', body: '', headers: {} }}
                  />
                </View>
                
                {includeDetails && (
                  <View style={styles.qrDetails}>
                    <Text style={styles.studentName}>{qrCode.studentName}</Text>
                    <Text style={styles.activityName}>{qrCode.activityName}</Text>
                    <Text style={styles.date}>Date: {typeof qrCode.date === 'object' ? new Date(qrCode.date).toLocaleDateString() : qrCode.date}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
          
          <Text style={styles.pageNumber}>
            Page {pageIndex + 1} / {qrCodePages.length}
          </Text>
          
          <Text style={styles.footer}>
            Généré le {new Date().toLocaleDateString()} - QR codes pour accès aux corrections
          </Text>
        </Page>
      ))}
    </Document>
  );
};

export default QRCodePdfDocumentAutre;