import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const uid = searchParams.get('uid')

  let broadcasterId: string | null = null
  if (uid) {
    broadcasterId = uid
  } else {
    const token = req.cookies.get(COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = decodeSession(token)
    broadcasterId = user?.id ?? null
  }

  if (!broadcasterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 50)
  const { data, error } = await db
    .from('loyalty_points')
    .select('viewer_login, points, total_earned')
    .eq('broadcaster_id', broadcasterId)
    .order('points', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
