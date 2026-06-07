import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

const DEFAULT_STATE = {
  title: 'Subathon',
  end_time: null,
  paused_remaining: null,
  seconds_per_sub: 60,
  seconds_per_bits100: 30,
  is_active: false,
  is_paused: false,
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data } = await db.from('subathon_state').select('*').eq('broadcaster_id', user.id).single()
  return NextResponse.json(data ?? { broadcaster_id: user.id, ...DEFAULT_STATE })
}

export async function PATCH(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const db = getSupabaseAdmin()

  const { data: existing } = await db.from('subathon_state').select('*').eq('broadcaster_id', user.id).single()
  const now = new Date()
  let updates: Record<string, unknown> = { updated_at: now.toISOString() }

  if (body.action === 'start') {
    const secs = Number(body.initial_seconds ?? 3600)
    updates = { ...updates, is_active: true, is_paused: false, paused_remaining: null, end_time: new Date(now.getTime() + secs * 1000).toISOString() }

  } else if (body.action === 'pause') {
    if (existing?.end_time) {
      const remaining = Math.max(0, Math.floor((new Date(existing.end_time).getTime() - now.getTime()) / 1000))
      updates = { ...updates, is_paused: true, paused_remaining: remaining, end_time: null }
    }

  } else if (body.action === 'resume') {
    if (existing?.paused_remaining != null) {
      updates = { ...updates, is_paused: false, end_time: new Date(now.getTime() + existing.paused_remaining * 1000).toISOString(), paused_remaining: null }
    }

  } else if (body.action === 'stop') {
    updates = { ...updates, is_active: false, is_paused: false, end_time: null, paused_remaining: null }

  } else if (body.action === 'add_time') {
    const secs = Number(body.seconds ?? 60)
    if (existing?.is_active && !existing.is_paused && existing.end_time) {
      const currentEnd = new Date(existing.end_time)
      const base = currentEnd > now ? currentEnd : now
      updates = { ...updates, end_time: new Date(base.getTime() + secs * 1000).toISOString() }
    } else if (existing?.is_active && existing.is_paused) {
      updates = { ...updates, paused_remaining: (existing.paused_remaining ?? 0) + secs }
    }

  } else {
    if (body.title !== undefined) updates.title = String(body.title)
    if (body.seconds_per_sub !== undefined) updates.seconds_per_sub = Number(body.seconds_per_sub)
    if (body.seconds_per_bits100 !== undefined) updates.seconds_per_bits100 = Number(body.seconds_per_bits100)
  }

  if (existing) {
    const { data, error } = await db.from('subathon_state').update(updates).eq('broadcaster_id', user.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } else {
    const { data, error } = await db.from('subathon_state').insert({ broadcaster_id: user.id, ...DEFAULT_STATE, ...updates }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }
}
