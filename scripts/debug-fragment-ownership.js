require('dotenv').config();
const { pool, closePool } = require('../lib/db');

async function debugFragmentOwnership() {
  try {
    console.log('Debugging fragment ownership issues...');
    
    const connection = await pool.getConnection();
    
    try {
      // Get all fragments with their user_ids
      const [fragments] = await connection.query(`
        SELECT id, user_id, content 
        FROM fragments 
        ORDER BY id ASC
      `);
      
      console.log('\n=== FRAGMENTS IN DATABASE ===');
      fragments.forEach(fragment => {
        console.log(`Fragment #${fragment.id}: user_id = "${fragment.user_id}" (${typeof fragment.user_id}), content = "${fragment.content.substring(0, 30)}..."`);
      });
      
      // Get all users
      const [users] = await connection.query(`
        SELECT id, username, name
        FROM users
        ORDER BY id ASC
      `);
      
      console.log('\n=== USERS IN DATABASE ===');
      users.forEach(user => {
        console.log(`User #${user.id}: "${user.username}" (${typeof user.id})`);
        
        // Check which fragments this user should own
        const ownedFragments = fragments.filter(fragment => 
          String(fragment.user_id) === String(user.id)
        );
        
        console.log(`  - Should own ${ownedFragments.length} fragments: ${
          ownedFragments.map(f => f.id).join(', ') || 'none'
        }`);
      });
      
      console.log('\n=== SUGGESTED FIX ===');
      console.log('Make sure all user_id values in fragments table are stored in the same format as user.id');
      console.log('Convert both values to strings when comparing them in the API');
      
    } finally {
      connection.release();
      await closePool();
    }
    
    console.log('\nDebug script completed.');
  } catch (error) {
    console.error('Error debugging fragment ownership:', error);
    process.exit(1);
  }
}

debugFragmentOwnership();
