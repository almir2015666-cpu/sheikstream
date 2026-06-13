import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

// SQL to create table (run once in Supabase):
// CREATE TABLE collab_listings (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id text NOT NULL,
//   twitch_username text NOT NULL,
//   display_name text,
//   avatar_url text,
//   game text,
//   description text,
//   looking_for text[] DEFAULT '{}',
//   schedule_tags text[] DEFAULT '{}',
//   viewer_range text,
//   is_active boolean DEFAULT true,
//   created_at timestamptz DEFAULT now(),
//   updated_at timestamptz DEFAULT now(),
//   UNIQUE(user_id)
// );

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const url = new URL(req.url)
  const mine = url.searchParams.get('mine') === '1'

  if (mine) {
    const { data } = await db
      .from('collab_listings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    return NextResponse.json(data ?? null)
  }

  const { data } = await db
    .from('collab_listings')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(50)

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { game, description, looking_for, schedule_tags, viewer_range, is_active } = body

  const db = getSupabaseAdmin()
  const { error } = await db
    .from('collab_listings')
    .upsert(
      {
        user_id: user.id,
        twitch_username: (user as { name?: string }).name?.toLowerCase() ?? '',
        display_name: (user as { name?: string }).name ?? 'Usuário',
        avatar_url: (user as { image?: string }).image ?? null,
        game: game?.trim() ?? null,
        description: description?.trim() ?? null,
        looking_for: looking_for ?? [],
        schedule_tags: schedule_tags ?? [],
        viewer_range: viewer_range?.trim() ?? null,
        is_active: is_active !== false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await getSupabaseAdmin()
    .from('collab_listings')
    .delete()
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
