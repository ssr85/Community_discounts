import { Client } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const connectionString = `postgresql://postgres:${process.env.SUPABASE_DATABASE_PASSWORD}@db.ncijyaadahalfpolzjdx.supabase.co:5432/postgres`;

async function seedRoles() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('🔌 Connected to database.');

    // Add role column if not exists (defensive)
    await client.query(`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
    `);

    // Assign roles
    const assignments = [
      { email: 'alice@skyline.com', role: 'community_admin' },
      { email: 'david@greenvalley.com', role: 'community_admin' },
      { email: 'frank@greenvalley.com', role: 'super_admin' },
    ];

    for (const { email, role } of assignments) {
      const res = await client.query(
        'UPDATE public.users SET role = $1 WHERE email = $2',
        [role, email]
      );
      console.log(`✅ Assigned ${role} to ${email} (${res.rowCount} rows updated)`);
    }

    console.log('🎉 Role seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await client.end();
  }
}

seedRoles();
