import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('twitch_subs')
    .update({
      username: body.username,
      tier: body.tier,
      is_gift: body.is_gift,
      gifted_by: body.gifted_by || null,
      sorteio_id: body.sorteio_id || null,
      tickets: Number(body.tickets) || 1,
      date: body.date,
    })
    .eq('id', id).eq('broadcaster_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = getSupabaseAdmin()
  const { error } = await db.from('twitch_subs').delete().eq('id', id).eq('broadcaster_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
