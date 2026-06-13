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
  try {
    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('mod_config')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (error && error.code === 'PGRST116') {
      // No config yet — return defaults
      return NextResponse.json({
        banned_words: [], banned_users: [],
        slow_mode_twitch: 0, slow_mode_kick: 0, slow_mode_youtube: 0,
        timeout_violations: 3, is_active: false,
      })
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const db = getSupabaseAdmin()
    const { data: existing } = await db
      .from('mod_config')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const payload = {
      user_id: user.id,
      banned_words: Array.isArray(body.banned_words) ? body.banned_words : [],
      banned_users: Array.isArray(body.banned_users) ? body.banned_users : [],
      slow_mode_twitch: Number(body.slow_mode_twitch ?? 0),
      slow_mode_kick: Number(body.slow_mode_kick ?? 0),
      slow_mode_youtube: Number(body.slow_mode_youtube ?? 0),
      timeout_violations: Math.max(1, Number(body.timeout_violations ?? 3)),
      is_active: Boolean(body.is_active ?? false),
    }

    let result
    if (existing) {
      result = await db.from('mod_config').update(payload).eq('user_id', user.id).select().single()
    } else {
      result = await db.from('mod_config').insert(payload).select().single()
    }
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
    return NextResponse.json(result.data)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
