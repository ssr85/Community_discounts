import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const connectionString = `postgresql://postgres:${process.env.SUPABASE_DATABASE_PASSWORD}@db.ncijyaadahalfpolzjdx.supabase.co:5432/postgres`;

async function applySchema() {
  console.log('📖 Reading schema.sql...');
  const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  // We need to clean up the SQL a bit for pg
  // Remove triggers that might already exist or handled by SECURITY DEFINER properly
  // Actually, pg.query can handle multiple statements if separated by semicolons
  
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('🚀 Executing migration...');
    await client.query(sql);
    console.log('✅ Migration successful!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySchema();
