import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'no_cookie' })

  const user = decodeSession(token)
  if (!user) return NextResponse.json({ error: 'invalid_session', token_preview: token.slice(0, 20) })

  const { data, error } = await getSupabaseAdmin()
    .from('user_tokens')
    .select('user_id, twitch_token, spotify_token, spotify_username, kick_token, youtube_token, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    session_user_id: user.id,
    session_user_name: user.name,
    db_row_found: !!data,
    twitch_token_set: !!data?.twitch_token,
    spotify_token_set: !!data?.spotify_token,
    spotify_username: data?.spotify_username ?? null,
    kick_token_set: !!data?.kick_token,
    youtube_token_set: !!data?.youtube_token,
    updated_at: data?.updated_at ?? null,
    db_error: error?.message ?? null,
  })
}
