'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import CsvUploader from '@/components/CsvUploader';

type Analytics = {
  totalSpend: number;
  byPlatform: Record<string, number>;
  topMerchants: { name: string; amount: number }[];
  memberCount: number;
};

type Community = { id: string; name: string };

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed'];

export default function DashboardPage() {
  const [community, setCommunity] = useState<Community | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('community_members')
      .select('communities(id, name)')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!data?.communities) { setLoading(false); return; }
    const c = data.communities as unknown as Community;
    setCommunity(c);

    const res = await fetch(`/api/analytics/community?community_id=${c.id}`);
    if (res.ok) setAnalytics(await res.json());
    setLoading(false);
  }

  async function generateDeals() {
    if (!community) return;
    setGenerating(true);
    setGenMessage('');
    const res = await fetch('/api/agent/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ community_id: community.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setGenMessage(`✓ ${data.inserted} deal opportunities generated! Check the Deals tab.`);
    } else {
      setGenMessage(`Error: ${data.error}`);
    }
    setGenerating(false);
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>;

  if (!community) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">🏘️</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No community yet</h2>
        <p className="text-gray-500 text-sm mb-4">Join or create a community to see your spending dashboard.</p>
        <a href="/community" className="inline-block bg-green-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-green-700">
          Set up community
        </a>
      </div>
    );
  }

  const platformData = analytics
    ? Object.entries(analytics.byPlatform).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Last 30 days</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUpload(v => !v)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showUpload ? 'Hide Upload' : '+ Upload CSV'}
          </button>
          <button
            onClick={generateDeals}
            disabled={generating || !analytics?.totalSpend}
            className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {generating ? 'Analyzing...' : '✨ Generate AI Deals'}
          </button>
        </div>
      </div>

      {genMessage && (
        <div className={`text-sm rounded-lg p-3 ${genMessage.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {genMessage}
        </div>
      )}

      {showUpload && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Upload Spending Data</h2>
          <CsvUploader
            communityId={community.id}
            onSuccess={(count) => { setShowUpload(false); loadData(); alert(`${count} records uploaded!`); }}
          />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Community Spend</div>
          <div className="text-2xl font-bold text-gray-900">
            ₹{analytics ? (analytics.totalSpend / 1000).toFixed(1) : '0'}k
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Members</div>
          <div className="text-2xl font-bold text-gray-900">{analytics?.memberCount ?? 0}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Avg per Member</div>
          <div className="text-2xl font-bold text-gray-900">
            ₹{analytics && analytics.memberCount
              ? Math.round(analytics.totalSpend / analytics.memberCount).toLocaleString()
              : '0'}
          </div>
        </div>
      </div>

      {analytics && analytics.totalSpend > 0 ? (
        <div className="grid grid-cols-2 gap-6">
          {/* Spend by Platform */}
          {platformData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Spend by Platform</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                    {platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${Number(v).toFixed(0)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Merchants */}
          {analytics.topMerchants.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Merchants</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.topMerchants.slice(0, 6)} layout="vertical">
                  <XAxis type="number" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => `₹${Number(v).toFixed(0)}`} />
                  <Bar dataKey="amount" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <div className="text-3xl mb-3">📊</div>
          <p className="text-gray-600 text-sm mb-4">No spending data yet. Upload a CSV to see your community insights.</p>
          <button onClick={() => setShowUpload(true)} className="text-green-600 text-sm font-medium hover:underline">
            Upload now →
          </button>
        </div>
      )}
    </div>
  );
}
