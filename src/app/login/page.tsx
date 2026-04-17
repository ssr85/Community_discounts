'use client';

import { createClient } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [superAdmins, setSuperAdmins] = useState<{email: string; name: string}[]>([]);
  const [communityAdmins, setCommunityAdmins] = useState<{email: string; name: string; community: string; has_expenses: boolean}[]>([]);
  const [communityMembers, setCommunityMembers] = useState<{email: string; name: string; community: string}[]>([]);

  useEffect(() => {
    if (error === 'auth_failed') {
      setErrorMsg('Authentication failed. Please try again.');
    }
    loadDemoUsers();
  }, []);

  async function loadDemoUsers() {
    setFetchingUsers(true);
    
    try {
      // 1. Fetch Super Admins
      const { data: sAdmins, error: sError } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('role', 'super_admin');
      
      if (sError) console.error('Supabase Error (Super Admins):', sError);
      
      const adminEmails = new Set();
      const superAdminList = (sAdmins || []).map(a => {
        adminEmails.add(a.email);
        return {
          email: a.email,
          name: a.full_name || a.email.split('@')[0]
        };
      });
      setSuperAdmins(superAdminList);

      // 2. Fetch all users with expenses
      const { data: spenders, error: spError } = await supabase
        .from('spending_records')
        .select('user_id');
      
      if (spError) console.error('Supabase Error (Spenders):', spError);
      const usersWithExpenses = new Set(spenders?.map(s => s.user_id) || []);

      // 3. Fetch Community Admins
      const { data: admins, error: aError } = await supabase
        .from('communities')
        .select(`
          name,
          admin_id,
          users (email, full_name)
        `)
        .not('admin_id', 'is', null);

      if (aError) console.error('Supabase Error (Admins):', aError);

      const commAdminEmails = new Set();
      const adminList = (admins || [])
        .map(a => ({
          email: (a.users as any)?.email || '',
          name: (a.users as any)?.full_name || (a.users as any)?.email?.split('@')[0] || 'Admin',
          community: a.name,
          has_expenses: usersWithExpenses.has(a.admin_id)
        }))
        .filter(a => a.email && !adminEmails.has(a.email));
      
      adminList.forEach(a => commAdminEmails.add(a.email));

      setCommunityAdmins(adminList.slice(0, 4));

      // 4. Fetch Members with expenses (who are not already in admin lists)
      const { data: members, error: mError } = await supabase
        .from('community_members')
        .select(`
          user_id,
          communities (name),
          users (email, full_name)
        `)
        .limit(100);

      if (mError) console.error('Supabase Error (Members):', mError);

      const memberList = (members || [])
        .map(m => ({
          email: (m.users as any)?.email || '',
          name: (m.users as any)?.full_name || (m.users as any)?.email?.split('@')[0] || 'Member',
          community: (m.communities as any)?.name || 'Community',
          user_id: m.user_id
        }))
        .filter(m => 
          m.email && 
          !adminEmails.has(m.email) && 
          !commAdminEmails.has(m.email) && 
          usersWithExpenses.has(m.user_id)
        )
        .slice(0, 4);

      setCommunityMembers(memberList);
    } catch (err) {
      console.error('Unexpected error loading demo users:', err);
    } finally {
      setFetchingUsers(false);
    }
  }

  async function signInWithGoogle() {
    setErrorMsg(null);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  async function quickLogin(userEmail: string) {
    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: 'Password123',
    });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 font-sans selection:bg-indigo-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[480px]">
        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white p-10 md:p-12 text-center group">
          
          <div className="mb-10 animate-fade-in text-center flex flex-col items-center">
             <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-[1.5rem] mb-6 shadow-2xl shadow-slate-200 group-hover:scale-105 transition-transform duration-500">
                <span className="text-2xl">🤝</span>
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">
               Community<span className="text-indigo-600">Deals</span>
             </h1>
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Save More Together</p>
          </div>

          <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed max-w-[320px] mx-auto text-center">
            Aggregating spending power to negotiate bulk discounts for your neighborhood.
          </p>

          {errorMsg && (
            <div className="mb-8 text-xs font-bold text-red-600 bg-red-50/50 border border-red-100 rounded-2xl p-5 text-left flex items-start gap-3 animate-shake">
              <span className="mt-0.5">⚠️</span>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4 mb-8">
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-semibold placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all hover:bg-white"
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-semibold placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all hover:bg-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white rounded-[1.25rem] px-6 py-5 text-sm font-black uppercase tracking-widest hover:bg-indigo-600 active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-indigo-100"
            >
              {loading ? 'Verifying...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="relative mb-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="px-6 bg-white/50 text-slate-300">Quick Demo Access</span>
            </div>
          </div>

          <div className="text-left max-h-[440px] overflow-y-auto px-1 custom-scrollbar">
            <div className="space-y-8 pb-4">
              {fetchingUsers ? (
                <div className="space-y-4 animate-pulse">
                   <div className="h-4 w-24 bg-slate-100 rounded-full" />
                   <div className="h-14 w-full bg-slate-50 rounded-2xl" />
                </div>
              ) : (
                <>
                  {superAdmins.map(admin => (
                    <div key={admin.email}>
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.15em] mb-3 px-1">Global Governance</p>
                      <button
                        onClick={() => quickLogin(admin.email)}
                        className="w-full text-left p-5 bg-indigo-50/30 border border-indigo-100 rounded-[1.5rem] hover:border-indigo-500 hover:bg-white active:scale-[0.98] transition-all flex justify-between items-center group/btn"
                      >
                        <div>
                          <span className="text-xs font-black text-slate-800 block mb-0.5">{admin.name}</span>
                          <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest opacity-60">Platform Control</span>
                        </div>
                      </button>
                    </div>
                  ))}

                  {communityAdmins.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.15em] mb-4 px-1">Active Communities</p>
                      <div className="space-y-3">
                        {communityAdmins.map((admin) => (
                          <button
                            key={admin.email}
                            onClick={() => quickLogin(admin.email)}
                            className="w-full text-left p-5 bg-emerald-50/30 border border-emerald-100 rounded-[1.5rem] hover:border-emerald-500 hover:bg-white active:scale-[0.98] transition-all flex justify-between items-start"
                          >
                            <div>
                              <span className="text-xs font-black text-slate-800 block mb-0.5">{admin.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold italic tracking-tight">{admin.community}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {communityMembers.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 px-1">Power Users</p>
                      <div className="grid grid-cols-2 gap-3">
                        {communityMembers.map((member) => (
                          <button
                            key={member.email}
                            onClick={() => quickLogin(member.email)}
                            className="w-full text-left p-5 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] hover:border-slate-400 hover:bg-white active:scale-[0.98] transition-all"
                          >
                            <span className="text-xs font-black text-slate-800 block mb-1 truncate">{member.name}</span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest truncate block opacity-70">{member.community}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {communityAdmins.length === 0 && communityMembers.length === 0 && !fetchingUsers && (
                    <div className="text-center py-8 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                       <p className="text-xs text-slate-400 font-medium italic">Apply the SQL fix to see shortcuts.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
      `}</style>
    </div>
  );
}

export default function LoginPage() { return <Suspense><LoginContent /></Suspense>; }
