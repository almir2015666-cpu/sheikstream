import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

async function refreshKickToken(refreshToken: string): Promise<string | null> {
  if (!process.env.KICK_CLIENT_ID || !process.env.KICK_CLIENT_SECRET) return null
  try {
    const res = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.KICK_CLIENT_ID,
        client_secret: process.env.KICK_CLIENT_SECRET,
      }),
    })
    if (!res.ok) return null
    const d = await res.json()
    return d.access_token ?? null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const user = decodeSession(req.cookies.get(COOKIE_NAME)?.value ?? '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data: row } = await db
    .from('user_tokens')
    .select('kick_token, kick_refresh_token, kick_channel_id, kick_username')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!row?.kick_token) return NextResponse.json({ error: 'not_connected' }, { status: 404 })

  let token = row.kick_token
  const clientId = process.env.KICK_CLIENT_ID ?? ''
  let tokenExpired = false

  const authHeaders = (): Record<string, string> => ({
    Authorization: `Bearer ${token}`,
    'Client-Id': clientId,
  })

  // GET /public/v1/users — correct endpoint (not /users/me which returns 404)
  let usersRes = await fetch('https://api.kick.com/public/v1/users', { headers: authHeaders() })

  if (usersRes.status === 401) {
    tokenExpired = true
    if (row.kick_refresh_token) {
      const newToken = await refreshKickToken(row.kick_refresh_token)
      if (newToken) {
        token = newToken
        tokenExpired = false
        await db.from('user_tokens').update({ kick_token: newToken }).eq('user_id', user.id)
        usersRes = await fetch('https://api.kick.com/public/v1/users', { headers: authHeaders() })
      }
    }
  }

  let displayName = row.kick_username || ''
  let resolvedChannelId = row.kick_channel_id || ''

  if (usersRes.ok) {
    try {
      const d = await usersRes.json()
      const arr = d?.data ?? d
      const u = Array.isArray(arr) ? arr[0] : arr
      if (u) {
        const name = String(u.name ?? u.username ?? u.slug ?? '')
        const id   = String(u.user_id ?? u.id ?? '')
        if (name) displayName      = name
        if (id)   resolvedChannelId = id
      }
    } catch { /* ignore */ }
  }

  // GET /public/v1/channels — returns authenticated user's channel data
  let isLive = false
  let streamTitle: string | null = null
  let viewerCount: number | null = null
  let followersCount: number | null = null
  let slug = displayName.toLowerCase()

  const channelsRes = await fetch('https://api.kick.com/public/v1/channels', { headers: authHeaders() })
  if (channelsRes.ok) {
    try {
      const d = await channelsRes.json()
      const arr = d?.data ?? d
      const c = Array.isArray(arr) ? arr[0] : arr
      if (c) {
        if (c.slug && !slug) { slug = String(c.slug); displayName = c.slug }
        isLive      = !!(c.stream?.is_live)
        viewerCount = c.stream?.viewer_count ?? null
        streamTitle = c.stream_title || null
        // active_subscribers_count is subs, not followers — get followers separately
      }
    } catch { /* ignore */ }
  }

  // Get follower count from old public Kick API (no auth needed, has followers_count)
  if (slug) {
    try {
      const r = await fetch(`https://kick.com/api/v2/channels/${slug}`)
      if (r.ok) {
        const d = await r.json()
        followersCount = d.followers_count ?? null
        // Also fill live data if not already set (old API is more complete)
        if (!isLive && d.livestream) {
          isLive      = true
          streamTitle = d.livestream.session_title ?? streamTitle
          viewerCount = d.livestream.viewer_count ?? viewerCount
        }
      }
    } catch { /* ignore */ }
  }

  // Persist if we learned new info
  if ((displayName && displayName !== row.kick_username) || (resolvedChannelId && resolvedChannelId !== row.kick_channel_id)) {
    db.from('user_tokens').update({
      kick_username:   displayName || null,
      kick_channel_id: resolvedChannelId || null,
    }).eq('user_id', user.id).then(() => {})
  }

  return NextResponse.json({
    username:     displayName || null,
    channel_id:   resolvedChannelId || null,
    followers:    followersCount,
    is_live:      isLive,
    stream_title: streamTitle,
    viewer_count: viewerCount,
    token_valid:  !tokenExpired,
  })
}
