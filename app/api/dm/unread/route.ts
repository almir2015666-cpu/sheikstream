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
  if (!user) return NextResponse.json([], { status: 401 })
  try {
    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('dm_messages')
      .select('sender_id')
      .eq('receiver_id', user.id)
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
