import { createServerSupabaseClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const communityId = new URL(request.url).searchParams.get('community_id');
  if (!communityId) return NextResponse.json({ error: 'community_id required' }, { status: 400 });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: records } = await supabase
    .from('spending_records')
    .select('amount, platform, merchant_name, category, date')
    .eq('community_id', communityId)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

  if (!records) return NextResponse.json({ totalSpend: 0, byPlatform: {}, topMerchants: [], memberCount: 0 });

  const totalSpend = records.reduce((s, r) => s + Number(r.amount), 0);

  const byPlatform: Record<string, number> = {};
  records.forEach(r => {
    byPlatform[r.platform] = (byPlatform[r.platform] || 0) + Number(r.amount);
  });

  const merchantMap: Record<string, number> = {};
  records.forEach(r => {
    merchantMap[r.merchant_name] = (merchantMap[r.merchant_name] || 0) + Number(r.amount);
  });
  const topMerchants = Object.entries(merchantMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, amount]) => ({ name, amount }));

  const { count: memberCount } = await supabase
    .from('community_members')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', communityId);

  return NextResponse.json({ totalSpend, byPlatform, topMerchants, memberCount: memberCount ?? 0 });
}
