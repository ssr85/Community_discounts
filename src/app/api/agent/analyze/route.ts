import { createServerSupabaseClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { community_id } = await request.json();
  if (!community_id) return NextResponse.json({ error: 'community_id required' }, { status: 400 });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [{ data: community }, { data: records }, { count: memberCount }] = await Promise.all([
    supabase.from('communities').select('name, city').eq('id', community_id).single(),
    supabase.from('spending_records').select('amount, platform, merchant_name, category')
      .eq('community_id', community_id).gte('date', thirtyDaysAgo.toISOString().split('T')[0]),
    supabase.from('community_members').select('*', { count: 'exact', head: true }).eq('community_id', community_id),
  ]);

  if (!records?.length) return NextResponse.json({ error: 'No spending data yet' }, { status: 400 });

  const merchantTotals: Record<string, number> = {};
  records.forEach(r => {
    merchantTotals[r.merchant_name] = (merchantTotals[r.merchant_name] || 0) + Number(r.amount);
  });
  const topMerchants = Object.entries(merchantTotals).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const totalSpend = records.reduce((s, r) => s + Number(r.amount), 0);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a community savings advisor. Analyze spending data and identify group deal opportunities.
Output JSON with a "deals" array. Each deal: { merchant_name, title, description, discount_pct (number), min_orders (number), monthly_spend (number), projected_annual_savings (number) }.
Be specific with numbers. Prioritize by savings potential. Return exactly 3 deals.`,
      },
      {
        role: 'user',
        content: `Community: ${community?.name} in ${community?.city}
Members: ${memberCount}
Last 30 days total spend: ₹${totalSpend.toFixed(0)}
Top merchants by spend: ${topMerchants.map(([name, amt]) => `${name}: ₹${amt.toFixed(0)}`).join(', ')}

Identify 3 group deal opportunities.`,
      },
    ],
  });

  const result = JSON.parse(completion.choices[0].message.content ?? '{"deals":[]}');

  const insights = result.deals.map((d: Record<string, unknown>) => ({
    community_id,
    insight_type: 'deal_opportunity',
    title: d.title,
    body: d.description,
    data: d,
  }));

  await supabase.from('ai_insights').insert(insights);

  const dealRows = result.deals.map((d: Record<string, unknown>) => ({
    community_id,
    merchant_name: d.merchant_name,
    title: d.title as string,
    description: d.description as string,
    discount_pct: d.discount_pct,
    min_orders: d.min_orders,
    ai_generated: true,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  await supabase.from('group_deals').insert(dealRows);

  return NextResponse.json({ deals: result.deals, inserted: dealRows.length });
}
