import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { deal_id } = await request.json();
  if (!deal_id) return NextResponse.json({ error: 'deal_id required' }, { status: 400 });

  const { error } = await supabase.from('deal_bookings').insert({ deal_id, user_id: user.id });

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already joined' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: deal } = await supabase
    .from('group_deals')
    .select('current_orders, min_orders, status')
    .eq('id', deal_id)
    .single();

  return NextResponse.json({ success: true, deal });
}
