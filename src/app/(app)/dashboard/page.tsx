'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

export default function Dashboard() {
  const [deals, setDeals] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [userSpend, setUserSpend] = useState<number>(0);
  const [communityBadge, setCommunityBadge] = useState<{members: number; savings: number}>({members: 0, savings: 0});
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    
    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
    
    // Calculate date filter
    let fromDate = new Date();
    if (timeRange === '7d') fromDate.setDate(fromDate.getDate() - 7);
    else if (timeRange === '30d') fromDate.setDate(fromDate.getDate() - 30);
    else if (timeRange === '90d') fromDate.setDate(fromDate.getDate() - 90);
    else fromDate = new Date('2000-01-01');
    const dateStr = fromDate.toISOString().split('T')[0];
    
    // Get user's community membership
    let communityId: string | null = null;
    if (currentUser) {
      const { data: membership } = await supabase
        .from('community_members')
        .select('community_id, communities(name)')
        .eq('user_id', currentUser.id)
        .limit(1)
        .single();
      if (membership?.community_id) {
        communityId = membership.community_id;
      }
    }
    
    // Fetch Deals
    const { data: dealsData } = await supabase
      .from('group_deals')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Fetch user's spend for selected period
    const { data: userSpendData } = await supabase
      .from('spending_records')
      .select('amount, date')
      .eq('user_id', currentUser?.id)
      .gte('date', dateStr);
    
    const totalUserSpend = userSpendData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
    setUserSpend(totalUserSpend);
    
    // Fetch Aggregated Stats for Charts (user's data only)
    const { data: spendData } = await supabase
      .from('spending_records')
      .select('merchant_name, amount, category, date')
      .eq('user_id', currentUser?.id)
      .gte('date', dateStr);

    if (spendData) {
      const merchantAgg = spendData.reduce((acc: any, curr: any) => {
        const existing = acc.find((a: any) => a.name === curr.merchant_name);
        if (existing) {
          existing.value += Number(curr.amount);
        } else {
          acc.push({ name: curr.merchant_name, value: Number(curr.amount) });
        }
        return acc;
      }, []);
      setStats(merchantAgg.sort((a: any, b: any) => b.value - a.value).slice(0, 5));
    }

    if (dealsData) setDeals(dealsData);
    
    // Get community badge data (member count and savings)
    if (communityId) {
      const [{ data: members }, { data: activeDeals }] = await Promise.all([
        supabase.from('community_members').select('user_id').eq('community_id', communityId),
        supabase.from('group_deals').select('discount_pct, current_orders, min_orders').eq('community_id', communityId).eq('status', 'active'),
      ]);
      
      const potentialSavings = activeDeals?.reduce((sum, d) => {
        const avgOrder = 500;
        return sum + (d.current_orders * d.discount_pct * avgOrder / 100);
      }, 0) || 0;
      
      setCommunityBadge({
        members: members?.length || 0,
        savings: potentialSavings,
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/agent/analyze', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Header with Stats Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Community Dashboard
          </h1>
          <p className="text-slate-500 text-sm">Real-time spending insights and AI-negotiated deals.</p>
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold transition-all shadow-sm ${
            analyzing 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-200'
          }`}
        >
          {analyzing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              AI Analyzing...
            </>
          ) : (
            <>
              <span className="text-lg">✨</span>
              Generate New Deals
            </>
          )}
        </button>
      </div>

      {/* Timeline Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Your Spend:</span>
        {(['7d', '30d', '90d', 'all'] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
              timeRange === range 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Gamified Badge - Member Count & Savings */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🎉</div>
            <div>
              <div className="text-lg font-black">
                {communityBadge.members} members from your community joined
              </div>
              <div className="text-indigo-200 text-sm">
                💰 ₹{communityBadge.savings.toLocaleString()} potential savings unlocked
              </div>
            </div>
          </div>
          <button className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-opacity-90 active:scale-95">
            + Invite Neighbor
          </button>
        </div>
      </div>

      {/* User Spend Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-sm text-slate-500">Your cumulative spend ({timeRange === '7d' ? '7 Days' : timeRange === '30d' ? '30 Days' : timeRange === '90d' ? '90 Days' : 'All Time'})</div>
        <div className="text-3xl font-bold text-slate-900">₹{userSpend.toLocaleString()}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Deals Feed */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Recommended Group Deals
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] uppercase tracking-widest rounded-full">AI Powered</span>
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-3xl border border-slate-100" />)}
            </div>
          ) : deals.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 text-sm italic">No deals generated yet. Click "Generate New Deals" to trigger the analyzer.</p>
            </div>
          ) : (
            deals.map((deal) => (
              <div 
                key={deal.id}
                className="group bg-white border border-slate-200 p-6 rounded-[2rem] hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-2xl font-black">
                    {deal.merchant_name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tighter">
                        {deal.title}
                      </h3>
                      <div className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                        {deal.discount_pct}% OFF
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed mb-4">
                       {deal.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                       <div className="flex items-center gap-8">
                         <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Threshold</p>
                            <p className="font-mono text-sm font-bold text-slate-700">{deal.min_orders} Households</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Current</p>
                            <p className="font-mono text-sm font-bold text-indigo-600 italic">Pre-Active</p>
                         </div>
                       </div>
                       <button className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200">
                         Commit Intent
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Spending Stats */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Spend Concentration</h3>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    width={80}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 space-y-3">
               {stats.slice(0, 3).map((s, i) => (
                 <div key={s.name} className="flex items-center justify-between text-xs">
                   <span className="text-slate-500 font-bold flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                     {s.name}
                   </span>
                   <span className="font-mono font-black text-slate-900 uppercase">₹{Math.round(s.value).toLocaleString()}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            </div>
            <h3 className="text-xl font-black italic mb-2 tracking-tighter uppercase">Viral Savings</h3>
            <p className="text-indigo-100 text-sm mb-6 leading-snug">
              Every neighbor you invite increases the collective power. You're currently <span className="font-bold text-white">4 invites away</span> from boosting all rewards by 5%.
            </p>
            <button className="w-full py-3 bg-white text-indigo-600 font-black rounded-2xl text-sm transition-transform hover:-translate-y-1 active:scale-95">
              Invite to Society
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
