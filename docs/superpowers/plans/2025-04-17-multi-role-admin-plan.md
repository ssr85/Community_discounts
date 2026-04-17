# Multi-Role Admin & Member Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three distinct dashboards: Member with timeline/gamification, Community Admin with member drill-down, Super Admin with community drill-down

**Architecture:** 
1. Update login with demo shortcuts
2. Add is_admin to community_members
3. Update Member dashboard with timeline + badge + invite
4. Create Community Admin with member drill-down
5. Create Super Admin with community drill-down
6. Role-aware navigation

**Tech Stack:** Next.js App Router, Tailwind CSS, Supabase, Recharts (existing)

---

## Task 1: Login Page Demo Shortcuts

**Files:**
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: Add community fetch and state**

Add state and fetch for demo login:
```tsx
const [demoMode, setDemoMode] = useState<'super_admin' | 'community' | null>(null);
const [selectedCommunity, setSelectedCommunity] = useState('');
const [communities, setCommunities] = useState<{id: string, name: string}[]>([]);

useEffect(() => {
  if (demoMode === 'community') {
    supabase.from('communities').select('id,name').then(({data}) => setCommunities(data || []));
  }
}, [demoMode]);
```

- [ ] **Step 2: Add demo section UI below test users**

```tsx
<div className="text-left border-t border-gray-100 pt-6 mt-6">
  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Demo Login</h3>
  
  <div className="flex gap-2 mb-4">
    <button onClick={() => setDemoMode('super_admin')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${demoMode === 'super_admin' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>
      Super Admin
    </button>
    <button onClick={() => setDemoMode('community')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${demoMode === 'community' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
      Community
    </button>
  </div>

  {demoMode === 'super_admin' && (
    <button onClick={() => quickLogin('admin@communitydeals.com')} className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium">
      Enter as Super Admin
    </button>
  )}

  {demoMode === 'community' && (
    <div className="space-y-3">
      <select value={selectedCommunity} onChange={(e) => setSelectedCommunity(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Select community</option>
        {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className="flex gap-2">
        <button onClick={() => quickLogin('admin@skyline.com')} disabled={!selectedCommunity} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs">As Admin</button>
        <button onClick={() => quickLogin('alice@skyline.com')} disabled={!selectedCommunity} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs">As Member</button>
      </div>
    </div>
  )}
</div>
```

- [ ] **Step 3: Test and commit**

```bash
git add src/app/login/page.tsx && git commit -m "feat: add demo login shortcuts"
```

---

## Task 2: Add is_admin to community_members

**Files:**
- Database migration

- [ ] **Step 1: Add column via Supabase**

```bash
# Or run via supabase CLI
supabase db exec --sql "ALTER TABLE community_members ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;"
```

- [ ] **Step 2: Set existing admins**

```sql
UPDATE community_members cm SET is_admin = TRUE FROM communities c 
WHERE cm.community_id = c.id AND cm.user_id = c.admin_id;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql && git commit -m "feat: add is_admin to community_members"
```

---

## Task 3: Member Dashboard with Timeline + Badge + Invite

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Add timeline state**

```tsx
const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
const [userSpend, setUserSpend] = useState<any[]>([]);
const [communityBadge, setCommunityBadge] = useState<{members: number, savings: number}>();
```

- [ ] **Step 2: Add timeline filter + fetch logic**

```tsx
useEffect(() => {
  loadData();
}, [timeRange]);

async function loadData() {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get date filter
  let fromDate = new Date();
  if (timeRange === '7d') fromDate.setDate(fromDate.getDate() - 7);
  else if (timeRange === '30d') fromDate.setDate(fromDate.getDate() - 30);
  else if (timeRange === '90d') fromDate.setDate(fromDate.getDate() - 90);
  else fromDate = new Date('2000-01-01');

  // Fetch user spend for period
  const { data: spend } = await supabase
    .from('spending_records')
    .select('*')
    .eq('user_id', user?.id)
    .gte('date', fromDate.toISOString().split('T')[0])
    .order('date', { ascending: false });
  setUserSpend(spend || []);

  // Get community badge data
  const [{ data: membership }, { data: allMembers }, { data: deals }] = await Promise.all([
    supabase.from('community_members').select('community_id').eq('user_id', user?.id).limit(1).single(),
    supabase.from('community_members').select('user_id').eq('community_id', membership?.community_id),
    supabase.from('group_deals').select('discount_pct, current_orders, min_orders').eq('community_id', membership?.community_id).eq('status', 'active'),
  ]);
  
  const potentialSavings = deals?.reduce((sum, d) => sum + (d.current_orders * d.discount_pct * 100), 0) || 0;
  setCommunityBadge({ members: allMembers?.length || 0, savings: potentialSavings });
}
```

- [ ] **Step 3: Add gamified badge at top**

```tsx
<div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm opacity-80">Community Progress</div>
      <div className="text-2xl font-bold mt-1">
        🎉 {communityBadge?.members} members joined
      </div>
      <div className="text-lg mt-1">
        💰 ₹{(communityBadge?.savings || 0).toLocaleString()} potential savings unlocked
      </div>
    </div>
    <button className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-opacity-90">
      + Invite Neighbor
    </button>
  </div>
</div>
```

- [ ] **Step 4: Add timeline selector**

```tsx
<div className="flex gap-2 mb-6">
  {(['7d', '30d', '90d', 'all'] as const).map(range => (
    <button key={range} onClick={() => setTimeRange(range)} 
      className={`px-3 py-1 text-xs rounded-full ${timeRange === range ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
      {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
    </button>
  ))}
</div>
```

- [ ] **Step 5: Calculate and display cumulative spend**

```tsx
const cumulative = userSpend.reduce((sum, r) => sum + Number(r.amount), 0);
<div className="bg-white rounded-xl border p-4 mb-4">
  <div className="text-sm text-gray-500">Your Spend ({timeRange === '7d' ? '7 Days' : timeRange === '30d' ? '30 Days' : timeRange === '90d' ? '90 Days' : 'All Time'})</div>
  <div className="text-3xl font-bold text-gray-900">₹{cumulative.toLocaleString()}</div>
</div>
```

- [ ] **Step 6: Test and commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx && git commit -m "feat: add timeline selector and gamified badge to member dashboard"
```

---

## Task 4: Community Admin with Member Drill-Down

**Files:**
- Create: `src/app/(app)/admin/community/page.tsx`

- [ ] **Step 1: Create page with members table**

```tsx
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function AdminCommunityPage() {
  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get admin's community
    const { data: membership } = await supabase
      .from('community_members')
      .select('communities(*), is_admin')
      .eq('user_id', user?.id)
      .eq('is_admin', true)
      .limit(1)
      .single();

    if (!membership?.communities) { setLoading(false); return; }
    setCommunity(membership.communities);

    // Get all members with their spend
    const { data: membersData } = await supabase
      .from('community_members')
      .select('*, users(*), spending_records(*)')
      .eq('community_id', membership.communities.id);

    // Calculate each member's spend
    const processed = membersData?.map(m => ({
      ...m,
      total_spend: m.spending_records?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0
    })) || [];

    setMembers(processed);
    setLoading(false);
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!community) return <div className="p-8">You are not an admin.</div>;

  const totalSocietySpend = members.reduce((sum, m) => sum + m.total_spend, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{community.name}</h1>
      <p className="text-sm text-gray-500 mb-6">Community Admin</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total Members</div>
          <div className="text-2xl font-bold">{members.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Society Total</div>
          <div className="text-2xl font-bold">₹{totalSocietySpend.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Active Deals</div>
          <div className="text-2xl font-bold text-green-600">-</div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Member</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Spend</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">% of Society</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((m: any) => (
              <tr key={m.id} onClick={() => setSelectedMember(m)} className="cursor-pointer hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{m.users?.full_name || m.users?.email}</td>
                <td className="px-4 py-3">₹{m.total_spend.toLocaleString()}</td>
                <td className="px-4 py-3">{totalSocietySpend > 0 ? ((m.total_spend/totalSocietySpend)*100).toFixed(1) : 0}%</td>
                <td className="px-4 py-3 text-gray-500">{new Date(m.joined_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedMember(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{selectedMember.users?.full_name || 'Member'}</h2>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500">Their Spend</div>
              <div className="text-2xl font-bold">₹{selectedMember.total_spend.toLocaleString()}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-2">Spend by Platform</div>
              {(selectedMember.spending_records || []).reduce((acc: any[], r: any) => {
                const existing = acc.find(a => a.platform === r.platform);
                if (existing) existing.amount += Number(r.amount);
                else acc.push({ platform: r.platform, amount: Number(r.amount) });
                return acc;
              }, []).map((p: any) => (
                <div key={p.platform} className="flex justify-between text-sm">
                  <span>{p.platform}</span>
                  <span className="font-medium">₹{p.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedMember(null)} className="mt-4 w-full py-2 bg-gray-100 rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Test and commit**

```bash
git add src/app/\(app\)/admin/community/page.tsx && git commit -m "feat: add community admin with member drill-down"
```

---

## Task 5: Super Admin with Community Drill-Down

**Files:**
- Create: `src/app/(app)/super-admin/page.tsx`

- [ ] **Step 1: Create page with expandable rows**

```tsx
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function SuperAdminPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    // Fetch all communities with admin info
    const { data } = await supabase
      .from('communities')
      .select('*, users!communities_admin_id_fkey(email)')
      .order('created_at', { ascending: false });
    setCommunities(data || []);
    setLoading(false);
  }

  async function loadCommunityDetails(communityId: string) {
    // Get members and spend for this community
    const [{ data: members }, { data: deals }, { data: spend }] = await Promise.all([
      supabase.from('community_members').select('*, users(*)').eq('community_id', communityId),
      supabase.from('group_deals').select('*').eq('community_id', communityId),
      supabase.from('spending_records').select('user_id, amount, platform').eq('community_id', communityId),
    ]);

    // Calculate per member spend
    const memberSpend = (members || []).map(m => ({
      ...m,
      total: spend?.filter(s => s.user_id === m.user_id).reduce((sum, s) => sum + Number(s.amount), 0) || 0
    }));

    const platformSpend = (spend || []).reduce((acc: any[], r) => {
      const existing = acc.find(a => a.platform === r.platform);
      if (existing) existing.amount += Number(r.amount);
      else acc.push({ platform: r.platform, amount: Number(r.amount) });
      return acc;
    }, []);

    return { members: memberSpend, deals: deals || [], platformSpend };
  }

  async function handleSelectCommunity(c: any) {
    if (selectedCommunity?.id === c.id) {
      setSelectedCommunity(null);
    } else {
      const details = await loadCommunityDetails(c.id);
      setSelectedCommunity({ ...c, ...details });
    }
  }

  const stats = { total: communities.length, members: communities.reduce((sum, c) => sum + (c.member_count || 0), 0) };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Super Admin</h1>
      <p className="text-sm text-gray-500 mb-6">All Communities</p>

      {/* System Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
          <div className="text-sm text-purple-600">Total Communities</div>
          <div className="text-2xl font-bold text-purple-700">{stats.total}</div>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="text-sm text-blue-600">Total Members</div>
          <div className="text-2xl font-bold text-blue-700">{stats.members}</div>
        </div>
      </div>

      {/* Communities Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Community</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Members</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total Spend</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {communities.map((c: any) => (
              <>
                <tr key={c.id} onClick={() => handleSelectCommunity(c)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-4 py-3">{selectedCommunity?.id === c.id ? '▼' : '▶'}</td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 capitalize">{c.type}</td>
                  <td className="px-4 py-3">{c.member_count}</td>
                  <td className="px-4 py-3">₹{Number(c.total_spend || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{c.users?.email}</td>
                </tr>
                {selectedCommunity?.id === c.id && (
                  <tr key={`${c.id}-details`}>
                    <td colSpan={6} className="bg-gray-50 p-4">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Members List */}
                        <div>
                          <h4 className="text-sm font-bold mb-2">Members ({selectedCommunity.members?.length})</h4>
                          <div className="space-y-1 max-h-40 overflow-auto">
                            {(selectedCommunity.members || []).map((m: any) => (
                              <div key={m.id} className="flex justify-between text-xs">
                                <span>{m.users?.full_name || m.users?.email}</span>
                                <span>₹{m.total.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Platform Spend */}
                        <div>
                          <h4 className="text-sm font-bold mb-2">Spend by Platform</h4>
                          <div className="space-y-1">
                            {(selectedCommunity.platformSpend || []).map((p: any) => (
                              <div key={p.platform} className="flex justify-between text-xs">
                                <span>{p.platform}</span>
                                <span>₹{p.amount.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test and commit**

```bash
git add src/app/\(app\)/super-admin/page.tsx && git commit -m "feat: add super admin with community drill-down"
```

---

## Task 6: Role-Aware Navigation

**Files:**
- Modify: `src/components/NavBar.tsx`

- [ ] **Step 1: Add role detection and navigation**

```tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<'member' | 'admin' | 'super_admin'>('member');
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkRole(); }, []);

  async function checkRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    
    if (user.email === 'admin@communitydeals.com') {
      setRole('super_admin');
    } else {
      const { data } = await supabase
        .from('community_members')
        .select('is_admin')
        .eq('user_id', user.id)
        .eq('is_admin', true)
        .limit(1)
        .single();
      setRole(data ? 'admin' : 'member');
    }
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const links = role === 'super_admin' 
    ? [{ href: '/super-admin', label: 'Super Admin' }]
    : role === 'admin'
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/community', label: 'Community' },
        { href: '/deals', label: 'Deals' },
        { href: '/admin/community', label: 'Admin' },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/community', label: 'Community' },
        { href: '/deals', label: 'Deals' },
      ];

  if (loading) return <nav className="bg-white border-b border-gray-200 px-6 py-3"></nav>;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href={role === 'super_admin' ? '/super-admin' : '/dashboard'} className="text-lg font-bold text-green-600">
        CommunityDeals
      </Link>
      <div className="flex items-center gap-6">
        {links.map(l => (
          <Link key={l.href} href={l.href} className={`text-sm font-medium ${pathname.startsWith(l.href) ? 'text-green-600' : 'text-gray-600'}`}>
            {l.label}
          </Link>
        ))}
        <button onClick={signOut} className="text-sm text-gray-400">Sign out</button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Test and commit**

```bash
git add src/components/NavBar.tsx && git commit -m "feat: add role-aware navigation"
```

---

## Task 7: Integration Tests

- [ ] **Step 1: Test Member flow**

Visit /login → demo as member → verify timeline selector, badge, invite button appear

- [ ] **Step 2: Test Admin flow**

Visit /login → demo as admin → navigate to /admin/community → click member row → verify modal with spend details

- [ ] **Step 3: Test Super Admin flow**

Visit /login → demo as super admin → click community row → verify expanded details with members

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "feat: complete multi-role admin views"```