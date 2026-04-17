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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedDashboardData() {
  console.log('🚀 Starting intensive dashboard data seeding...');

  // 1. Define Communities (mapping from current state)
  const skylineCommId = '3e7fe201-b273-48fe-b8a0-db43cee5b88d';
  const greenValleyCommId = 'd73e94bd-539b-4864-aff2-457d308c5b52';

  // 2. Create 4 New Users
  const password = 'Password123';
  const newUsers = [
    { email: 'george@skyline.com', name: 'George Harrison', commId: skylineCommId, pincode: '411002' },
    { email: 'hannah@skyline.com', name: 'Hannah Montana', commId: skylineCommId, pincode: '411001' },
    { email: 'ian@greenvalley.com', name: 'Ian Wright', commId: greenValleyCommId, pincode: '411007' },
    { email: 'julia@greenvalley.com', name: 'Julia Roberts', commId: greenValleyCommId, pincode: '411008' }
  ];

  const userIds: { id: string, commId: string }[] = [];

  for (const u of newUsers) {
    console.log(`Creating user ${u.email}...`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: u.name }
    });

    if (authError) {
      console.error(`Error creating auth user ${u.email}:`, authError);
      // If user already exists, try to get their ID
      const { data: existingUser } = await supabase.from('users').select('id').eq('email', u.email).single();
      if (existingUser) {
        userIds.push({ id: existingUser.id, commId: u.commId });
      }
      continue;
    }

    const userId = authData.user.id;
    userIds.push({ id: userId, commId: u.commId });

    // Link and set pincode
    await supabase.from('users').update({ pincode: u.pincode }).eq('id', userId);
    await supabase.from('community_members').upsert({
      community_id: u.commId,
      user_id: userId,
      data_shared: true
    });
  }

  // Also include the 6 users we created earlier
  const existingEmails = [
    'alice@skyline.com', 'bob@skyline.com', 'charlie@skyline.com',
    'david@greenvalley.com', 'eve@greenvalley.com', 'frank@greenvalley.com'
  ];
  
  const { data: existingUsersData } = await supabase
    .from('users')
    .select('id, email, community_members(community_id)')
    .in('email', existingEmails);

  if (existingUsersData) {
    existingUsersData.forEach(u => {
      if (u.community_members && u.community_members[0]) {
        userIds.push({ id: u.id, commId: u.community_members[0].community_id });
      }
    });
  }

  console.log(`Seeding data for ${userIds.length} users...`);

  // 3. Define Platforms and Merchants
  const platforms = [
    { name: 'Swiggy', categories: ['food', 'grocery'] },
    { name: 'Zomato', categories: ['food'] },
    { name: 'District', categories: ['dine_out'] }
  ];

  const merchants = {
    food: ['Biryani Blues', 'Barkaas', 'Social', 'The Good Bowl', 'Pizza Hut', 'Subway', 'Burger King', 'Leon Grill'],
    grocery: ['Instamart', 'BigBasket', 'Blinkit', 'Reliance Fresh', 'Star Market'],
    dine_out: ['Atmosphere 6', 'Paasha', 'Malaka Spice', 'The Daily', 'Effingut', 'Toit', 'Agent Jack\'s']
  };

  const records = [];
  const now = new Date();

  // Generate records for each user
  for (const user of userIds) {
    // Generate ~40-50 records per user over 90 days
    const numRecords = Math.floor(Math.random() * 20) + 40;
    
    for (let i = 0; i < numRecords; i++) {
        const platformObj = platforms[Math.floor(Math.random() * platforms.length)];
        const category = platformObj.categories[Math.floor(Math.random() * platformObj.categories.length)];
        const categoryMerchants = merchants[category as keyof typeof merchants];
        const merchant = categoryMerchants[Math.floor(Math.random() * categoryMerchants.length)];
        
        const date = new Date(now);
        date.setDate(now.getDate() - Math.floor(Math.random() * 90));

        let amount = 0;
        if (category === 'dine_out') amount = Math.floor(Math.random() * 5000) + 1500;
        else if (category === 'grocery') amount = Math.floor(Math.random() * 2500) + 500;
        else amount = Math.floor(Math.random() * 800) + 200;

        records.push({
            user_id: user.id,
            community_id: user.commId,
            date: date.toISOString().split('T')[0],
            platform: platformObj.name,
            merchant_name: merchant,
            amount: amount,
            category: category,
            source: 'csv_upload'
        });
    }
  }

  // Batch insert to avoid huge requests
  const chunkSize = 100;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error } = await supabase.from('spending_records').insert(chunk);
    if (error) {
      console.error('Error inserting chunk:', error);
    } else {
      console.log(`✅ Seeded chunk ${i / chunkSize + 1} (${chunk.length} records)`);
    }
  }

  console.log(`\n🎉 Total seeded records: ${records.length}`);
  console.log('🎉 Seeding complete!');
}

seedDashboardData();
