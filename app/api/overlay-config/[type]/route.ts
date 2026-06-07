import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

// GET — called by the overlay page itself (no auth, public by uid)
export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const uid = new URL(req.url).searchParams.get('uid')
  if (!uid) return NextResponse.json({}, { status: 400 })
  const db = getSupabaseAdmin()
  const { data } = await db.from('overlay_configs').select('config').eq('broadcaster_id', uid).eq('type', type).single()
  return NextResponse.json(data?.config ?? {})
}

// PUT — called by the overlay editor (requires auth)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { type } = await params
  const config = await req.json()
  const db = getSupabaseAdmin()
  await db.from('overlay_configs').upsert({
    broadcaster_id: user.id,
    type,
    config,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'broadcaster_id,type' })
  return NextResponse.json({ ok: true })
}
