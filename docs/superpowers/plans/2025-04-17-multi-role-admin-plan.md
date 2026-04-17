# Multi-Role Admin & Member Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add login shortcuts for Super Admin, Community Admin, and Member roles with distinct dashboard views for each role.

**Architecture:** 1) Update login page with demo shortcuts 2) Add is_admin flag to community_members 3) Create /admin/community page for community admins 4) Create /super-admin page for super admins 5) Role-aware navigation in NavBar

**Tech Stack:** Next.js App Router, Tailwind CSS, Supabase

---

## File Structure

- Modify: `src/app/login/page.tsx` - Add demo shortcuts
- Modify: `src/components/NavBar.tsx` - Role-aware navigation  
- Create: `src/app/(app)/admin/community/page.tsx` - Community admin dashboard
- Create: `src/app/(app)/super-admin/page.tsx` - Super admin dashboard
- Database: Add is_admin to community_members, role to users (optional for super_admin detection)

---

### Task 1: Update Login Page with Demo Shortcuts

**Files:**
- Modify: `src/app/login/page.tsx`
- Test: Manual browser test at /login

- [ ] **Step 1: Read current login page**

Read: `src/app/login/page.tsx` (already read - 180 lines)

- [ ] **Step 2: Add super admin test user and community fetch logic**

Replace testUsers array section with demo login section:
```tsx
// Add after test users section
const [demoMode, setDemoMode] = useState<'super_admin' | 'community' | null>(null);
const [selectedCommunity, setSelectedCommunity] = useState<string>('');
const [communities, setCommunities] = useState<{id: string, name: string}[]>([]);

// Fetch communities for dropdown
useEffect(() => {
  if (demoMode === 'community') {
    supabase.from('communities').select('id,name').then(({data}) => setCommunities(data || []));
  }
}, [demoMode]);

// Test users
const superAdminEmail = 'admin@communitydeals.com';

// Quick login function
async function handleDemoLogin(email: string) {
  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: 'Password123'
  });
  if (!error) {
    // Check role and redirect
    router.push('/dashboard');
  }
}
```

- [ ] **Step 3: Update UI with demo login section**

Add below test users grid:
```tsx
<div className="text-left border-t border-gray-100 pt-6 mt-6">
  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Demo Login</h3>
  
  {/* Mode Selection */}
  <div className="flex gap-2 mb-4">
    <button
      onClick={() => setDemoMode('super_admin')}
      className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
        demoMode === 'super_admin' 
          ? 'bg-purple-600 text-white' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      Super Admin
    </button>
    <button
      onClick={() => setDemoMode('community')}
      className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
        demoMode === 'community' 
          ? 'bg-green-600 text-white' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      Community
    </button>
  </div>

  {/* Super Admin Button */}
  {demoMode === 'super_admin' && (
    <button
      onClick={() => handleDemoLogin(superAdminEmail)}
      disabled={loading}
      className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
    >
      Enter as Super Admin
    </button>
  )}

  {/* Community Dropdown + Admin/Member */}
  {demoMode === 'community' && (
    <div className="space-y-3">
      <select
        value={selectedCommunity}
        onChange={(e) => setSelectedCommunity(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">Select a community</option>
        {communities.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      
      <div className="flex gap-2">
        <button
          onClick={() => quickLogin(testUsers.find(u => u.email.startsWith('admin'))?.email || 'admin@skyline.com')}
          disabled={loading || !selectedCommunity}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          As Admin
        </button>
        <button
          onClick={() => quickLogin(testUsers[0]?.email || 'alice@skyline.com')}
          disabled={loading || !selectedCommunity}
          className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
        >
          As Member
        </button>
      </div>
    </div>
  )}
</div>
```

- [ ] **Step 4: Verify in browser**

Visit /login, check demo login section appears and functions correctly.

- [ ] **Step 5: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: add demo login shortcuts for super admin and community"
```

---

### Task 2: Add is_admin to community_members

**Files:**
- Modify: `supabase/schema.sql` or create migration
- Test: Check table structure

- [ ] **Step 1: Add column**

```sql
ALTER TABLE community_members ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
```

Or if using Supabase local CLI:
```bash
supabase db exec --sql "ALTER TABLE community_members ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;"
```

- [ ] **Step 2: Set existing community admins**

Update existing community admins (those where community admin_id matches):
```sql
UPDATE community_members cm
SET is_admin = TRUE
FROM communities c
WHERE cm.community_id = c.id AND cm.user_id = c.admin_id;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add is_admin to community_members"
```

---

### Task 3: Create Community Admin Page

**Files:**
- Create: `src/app/(app)/admin/community/page.tsx`
- Test: Navigate as community admin

- [ ] **Step 1: Create directory and page**

Create file: `src/app/(app)/admin/community/page.tsx`
```tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

type Tab = 'overview' | 'members' | 'deals' | 'analytics' | 'settings';

export default function AdminCommunityPage() {
  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's community where they are admin
    const { data: membership } = await supabase
      .from('community_members')
      .select('communities(*), is_admin')
      .eq('user_id', user.id)
      .eq('is_admin', true)
      .limit(1)
      .single();

    if (!membership?.communities) { 
      setLoading(false); 
      return; 
    }

    setCommunity(membership.communities);

    // Load members and deals
    const [{ data: membersData }, { data: dealsData }] = await Promise.all([
      supabase.from('community_members').select('users(*), joined_at, data_shared').eq('community_id', membership.communities.id),
      supabase.from('group_deals').select('*').eq('community_id', membership.communities.id).order('created_at', { ascending: false }),
    ]);

    setMembers(membersData || []);
    setDeals(dealsData || []);
    setLoading(false);
  }

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;

  if (!community) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
        <p className="text-gray-500 text-sm">You are not an admin of any community.</p>
      </div>
    );
  }

  const tabs: {id: Tab, label: string}[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'members', label: 'Members' },
    { id: 'deals', label: 'Deals' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
        <p className="text-sm text-gray-500">Community Admin</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-green-600 border-b-2 border-green-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl font-bold text-gray-900">{community.member_count}</div>
            <div className="text-sm text-gray-500">Members</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl font-bold text-green-600">₹{(community.total_spend/1000).toFixed(1)}k</div>
            <div className="text-sm text-gray-500">Total Spend</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl font-bold text-blue-600">{deals.filter(d => d.status === 'active').length}</div>
            <div className="text-sm text-gray-500">Active Deals</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl font-bold text-purple-600">{deals.length}</div>
            <div className="text-sm text-gray-500">Total Deals</div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Shared</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map((m: any) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.users?.full_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{m.users?.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(m.joined_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${m.data_shared ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {m.data_shared ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'deals' && (
        <div className="space-y-4">
          {deals.map(deal => (
            <div key={deal.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-gray-900">{deal.title}</div>
                  <div className="text-sm text-gray-500">{deal.merchant_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{deal.discount_pct}%</div>
                  <div className="text-xs text-gray-500">off</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <span>{deal.current_orders}/{deal.min_orders} orders</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${deal.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {deal.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-gray-500">Analytics coming soon...</p>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Community Name</label>
            <input value={community.name} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <input value={community.type} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50" />
          </div>
          <div className="pt-4">
            <p className="text-sm text-gray-500">Contact support to update community settings.</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/admin/community/page.tsx
git commit -m "feat: add community admin dashboard page"
```

---

### Task 4: Create Super Admin Page

**Files:**
- Create: `src/app/(app)/super-admin/page.tsx`
- Test: Navigate as super admin

- [ ] **Step 1: Create super admin page**

Create file: `src/app/(app)/super-admin/page.tsx`
```tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

type Tab = 'communities' | 'users' | 'create' | 'system';

export default function SuperAdminPage() {
  const [tab, setTab] = useState<Tab>('communities');
  const [communities, setCommunities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{total_communities: number, total_users: number, active_deals: number}>();
  const supabase = createClient();

  useEffect(() => { loadData(); }, [tab]);

  async function loadData() {
    setLoading(true);
    
    if (tab === 'communities') {
      const { data } = await supabase
        .from('communities')
        .select('*, users!communities_admin_id_fkey(email)')
        .order('created_at', { ascending: false });
      setCommunities(data || []);
    } else if (tab === 'users') {
      const { data } = await supabase
        .from('users')
        .select('*, community_members(*)')
        .order('created_at', { ascending: false });
      setUsers(data || []);
    } else if (tab === 'system') {
      const [{ data: comms }, { data: usrs }, { data: deals }] = await Promise.all([
        supabase.from('communities').select('id'),
        supabase.from('users').select('id'),
        supabase.from('group_deals').select('id').eq('status', 'active'),
      ]);
      setStats({
        total_communities: comms?.length || 0,
        total_users: usrs?.length || 0,
        active_deals: deals?.length || 0,
      });
    }
    
    setLoading(false);
  }

  const tabs: {id: Tab, label: string}[] = [
    { id: 'communities', label: 'Communities' },
    { id: 'users', label: 'Users' },
    { id: 'create', label: 'Create Community' },
    { id: 'system', label: 'System Health' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
        <p className="text-sm text-gray-500">System-wide administration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'text-purple-600 border-b-2 border-purple-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : tab === 'communities' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {communities.map((c: any) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 capitalize">{c.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.member_count}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.users?.email || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Communities</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.full_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.community_members?.length || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'create' && (
        <div className="max-w-md bg-white rounded-xl border border-gray-200 p-6">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Community Name</label>
              <input placeholder="e.g. Oakwood Society" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="residential">Residential</option>
                <option value="office">Office</option>
                <option value="area">Area</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input placeholder="e.g. Mumbai" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="w-full bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700">
              Create Community
            </button>
          </form>
        </div>
      )}

      {tab === 'system' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
            <div className="text-3xl font-bold text-purple-700">{stats.total_communities}</div>
            <div className="text-sm text-purple-600">Total Communities</div>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <div className="text-3xl font-bold text-blue-700">{stats.total_users}</div>
            <div className="text-sm text-blue-600">Total Users</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-6">
            <div className="text-3xl font-bold text-green-700">{stats.active_deals}</div>
            <div className="text-sm text-green-600">Active Deals</div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/super-admin/page.tsx
git commit -m "feat: add super admin dashboard page"
```

---

### Task 5: Update Navigation

**Files:**
- Modify: `src/components/NavBar.tsx`
- Test: Check navigation works for each role

- [ ] **Step 1: Check user role and update NavBar**

Replace NavBar content with role-aware navigation:
```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userRole, setUserRole] = useState<'member' | 'admin' | 'super_admin'>('member');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRole();
  }, []);

  async function checkRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Check if super admin
    if (user.email === 'admin@communitydeals.com') {
      setUserRole('super_admin');
      setLoading(false);
      return;
    }

    // Check if community admin
    const { data: membership } = await supabase
      .from('community_members')
      .select('is_admin')
      .eq('user_id', user.id)
      .eq('is_admin', true)
      .limit(1)
      .single();

    if (membership) {
      setUserRole('admin');
    }
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const memberLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/community', label: 'Community' },
    { href: '/deals', label: 'Deals' },
  ];

  const adminLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/community', label: 'Community' },
    { href: '/deals', label: 'Deals' },
    { href: '/admin/community', label: 'Admin' },
  ];

  const superAdminLinks = [
    { href: '/super-admin', label: 'Super Admin' },
  ];

  const links = userRole === 'super_admin' 
    ? superAdminLinks 
    : userRole === 'admin' 
    ? adminLinks 
    : memberLinks;

  if (loading) return <nav className="bg-white border-b border-gray-200 px-6 py-3"></nav>;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href={userRole === 'super_admin' ? '/super-admin' : '/dashboard'} className="text-lg font-bold text-green-600">
        CommunityDeals
      </Link>
      <div className="flex items-center gap-6">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm font-medium transition-colors ${
              pathname.startsWith(href)
                ? 'text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </Link>
        ))}
        <button
          onClick={signOut}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NavBar.tsx
git commit -m "feat: add role-aware navigation"
```

---

### Task 6: Final Integration Test

**Files:**
- Test all flows
- Fix any issues

- [ ] **Step 1: Test Super Admin flow**

1. Go to /login
2. Click "Super Admin" → "Enter as Super Admin"
3. Verify redirects to /super-admin
4. Check all tabs work

- [ ] **Step 2: Test Community Admin flow**

1. Go to /login  
2. Click "Community" → Select community → Click "As Admin"
3. Verify "Admin" tab appears in navigation
4. Click Admin → Verify admin dashboard loads

- [ ] **Step 3: Test Member flow**

1. Go to /login
2. Click community → Click "As Member"
3. Verify no Admin tab in navigation
4. Can still access Dashboard, Deals, Community

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: complete multi-role admin views"
```

---

## Execution Choice

**Plan complete and saved to `docs/superpowers/plans/2025-04-17-multi-role-admin-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**