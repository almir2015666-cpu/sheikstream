import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data: tokenRow } = await db
    .from('user_tokens')
    .select('twitch_token, twitch_channel_id')
    .eq('user_id', user.id)
    .single()

  if (!tokenRow?.twitch_token) {
    return NextResponse.json({ error: 'Conta Twitch não conectada' }, { status: 400 })
  }

  const clientId = process.env.TWITCH_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 })

  const broadcasterId = tokenRow.twitch_channel_id || user.id
  const headers = {
    Authorization: `Bearer ${tokenRow.twitch_token}`,
    'Client-Id': clientId,
  }

  try {
    const [channelRes, streamRes, followersRes] = await Promise.all([
      fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`, { headers }),
      fetch(`https://api.twitch.tv/helix/streams?user_id=${broadcasterId}`, { headers }),
      fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}&first=1`, { headers }),
    ])

    if (channelRes.status === 401) {
      return NextResponse.json({ error: 'Token Twitch expirado. Reconecte em Conexões.' }, { status: 401 })
    }

    const channelData = channelRes.ok ? await channelRes.json() : null
    const streamData = streamRes.ok ? await streamRes.json() : null
    const followersData = followersRes.ok ? await followersRes.json() : null

    const channel = channelData?.data?.[0] ?? null
    const stream = streamData?.data?.[0] ?? null
    const followerCount = followersData?.total ?? null

    return NextResponse.json({
      broadcaster_name: channel?.broadcaster_name ?? user.name,
      broadcaster_login: channel?.broadcaster_login ?? '',
      title: channel?.title ?? '',
      game_name: channel?.game_name ?? '',
      is_live: !!stream,
      viewer_count: stream?.viewer_count ?? 0,
      started_at: stream?.started_at ?? null,
      follower_count: followerCount,
      language: channel?.broadcaster_language ?? '',
    })
  } catch {
    return NextResponse.json({ error: 'Falha de conexão com a Twitch' }, { status: 502 })
  }
}
