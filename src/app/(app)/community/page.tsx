'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

type Community = {
  id: string;
  name: string;
  type: string;
  city: string;
  invite_code: string;
  member_count: number;
  total_spend: number;
};

export default function CommunityPage() {
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [inviteCode, setInviteCode] = useState('');
  const [form, setForm] = useState({ name: '', type: 'residential', city: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCommunity();
  }, []);

  async function loadCommunity() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('community_members')
      .select('communities(*)')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (data?.communities) setCommunity(data.communities as unknown as Community);
    setLoading(false);
  }

  async function joinCommunity() {
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/community/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_code: inviteCode.trim().toUpperCase() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSubmitting(false); return; }
    setCommunity(data.community);
    setSubmitting(false);
  }

  async function createCommunity() {
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/community/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSubmitting(false); return; }
    setCommunity(data.community);
    setSubmitting(false);
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>;

  if (community) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Community</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-md">
          <div className="text-xl font-semibold text-gray-900 mb-1">{community.name}</div>
          <div className="text-sm text-gray-500 mb-4 capitalize">{community.type} · {community.city}</div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-700">{community.member_count}</div>
              <div className="text-xs text-green-600 mt-1">Members</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-700">₹{(community.total_spend / 1000).toFixed(1)}k</div>
              <div className="text-xs text-blue-600 mt-1">Community Spend</div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Invite Code</span>
            <span className="font-mono font-bold text-gray-900 tracking-widest">{community.invite_code}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Join or Create a Community</h1>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-md">
        <div className="flex gap-2 mb-6">
          {(['join', 'create'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'join' ? 'Join with Code' : 'Create New'}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}

        {tab === 'join' ? (
          <div className="space-y-4">
            <input
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder="Enter invite code (e.g. A1B2C3D4)"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={joinCommunity}
              disabled={submitting || !inviteCode}
              className="w-full bg-green-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Joining...' : 'Join Community'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Community name (e.g. Koregaon Park Society)"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="residential">Residential Society</option>
              <option value="office">Office Building</option>
              <option value="area">Neighborhood</option>
            </select>
            <input
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              placeholder="City"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={createCommunity}
              disabled={submitting || !form.name || !form.city}
              className="w-full bg-green-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
