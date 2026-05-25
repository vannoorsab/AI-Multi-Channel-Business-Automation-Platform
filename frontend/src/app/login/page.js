'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Loader2, Cpu } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('tester123@example.com');
  const [password, setPassword] = useState('password123');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    const res = await login(email, password);
    if (!res.success) {
      setErr(res.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-dark-950">
      {/* Decorative Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] glow-effect"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px] glow-effect" style={{ animationDelay: '-2s' }}></div>

      <div className="w-full max-w-md glass-panel p-8 relative z-10 border-slate-800/80 bg-slate-900/50">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/10 border border-brand-500/30 flex items-center justify-center mb-4 shadow-brand-glow">
            <Cpu className="w-6 h-6 text-brand-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h1>
          <p className="text-slate-400 text-sm mt-1">AI Business Automation Platform</p>
        </div>

        {err && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                className="w-full glass-input pl-12"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                className="w-full glass-input pl-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-btn-primary flex items-center justify-center gap-2 mt-6 h-12"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-brand-400 hover:text-brand-300 font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
