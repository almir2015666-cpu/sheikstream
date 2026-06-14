import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const TYPE = 'cmd_order'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await getSupabaseAdmin()
    .from('overlay_configs')
    .select('config')
    .eq('broadcaster_id', user.id)
    .eq('type', TYPE)
    .single()
  return NextResponse.json({ order: data?.config?.order ?? [] })
}

export async function PUT(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { order } = await req.json()
  if (!Array.isArray(order)) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const { error } = await getSupabaseAdmin()
    .from('overlay_configs')
    .upsert({
      broadcaster_id: user.id,
      type: TYPE,
      config: { order },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'broadcaster_id,type' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
