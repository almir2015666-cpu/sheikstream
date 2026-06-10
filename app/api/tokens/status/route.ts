import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ twitch: false, youtube: false, spotify: false, kick: false })

  const user = decodeSession(token)
  if (!user) return NextResponse.json({ twitch: false, youtube: false, spotify: false, kick: false })

  const { data: baseData } = await getSupabaseAdmin()
    .from('user_tokens')
    .select('twitch_token, youtube_token, spotify_token, spotify_username')
    .eq('user_id', user.id)
    .maybeSingle()

  // Kick columns may not exist yet — query separately to avoid breaking everything
  const { data: kickData } = await getSupabaseAdmin()
    .from('user_tokens')
    .select('kick_token, kick_username')
    .eq('user_id', user.id)
    .maybeSingle()
    .then(r => r.error ? { data: null } : r)

  // Try kick_channel_id separately — column may not exist on all installs
  const { data: kickChannelData } = await getSupabaseAdmin()
    .from('user_tokens')
    .select('kick_channel_id')
    .eq('user_id', user.id)
    .maybeSingle()
    .then(r => r.error ? { data: null } : r)

  return NextResponse.json({
    twitch:           !!baseData?.twitch_token,
    youtube:          !!baseData?.youtube_token,
    spotify:          !!baseData?.spotify_token,
    spotify_username: baseData?.spotify_username ?? null,
    kick:             !!kickData?.kick_token,
    kick_username:    kickData?.kick_username ?? null,
    kick_channel_id:  kickChannelData?.kick_channel_id ?? null,
  })
}
