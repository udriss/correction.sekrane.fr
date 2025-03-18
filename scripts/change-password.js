require('dotenv').config({ path: '/var/www/correction.sekrane.fr/.env' });
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function getPool() {
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  return mysql.createPool(dbConfig);
}

async function changePassword(username, newPassword) {
  try {
    const pool = await getPool();
    
    // Vérifier si l'utilisateur existe
    const [users] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    
    if (!Array.isArray(users) || users.length === 0) {
      console.log(`Utilisateur ${username} non trouvé.`);
      return;
    }
    
    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour le mot de passe
    await pool.query(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, username]
    );
    
    console.log(`Mot de passe mis à jour pour l'utilisateur: ${username}`);
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
  } finally {
    process.exit(0);
  }
}

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node change-password.js <username> <new-password>');
  process.exit(1);
}

const [username, newPassword] = args;
changePassword(username, newPassword);
