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
  const { data, error } = await db
    .from('song_requests')
    .select('*')
    .eq('broadcaster_id', user.id)
    .in('status', ['pending', 'playing'])
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function DELETE(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const mode = searchParams.get('mode')
  const db = getSupabaseAdmin()
  if (mode === 'all') {
    await db.from('song_requests').delete().eq('broadcaster_id', user.id).in('status', ['pending', 'played', 'skipped'])
  } else if (mode === 'played') {
    await db.from('song_requests').delete().eq('broadcaster_id', user.id).in('status', ['played', 'skipped'])
  } else if (id) {
    await db.from('song_requests').delete().eq('broadcaster_id', user.id).eq('id', id)
  }
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { id, status } = body
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('song_requests')
    .update({ status })
    .eq('broadcaster_id', user.id)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
