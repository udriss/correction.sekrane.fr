// xlsxExportUtils.ts - Utilitaires pour l'export des données en Excel
import { Student, CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';
import { ArrangementType, SubArrangementType, ViewType } from '@/components/pdfAutre/types';
import { formatGrade } from './formatUtils';

// Fonction pour appliquer des styles aux cellules Excel
export const applyExcelCellStyle = (cell: any, cellValue: any) => {
  if (!cell) return;
  
  // Déterminer le style en fonction de la valeur
  if (typeof cellValue === 'string') {
    // Pour les statuts spéciaux
    if (cellValue === 'NON NOTÉ') {
      cell.font = { color: { argb: 'FFCC0000' }, italic: true }; // Rouge
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEEEE' } // Rouge très pâle
      };
    } else if (cellValue === 'ABSENT') {
      cell.font = { color: { argb: 'FF006600' }, bold: true, italic: true }; // Vert foncé
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEEFFEE' } // Vert très pâle
      };
    } else if (cellValue === 'NON RENDU') {
      cell.font = { color: { argb: 'FFCC6600' }, italic: true }; // Orange foncé
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF2E6' } // Orange très pâle
      };
    } else if (cellValue === 'DÉSACTIVÉ') {
      cell.font = { color: { argb: 'FF666666' }, italic: true }; // Gris
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' } // Gris très pâle
      };
    } else if (cellValue.includes('/')) {
      // Pour les notes avec format "X/20"
      const match = cellValue.match(/^(\d+(\.\d+)?)\//);
      if (match) {
        const grade = parseFloat(match[1]);
        if (grade < 5) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFCCCC' } // Rouge clair
          };
        } else if (grade < 10) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFEECC' } // Orange clair
          };
        } else if (grade < 15) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEEFFEE' } // Vert clair
          };
        } else {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFCCFFCC' } // Vert clair
          };
          cell.font = { bold: true };
        }
      }
    }
  }
  
  // Centrer les cellules de notes
  cell.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  };
};

// Fonction pour créer une feuille Excel avec ExcelJS
export const createExcelWorksheet = (
  worksheet: any, 
  correctionsInput: any[], 
  viewType: ViewType, 
  arrangement: ArrangementType,
  subArrangement: SubArrangementType,
  getStudentById: (studentId: number | null) => Student | undefined,
  getActivityById: (activityId: number) => ActivityAutre | undefined,
  classesMap: Map<number | null, any>
) => {
  // Create a mutable copy to sort
  const corrections = [...correctionsInput];

  if (viewType === 'simplified' && (arrangement === 'class' || arrangement === 'subclass')) {
    // Format simplifié pour l'arrangement par classe
    // Regrouper les étudiants (lignes) et les activités (colonnes)
    const studentMap: Record<string, Record<string, any>> = {};
    const activitySet = new Set<string>();
    const activityStatusMap: Record<string, string> = {}; // Pour stocker les statuts des activités
    
    // --- Tri des corrections initiales (optionnel mais peut aider à la cohérence si la map est utilisée ailleurs) ---
    corrections.sort((a: CorrectionAutreEnriched, b: CorrectionAutreEnriched) => {
      const studentA = getStudentById(a.student_id) as Student | undefined;
      const studentB = getStudentById(b.student_id) as Student | undefined;
      const nameA = studentA ? `${studentA.last_name} ${studentA.first_name}` : '';
      const nameB = studentB ? `${studentB.last_name} ${studentB.first_name}` : '';
      if (!nameA && !nameB) return 0;
      if (!nameA) return 1;
      if (!nameB) return -1;
      return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });

    corrections.forEach(c => {
      const student = getStudentById(c.student_id);
      const activity = getActivityById(c.activity_id);
      
      if (!student) return;
      
      const studentKey = `${student.last_name} ${student.first_name}`;
      const activityKey = activity?.name || `Activité ${c.activity_id}`;
      
      activitySet.add(activityKey);
      if (!studentMap[studentKey]) {
        studentMap[studentKey] = {};
      }
      
      // Stocker le statut de l'activité pour cet étudiant
      if (c.status) {
        activityStatusMap[`${studentKey}-${activityKey}`] = c.status;
      }
      
      // Vérifier si c'est une correction fictive avec status NON_NOTE
      const isPlaceholder = (c.placeholder && c.status === 'NON_NOTE');
      
      // Déterminer la valeur à afficher
      let displayValue = 'NON NOTÉ XLSX';
      
      if (isPlaceholder) {
        displayValue = 'N/A XLSX';
      } else if (c.status) {
        switch (c.status) {
          case 'ACTIVE':
            displayValue = c.grade !== undefined ? 
            `${formatGrade(c.grade)} / 20`
             : 'NON NOTÉ';
            break;
          case 'NON_NOTE':
            displayValue = 'NON NOTÉ';
            break;
          case 'ABSENT':
            displayValue = 'ABSENT';
            break;
          case 'NON_RENDU':
            displayValue = 'NON RENDU';
            break;
          case 'DEACTIVATED':
            displayValue = 'DÉSACTIVÉ';
            break;
          default:
            displayValue = c.grade !== undefined ? 
            `${formatGrade(c.grade)} / 20`
             : 'NON NOTÉ';
        }
      } else if (c.active === 0) {
        displayValue = 'DÉSACTIVÉ';
      } else if (c.grade !== undefined) {
        displayValue = `${c.grade}/20`;
      }
      
      studentMap[studentKey][activityKey] = displayValue;
    });
    
    // Convertir les activités en tableau pour les colonnes
    const activityArray = Array.from(activitySet);
    
    // Définir les colonnes avec les en-têtes
    worksheet.columns = [
      { header: 'Étudiant', key: 'student', width: 30 },
      ...activityArray.map(activity => ({
        header: activity,
        key: activity,
        width: 15
      }))
    ];
    
    // Ajouter les données
    // --- Tri des entrées de la map par nom d'étudiant --- 
    const sortedStudentEntries = Object.entries(studentMap).sort(([studentNameA], [studentNameB]) => {
      return studentNameA.localeCompare(studentNameB, 'fr', { sensitivity: 'base' });
    });

    // Iterate over the sorted entries
    sortedStudentEntries.forEach(([studentName, grades]) => {
      const rowData: any = { student: studentName };
      
      activityArray.forEach(activity => {
        // Déterminer la valeur à afficher en fonction du statut
        const status = activityStatusMap[`${studentName}-${activity}`];
        let displayValue;
        
        if (grades[activity] !== undefined) {
          displayValue = grades[activity];
        } else {
          // Utiliser le statut de l'activité pour cet étudiant si disponible
          switch (status) {
            case 'NON_NOTE':
              displayValue = 'NON NOTÉ';
              break;
            case 'ABSENT':
              displayValue = 'ABSENT';
              break;
            case 'NON_RENDU':
              displayValue = 'NON RENDU';
              break;
            case 'DEACTIVATED':
              displayValue = 'DÉSACTIVÉ';
              break;
            default:
              displayValue = 'NON ÉVALUÉ';
          }
        }
        
        rowData[activity] = displayValue;
      });

      const row = worksheet.addRow(rowData);
      
      // Appliquer des styles aux cellules de notes (commençant à l'index 1 car la première colonne est l'étudiant)
      activityArray.forEach((activity, index) => {
        const cellValue = rowData[activity];
        if (cellValue) {
          const cell = row.getCell(index + 2); // +2 car 1 est l'index de l'étudiant et les index Excel commencent à 1
          applyExcelCellStyle(cell, cellValue);
        }
      });
    });
    
  } else if (arrangement === 'class' && subArrangement === 'none' || arrangement === 'subclass' && subArrangement === 'none') {
    // Format spécial pour vue détaillée avec arrangement par classe ou sous-classe sans sous-arrangement
    // Regrouper les étudiants (lignes) et les activités (colonnes)
    const studentMap: Record<string, Record<string, any>> = {};
    const activitySet = new Set<string>();
    const activityStatusMap: Record<string, string> = {}; // Pour stocker les statuts des activités
    
    // --- Tri des corrections initiales ---
    corrections.sort((a: CorrectionAutreEnriched, b: CorrectionAutreEnriched) => {
      const studentA = getStudentById(a.student_id) as Student | undefined;
      const studentB = getStudentById(b.student_id) as Student | undefined;
      const nameA = studentA ? `${studentA.last_name} ${studentA.first_name}` : '';
      const nameB = studentB ? `${studentB.last_name} ${studentB.first_name}` : '';
      if (!nameA && !nameB) return 0;
      if (!nameA) return 1;
      if (!nameB) return -1;
      return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });

    corrections.forEach(c => {
      const student = getStudentById(c.student_id);
      const activity = getActivityById(c.activity_id);
      
      if (!student) return;
      
      const studentKey = `${student.last_name} ${student.first_name}`;
      const activityKey = activity?.name || `Activité ${c.activity_id}`;
      
      activitySet.add(activityKey);
      
      if (!studentMap[studentKey]) {
        studentMap[studentKey] = {};
      }
      
      // Stocker le statut de l'activité pour cet étudiant
      if (c.status) {
        activityStatusMap[`${studentKey}-${activityKey}`] = c.status;
      }
      
      // Vérifier si c'est une correction fictive avec status NON_NOTE
      const isPlaceholder = (c.placeholder && c.status === 'NON_NOTE');
      
      // Déterminer la valeur à afficher
      let gradeDisplay = 'NON NOTÉ';
      let pointsDisplay = 'N/A';
      
      if (isPlaceholder) {
        gradeDisplay = 'N/A';
        pointsDisplay = 'N/A';
      } else if (c.status) {
        switch (c.status) {
          case 'ACTIVE':
            gradeDisplay = c.grade !== undefined ? 
              `${formatGrade(c.grade)} / 20` : 'NON NOTÉ';
            pointsDisplay = Array.isArray(c.points_earned) ? 
              '[' + c.points_earned.join(' ; ') + ']' : 'N/A';
            break;
          case 'NON_NOTE':
            gradeDisplay = 'NON NOTÉ';
            pointsDisplay = 'NON NOTÉ';
            break;
          case 'ABSENT':
            gradeDisplay = 'ABSENT';
            pointsDisplay = 'ABSENT';
            break;
          case 'NON_RENDU':
            gradeDisplay = 'NON RENDU';
            pointsDisplay = 'NON RENDU';
            break;
          case 'DEACTIVATED':
            gradeDisplay = 'DÉSACTIVÉ';
            pointsDisplay = 'DÉSACTIVÉ';
            break;
          default:
            gradeDisplay = c.grade !== undefined ? 
              `${formatGrade(c.grade)} / 20` : 'NON NOTÉ';
            pointsDisplay = Array.isArray(c.points_earned) ? 
              '[' + c.points_earned.join(' ; ') + ']' : 'N/A';
        }
      } else if (c.active === 0) {
        gradeDisplay = 'DÉSACTIVÉ';
        pointsDisplay = 'DÉSACTIVÉ';
      } else {
        gradeDisplay = c.grade !== undefined ? 
          `${formatGrade(c.grade)} / 20` : 'NON NOTÉ';
        pointsDisplay = Array.isArray(c.points_earned) ? 
          '[' + c.points_earned.join(' ; ') + ']' : 'N/A';
      }
      
      // Stocker à la fois la note et les points pour chaque activité
      studentMap[studentKey][`${activityKey}-grade`] = gradeDisplay;
      studentMap[studentKey][`${activityKey}-points`] = pointsDisplay;
    });
    
    // Convertir les activités en tableau pour les colonnes
    const activityArray = Array.from(activitySet);
    
    // Définir la première colonne (Étudiant)
    worksheet.columns = [
      { header: 'Étudiant', key: 'student', width: 30 }
    ];
    
    // Ajouter les données
    // --- Tri des entrées de la map par nom d'étudiant --- 
    const sortedStudentEntries = Object.entries(studentMap).sort(([studentNameA], [studentNameB]) => {
      return studentNameA.localeCompare(studentNameB, 'fr', { sensitivity: 'base' });
    });
    
    // Créer la ligne d'en-tête pour les activités (fusionnée)
    const headerRow1 = worksheet.addRow(['Étudiant']);
    headerRow1.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4287F5' } // Bleu
    };
    headerRow1.getCell(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    
    // Créer la seconde ligne d'en-tête pour les détails (Points/Note)
    const headerRow2 = worksheet.addRow(['']);
    headerRow2.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4287F5' } // Bleu
    };
    
    // Pour chaque activité, ajouter deux colonnes et fusionner les cellules d'en-tête
    let colIndex = 2; // Commencer après la colonne Étudiant
    activityArray.forEach(activity => {
      // Ajouter les colonnes pour cette activité
      worksheet.getColumn(colIndex).width = 25; // Points par partie
      worksheet.getColumn(colIndex + 1).width = 15; // Note
      
      // Ajouter les en-têtes
      headerRow1.getCell(colIndex).value = activity;
      headerRow1.getCell(colIndex + 1).value = activity;
      headerRow2.getCell(colIndex).value = `Points par partie`;
      headerRow2.getCell(colIndex + 1).value = 'Note';
      
      // Fusionner les cellules du titre de l'activité
      worksheet.mergeCells(1, colIndex, 1, colIndex + 1);
      
      // Appliquer les styles aux en-têtes
      headerRow1.getCell(colIndex).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4287F5' } // Bleu
      };
      headerRow1.getCell(colIndex).font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow1.getCell(colIndex).alignment = { horizontal: 'center' };
      
      headerRow2.getCell(colIndex).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '98C0F7' } // Bleu légèrement différent
      };
      headerRow2.getCell(colIndex + 1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '98C0F7' } // Bleu légèrement différent
      };
      headerRow2.getCell(colIndex).font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow2.getCell(colIndex + 1).font = { bold: true, color: { argb: 'FFFFFF' } };
      
      colIndex += 2; // Passer à la prochaine paire de colonnes
    });
    
    // Ajouter les données des étudiants
    sortedStudentEntries.forEach(([studentName, data], index) => {
      const rowData: any[] = [studentName]; // Commencer avec le nom de l'étudiant
      
      // Pour chaque activité, ajouter les points et la note
      activityArray.forEach(activity => {
        const points = data[`${activity}-points`] || 'N/A';
        const grade = data[`${activity}-grade`] || 'NON NOTÉ';
        
        rowData.push(points); // Points par partie
        rowData.push(grade);  // Note
      });
      
      const row = worksheet.addRow(rowData);
      
      // Appliquer des styles aux cellules
      row.getCell(1).font = { bold: true }; // Nom de l'étudiant en gras
      
      // Appliquer des styles aux points et notes
      let cellIndex = 2;
      activityArray.forEach(activity => {
        const pointsCell = row.getCell(cellIndex);
        const gradeCell = row.getCell(cellIndex + 1);
        
        applyExcelCellStyle(pointsCell, rowData[cellIndex - 1]);
        applyExcelCellStyle(gradeCell, rowData[cellIndex]);
        
        cellIndex += 2;
      });
    });
    
    // Définir la largeur des colonnes (si nécessaire)
    worksheet.getColumn(1).width = 30; // Étudiant
    
    // Geler les deux premières lignes et la première colonne
    worksheet.views = [
      { state: 'frozen', xSplit: 1, ySplit: 2, activeCell: 'B3' }
    ];
  } else {
    // Format détaillé standard pour corrections_autres
    worksheet.columns = [
      { header: 'Étudiant', key: 'student', width: 30 },
      { header: 'Classe', key: 'class', width: 20 },
      { header: 'Activité', key: 'activity', width: 30 },
      { header: 'Points par partie', key: 'points', width: 30 },
      { header: 'Note', key: 'grade', width: 15 },
      { header: 'Statut', key: 'status', width: 15 }
    ];
    
    // --- Ajout du tri par nom d'étudiant pour la vue détaillée ---
    corrections.sort((a: CorrectionAutreEnriched, b: CorrectionAutreEnriched) => {
      const studentA = getStudentById(a.student_id) as Student | undefined;
      const studentB = getStudentById(b.student_id) as Student | undefined;
      const nameA = studentA ? `${studentA.last_name} ${studentA.first_name}` : '';
      const nameB = studentB ? `${studentB.last_name} ${studentB.first_name}` : '';
      if (!nameA && !nameB) return 0;
      if (!nameA) return 1;
      if (!nameB) return -1;
      return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });

    // Ajouter les données des corrections (maintenant triées)
    corrections.forEach(c => {
      const activity = getActivityById(c.activity_id);
      const student = getStudentById(c.student_id);
      const className = classesMap.get(c.class_id)?.name || `Classe ${c.class_id}`;
      
      // Vérifier si c'est une correction fictive avec status NON_NOTE
      const isPlaceholder = (c.placeholder && c.status === 'NON_NOTE');
      
      // Déterminer le statut
      let statusDisplay = 'ACTIVE';
      if (c.status) {
        switch (c.status) {
          case 'NON_NOTE': statusDisplay = 'NON NOTÉ'; break;
          case 'ABSENT': statusDisplay = 'ABSENT'; break;
          case 'NON_RENDU': statusDisplay = 'NON RENDU'; break;
          case 'DEACTIVATED': statusDisplay = 'DÉSACTIVÉ'; break;
          default: statusDisplay = c.status;
        }
      } else if (c.active === 0) {
        statusDisplay = 'DÉSACTIVÉ';
      }
      
      // Formater les points
      let pointsDisplay = isPlaceholder ? 'N/A' : 'N/A';
      if (!isPlaceholder && Array.isArray(c.points_earned) && c.points_earned.length > 0) {
        pointsDisplay = '[' + c.points_earned.join(' ; ') + ']';
      }
      
      // Formater la note
      let gradeDisplay;
      if (isPlaceholder) {
        gradeDisplay = 'N/A';
      } else if (c.grade !== undefined) {
        if (statusDisplay === 'ACTIVE') {
          gradeDisplay = `${formatGrade(c.grade)} / 20`;
        } else {
          gradeDisplay = statusDisplay;
        }
      } else {
        gradeDisplay = 'NON NOTÉ';
      }
      
      const row = worksheet.addRow({
        student: student ? `${student.first_name} ${student.last_name}` : 'N/A',
        class: className,
        activity: activity?.name || `Activité ${c.activity_id}`,
        points: pointsDisplay,
        grade: gradeDisplay,
        status: statusDisplay
      });
      
      // Appliquer des styles aux cellules
      applyExcelCellStyle(row.getCell('grade'), gradeDisplay);
      applyExcelCellStyle(row.getCell('status'), statusDisplay);
    });
  }
  
  // Styliser l'en-tête
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4287F5' } // Bleu
  };
  
  // Ajouter des bordures
  worksheet.eachRow((row: any) => {
    row.eachCell((cell: any) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
  
  // Geler la première ligne
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];
};