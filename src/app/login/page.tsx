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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (error === 'auth_failed') {
      setErrorMsg('Authentication failed. Please try again.');
    }
  }, [error]);

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

  const testUsers = [
    { name: 'Alice', email: 'alice@skyline.com', community: 'Skyline' },
    { name: 'Bob', email: 'bob@skyline.com', community: 'Skyline' },
    { name: 'Charlie', email: 'charlie@skyline.com', community: 'Skyline' },
    { name: 'David', email: 'david@greenvalley.com', community: 'Green Valley' },
    { name: 'Eve', email: 'eve@greenvalley.com', community: 'Green Valley' },
    { name: 'Frank', email: 'frank@greenvalley.com', community: 'Green Valley' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="text-3xl font-bold text-green-600 mb-1">CommunityDeals</div>
          <p className="text-gray-500 text-sm">Save more together</p>
        </div>

        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          Join your community, share spending data voluntarily, and unlock group discounts negotiated on your behalf.
        </p>

        {errorMsg && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg p-3 text-left">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm mb-8 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        <div className="text-left border-t border-gray-100 pt-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Demo Login</h3>
          
          <div className="space-y-4">
            {/* Super Admin */}
            <div>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1 px-1">Super Admin</p>
              <button
                onClick={() => quickLogin('frank@greenvalley.com')}
                disabled={loading}
                className="w-full text-left px-3 py-2 text-xs bg-indigo-50 border border-indigo-100 rounded-lg hover:border-indigo-500 hover:bg-indigo-100 transition-all disabled:opacity-50 cursor-pointer flex justify-between items-center"
              >
                <span>Frank</span>
                <span className="text-[9px] bg-indigo-200 text-indigo-700 px-1.5 rounded">Platform Global</span>
              </button>
            </div>

            {/* Community Admins */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 px-1">Community Admins</p>
                <button
                  onClick={() => quickLogin('alice@skyline.com')}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 text-xs bg-emerald-50 border border-emerald-100 rounded-lg hover:border-emerald-500 hover:bg-emerald-100 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Alice <span className="text-[9px] opacity-60 block">Skyline</span>
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 px-1 opacity-0">spacer</p>
                <button
                  onClick={() => quickLogin('david@greenvalley.com')}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 text-xs bg-emerald-50 border border-emerald-100 rounded-lg hover:border-emerald-500 hover:bg-emerald-100 transition-all disabled:opacity-50 cursor-pointer"
                >
                  David <span className="text-[9px] opacity-60 block">Green Valley</span>
                </button>
              </div>
            </div>

            {/* Members */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-1">Community Members</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => quickLogin('bob@skyline.com')}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Bob <span className="text-[9px] opacity-50 ml-1">Skyline</span>
                </button>
                <button
                  onClick={() => quickLogin('eve@greenvalley.com')}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Eve <span className="text-[9px] opacity-50 ml-1">Green Valley</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          By signing in, you agree to share spending data only with your community members.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
