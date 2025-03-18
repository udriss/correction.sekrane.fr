import { hash } from 'bcrypt';
import { getPool } from '../lib/db';

async function createUser(username: string, password: string, name: string) {
  try {
    const hashedPassword = await hash(password, 10);
    const pool = getPool();
    
    await pool.query(
      'INSERT INTO users (username, password, name) VALUES (?, ?, ?)',
      [username, hashedPassword, name]
    );
    
    console.log(`User ${username} created successfully!`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
}

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length !== 3) {
  console.error('Usage: ts-node create-user.ts <username> <password> <name>');
  process.exit(1);
}

const [username, password, name] = args;
createUser(username, password, name);
