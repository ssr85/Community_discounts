'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function getRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (data) setRole(data.role);
      }
    }
    getRole();
  }, [supabase]);

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/community', label: 'Community' },
    { href: '/deals', label: 'Deals' },
  ];

  if (role === 'super_admin') {
    links.push({ href: '/admin', label: 'Admin Console' });
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
      <Link href="/dashboard" className="text-xl font-black text-slate-900 tracking-tighter italic">
        COMMUNITY<span className="text-indigo-600">DEALS</span>
      </Link>
      <div className="flex items-center gap-8">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-xs font-bold uppercase tracking-widest transition-all ${
              pathname.startsWith(href)
                ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1'
                : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            {label}
          </Link>
        ))}
        <button
          onClick={signOut}
          className="ml-4 px-4 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
