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
  const channelId = row.kick_channel_id ?? ''
  const clientId  = process.env.KICK_CLIENT_ID ?? ''

  async function kickFetch(url: string, t: string) {
    return fetch(url, {
      headers: { Authorization: `Bearer ${t}`, 'Client-Id': clientId },
    })
  }

  // Try fetching user profile
  let profileRes = await kickFetch('https://api.kick.com/public/v1/users/me', token)

  // If 401 and refresh token exists, try to refresh
  if (profileRes.status === 401 && row.kick_refresh_token) {
    const newToken = await refreshKickToken(row.kick_refresh_token)
    if (newToken) {
      token = newToken
      await db.from('user_tokens').update({ kick_token: newToken }).eq('user_id', user.id)
      profileRes = await kickFetch('https://api.kick.com/public/v1/users/me', token)
    }
  }

  let displayName = row.kick_username || ''
  let resolvedChannelId = channelId

  if (profileRes.ok) {
    try {
      const d = await profileRes.json()
      // Kick may return data as object or array
      const raw = d?.data ?? d
      const u = Array.isArray(raw) ? raw[0] : raw
      if (u) {
        const newName = String(u.username ?? u.name ?? u.slug ?? u.login ?? '')
        const newId   = String(u.id ?? u.user_id ?? u.channel_id ?? '')
        if (newName) displayName      = newName
        if (newId)   resolvedChannelId = newId

        // Persist updated info
        await db.from('user_tokens').update({
          kick_username:   displayName || null,
          kick_channel_id: resolvedChannelId || null,
        }).eq('user_id', user.id)
      }
    } catch { /* ignore parse errors */ }
  }

  // Fetch channel details (followers, live status)
  let followersCount: number | null = null
  let isLive = false
  let streamTitle: string | null = null
  let viewerCount: number | null = null

  async function fetchChannelSlug(slug: string) {
    // Try with auth first, then without (public endpoint)
    const headerOptions: Record<string, string>[] = [
      { Authorization: `Bearer ${token}`, 'Client-Id': clientId },
      { 'Client-Id': clientId },
    ]
    for (const headers of headerOptions) {
      try {
        const res = await fetch(`https://api.kick.com/public/v1/channels/${slug}`, { headers })
        if (res.ok) return res
      } catch { /* ignore */ }
    }
    return null
  }

  function parseChannelData(c: Record<string, unknown>) {
    followersCount = (c.followers_count ?? c.followersCount ?? null) as number | null
    isLive         = !!(c.is_live ?? c.livestream)
    const ls = c.livestream as Record<string, unknown> | null
    streamTitle    = (ls?.session_title ?? (c.currentLivestream as Record<string, unknown>)?.session_title ?? null) as string | null
    viewerCount    = (ls?.viewer_count ?? null) as number | null
  }

  const slug = displayName.toLowerCase()
  if (slug) {
    try {
      const res = await fetchChannelSlug(slug)
      if (res) {
        const d = await res.json()
        const raw = d?.data ?? d
        const c = Array.isArray(raw) ? raw[0] : raw
        if (c) parseChannelData(c)
      }
    } catch { /* ignore */ }
  }

  // Fallback: try with channel ID
  if (followersCount === null && resolvedChannelId && resolvedChannelId !== slug) {
    try {
      const res = await fetchChannelSlug(resolvedChannelId)
      if (res) {
        const d = await res.json()
        const raw = d?.data ?? d
        const c = Array.isArray(raw) ? raw[0] : raw
        if (c) {
          parseChannelData(c)
          if (!displayName && (c.slug ?? c.channel_name)) {
            displayName = String(c.slug ?? c.channel_name)
          }
        }
      }
    } catch { /* ignore */ }
  }

  return NextResponse.json({
    username:       displayName || null,
    channel_id:     resolvedChannelId || null,
    followers:      followersCount,
    is_live:        isLive,
    stream_title:   streamTitle,
    viewer_count:   viewerCount,
    token_valid:    profileRes.ok,
  })
}
