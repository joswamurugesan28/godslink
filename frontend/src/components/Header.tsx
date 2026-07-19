'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Gamepad2, LayoutDashboard, LogOut, LogIn, User } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        setProfile(currentProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    fetchUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        setProfile(currentProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  };

  if (pathname === '/login') return null;

  return (
    <header className="bg-discord-sidebar border-b border-discord-card text-discord-text-light py-3 px-6 z-40 relative flex-shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-discord-blurple rounded-lg group-hover:scale-105 transition duration-200">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-discord-text-light transition">
              GodsLink
            </h1>
          </div>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className={`transition ${pathname === '/' ? 'text-discord-blurple' : 'text-discord-text-muted hover:text-white'}`}>
            Home
          </Link>

          {!loading && profile?.role === 'developer' && (
            <Link href="/dashboard" className={`flex items-center gap-1.5 transition ${pathname === '/dashboard' ? 'text-discord-blurple' : 'text-discord-text-muted hover:text-white'}`}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Developer Dashboard</span>
            </Link>
          )}

          {loading ? (
            <div className="h-5 w-20 bg-discord-card rounded animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-4 border-l border-discord-card pl-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-discord-card border border-discord-bg flex items-center justify-center text-discord-blurple">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs text-white font-semibold">{profile?.username || user.email}</p>
                  <p className="text-[10px] text-discord-blurple uppercase tracking-wider font-extrabold">{profile?.role}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-xs bg-discord-card hover:bg-discord-bg text-discord-text-light py-1.5 px-3 rounded-lg border border-discord-bg transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 text-xs bg-discord-blurple hover:bg-[#4752c4] text-white font-semibold py-1.5 px-4 rounded-lg transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
