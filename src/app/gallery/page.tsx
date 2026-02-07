import Link from 'next/link';

import { getSupabaseServerClient } from '@/lib/supabase/server';

const PAGE_SIZE = 24;

type GalleryCard = {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  author: {
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
  } | null;
};

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function parseGalleryCard(row: unknown): GalleryCard | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;

  const id = getString(r.id);
  const name = getString(r.name);
  const createdAt = getString(r.created_at);
  if (!id || !name || !createdAt) return null;

  const description = getString(r.description);
  const thumbnailUrl = getString(r.thumbnail_url);

  let author: GalleryCard['author'] = null;
  const profiles = r.profiles;
  const profileObj =
    profiles && typeof profiles === 'object' && !Array.isArray(profiles)
      ? (profiles as Record<string, unknown>)
      : Array.isArray(profiles) && profiles.length > 0 && profiles[0] && typeof profiles[0] === 'object'
        ? (profiles[0] as Record<string, unknown>)
        : null;

  if (profileObj) {
    author = {
      displayName: getString(profileObj.display_name),
      username: getString(profileObj.username),
      avatarUrl: getString(profileObj.avatar_url),
    };
  }

  return { id, name, description, thumbnailUrl, createdAt, author };
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const pageParam = searchParams.page;
  const pageRaw = typeof pageParam === 'string' ? Number.parseInt(pageParam, 10) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await getSupabaseServerClient();
  const { data, error, count } = await supabase
    .from('builds')
    .select('id,name,description,thumbnail_url,created_at,profiles(display_name,username,avatar_url)', {
      count: 'exact',
    })
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  const cards: GalleryCard[] = Array.isArray(data)
    ? data
        .map(parseGalleryCard)
        .filter((v): v is GalleryCard => v !== null)
    : [];
  const total = typeof count === 'number' && count > 0 ? count : 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;

  return (
    <div className="min-h-screen bg-[#05070a] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(0,170,255,0.16),transparent_35%),radial-gradient(circle_at_80%_60%,rgba(0,255,170,0.10),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.08),transparent_55%)]" />

      <main className="mx-auto max-w-6xl px-6 py-14">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm font-semibold tracking-wide text-zinc-100">
            AquascapeSim
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/editor"
              className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Launch Editor
            </Link>
          </nav>
        </header>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Gallery</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">
                Public builds saved by the community. Click a card to open it in the editor.
              </p>
            </div>

            <div className="text-xs text-zinc-400">
              Page {page} of {totalPages}
            </div>
          </div>
        </section>

        <section className="mt-8">
          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100">
              Failed to load gallery: {error.message}
            </div>
          ) : null}

          {!error && cards.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-200 backdrop-blur">
              No public builds yet. Save a build and enable “Make public” to publish it.
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const author = card.author?.displayName || card.author?.username || 'Anonymous';
              const date = new Date(card.createdAt);
              const dateLabel = Number.isFinite(date.getTime()) ? date.toLocaleDateString() : card.createdAt;

              return (
                <Link
                  key={card.id}
                  href={`/editor?build=${encodeURIComponent(card.id)}`}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_24px_110px_rgba(0,0,0,0.55)] transition hover:border-white/20"
                >
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

                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-zinc-100">{card.name}</div>
                        <div className="mt-1 text-xs text-zinc-400">
                          {author} · {dateLabel}
                        </div>
                      </div>
                      <div className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-[11px] text-zinc-200 ring-1 ring-white/10">
                        Open
                      </div>
                    </div>

                    {card.description ? (
                      <div className="line-clamp-2 text-xs leading-5 text-zinc-300">{card.description}</div>
                    ) : (
                      <div className="text-xs text-zinc-500">No description.</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <footer className="mt-10 flex items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-zinc-400">
          <div>{total > 0 ? `Showing ${from + 1}-${Math.min(to + 1, total)} of ${total}` : 'Showing 0 builds'}</div>
          <div className="flex items-center gap-2">
            <Link
              href={page > 1 ? `/gallery?page=${page - 1}` : '/gallery'}
              aria-disabled={page <= 1}
              className={`rounded-full px-4 py-2 ring-1 ring-white/10 transition ${
                page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-white/5'
              }`}
            >
              Prev
            </Link>
            <Link
              href={page < totalPages ? `/gallery?page=${page + 1}` : `/gallery?page=${page}`}
              aria-disabled={page >= totalPages}
              className={`rounded-full px-4 py-2 ring-1 ring-white/10 transition ${
                page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-white/5'
              }`}
            >
              Next
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
