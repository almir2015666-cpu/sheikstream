import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json(null, { status: 401 })
  const user = decodeSession(token)
  if (!user) return NextResponse.json(null, { status: 401 })

  if (user.platform === 'Twitch') {
    try {
      const db = getSupabaseAdmin()
      const { data: rows } = await db
        .from('waitlist')
        .select('status')
        .eq('platform', 'Twitch')
        .ilike('platform_username', user.name)
        .limit(1)
      const entry = rows?.[0] ?? null

      if (entry?.status === 'banned') {
        return NextResponse.json({ error: 'banned' }, { status: 403 })
      }
      if (entry?.status === 'pending' || entry?.status === 'rejected') {
        return NextResponse.json({ error: 'pending' }, { status: 403 })
      }
    } catch {
      // DB unavailable — allow through
    }
  }

  return NextResponse.json(user)
}
