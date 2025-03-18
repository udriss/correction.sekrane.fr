require('dotenv').config({ path: '/var/www/correction.sekrane.fr/.env' });
const bcrypt = require('bcrypt');
const path = require('path');
const mysql = require('mysql2/promise');

// Direct connection to database using environment variables
async function getPool() {
  // Database configuration - using ENV variables
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

async function createUser(username, password, name) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await getPool();
    
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
  console.error('Usage: node create-user.js <username> <password> <name>');
  process.exit(1);
}

const [username, password, name] = args;
createUser(username, password, name);
