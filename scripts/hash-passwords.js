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

  console.log('Connecting to database with config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database
  });

  return mysql.createPool(dbConfig);
}

async function hashPasswords() {
  try {
    const pool = await getPool();
    
    // Récupérer tous les utilisateurs
    const [users] = await pool.query('SELECT id, username, password FROM users');
    
    if (!Array.isArray(users) || users.length === 0) {
      console.log('Aucun utilisateur trouvé.');
      return;
    }
    
    console.log(`${users.length} utilisateurs trouvés. Vérification des mots de passe...`);
    
    // Pour chaque utilisateur, vérifier si le mot de passe est déjà haché
    for (const user of users) {
      if (!user.password.startsWith('$2')) {
        // Le mot de passe n'est pas haché, procéder au hachage
        console.log(`Hachage du mot de passe pour l'utilisateur: ${user.username}`);
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Mettre à jour l'utilisateur avec le mot de passe haché
        await pool.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, user.id]
        );
        
        console.log(`Mot de passe mis à jour pour l'utilisateur: ${user.username}`);
      } else {
        console.log(`Le mot de passe de l'utilisateur ${user.username} est déjà haché.`);
      }
    }
    
    console.log('Opération terminée avec succès.');
  } catch (error) {
    console.error('Erreur lors du hachage des mots de passe:', error);
  } finally {
    process.exit(0);
  }
}

// Lancer le script
hashPasswords();
