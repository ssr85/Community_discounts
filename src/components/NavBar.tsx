'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/community', label: 'Community' },
  { href: '/deals', label: 'Deals' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="text-lg font-bold text-green-600">
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
