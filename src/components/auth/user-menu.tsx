'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { AuthModal } from '@/components/auth/auth-modal';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuthUser } from '@/lib/supabase/use-auth-user';

export function UserMenu() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const { user, loading } = useAuthUser();
  const [open, setOpen] = useState<boolean>(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <AuthModal open={open} onClose={() => setOpen(false)} />

      {loading ? (
        <div className="text-xs text-zinc-400">Auth…</div>
      ) : user ? (
        <>
          <div className="hidden max-w-[220px] truncate text-xs text-zinc-200 sm:block">
            {user.email}
          </div>
          <button
            type="button"
            onClick={signOut}
            className="h-9 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
          >
            Sign Out
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-9 rounded-full bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200"
        >
          Sign In
        </button>
      )}
    </div>
  );
}

