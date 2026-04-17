import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { records, community_id } = await request.json();
  if (!records?.length) return NextResponse.json({ error: 'No records provided' }, { status: 400 });

  const rows = records.map((r: Record<string, string>) => ({
    user_id: user.id,
    community_id,
    date: r.date || r.Date || r.ORDER_DATE,
    platform: r.platform || r.Platform || 'Manual',
    merchant_name: r.merchant_name || r.Restaurant || r.RESTAURANT_NAME || r.merchant || 'Unknown',
    amount: parseFloat(r.amount || r.Amount || r.ORDER_TOTAL || r.total || '0'),
    category: r.category || 'food_delivery',
    source: 'csv_upload',
  })).filter((r: { amount: number }) => r.amount > 0);

  const { error } = await supabase.from('spending_records').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: rows.length });
}
