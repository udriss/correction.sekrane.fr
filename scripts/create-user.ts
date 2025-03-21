import { hash } from 'bcrypt';
import { withConnection } from '../lib/db';

async function createUser(username: string, password: string, name: string) {
  try {
    // Générer le mot de passe hashé
    const hashedPassword = await hash(password, 10);
    
    // Utiliser withConnection pour gérer automatiquement la connexion à la DB
    await withConnection(async (connection) => {
      // Vérifier d'abord si l'utilisateur existe déjà
      const [existingUsers] = await connection.query(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );
      
      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        throw new Error(`L'utilisateur '${username}' existe déjà`);
      }
      
      // Insérer le nouvel utilisateur
      const [result] = await connection.query(
        'INSERT INTO users (username, password, name) VALUES (?, ?, ?)',
        [username, hashedPassword, name]
      );
      
      const userId = (result as any).insertId;
      console.log(`Utilisateur ${username} (ID: ${userId}) créé avec succès!`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    process.exit(1);
  }
}

/**
 * Fonction principale qui exécute le script
 */
async function main() {
  // Récupérer les arguments depuis la ligne de commande
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    console.error('Usage: ts-node create-user.ts <username> <password> <name>');
    process.exit(1);
  }
  
  const [username, password, name] = args;
  
  // Validation des entrées
  if (!username || username.length < 3) {
    console.error('Le nom d\'utilisateur doit comporter au moins 3 caractères');
    process.exit(1);
  }
  
  if (!password || password.length < 6) {
    console.error('Le mot de passe doit comporter au moins 6 caractères');
    process.exit(1);
  }
  
  if (!name || name.length < 2) {
    console.error('Le nom doit comporter au moins 2 caractères');
    process.exit(1);
  }
  
  await createUser(username, password, name);
}

// Exécuter la fonction principale
main().catch(err => {
  console.error('Erreur non gérée:', err);
  process.exit(1);
});