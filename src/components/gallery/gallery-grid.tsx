'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuthUser } from '@/lib/supabase/use-auth-user';

export type GalleryGridCard = {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  authorLabel: string;
  dateLabel: string;
};

type LikeRow = {
  buildId: string;
  userId: string;
};

function parseLikeRow(row: unknown): LikeRow | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const buildId = typeof r.build_id === 'string' ? r.build_id : null;
  const userId = typeof r.user_id === 'string' ? r.user_id : null;
  if (!buildId || !userId) return null;
  return { buildId, userId };
}

export function GalleryGrid({ cards }: { cards: GalleryGridCard[] }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { user } = useAuthUser();

  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedByMe, setLikedByMe] = useState<Record<string, true>>({});
  const [busy, setBusy] = useState<Record<string, true>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setLikeCounts({});
    setLikedByMe({});

    const buildIds = cards.map((c) => c.id);
    if (buildIds.length === 0) return;

    let canceled = false;
    const run = async () => {
      const { data, error: selectError } = await supabase
        .from('build_likes')
        .select('build_id,user_id')
        .in('build_id', buildIds);

      if (canceled) return;
      if (selectError) {
        setError(selectError.message);
        return;
      }

      const counts: Record<string, number> = {};
      const liked: Record<string, true> = {};

      if (Array.isArray(data)) {
        for (const row of data) {
          const parsed = parseLikeRow(row);
          if (!parsed) continue;
          counts[parsed.buildId] = (counts[parsed.buildId] ?? 0) + 1;
          if (user && parsed.userId === user.id) {
            liked[parsed.buildId] = true;
          }
        }
      }

      setLikeCounts(counts);
      setLikedByMe(liked);
    };

    run();
    return () => {
      canceled = true;
    };
  }, [cards, supabase, user]);

  const toggleLike = async (buildId: string) => {
    setError(null);

    if (!user) {
      setError('Sign in to like builds.');
      return;
    }

    if (busy[buildId]) return;
    setBusy((s) => ({ ...s, [buildId]: true }));

    const wasLiked = likedByMe[buildId] === true;
    const prevCount = likeCounts[buildId] ?? 0;

    setLikedByMe((s) => {
      const next = { ...s };
      if (wasLiked) delete next[buildId];
      else next[buildId] = true;
      return next;
    });
    setLikeCounts((s) => ({
      ...s,
      [buildId]: Math.max(0, prevCount + (wasLiked ? -1 : 1)),
    }));

    try {
      if (wasLiked) {
        const { error: delError } = await supabase.from('build_likes').delete().eq('build_id', buildId).eq('user_id', user.id);
        if (delError) throw delError;
      } else {
        const { error: insError } = await supabase.from('build_likes').insert({ build_id: buildId });
        if (insError) throw insError;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Like failed';
      setError(message);
      // Revert optimistic update.
      setLikedByMe((s) => {
        const next = { ...s };
        if (wasLiked) next[buildId] = true;
        else delete next[buildId];
        return next;
      });
      setLikeCounts((s) => ({ ...s, [buildId]: prevCount }));
    } finally {
      setBusy((s) => {
        const next = { ...s };
        delete next[buildId];
        return next;
      });
    }
  };

  return (
    <div className="mt-6">
      {error ? (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const count = likeCounts[card.id] ?? 0;
          const liked = likedByMe[card.id] === true;
          const isBusy = busy[card.id] === true;

          return (
            <div
              key={card.id}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_24px_110px_rgba(0,0,0,0.55)] transition hover:border-white/20"
            >
              <Link href={`/editor?build=${encodeURIComponent(card.id)}`} className="block">
                <div className="relative aspect-[4/3] w-full bg-black">
                  {card.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.thumbnailUrl}
                      alt={`${card.name} thumbnail`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_20%_30%,rgba(0,170,255,0.26),transparent_55%),radial-gradient(circle_at_80%_40%,rgba(0,255,170,0.16),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]" />
                  )}
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
                </div>
              </Link>

              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/editor?build=${encodeURIComponent(card.id)}`}
                      className="block truncate text-sm font-medium text-zinc-100 hover:underline"
                    >
                      {card.name}
                    </Link>
                    <div className="mt-1 text-xs text-zinc-400">
                      {card.authorLabel} · {card.dateLabel}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleLike(card.id)}
                      disabled={!user || isBusy}
                      className={[
                        'inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs ring-1 transition',
                        liked
                          ? 'bg-emerald-500/15 text-emerald-100 ring-emerald-400/30 hover:bg-emerald-500/20'
                          : 'bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10',
                        !user || isBusy ? 'cursor-not-allowed opacity-50' : '',
                      ].join(' ')}
                      title={user ? (liked ? 'Unlike' : 'Like') : 'Sign in to like'}
                    >
                      <span className={liked ? 'text-emerald-200' : 'text-zinc-200'}>{liked ? '♥' : '♡'}</span>
                      <span>{count}</span>
                    </button>

                    <Link
                      href={`/editor?build=${encodeURIComponent(card.id)}`}
                      className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/10"
                    >
                      Open
                    </Link>
                  </div>
                </div>

                {card.description ? (
                  <div className="line-clamp-2 text-xs leading-5 text-zinc-300">{card.description}</div>
                ) : (
                  <div className="text-xs text-zinc-500">No description.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

