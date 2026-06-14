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
  const { data } = await db.from('loyalty_rewards').select('*').eq('broadcaster_id', user.id).order('cost', { ascending: true })
  return NextResponse.json((data ?? []).map((r: Record<string, unknown>) => ({ ...r, enabled: r.active ?? true })))
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { name, description, cost, max_redemptions } = body
  if (!name || !cost) return NextResponse.json({ error: 'name and cost required' }, { status: 400 })
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('loyalty_rewards').insert({
    broadcaster_id: user.id, name, description, cost: Number(cost), max_redemptions: max_redemptions ?? null, active: true,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if ('enabled' in updates) { updates.active = updates.enabled; delete updates.enabled }
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('loyalty_rewards').update(updates).eq('id', id).eq('broadcaster_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, enabled: data.active ?? true })
}

export async function DELETE(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const db = getSupabaseAdmin()
  await db.from('loyalty_rewards').delete().eq('id', id).eq('broadcaster_id', user.id)
  return NextResponse.json({ ok: true })
}
