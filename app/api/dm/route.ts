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
    const { searchParams } = new URL(req.url)
    const withUser = searchParams.get('with')
    const since = searchParams.get('since')
    const db = getSupabaseAdmin()

    if (withUser) {
      const { data, error } = await db
        .from('dm_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${withUser}),and(sender_id.eq.${withUser},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100)
      if (error) return NextResponse.json([], { status: 200 })
      return NextResponse.json(data ?? [])
    }

    if (since) {
      const { data, error } = await db
        .from('dm_messages')
        .select('*')
        .eq('receiver_id', user.id)
        .gt('created_at', since)
        .order('created_at', { ascending: true })
      if (error) return NextResponse.json([], { status: 200 })
      return NextResponse.json(data ?? [])
    }

    // All unread by sender
    const { data, error } = await db
      .from('dm_messages')
      .select('sender_id, sender_name, sender_image, content, created_at')
      .eq('receiver_id', user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json([], { status: 200 })
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { receiver_id, content } = await req.json()
    if (!receiver_id || !content?.trim()) {
      return NextResponse.json({ error: 'receiver_id e content obrigatórios' }, { status: 400 })
    }
    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('dm_messages')
      .insert({
        sender_id: user.id,
        sender_name: (user as { name?: string }).name ?? 'Usuário',
        sender_image: (user as { image?: string }).image ?? null,
        receiver_id,
        content: String(content).trim(),
        read_at: null,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { sender_id } = await req.json()
    if (!sender_id) return NextResponse.json({ error: 'sender_id required' }, { status: 400 })
    const db = getSupabaseAdmin()
    await db
      .from('dm_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', user.id)
      .eq('sender_id', sender_id)
      .is('read_at', null)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
