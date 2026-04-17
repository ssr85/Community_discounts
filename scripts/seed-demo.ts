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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🚀 Starting demo seeding...');

  // 1. Create Demo User
  const demoUserId = '00000000-0000-0000-0000-000000000001';
  const { error: userError } = await supabase.from('users').upsert({
    id: demoUserId,
    email: 'demo@communitydeals.io',
    full_name: 'Demo Admin',
    pincode: '411001'
  });

  if (userError) {
    console.error('Error seeding user:', userError);
    return;
  }
  console.log('✅ Demo user seeded');

  // 2. Create Community
  const { data: community, error: communityError } = await supabase.from('communities').upsert({
    name: 'Koregaon Park Residents',
    type: 'residential',
    pincode: '411001',
    city: 'Pune',
    admin_id: demoUserId
  }).select().single();

  if (communityError) {
    console.error('Error seeding community:', communityError);
    return;
  }
  const communityId = community.id;
  console.log('✅ Community "Koregaon Park Residents" seeded');

  // 3. Link User to Community
  await supabase.from('community_members').upsert({
    community_id: communityId,
    user_id: demoUserId,
    data_shared: true
  });
  console.log('✅ User linked to community');

  // 4. Generate Spending Records
  const merchants = [
    { name: 'Biryani Blues', category: 'food_delivery', platform: 'Swiggy' },
    { name: 'Starbucks', category: 'food_delivery', platform: 'Zomato' },
    { name: 'Blinkit', category: 'grocery', platform: 'Blinkit' },
    { name: 'BigBasket', category: 'grocery', platform: 'BigBasket' },
    { name: 'Urban Company', category: 'home_services', platform: 'Urban Company' },
    { name: 'Swiggy Genie', category: 'home_services', platform: 'Swiggy' },
    { name: 'The Good Bowl', category: 'food_delivery', platform: 'Swiggy' },
    { name: 'Pizza Hut', category: 'food_delivery', platform: 'Zomato' }
  ];

  const records = [];
  const now = new Date();

  for (let i = 0; i < 150; i++) {
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const date = new Date(now);
    date.setDate(now.getDate() - Math.floor(Math.random() * 30)); // Last 30 days

    records.push({
      user_id: demoUserId,
      community_id: communityId,
      date: date.toISOString().split('T')[0],
      platform: merchant.platform,
      merchant_name: merchant.name,
      amount: Math.floor(Math.random() * 1500) + 200, // ₹200 to ₹1700
      category: merchant.category,
      source: 'csv_upload'
    });
  }

  const { error: recordsError } = await supabase.from('spending_records').insert(records);

  if (recordsError) {
    console.error('Error seeding records:', recordsError);
    return;
  }
  console.log(`✅ Successfully seeded ${records.length} spending records`);

  console.log('🎉 Seeding complete!');
}

seed();
