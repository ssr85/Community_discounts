import { NextResponse } from 'next/server';
import { generateDeals } from '../../../../../skills/deal-orchestrator/provider';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    console.log('📡 API: Triggering AI analysis for deals...');

    // 1. Get the first community for the demo
    const { data: communities, error: communityError } = await supabaseAdmin
      .from('communities')
      .select('id, name')
      .limit(1)
      .single();

    if (communityError || !communities) {
      return NextResponse.json({ error: 'No community found for demo.' }, { status: 404 });
    }

    const communityId = communities.id;
    console.log(`🏠 Community identified: ${communities.name} (${communityId})`);

    // 2. Clear old demo deals if any (optional, but good for refresh demo)
    await supabaseAdmin
      .from('group_deals')
      .delete()
      .eq('community_id', communityId)
      .eq('ai_generated', true);

    // 3. Generate new deals via the AI Skill
    const deals = await generateDeals(communityId);

    if (!deals || deals.length === 0) {
      return NextResponse.json({ message: 'No deals generated from data.' });
    }

    // 4. Save deals to Supabase
    const dealsToInsert = deals.map((d: any) => ({
      community_id: communityId,
      merchant_name: d.merchant_name,
      title: d.title,
      description: d.description,
      discount_pct: d.discount_pct,
      min_orders: d.min_orders,
      status: 'pending',
      ai_generated: true,
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Valid for 7 days
    }));

    const { error: insertError } = await supabaseAdmin
      .from('group_deals')
      .insert(dealsToInsert);

    if (insertError) {
      console.error('Error saving deals:', insertError);
      return NextResponse.json({ error: 'Failed to save generated deals.' }, { status: 500 });
    }

    console.log(`✨ Successfully saved ${dealsToInsert.length} deals to Supabase.`);

    return NextResponse.json({
      success: true,
      deals_count: dealsToInsert.length,
      deals: dealsToInsert
    });

  } catch (error: any) {
    console.error('💥 API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
