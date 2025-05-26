// Test simple pour vérifier la logique de détection de pénalité
import { applyExcelCellStyle } from './components/pdfAutre/exportUtils/xlsxExportUtils';

// Mock cell object
interface MockCell {
  font?: any;
  fill?: any;
  alignment?: any;
}

const createMockCell = (): MockCell => ({
  font: {},
  fill: {},
  alignment: {}
});

// Test avec une note ayant une pénalité
const correction1 = {
  penalty: "4.00",
  final_grade: "7.50",
  // ... autres propriétés
};

// Test avec une note sans pénalité  
const correction2 = {
  penalty: "0.00",
  final_grade: "9.00",
  // ... autres propriétés
};

// Fonction pour simuler la détection de pénalité
const hasPenalty1 = correction1.penalty !== undefined && 
                   correction1.penalty !== null && 
                   parseFloat(String(correction1.penalty)) > 0;

const hasPenalty2 = correction2.penalty !== undefined && 
                   correction2.penalty !== null && 
                   parseFloat(String(correction2.penalty)) > 0;

console.log('Correction 1 (penalty: 4.00) has penalty:', hasPenalty1); // Should be true
console.log('Correction 2 (penalty: 0.00) has penalty:', hasPenalty2); // Should be false

// Test de stylisation
const cell1 = createMockCell();
const cell2 = createMockCell();

applyExcelCellStyle(cell1, '7.50/20', hasPenalty1);
applyExcelCellStyle(cell2, '9.00/20', hasPenalty2);

console.log('Cellule 1 (avec pénalité):', {
  font: cell1.font,
  fill: cell1.fill
});

console.log('Cellule 2 (sans pénalité):', {
  font: cell2.font,
  fill: cell2.fill
});

export {};
