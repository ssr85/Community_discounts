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

async function seedDiversifiedData() {
  console.log('🚀 Starting diversified community and deal seeding...');

  // 1. Create 3 New Communities
  const newCommunities = [
    { name: 'Palm Grove Residency', city: 'Pune', pincode: '411004', focus: 'grocery' },
    { name: 'Crestview Heights', city: 'Pune', pincode: '411014', focus: 'dine_out' },
    { name: 'Oakwood Enclave', city: 'Pune', pincode: '411027', focus: 'food' }
  ];

  const communityMap: Record<string, string> = {};

  for (const comm of newCommunities) {
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
    communityMap[comm.name] = data.id;
  }

  // Add existing communities to the map
  const skylineCommId = '3e7fe201-b273-48fe-b8a0-db43cee5b88d';
  const greenValleyCommId = 'd73e94bd-539b-4864-aff2-457d308c5b52';
  communityMap['Skyline Apartments'] = skylineCommId;
  communityMap['Green Valley Society'] = greenValleyCommId;

  // 2. Create 9 New Users (3 per new community)
  const password = 'Password123';
  const usersToCreate = [
    { email: 'p1@palmgrove.com', name: 'Paul Atreides', commId: communityMap['Palm Grove Residency'] },
    { email: 'p2@palmgrove.com', name: 'Penny Hofstadter', commId: communityMap['Palm Grove Residency'] },
    { email: 'p3@palmgrove.com', name: 'Peter Parker', commId: communityMap['Palm Grove Residency'] },
    { email: 'c1@crestview.com', name: 'Clark Kent', commId: communityMap['Crestview Heights'] },
    { email: 'c2@crestview.com', name: 'Courtney Cox', commId: communityMap['Crestview Heights'] },
    { email: 'c3@crestview.com', name: 'Cynthia Rothrock', commId: communityMap['Crestview Heights'] },
    { email: 'o1@oakwood.com', name: 'Oliver Twist', commId: communityMap['Oakwood Enclave'] },
    { email: 'o2@oakwood.com', name: 'Ophelia Night', commId: communityMap['Oakwood Enclave'] },
    { email: 'o3@oakwood.com', name: 'Oscar Isaac', commId: communityMap['Oakwood Enclave'] }
  ];

  const userIds: { id: string, commId: string, focus: string }[] = [];

  for (const u of usersToCreate) {
    console.log(`Creating user ${u.email}...`);
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
    const focus = newCommunities.find(c => communityMap[c.name] === u.commId)?.focus || 'food';
    userIds.push({ id: userId, commId: u.commId, focus });

    await supabase.from('community_members').upsert({
      community_id: u.commId,
      user_id: userId,
      data_shared: true
    });
  }

  // 3. Generate Biased Transactions
  const merchants = {
    food: ['Biryani Blues', 'Social', 'Pizza Hut', 'Burger King', 'Leon Grill'],
    grocery: ['Instamart', 'BigBasket', 'Blinkit', 'Reliance Fresh'],
    dine_out: ['Atmosphere 6', 'Paasha', 'Malaka Spice', 'Toit', 'Agent Jack\'s']
  };

  const records = [];
  const now = new Date();

  for (const user of userIds) {
    const numRecords = 40;
    for (let i = 0; i < numRecords; i++) {
        // Biased selection
        let category = user.focus;
        if (Math.random() > 0.8) {
            // 20% cross-pollination
            const otherCats = Object.keys(merchants).filter(c => c !== user.focus);
            category = otherCats[Math.floor(Math.random() * otherCats.length)];
        }

        const categoryMerchants = merchants[category as keyof typeof merchants];
        const merchant = categoryMerchants[Math.floor(Math.random() * categoryMerchants.length)];
        
        const platform = category === 'dine_out' ? 'District' : (category === 'grocery' ? 'Swiggy' : (Math.random() > 0.5 ? 'Swiggy' : 'Zomato'));

        const date = new Date(now);
        date.setDate(now.getDate() - Math.floor(Math.random() * 60));

        let amount = 0;
        if (category === 'dine_out') amount = Math.floor(Math.random() * 4000) + 1500;
        else if (category === 'grocery') amount = Math.floor(Math.random() * 2000) + 500;
        else amount = Math.floor(Math.random() * 800) + 300;

        records.push({
            user_id: user.id,
            community_id: user.commId,
            date: date.toISOString().split('T')[0],
            platform: platform,
            merchant_name: merchant,
            amount: amount,
            category: category,
            source: 'csv_upload'
        });
    }
  }

  // Batch insert transactions
  const { error: recordsError } = await supabase.from('spending_records').insert(records);
  if (recordsError) console.error('Error inserting records:', recordsError);
  else console.log(`✅ Seeded ${records.length} biased transactions.`);

  // 4. Inject Representative Deals
  const deals = [
    { 
        community_id: communityMap['Palm Grove Residency'], 
        merchant_name: 'Instamart', 
        title: 'Bulk Grocery Savings', 
        description: 'Exclusive 25% off on orders above ₹2000 for Palm Grove residents.', 
        discount_pct: 25, 
        min_orders: 10,
        status: 'pending'
    },
    { 
        community_id: communityMap['Crestview Heights'], 
        merchant_name: 'Atmosphere 6', 
        title: 'Luxury Dining Night', 
        description: 'Complimentary drinks and 30% off total bill for groups from Crestview.', 
        discount_pct: 30, 
        min_orders: 5,
        status: 'pending'
    },
    { 
        community_id: communityMap['Oakwood Enclave'], 
        merchant_name: 'Barkaas', 
        title: 'Gourmet Biryani Special', 
        description: 'Flat ₹500 off on bulk Zomato orders for Oakwood community.', 
        discount_pct: 20, 
        min_orders: 15,
        status: 'pending'
    },
    { 
        community_id: communityMap['Skyline Apartments'], 
        merchant_name: 'Swiggy Selects', 
        title: 'Skyline Swiggy Fiesta', 
        description: 'Unlock 20% site-wide discount when 20 neighbors join.', 
        discount_pct: 20, 
        min_orders: 20,
        status: 'pending'
    },
    { 
        community_id: communityMap['Green Valley Society'], 
        merchant_name: 'Zomato Gold', 
        title: 'Green Valley Gold Rush', 
        description: 'Group subscription discount for Zomato Gold.', 
        discount_pct: 15, 
        min_orders: 12,
        status: 'pending'
    }
  ];

  const { error: dealsError } = await supabase.from('group_deals').insert(deals);
  if (dealsError) console.error('Error inserting deals:', dealsError);
  else console.log('✅ Seeded 5 unique platform-specific deals.');

  console.log('\n🎉 Finished diversifying the world of Community Discounts!');
}

seedDiversifiedData();
