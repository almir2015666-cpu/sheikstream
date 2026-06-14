import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'no_session' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data: tok } = await db.from('user_tokens')
    .select('spotify_token, spotify_refresh_token, spotify_username')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!tok?.spotify_token) return NextResponse.json({ error: 'no_token', user_id: user.id })

  const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${tok.spotify_token}` },
  })

  let body: unknown = null
  const text = await res.text()
  if (text) { try { body = JSON.parse(text) } catch { body = text.slice(0, 200) } }

  return NextResponse.json({
    spotify_user: tok.spotify_username,
    http_status: res.status,
    has_body: !!text,
    body,
  })
}
