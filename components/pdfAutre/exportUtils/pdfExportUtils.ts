// pdfExportUtils.ts - Utilitaires pour l'export des données en PDF
import { Student, CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';
import { formatGrade, getDisplayValues } from './formatUtils';

// Fonction pour générer le PDF
export const generatePDF = async (
  groupedData: any,
  filterActivity: number[] | 'all',
  uniqueActivities: { id: number | string; name: string }[],
  getActivityById: (activityId: number) => ActivityAutre | undefined,
  getStudentById: (studentId: number | null) => Student | undefined,
  enqueueSnackbar: (message: string, options: any) => void,
  filterClasses: number[] | 'all' = 'all' // Ajout du paramètre pour filtrer les classes
) => {
  try {
    // Importer les modules nécessaires
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.jsPDF;
    const doc = new jsPDF();
    
    // Configurer l'en-tête du document
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text('Récapitulatif des notes', 20, 20);
    
    // Informations de filtrage
    doc.setFontSize(12);
    doc.text(`Date d'export : ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 30);
    doc.text(`Activité : ${filterActivity === 'all' ? 'toutes' : Array.isArray(filterActivity) ? uniqueActivities.filter((a) => filterActivity.includes(Number(a.id))).map(a => a.name).join(', ') : uniqueActivities.find((a) => a.id === filterActivity)?.name}`, 20, 40);
    
    // Position de départ pour le contenu du PDF
    let yPosition = 50;
    
    // Ajouter un rectangle décoratif en haut
    doc.setFillColor(66, 135, 245); // Bleu, couleur cohérente avec les tableaux
    doc.rect(0, 0, doc.internal.pageSize.width, 12, 'F');
    
    // Ajouter un rectangle décoratif en bas pour le pied de page
    doc.setFillColor(240, 240, 240); // Gris clair
    doc.rect(0, doc.internal.pageSize.height - 15, doc.internal.pageSize.width, 15, 'F');

    doc.addPage();
    
    // Filtrage des corrections selon les classes sélectionnées
    const filterCorrectionsByClass = (corrections: any[]) => {
      if (filterClasses === 'all') return corrections;
      return corrections.filter(c => filterClasses.includes(c.class_id));
    };
    
    // Générer le contenu selon l'organisation choisie
    let isFirstGroup = true;
    Object.entries(groupedData).forEach(([key, value]: [string, any]) => {
      // Ajouter une nouvelle page pour chaque groupe sauf le premier
      if (!isFirstGroup) {
        doc.addPage();
        
        // Ajouter un rectangle décoratif en haut de la nouvelle page
        doc.setFillColor(66, 135, 245);
        doc.rect(0, 0, doc.internal.pageSize.width, 12, 'F');
        
        // Ajouter un rectangle décoratif en bas pour le pied de page
        doc.setFillColor(240, 240, 240);
        doc.rect(0, doc.internal.pageSize.height - 15, doc.internal.pageSize.width, 15, 'F');
        
        yPosition = 50; // Réinitialiser la position Y pour la nouvelle page
      } else {
        isFirstGroup = false;
      }
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(key, 20, yPosition);
      yPosition += 10;
      
      // Ligne de séparation sous le titre principal
      doc.setDrawColor(66, 135, 245); // Bleu
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, doc.internal.pageSize.width - 20, yPosition);
      yPosition += 5;
      
      if (value.corrections) {
        // Cas 1: Corrections disponibles directement au niveau principal
        // Filtrer les corrections selon les classes sélectionnées
        const filteredCorrections = filterCorrectionsByClass(value.corrections);
        if (filteredCorrections.length === 0) return; // Ne pas afficher de tableau vide
        
        // Tableau pour ce groupe
        const tableData = filteredCorrections.map((c: any) => {
          const activity = getActivityById(c.activity_id);
          const student = getStudentById(c.student_id);
          
          // Obtenir les valeurs d'affichage pour cette correction en passant l'activité
          const { statusDisplay, gradeDisplay, pointsDisplay } = getDisplayValues(c, activity);
          
          return [
            student ? `${student.first_name} ${student.last_name}` : 'N/A',
            activity?.name || `Activité ${c.activity_id}`,
            pointsDisplay,
            gradeDisplay,
            statusDisplay
          ];
        });
        
        const autoTable = require('jspdf-autotable').default;
        autoTable(doc, {
          head: [['Étudiant', 'Activité', 'Points par partie', 'Note', 'Statut']],
          body: tableData,
          startY: yPosition,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] },
          didParseCell: function(data: any) {
            // Style pour les cellules des étudiants
            if (data.column.index === 0) {
              data.cell.styles.fontStyle = 'bold';
            }
            
            // Styles basés sur le statut (indice 4)
            if (data.column.index === 4) {
              const statusValue = data.cell.raw;
              switch (statusValue) {
                case 'NON NOTÉ':
                  data.cell.styles.fillColor = [255, 238, 238]; // Rouge très pâle
                  data.cell.styles.fontStyle = 'italic';
                  break;
                case 'ABSENT':
                  data.cell.styles.fillColor = [238, 255, 238]; // Vert très pâle
                  data.cell.styles.fontStyle = 'bolditalic';
                  break;
                case 'NON RENDU':
                  data.cell.styles.fillColor = [255, 242, 230]; // Orange très pâle
                  data.cell.styles.fontStyle = 'italic';
                  break;
                case 'DÉSACTIVÉ':
                  data.cell.styles.fillColor = [242, 242, 242]; // Gris très pâle
                  data.cell.styles.fontStyle = 'italic';
                  break;
              }
            }
            
            // Style pour les points (colonne 2) et les notes (colonne 3)
            if (data.column.index === 2 || data.column.index === 3) {
              const cellValue = data.cell.raw;
              
              // Si c'est un statut spécial, appliquer le même style que pour la colonne de statut
              if (cellValue === 'NON NOTÉ') {
                data.cell.styles.fillColor = [255, 238, 238]; // Rouge très pâle
                data.cell.styles.fontStyle = 'italic';
              } else if (cellValue === 'ABSENT') {
                data.cell.styles.fillColor = [238, 255, 238]; // Vert très pâle
                data.cell.styles.fontStyle = 'bolditalic';
              } else if (cellValue === 'NON RENDU') {
                data.cell.styles.fillColor = [255, 242, 230]; // Orange très pâle
                data.cell.styles.fontStyle = 'italic';
              } else if (cellValue === 'DÉSACTIVÉ') {
                  data.cell.styles.fillColor = [242, 242, 242]; // Gris très pâle
                  data.cell.styles.fontStyle = 'italic';
                  
              } else if (cellValue === 'N/A') {
                data.cell.styles.fillColor = [238, 238, 238]; // Gris clair
                data.cell.styles.fontStyle = 'italic';
              } else if (typeof cellValue === 'string' && cellValue.includes('/')) {
                // Pour les notes et points, dégradé de couleur basé sur la valeur
                const match = cellValue.match(/^(\d+(\.\d+)?)\//);
                if (match && data.column.index === 3) {  // Uniquement pour les notes
                  const grade = parseFloat(match[1]);
                  if (grade < 5) {
                    data.cell.styles.fillColor = [255, 204, 204]; // Rouge clair
                  } else if (grade < 10) {
                    data.cell.styles.fillColor = [255, 238, 204]; // Orange clair
                  } else if (grade < 15) {
                    data.cell.styles.fillColor = [238, 255, 238]; // Vert clair
                  } else {
                    data.cell.styles.fillColor = [204, 255, 204]; // Vert plus intense
                    data.cell.styles.fontStyle = 'bold';
                  }
                }
              }
            }
          },
          // Add didDrawCell hook to draw custom content
          didDrawCell: function(data: any) {
            // Check if the cell is in the relevant columns (Points, Note, Statut)
            if (data.column.index >= 2 && data.column.index <= 4) {
              const cellValue = data.cell.raw;
              if (cellValue === 'DÉSACTIVÉ') {
                // Draw a diagonal line (strikethrough)
                doc.setDrawColor(230, 230, 230); // Set line color (e.g., gray)
                doc.setLineWidth(0.2);
                doc.line(
                  data.cell.x, 
                  data.cell.y, 
                  data.cell.x + data.cell.width, 
                  data.cell.y + data.cell.height
                );
                doc.line(
                  data.cell.x + data.cell.width, 
                  data.cell.y, 
                  data.cell.x , 
                  data.cell.y + data.cell.height
                );
              }
            }
          }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 10;
      } 
      else if (value.items) {
        // Cas 2: Les corrections sont dans les sous-objets (sous-arrangement)
        Object.entries(value.items).forEach(([subKey, subValue]: [string, any]) => {
          // Vérification pour nouvelle page si l'espace est insuffisant
          if (yPosition > doc.internal.pageSize.height - 50) {
            doc.addPage();
            yPosition = 20;
            
            // Ajouter un rectangle décoratif en haut de la nouvelle page
            doc.setFillColor(66, 135, 245);
            doc.rect(0, 0, doc.internal.pageSize.width, 12, 'F');
            
            // Ajouter un rectangle décoratif en bas pour le pied de page
            doc.setFillColor(240, 240, 240);
            doc.rect(0, doc.internal.pageSize.height - 15, doc.internal.pageSize.width, 15, 'F');
          }
          
          // Créer un dégradé pour le fond du titre du sous-arrangement
          doc.setFillColor(230, 240, 255); // Bleu très pâle pour le fond de base
          doc.rect(20, yPosition - 7, doc.internal.pageSize.width - 40, 16, 'F');
          
          // Ajouter une bande colorée sur le côté gauche pour plus de visibilité
          doc.setFillColor(66, 135, 245); // Bleu plus vif
          doc.rect(20, yPosition - 7, 5, 16, 'F');
          
          // Ajouter une bordure plus prononcée autour du titre
          doc.setDrawColor(41, 98, 255); // Bleu plus foncé pour la bordure
          doc.setLineWidth(0.5);
          doc.rect(20, yPosition - 7, doc.internal.pageSize.width - 40, 16);
          
          // Ajouter un effet d'ombre légère (en dessinant un rectangle gris en dessous)
          doc.setFillColor(250, 250, 250);
          doc.rect(18, yPosition - 9, doc.internal.pageSize.width - 40, 16, 'F');
          doc.setFillColor(240, 240, 245);
          doc.rect(20, yPosition - 7, doc.internal.pageSize.width - 40, 16, 'F');
          
          // Déterminer le type de sous-arrangement en fonction de la propriété subArrangement
          const subArrangement = (subValue as any).subArrangement || 'none';
          
          let subArrangementType = '';
          if (subArrangement === 'class') subArrangementType = 'Classe';
          else if (subArrangement === 'activity') subArrangementType = 'Activité';
          else if (subArrangement === 'student') subArrangementType = 'Étudiant';
          else if (subArrangement === 'subclass') subArrangementType = 'Groupe';
          else subArrangementType = 'Groupe';
          
          // Texte du titre avec style amélioré
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 51, 153); // Bleu foncé pour le texte
          
          doc.text(`${subArrangementType} : ${subKey}`, 30, yPosition + 2);
          
          // Réinitialiser la couleur du texte
          doc.setTextColor(0, 0, 0);
          
          yPosition += 13; // Espace après le titre du sous-arrangement
          
          // Vérifier que subValue a des corrections
          if (subValue.corrections && subValue.corrections.length > 0) {
            // --- Ajout du tri par nom d'étudiant ---
            subValue.corrections.sort((a: CorrectionAutreEnriched, b: CorrectionAutreEnriched) => {
              const studentA = getStudentById(a.student_id) as Student | undefined;
              const studentB = getStudentById(b.student_id) as Student | undefined;

              const nameA = studentA ? `${studentA.last_name} ${studentA.first_name}` : '';
              const nameB = studentB ? `${studentB.last_name} ${studentB.first_name}` : '';

              // Handle cases where student might not be found
              if (!nameA && !nameB) return 0;
              if (!nameA) return 1; // Put corrections without student info last
              if (!nameB) return -1; // Put corrections without student info last

              return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
            });

            // Filtrer les corrections selon les classes sélectionnées
            const filteredCorrections = filterCorrectionsByClass(subValue.corrections);
            if (filteredCorrections.length === 0) return; // Ne pas afficher de tableau vide
            
            const tableData = filteredCorrections.map((c: any) => {
              const activity = getActivityById(c.activity_id);
              const student = getStudentById(c.student_id);
              
              // Obtenir les valeurs d'affichage pour cette correction en passant l'activité
              const { statusDisplay, gradeDisplay, pointsDisplay } = getDisplayValues(c, activity);
              
              return [
                student ? `${student.first_name} ${student.last_name ? student.last_name.substring(0, 2).toUpperCase()+'.' : ''}` : 'N/A',
                activity?.name || `Activité ${c.activity_id}`,
                pointsDisplay,
                gradeDisplay,
                statusDisplay
              ];
            });
            
              const autoTable = require('jspdf-autotable').default;
              autoTable(doc, {
              head: [['Étudiant', 'Activité', 'Points par partie', 'Note', 'Statut']],
              body: tableData,
              startY: yPosition,
              styles: { fontSize: 10 },
              headStyles: { fillColor: [41, 128, 185], halign: 'center' },
              columnStyles: {
                0: { halign: 'left' }, // Première colonne (Étudiant) alignée à gauche
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center' },
              },
              margin: { left: 10, right: 10 }, // Marge indentée pour les sous-tableaux
              didParseCell: function(data: any) {
                // Style pour les cellules des étudiants
                if (data.column.index === 0) {
                data.cell.styles.fontStyle = 'bold';
                }
                
                // Styles basés sur le statut (indice 4)
                if (data.column.index === 4) {
                const statusValue = data.cell.raw;
                switch (statusValue) {
                  case 'NON NOTÉ':
                  data.cell.styles.fillColor = [255, 238, 238]; // Rouge très pâle
                  data.cell.styles.fontStyle = 'italic';
                  break;
                  case 'ABSENT':
                  data.cell.styles.fillColor = [238, 255, 238]; // Vert très pâle
                  data.cell.styles.fontStyle = 'bolditalic';
                  break;
                  case 'NON RENDU':
                  data.cell.styles.fillColor = [255, 242, 230]; // Orange très pâle
                  data.cell.styles.fontStyle = 'italic';
                  break;
                  case 'DÉSACTIVÉ':
                  data.cell.styles.fillColor = [252, 252, 252]; // Gris très pâle
                  data.cell.styles.fontStyle = 'italic';
                  break;
                }
                }
                
                // Style pour les points (colonne 2) et les notes (colonne 3)
                if (data.column.index === 2 || data.column.index === 3) {
                const cellValue = data.cell.raw;
                
                // Si c'est un statut spécial, appliquer le même style que pour la colonne de statut
                if (cellValue === 'NON NOTÉ') {
                  data.cell.styles.fillColor = [255, 238, 238]; // Rouge très pâle
                  data.cell.styles.fontStyle = 'italic';
                } else if (cellValue === 'ABSENT') {
                  data.cell.styles.fillColor = [238, 255, 238]; // Vert très pâle
                  data.cell.styles.fontStyle = 'bolditalic';
                } else if (cellValue === 'NON RENDU') {
                  data.cell.styles.fillColor = [255, 242, 230]; // Orange très pâle
                  data.cell.styles.fontStyle = 'italic';
                } else if (cellValue === 'DÉSACTIVÉ') {
                  data.cell.styles.fillColor = [252, 252, 252]; // Gris très pâle
                  data.cell.styles.fontStyle = 'italic';
                } else if (cellValue === 'N/A') {
                  data.cell.styles.fillColor = [238, 238, 238]; // Gris clair
                  data.cell.styles.fontStyle = 'italic';
                } else if (typeof cellValue === 'string' && cellValue.includes('/')) {
                  // Pour les notes et points, dégradé de couleur basé sur la valeur
                  const match = cellValue.match(/^(\d+(\.\d+)?)\//);
                  if (match && data.column.index === 3) {  // Uniquement pour les notes
                  const grade = parseFloat(match[1]);
                  if (grade < 5) {
                    data.cell.styles.fillColor = [255, 204, 204]; // Rouge clair
                  } else if (grade < 10) {
                    data.cell.styles.fillColor = [255, 238, 204]; // Orange clair
                  } else if (grade < 15) {
                    data.cell.styles.fillColor = [238, 255, 238]; // Vert clair
                  } else {
                    data.cell.styles.fillColor = [204, 255, 204]; // Vert plus intense
                    data.cell.styles.fontStyle = 'bold';
                  }
                  }
                }
                }
              },
              // Add didDrawCell hook to draw custom content for sub-tables
              didDrawCell: function(data: any) {
                // Check if the cell is in the relevant columns (Points, Note, Statut)
                if (data.column.index >= 2 && data.column.index <= 4) { 
                const cellValue = data.cell.raw;
                if (cellValue === 'DÉSACTIVÉ') {
                  // Draw a diagonal line (strikethrough)
                  doc.setDrawColor(200, 200, 200); // Set line color (e.g., gray)
                  doc.setLineWidth(0.2);
                  doc.line(
                  data.cell.x, 
                  data.cell.y, 
                  data.cell.x + data.cell.width, 
                  data.cell.y + data.cell.height
                  );
                  doc.line(
                  data.cell.x + data.cell.width, 
                  data.cell.y, 
                  data.cell.x , 
                  data.cell.y + data.cell.height
                  );
                }
                }
              }
              });
            yPosition = (doc as any).lastAutoTable.finalY + 15; // Espace supplémentaire entre les sous-tableaux
          } else {
            // Aucune correction pour ce sous-groupe
            doc.setFontSize(10);
            doc.text('Aucune correction disponible', 40, yPosition);
            yPosition += 10;
          }
          
          // Espace après chaque sous-section
          yPosition += 5;
        });
      }
      
      if (yPosition > doc.internal.pageSize.height - 30) {
        doc.addPage();
        yPosition = 20;
        
        // Ajouter un rectangle décoratif en haut de chaque nouvelle page
        doc.setFillColor(66, 135, 245);
        doc.rect(0, 0, doc.internal.pageSize.width, 12, 'F');
        
        // Ajouter un rectangle décoratif en bas pour le pied de page
        doc.setFillColor(240, 240, 240);
        doc.rect(0, doc.internal.pageSize.height - 15, doc.internal.pageSize.width, 15, 'F');
      }
    });
    
    // Finaliser avec numéro de page et informations
    const totalPages = doc.getNumberOfPages();
    
    // Ajouter les pieds de page à toutes les pages
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Numérotation des pages
      const pageInfo = `Page ${i}/${totalPages}`;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(pageInfo, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 7, { align: 'center' });
      
      // Petit texte d'information
      doc.setFontSize(5);
      doc.setTextColor(100, 100, 100);
      doc.text('Document construit automatiquement — correction.sekrane.fr', 100, doc.internal.pageSize.height - 7, { align: 'right' });
    }
    
    // Sauvegarder le PDF
    const fileName = `Corrections_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    enqueueSnackbar('PDF construit avec succès', { variant: 'success' });
    
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw error;
  }
};