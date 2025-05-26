// Test pour vérifier le comportement de la stylisation des pénalités
const { applyExcelCellStyle } = require('./components/pdfAutre/exportUtils/xlsxExportUtils.ts');

// Mock cell object
const createMockCell = () => ({
  font: {},
  fill: {},
  alignment: {}
});

// Test 1: Note avec pénalité
console.log('Test 1: Note avec pénalité');
const cellWithPenalty = createMockCell();
applyExcelCellStyle(cellWithPenalty, '12.5/20', true);
console.log('Cellule avec pénalité:', JSON.stringify(cellWithPenalty, null, 2));

// Test 2: Note sans pénalité
console.log('\nTest 2: Note sans pénalité');
const cellWithoutPenalty = createMockCell();
applyExcelCellStyle(cellWithoutPenalty, '12.5/20', false);
console.log('Cellule sans pénalité:', JSON.stringify(cellWithoutPenalty, null, 2));

// Test 3: Note simple avec pénalité
console.log('\nTest 3: Note simple avec pénalité');
const cellSimplePenalty = createMockCell();
applyExcelCellStyle(cellSimplePenalty, '12.5', true);
console.log('Cellule note simple avec pénalité:', JSON.stringify(cellSimplePenalty, null, 2));

// Test 4: Statut spécial
console.log('\nTest 4: Statut spécial');
const cellStatus = createMockCell();
applyExcelCellStyle(cellStatus, 'ABSENT', false);
console.log('Cellule statut ABSENT:', JSON.stringify(cellStatus, null, 2));
