#!/usr/bin/env node

/**
 * Script de migration pour calculer le champ percentage_grade 
 * pour toutes les corrections existantes
 */

const { recalculateAllPercentageGrades } = require('./lib/correctionAutre');

async function runMigration() {
  console.log('🚀 Début de la migration percentage_grade...');
  
  try {
    await recalculateAllPercentageGrades();
    console.log('✅ Migration terminée avec succès !');
    console.log('📊 Tous les champs percentage_grade ont été calculés et mis à jour.');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Exécuter la migration si ce script est appelé directement
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
