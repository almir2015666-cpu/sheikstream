import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data: sorteio } = await db.from('sorteios').select('*').eq('id', id).eq('broadcaster_id', user.id).single()
  if (!sorteio) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: participants, count } = await db
    .from('sorteio_participants')
    .select('username,tickets,joined_at', { count: 'exact' })
    .eq('sorteio_id', id)
    .order('joined_at', { ascending: false })
    .limit(200)

  return NextResponse.json({ ...sorteio, participants: participants ?? [], count: count ?? 0 })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const db = getSupabaseAdmin()
  const updates: Record<string, unknown> = {}

  if (body.status === 'active') {
    updates.status = 'active'
    updates.started_at = new Date().toISOString()
  } else if (body.status === 'finished') {
    updates.status = 'finished'
    updates.ended_at = new Date().toISOString()
  } else if (body.status === 'pending') {
    updates.status = 'pending'
    updates.started_at = null
    updates.ended_at = null
    updates.winner_username = null
  }
  if (body.title) updates.title = body.title
  if (body.type) updates.type = body.type
  if (body.keyword !== undefined) updates.keyword = body.keyword

  const { data, error } = await db.from('sorteios').update(updates).eq('id', id).eq('broadcaster_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { error } = await db.from('sorteios').delete().eq('id', id).eq('broadcaster_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
