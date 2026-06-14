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
  const { data } = await db.from('loyalty_config').select('*').eq('broadcaster_id', user.id).maybeSingle()
  return NextResponse.json(data ?? {
    broadcaster_id: user.id, enabled: true, points_per_message: 5, points_per_follow: 100,
    points_per_sub: 500, points_per_giftsub: 300, points_per_bits100: 100,
    points_per_raid: 200, currency_name: 'pontos',
  })
}

export async function PUT(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const db = getSupabaseAdmin()
  const { error } = await db.from('loyalty_config').upsert({
    broadcaster_id: user.id, ...body, updated_at: new Date().toISOString(),
  }, { onConflict: 'broadcaster_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
