import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

async function getAuthUid(): Promise<string | null> {
  try {
    const jar = await cookies()
    const token = jar.get(COOKIE_NAME)?.value
    if (!token) return null
    const sess = decodeSession(token)
    return sess?.id ?? null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const uid = await getAuthUid()
  if (!uid) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  const db = getSupabaseAdmin()
  const { error } = await db.from('overlay_configs').upsert({
    broadcaster_id: uid, type: 'goal_overlay', config: body,
  }, { onConflict: 'broadcaster_id,type' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 })

  const db = getSupabaseAdmin()

  const { data: cfgData } = await db
    .from('overlay_configs')
    .select('config')
    .eq('broadcaster_id', uid)
    .eq('type', 'goal_overlay')
    .maybeSingle()

  const cfg = (cfgData?.config ?? {}) as Record<string, unknown>
  const goalType = (cfg.goalType as string) ?? 'custom'
  let current = Number(cfg.customCurrent ?? 0)

  if (goalType === 'subs') {
    const { count } = await db
      .from('twitch_subs')
      .select('*', { count: 'exact', head: true })
      .eq('broadcaster_id', uid)
    current = count ?? 0
  } else if (goalType === 'bits') {
    const { data: cheers } = await db
      .from('twitch_cheers')
      .select('bits')
      .eq('broadcaster_id', uid)
    current = (cheers ?? []).reduce((s, c) => s + (Number(c.bits) || 0), 0)
  } else if (goalType === 'donations') {
    const { data: donors } = await db
      .from('livepix_donors')
      .select('total')
      .eq('broadcaster_id', uid)
    current = (donors ?? []).reduce((s, d) => s + (Number(d.total) || 0), 0)
  }

  return NextResponse.json({ ...cfg, current }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
