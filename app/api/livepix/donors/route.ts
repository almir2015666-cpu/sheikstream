import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const days = Number(url.searchParams.get('days') || 30)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const db = getSupabaseAdmin()
  let bids = [user.id]
  try {
    const { data: lpCfg } = await db.from('livepix_config').select('channel_id').eq('user_id', user.id).maybeSingle()
    if (lpCfg?.channel_id && lpCfg.channel_id !== user.id) bids.push(lpCfg.channel_id)
  } catch { /* table may not exist */ }
  const { data, error } = await db
    .from('livepix_donors')
    .select('*')
    .in('broadcaster_id', bids)
    .gte('date', since)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.username?.trim()) return NextResponse.json({ error: 'username obrigatório' }, { status: 400 })
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('livepix_donors').insert({
    broadcaster_id: user.id,
    username: body.username.trim(),
    amount: Number(body.amount) || 0,
    message: body.message || null,
    is_manual: true,
    sorteio_id: body.sorteio_id || null,
    tickets: Number(body.tickets) || 1,
    date: body.date || new Date().toISOString().split('T')[0],
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
