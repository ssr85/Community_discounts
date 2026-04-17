'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

type Deal = {
  id: string;
  merchant_name: string;
  title: string;
  description: string;
  discount_pct: number;
  min_orders: number;
  current_orders: number;
  status: string;
  valid_until: string;
  hasJoined?: boolean;
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => { loadDeals(); }, []);

  async function loadDeals() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership) { setLoading(false); return; }
    setCommunityId(membership.community_id);

    const [{ data: dealsData }, { data: bookings }] = await Promise.all([
      supabase.from('group_deals').select('*').eq('community_id', membership.community_id).order('created_at', { ascending: false }),
      supabase.from('deal_bookings').select('deal_id').eq('user_id', user.id),
    ]);

    const joinedIds = new Set(bookings?.map(b => b.deal_id) ?? []);
    setDeals((dealsData ?? []).map(d => ({ ...d, hasJoined: joinedIds.has(d.id) })));
    setLoading(false);

    // Real-time updates
    supabase.channel('deals').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'group_deals', filter: `community_id=eq.${membership.community_id}` },
      (payload) => {
        setDeals(prev => prev.map(d => d.id === (payload.new as Deal).id ? { ...d, ...(payload.new as Deal) } : d));
      }
    ).subscribe();
  }

  async function joinDeal(dealId: string) {
    setJoining(dealId);
    const res = await fetch('/api/deals/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_id: dealId }),
    });
    if (res.ok) {
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, hasJoined: true, current_orders: d.current_orders + 1 } : d));
    }
    setJoining(null);
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>;

  if (!communityId) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">🤝</div>
        <p className="text-gray-500 text-sm">Join a community first to see group deals.</p>
        <a href="/community" className="inline-block mt-4 bg-green-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-green-700">
          Set up community
        </a>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">✨</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No deals yet</h2>
        <p className="text-gray-500 text-sm mb-4">Upload spending data and generate AI deals from your dashboard.</p>
        <a href="/dashboard" className="inline-block bg-green-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-green-700">
          Go to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Group Deals</h1>
      <div className="grid gap-4">
        {deals.map(deal => {
          const progress = Math.min((deal.current_orders / deal.min_orders) * 100, 100);
          const isActive = deal.status === 'active';
          return (
            <div key={deal.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isActive ? '✓ Active' : 'Pending'}
                    </span>
                    <span className="text-xs text-gray-400">{deal.merchant_name}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{deal.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{deal.description}</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className="text-3xl font-bold text-green-600">{deal.discount_pct}%</div>
                  <div className="text-xs text-gray-400">discount</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{deal.current_orders} joined</span>
                  <span>{deal.min_orders} needed</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isActive ? 'bg-green-500' : 'bg-yellow-400'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => joinDeal(deal.id)}
                disabled={deal.hasJoined || joining === deal.id || isActive}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  deal.hasJoined
                    ? 'bg-gray-100 text-gray-500 cursor-default'
                    : isActive
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                }`}
              >
                {deal.hasJoined ? '✓ You joined' : isActive ? '🎉 Deal activated!' : joining === deal.id ? 'Joining...' : 'Join this deal'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
