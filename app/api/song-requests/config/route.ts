import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data } = await db.from('song_request_config').select('*').eq('broadcaster_id', user.id).maybeSingle()
  return NextResponse.json(data ?? {
    broadcaster_id: user.id, enabled: true, command: 'sr',
    max_queue: 20, allow_duplicates: false, announce_chat: true, cooldown_s: 60,
  })
}

export async function PUT(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const db = getSupabaseAdmin()
  const { error } = await db.from('song_request_config').upsert({
    broadcaster_id: user.id,
    ...body,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'broadcaster_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
