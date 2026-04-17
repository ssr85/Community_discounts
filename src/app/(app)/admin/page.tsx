'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [communities, setCommunities] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState({
    members: 0,
    spend: 0,
    deals: 0
  });
  const [spendData, setSpendData] = useState<any[]>([]);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const [
        { data: { user } },
        { data: comms },
        { data: users },
        { data: deals },
        { data: spend }
      ] = await Promise.all([
        supabase.from('communities').select('*'),
        supabase.from('users').select('id'),
        supabase.from('group_deals').select('*'),
        supabase.from('spending_records').select('amount, category, date')
      ]);

      if (!user) {
        router.push('/login');
        return;
      }

      // Check role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userData || userData.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }

      if (comms) setCommunities(comms);
      
      setTotalStats({
        members: users?.length || 0,
        spend: spend?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0,
        deals: deals?.length || 0
      });

      // Simple aggregation for chart
      if (spend) {
        const catMap = spend.reduce((acc: any, curr: any) => {
          acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
          return acc;
        }, {});
        setSpendData(Object.entries(catMap).map(([name, value]) => ({ name, value })));
      }

      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  if (loading) return <div className="p-8 animate-pulse text-slate-400">Loading platform metrics...</div>;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
          Platform <span className="text-indigo-600">Control</span>
        </h1>
        <p className="text-slate-500 font-medium">Global oversight of CommunityDeals ecosystem.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Members', value: totalStats.members, icon: '👥', color: 'bg-blue-50 text-blue-600' },
          { label: 'Gross Community Spend', value: `₹${totalStats.spend.toLocaleString()}`, icon: '💰', color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Deals Negotiated', value: totalStats.deals, icon: '🤝', color: 'bg-purple-50 text-purple-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-xl`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Communities Table */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
             <h2 className="font-black text-slate-800 uppercase tracking-tight">Active Communities</h2>
             <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase">Total: {communities.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Members</th>
                  <th className="px-6 py-4">Est. Spend</th>
                  <th className="px-6 py-4">Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {communities.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 group-hover:text-indigo-600">{c.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{c.type}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">{c.member_count}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">₹{c.total_spend?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-slate-500">{c.city || 'Unknown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Spend Distribution */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
           <h2 className="font-black italic uppercase tracking-widest text-indigo-400 mb-8">Platform Spend Mix</h2>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendData}>
                  <XAxis dataKey="name" stroke="#6366f1" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', backgroundColor: '#1e293b', color: '#fff'}}
                  />
                  <Bar dataKey="value" fill="#818cf8" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
           </div>
           
           <div className="mt-8 space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">AI Recommendation</p>
                 <p className="text-sm text-slate-300">Platform-wide food delivery spend is up 14%. Consider bulk negotiating a global partnership with a major logistics provider.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
