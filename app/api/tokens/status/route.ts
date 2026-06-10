import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ twitch: false, youtube: false, spotify: false, kick: false })

  const user = decodeSession(token)
  if (!user) return NextResponse.json({ twitch: false, youtube: false, spotify: false, kick: false })

  const { data } = await getSupabaseAdmin()
    .from('user_tokens')
    .select('twitch_token, youtube_token, spotify_token, spotify_username, kick_token, kick_username')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    twitch:           !!data?.twitch_token,
    youtube:          !!data?.youtube_token,
    spotify:          !!data?.spotify_token,
    spotify_username: data?.spotify_username ?? null,
    kick:             !!data?.kick_token,
    kick_username:    data?.kick_username ?? null,
  })
}
