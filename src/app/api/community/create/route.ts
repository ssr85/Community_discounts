import { createServerSupabaseClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, type, city } = await request.json();
  if (!name || !city) return NextResponse.json({ error: 'Name and city are required' }, { status: 400 });

  const { data: community, error } = await supabase
    .from('communities')
    .insert({ name, type, city, admin_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('community_members').insert({
    community_id: community.id,
    user_id: user.id,
    data_shared: true,
  });

  return NextResponse.json({ community });
}
