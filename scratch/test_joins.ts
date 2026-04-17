import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQuery() {
  console.log('Testing communities join...');
  const { data, error } = await supabase
    .from('communities')
    .select(`
      name,
      admin_id,
      users (email, full_name)
    `)
    .not('admin_id', 'is', null)
    .limit(1);

  if (error) {
    console.error('Join error:', error);
  } else {
    console.log('Join success:', data);
  }

  console.log('\nTesting community_members join...');
  const { data: members, error: mError } = await supabase
    .from('community_members')
    .select(`
      user_id,
      communities (name),
      users (email, full_name)
    `)
    .limit(1);

  if (mError) {
    console.error('Member join error:', mError);
  } else {
    console.log('Member join success:', members);
  }
}

testQuery();
