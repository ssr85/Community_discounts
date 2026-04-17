import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { invite_code } = await request.json();
  if (!invite_code) return NextResponse.json({ error: 'Invite code required' }, { status: 400 });

  const { data: community, error } = await supabase
    .from('communities')
    .select('*')
    .eq('invite_code', invite_code)
    .single();

  if (error || !community) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });

  const { error: joinError } = await supabase.from('community_members').insert({
    community_id: community.id,
    user_id: user.id,
    data_shared: true,
  });

  if (joinError) {
    if (joinError.code === '23505') return NextResponse.json({ error: 'Already a member' }, { status: 409 });
    return NextResponse.json({ error: joinError.message }, { status: 500 });
  }

  return NextResponse.json({ community });
}
