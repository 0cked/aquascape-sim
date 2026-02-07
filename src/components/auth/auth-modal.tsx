'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type AuthMode = 'login' | 'signup';

export type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AuthModal({ open, onClose }: AuthModalProps) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!open) return null;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        if (data.session) {
          onClose();
          router.refresh();
          return;
        }

        setInfo('Account created. Check your email to confirm your address, then log in.');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      onClose();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#06080b] shadow-[0_40px_140px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-sm font-medium text-zinc-100">Sign In</div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-zinc-300 hover:bg-white/5"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="px-4 pt-3">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-xs">
            <button
              type="button"
              className={[
                'rounded-full px-3 py-1 transition',
                mode === 'login' ? 'bg-white/10 text-white' : 'text-zinc-300 hover:text-white',
              ].join(' ')}
              onClick={() => setMode('login')}
            >
              Log In
            </button>
            <button
              type="button"
              className={[
                'rounded-full px-3 py-1 transition',
                mode === 'signup' ? 'bg-white/10 text-white' : 'text-zinc-300 hover:text-white',
              ].join(' ')}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
          </div>
        </div>

        <form className="space-y-3 px-4 pb-4 pt-4" onSubmit={submit}>
          <label className="block">
            <div className="text-xs font-medium text-zinc-200">Email</div>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/20"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <div className="text-xs font-medium text-zinc-200">Password</div>
            <input
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/20"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {info ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              {info}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-xl bg-white text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Working…' : mode === 'signup' ? 'Create Account' : 'Log In'}
          </button>

          <div className="text-pretty text-xs text-zinc-400">
            Note: Depending on your Supabase auth settings, sign-up may require email confirmation.
          </div>
        </form>
      </div>
    </div>
  );
}

