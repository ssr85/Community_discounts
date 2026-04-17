import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Service role client to bypass auth confirms and create users
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('🚀 Starting test user creation...');

  const communities = [
    { name: 'Skyline Apartments', city: 'Pune', pincode: '411001' },
    { name: 'Green Valley Society', city: 'Pune', pincode: '411007' }
  ];

  const communityIds: string[] = [];

  // 1. Create Communities
  for (const comm of communities) {
    const { data, error } = await supabase
      .from('communities')
      .insert({
        name: comm.name,
        type: 'residential',
        city: comm.city,
        pincode: comm.pincode
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating community ${comm.name}:`, error);
      continue;
    }
    console.log(`✅ Community "${comm.name}" created with ID: ${data.id}`);
    communityIds.push(data.id);
  }

  if (communityIds.length < 2) {
    console.error('Failed to create both communities. Exiting.');
    return;
  }

  const password = 'Password123';
  const usersToCreate = [
    { email: 'alice@skyline.com', name: 'Alice Smith', communityId: communityIds[0] },
    { email: 'bob@skyline.com', name: 'Bob Johnson', communityId: communityIds[0] },
    { email: 'charlie@skyline.com', name: 'Charlie Brown', communityId: communityIds[0] },
    { email: 'david@greenvalley.com', name: 'David Wilson', communityId: communityIds[1] },
    { email: 'eve@greenvalley.com', name: 'Eve Davis', communityId: communityIds[1] },
    { email: 'frank@greenvalley.com', name: 'Frank Miller', communityId: communityIds[1] }
  ];

  // 2. Create Users and Link to Communities
  for (const u of usersToCreate) {
    console.log(`Creating user ${u.email}...`);
    
    // Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: u.name }
    });

    if (authError) {
      console.error(`Error creating auth user ${u.email}:`, authError);
      continue;
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user created: ${userId}`);

    // Link user to community
    // Note: public.users record should be created by trigger on_auth_user_created
    // Let's wait a small bit if needed, or just insert
    
    // Sometimes triggers take a millisecond, but the next query should be fine
    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        community_id: u.communityId,
        user_id: userId,
        data_shared: true
      });

    if (memberError) {
      console.error(`Error linking user ${u.email} to community:`, memberError);
    } else {
      console.log(`✅ Linked ${u.email} to their community.`);
    }
  }

  console.log('\n🎉 Finished creating 6 users across 2 communities!');
  console.log(`Common Password for all users: ${password}`);
}

createTestUsers();
