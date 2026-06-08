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
    .maybeSingle()

  if (!tokenRow?.twitch_token) {
    return NextResponse.json({ error: 'Conta Twitch não conectada' }, { status: 400 })
  }

  const clientId = process.env.TWITCH_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 })

  const headers = {
    Authorization: `Bearer ${tokenRow.twitch_token}`,
    'Client-Id': clientId,
  }

  let broadcasterId = tokenRow.twitch_channel_id
  if (!broadcasterId) {
    try {
      const usersRes = await fetch('https://api.twitch.tv/helix/users', { headers })
      if (usersRes.ok) {
        const ud = await usersRes.json()
        const twitchId = ud.data?.[0]?.id
        if (twitchId) {
          broadcasterId = twitchId
          await db.from('user_tokens').update({ twitch_channel_id: twitchId }).eq('user_id', user.id)
        }
      }
    } catch { /* ignore */ }
  }

  if (!broadcasterId) {
    return NextResponse.json({ error: 'Canal Twitch não identificado. Reconecte em Conexões.' }, { status: 400 })
  }

  try {
    const [channelRes, streamRes, followersRes, usersRes, bitsRes] = await Promise.all([
      fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`, { headers }),
      fetch(`https://api.twitch.tv/helix/streams?user_id=${broadcasterId}`, { headers }),
      fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}&first=1`, { headers }),
      fetch(`https://api.twitch.tv/helix/users?id=${broadcasterId}`, { headers }),
      fetch(`https://api.twitch.tv/helix/bits/leaderboard?broadcaster_id=${broadcasterId}&count=100&period=all`, { headers }),
    ])

    if (channelRes.status === 401) {
      return NextResponse.json({ error: 'Token Twitch expirado. Reconecte em Conexões.' }, { status: 401 })
    }

    const channelData = channelRes.ok ? await channelRes.json() : null
    const streamData = streamRes.ok ? await streamRes.json() : null
    const followersData = followersRes.ok ? await followersRes.json() : null
    const usersData = usersRes.ok ? await usersRes.json() : null
    const bitsData = bitsRes.ok ? await bitsRes.json() : null

    const channel = channelData?.data?.[0] ?? null
    const stream = streamData?.data?.[0] ?? null
    const twitchUser = usersData?.data?.[0] ?? null
    const followerCount = followersData?.total ?? null

    // Sum all bits from the leaderboard (historical total)
    const bitsLeaderboard: Array<{ user_id: string; user_login: string; user_name: string; rank: number; score: number }> = bitsData?.data ?? []
    const totalBitsHistorical = bitsLeaderboard.reduce((acc, e) => acc + e.score, 0)

    return NextResponse.json({
      broadcaster_name: channel?.broadcaster_name ?? twitchUser?.display_name ?? user.name,
      broadcaster_login: channel?.broadcaster_login ?? twitchUser?.login ?? '',
      title: channel?.title ?? '',
      game_name: channel?.game_name ?? '',
      is_live: !!stream,
      viewer_count: stream?.viewer_count ?? 0,
      started_at: stream?.started_at ?? null,
      follower_count: followerCount,
      view_count: twitchUser?.view_count ?? null,
      language: channel?.broadcaster_language ?? '',
      bits_total_historical: totalBitsHistorical,
      bits_leaderboard: bitsLeaderboard.slice(0, 10).map(e => ({ username: e.user_name, bits: e.score })),
    })
  } catch {
    return NextResponse.json({ error: 'Falha de conexão com a Twitch' }, { status: 502 })
  }
}
