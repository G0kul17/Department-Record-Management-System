// Verify hackathons table exists
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function verify() {
  try {
    const result = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'hackathons')"
    );
    console.log('✅ Hackathons table exists:', result.rows[0].exists);
    
    // Get count
    const count = await pool.query('SELECT COUNT(*) FROM hackathons');
    console.log('📊 Current entries:', count.rows[0].count);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verify();
