import { NextResponse } from 'next/server';

import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const BUCKET = 'build_thumbnails';

async function ensureBucketExists(): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.storage.getBucket(BUCKET);

  if (data && !error) return;

  // If the bucket doesn't exist (or `getBucket` fails for any reason), attempt
  // to create it. Creating an existing bucket returns an error; ignore it.
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => undefined);
}

export async function POST(req: Request): Promise<Response> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const buildId = form.get('buildId');
  const thumbnail = form.get('thumbnail');

  if (typeof buildId !== 'string' || buildId.length < 8) {
    return NextResponse.json({ error: 'Missing or invalid buildId' }, { status: 400 });
  }

  const file = thumbnail instanceof Blob ? thumbnail : null;
  if (!file) {
    return NextResponse.json({ error: 'Missing thumbnail file' }, { status: 400 });
  }

  await ensureBucketExists();

  const admin = getSupabaseAdminClient();
  const path = `${user.id}/${buildId}.webp`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/webp',
    cacheControl: '3600',
  });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = admin.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrlData.publicUrl });
}

