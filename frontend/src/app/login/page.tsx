'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Gamepad2, ShieldAlert, Sparkles, User, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'developer' | 'gamer'>('gamer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Handle mock example accounts bypass
    if (!isSignUp) {
      if (email === 'admin@godslink.com' && password === 'password123') {
        const mockSession = {
          user: { id: 'mock_admin_null', email: 'admin@godslink.com' },
          profile: { id: 'mock_admin_null', username: 'NULL_Admin', role: 'developer' }
        };
        document.cookie = `mock_session=${encodeURIComponent(JSON.stringify(mockSession))}; path=/; max-age=604800; SameSite=Lax`;
        setSuccessMsg('Logged in as NULL_Admin Developer (Mock)! Redirecting...');
        setTimeout(() => {
          router.refresh();
          router.push('/');
        }, 800);
        return;
      }
      if (email === 'god@godslink.com' && password === 'password123') {
        const mockSession = {
          user: { id: 'mock_god_zeus', email: 'god@godslink.com' },
          profile: { id: 'mock_god_zeus', username: 'Zeus_God', role: 'developer' }
        };
        document.cookie = `mock_session=${encodeURIComponent(JSON.stringify(mockSession))}; path=/; max-age=604800; SameSite=Lax`;
        setSuccessMsg('Logged in as Developer Zeus (Mock)! Redirecting...');
        setTimeout(() => {
          router.refresh();
          router.push('/');
        }, 800);
        return;
      }
      if (email === 'gamer@godslink.com' && password === 'password123') {
        const mockSession = {
          user: { id: 'mock_gamer_hades', email: 'gamer@godslink.com' },
          profile: { id: 'mock_gamer_hades', username: 'Hades_Gamer', role: 'gamer' }
        };
        document.cookie = `mock_session=${encodeURIComponent(JSON.stringify(mockSession))}; path=/; max-age=604800; SameSite=Lax`;
        setSuccessMsg('Logged in as Gamer Hades (Mock)! Redirecting...');
        setTimeout(() => {
          router.refresh();
          router.push('/');
        }, 800);
        return;
      }
    }

    try {
      if (isSignUp) {
        if (!username.trim()) {
          throw new Error('Username is required for sign up.');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
              role,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          setSuccessMsg('Account created successfully! Logging you in...');
          router.refresh();
          router.push('/');
        } else {
          setSuccessMsg('Verification email sent! Please check your inbox.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setSuccessMsg('Logged in successfully!');
        router.refresh();
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-discord-bg text-discord-text-light flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-discord-blurple/5 blur-[120px] pointer-events-none" />

      {/* App Logo */}
      <div className="flex items-center gap-3 mb-6 z-10">
        <div className="p-3 bg-discord-blurple rounded-xl shadow-lg">
          <Gamepad2 className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            GodsLink
          </h1>
          <p className="text-[10px] text-discord-text-muted font-bold tracking-wider uppercase">Storefront & Community Chat</p>
        </div>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-discord-sidebar border border-discord-card rounded-2xl p-8 shadow-2xl z-10 relative">
        
        {/* Back to Home Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-discord-text-muted hover:text-white font-semibold transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <h2 className="text-2xl font-black text-white mb-1">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-sm text-discord-text-muted mb-4 font-medium">
          {isSignUp ? 'Join the community today' : 'Sign in to access your dashboard & channels'}
        </p>


        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 text-red-200 text-sm rounded-lg flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-sm rounded-lg flex items-start gap-2">
            <Sparkles className="w-5 h-5 flex-shrink-0 text-emerald-500 animate-bounce" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-discord-text-muted mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-discord-text-muted">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="god_gamer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-discord-card border border-discord-bg focus:border-discord-blurple/80 focus:ring-1 focus:ring-discord-blurple/80 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-discord-text-muted outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-discord-text-muted mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-discord-text-muted">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-discord-card border border-discord-bg focus:border-discord-blurple/80 focus:ring-1 focus:ring-discord-blurple/80 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-discord-text-muted outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-discord-text-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-discord-text-muted">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-discord-card border border-discord-bg focus:border-discord-blurple/80 focus:ring-1 focus:ring-discord-blurple/80 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-discord-text-muted outline-none transition"
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-discord-text-muted mb-2">
                Choose Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('gamer')}
                  className={`py-2.5 px-4 rounded-lg border text-sm font-bold transition duration-200 flex flex-col items-center gap-1.5 ${
                    role === 'gamer'
                      ? 'bg-discord-blurple/25 border-discord-blurple text-white'
                      : 'bg-discord-card border-discord-bg text-discord-text-muted hover:border-discord-card hover:bg-discord-bg'
                  }`}
                >
                  <Gamepad2 className="w-5 h-5" />
                  <span>Gamer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('developer')}
                  className={`py-2.5 px-4 rounded-lg border text-sm font-bold transition duration-200 flex flex-col items-center gap-1.5 ${
                    role === 'developer'
                      ? 'bg-discord-blurple/25 border-discord-blurple text-white'
                      : 'bg-discord-card border-discord-bg text-discord-text-muted hover:border-discord-card hover:bg-discord-bg'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Developer</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-discord-blurple hover:bg-[#4752c4] disabled:bg-discord-card disabled:text-discord-text-muted text-white font-bold py-2.5 rounded-lg text-sm transition duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-discord-card text-center">
          <p className="text-sm text-discord-text-muted">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-discord-blurple hover:underline font-bold transition duration-200"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
