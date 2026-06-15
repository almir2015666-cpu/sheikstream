import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

// Returns all user_ids that share the same twitch_username as the given user_id.
// This handles accounts that have multiple rows in user_tokens.
async function getAllMyIds(db: ReturnType<typeof getSupabaseAdmin>, userId: string): Promise<string[]> {
  const { data: me } = await db.from('user_tokens').select('twitch_username').eq('user_id', userId).maybeSingle()
  if (!me?.twitch_username) return [userId]
  const { data: rows } = await db.from('user_tokens').select('user_id').eq('twitch_username', me.twitch_username as string)
  const ids = (rows ?? []).map(r => r.user_id as string).filter(Boolean)
  return ids.length > 0 ? ids : [userId]
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const withUser = searchParams.get('with')
    const since = searchParams.get('since')
    const db = getSupabaseAdmin()

    const myIds = await getAllMyIds(db, user.id)

    if (withUser) {
      // Fetch conversation between any of my IDs and the other user
      const orParts = myIds.flatMap(id => [
        `and(sender_id.eq.${id},receiver_id.eq.${withUser})`,
        `and(sender_id.eq.${withUser},receiver_id.eq.${id})`,
      ]).join(',')
      const { data, error } = await db
        .from('dm_messages')
        .select('*')
        .or(orParts)
        .order('created_at', { ascending: true })
        .limit(100)
      if (error) return NextResponse.json([], { status: 200 })
      return NextResponse.json(data ?? [])
    }

    if (since) {
      const { data, error } = await db
        .from('dm_messages')
        .select('*')
        .in('receiver_id', myIds)
        .gt('created_at', since)
        .order('created_at', { ascending: true })
      if (error) return NextResponse.json([], { status: 200 })
      return NextResponse.json(data ?? [])
    }

    // All unread messages (used by poll)
    const { data, error } = await db
      .from('dm_messages')
      .select('*')
      .in('receiver_id', myIds)
      .is('read_at', null)
      .order('created_at', { ascending: true })
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
    const myIds = await getAllMyIds(db, user.id)
    // Mark as read for all of my IDs
    await Promise.all(myIds.map(myId =>
      db.from('dm_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('receiver_id', myId)
        .eq('sender_id', sender_id)
        .is('read_at', null)
    ))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
