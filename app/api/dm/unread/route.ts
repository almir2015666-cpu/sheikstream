import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

async function getAllMyIds(db: ReturnType<typeof getSupabaseAdmin>, userId: string): Promise<string[]> {
  const { data: me } = await db.from('user_tokens').select('twitch_username').eq('user_id', userId).maybeSingle()
  if (!me?.twitch_username) return [userId]
  const { data: rows } = await db.from('user_tokens').select('user_id').eq('twitch_username', me.twitch_username as string)
  const ids = (rows ?? []).map(r => r.user_id as string).filter(Boolean)
  return ids.length > 0 ? ids : [userId]
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json([], { status: 401 })
  try {
    const db = getSupabaseAdmin()
    const myIds = await getAllMyIds(db, user.id)
    const { data, error } = await db
      .from('dm_messages')
      .select('sender_id')
      .in('receiver_id', myIds)
      .is('read_at', null)
    if (error) return NextResponse.json([], { status: 200 })
    const counts: Record<string, number> = {}
    for (const row of data ?? []) {
      counts[row.sender_id] = (counts[row.sender_id] ?? 0) + 1
    }
    const result = Object.entries(counts).map(([sender_id, count]) => ({ sender_id, count }))
    return NextResponse.json(result)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
