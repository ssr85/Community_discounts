'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

type Member = {
  id: string;
  user_id: string;
  joined_at: string;
  data_shared: boolean;
  users: {
    email: string;
    full_name: string;
  };
  total_spend: number;
  spending_records: {
    platform: string;
    amount: number;
  }[];
};

export default function CommunityAdminPage() {
  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Check if user is community admin
    const { data: membership } = await supabase
      .from('community_members')
      .select('is_admin, communities(*)')
      .eq('user_id', user.id)
      .eq('is_admin', true)
      .limit(1)
      .single();

    if (!membership?.communities) {
      setLoading(false);
      return;
    }

    const communityData = membership.communities as any;
    setCommunity(communityData);

    // Get all community members with their spend data
    const { data: membersData } = await supabase
      .from('community_members')
      .select('*, users(*), spending_records(*)')
      .eq('community_id', communityData.id);

    // Process members to calculate total spend
    const processed = (membersData || []).map((m: any) => ({
      ...m,
      total_spend: m.spending_records?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0
    }));

    setMembers(processed);
    setLoading(false);
  }

  if (loading) return <div className="p-8 animate-pulse text-slate-400">Loading community data...</div>;

  if (!community) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Access Denied</h2>
        <p className="text-slate-500 text-sm">You are not an admin of any community.</p>
      </div>
    );
  }

  const totalSocietySpend = members.reduce((sum, m) => sum + m.total_spend, 0);

  // Calculate platform spend from all members
  const platformSpend = members.reduce((acc: Record<string, number>, m) => {
    m.spending_records?.forEach((r: any) => {
      acc[r.platform] = (acc[r.platform] || 0) + Number(r.amount);
    });
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
          {community.name}
        </h1>
        <p className="text-slate-500 font-medium">Community Admin Panel</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Members</div>
          <div className="text-3xl font-black text-slate-900">{members.length}</div>
        </div>
        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Society Total</div>
          <div className="text-3xl font-black text-emerald-600">₹{totalSocietySpend.toLocaleString()}</div>
        </div>
        <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
          <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Your Commission</div>
          <div className="text-3xl font-black text-indigo-600">-</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Members Table */}
        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h2 className="font-black text-slate-800 uppercase tracking-tight">Members</h2>
            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase">
              {members.length} total
            </span>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Spend</th>
                  <th className="px-6 py-4">% of Society</th>
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {members.map((m: Member) => (
                  <tr 
                    key={m.id} 
                    onClick={() => setSelectedMember(m)}
                    className="hover:bg-indigo-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{m.users?.full_name || m.users?.email}</p>
                      <p className="text-[10px] text-slate-400">{m.users?.email}</p>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">₹{m.total_spend.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {totalSocietySpend > 0 ? ((m.total_spend / totalSocietySpend) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{new Date(m.joined_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Spend Breakdown */}
        <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
          <h2 className="font-black italic uppercase tracking-widest text-indigo-400 mb-6">Society Spend by Platform</h2>
          <div className="space-y-4">
            {Object.entries(platformSpend).map(([platform, amount]) => (
              <div key={platform} className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                <span className="font-bold">{platform}</span>
                <span className="font-mono font-black text-indigo-400">₹{amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {selectedMember.users?.full_name || 'Member'}
                </h2>
                <p className="text-sm text-slate-500">{selectedMember.users?.email}</p>
              </div>
              <button 
                onClick={() => setSelectedMember(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Their Spend */}
              <div className="p-4 bg-indigo-50 rounded-xl">
                <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Their Total Spend</div>
                <div className="text-3xl font-black text-indigo-600">₹{selectedMember.total_spend.toLocaleString()}</div>
              </div>

              {/* Their Contribution */}
              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">% of Society</div>
                <div className="text-2xl font-black text-emerald-600">
                  {totalSocietySpend > 0 ? ((selectedMember.total_spend / totalSocietySpend) * 100).toFixed(1) : 0}%
                </div>
              </div>

              {/* Their Spend by Platform */}
              <div>
                <div className="text-sm font-bold text-slate-700 mb-2">Their Spend by Platform</div>
                <div className="space-y-2">
                  {selectedMember.spending_records && (
                    <>
                      {(() => {
                        const theirPlatform: Record<string, number> = {};
                        selectedMember.spending_records.forEach((r: any) => {
                          theirPlatform[r.platform] = (theirPlatform[r.platform] || 0) + Number(r.amount);
                        });
                        return Object.entries(theirPlatform).map(([plat, amt]) => (
                          <div key={plat} className="flex justify-between text-sm p-2 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">{plat}</span>
                            <span className="font-mono font-bold">₹{amt.toLocaleString()}</span>
                          </div>
                        ));
                      })()}
                    </>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setSelectedMember(null)}
                className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}