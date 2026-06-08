import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

const TABLE_MISSING_SQL = `-- Execute no Supabase SQL Editor:
create table if not exists public.livepix_config (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null unique,
  client_id   text,
  client_secret text,
  channel_id  text,
  slug        text,
  updated_at  timestamptz default now()
);`

function isTableMissing(err: { message?: string; code?: string } | null) {
  if (!err) return false
  return err.message?.includes('schema cache') || err.message?.includes('relation') || err.code === 'PGRST200' || err.code === '42P01'
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('livepix_config')
    .select('channel_id, client_id, client_secret, slug')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) {
    if (isTableMissing(error)) return NextResponse.json({ error: 'table_missing', sql: TABLE_MISSING_SQL }, { status: 503 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({})
  return NextResponse.json({
    client_id:  data.client_id ?? '',
    has_secret: !!data.client_secret,
    channel_id: data.channel_id ?? '',
    slug:       data.slug ?? '',
  })
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const db = getSupabaseAdmin()
  const { error } = await db.from('livepix_config').upsert(
    {
      user_id: user.id,
      channel_id: body.channel_id ?? null,
      client_id: body.client_id ?? null,
      client_secret: body.client_secret ?? null,
      slug: body.slug ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) {
    if (isTableMissing(error)) return NextResponse.json({ error: 'table_missing', sql: TABLE_MISSING_SQL }, { status: 503 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
