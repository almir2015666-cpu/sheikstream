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

function extractUserFields(raw: unknown): { name: string; id: string } {
  if (!raw || typeof raw !== 'object') return { name: '', id: '' }
  const u = raw as Record<string, unknown>
  // Try channel slug from nested channel object first (most reliable for lookup)
  const ch = (u.channel ?? {}) as Record<string, unknown>
  const name = String(
    u.username ?? u.slug ?? u.login ?? ch.slug ?? ch.name ?? u.name ?? u.display_name ?? ''
  )
  const id = String(
    u.id ?? u.user_id ?? u.channel_id ?? u.broadcaster_user_id ?? ch.id ?? ''
  )
  return { name, id }
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

  // Fetch user profile — try refresh on 401
  let profileRes = await fetch('https://api.kick.com/public/v1/users/me', { headers: authHeaders() })
  if (profileRes.status === 401) {
    tokenExpired = true
    if (row.kick_refresh_token) {
      const newToken = await refreshKickToken(row.kick_refresh_token)
      if (newToken) {
        token = newToken
        tokenExpired = false
        await db.from('user_tokens').update({ kick_token: newToken }).eq('user_id', user.id)
        profileRes = await fetch('https://api.kick.com/public/v1/users/me', { headers: authHeaders() })
      }
    }
  }

  let displayName = row.kick_username || ''
  let resolvedChannelId = row.kick_channel_id || ''

  if (profileRes.ok) {
    try {
      const d = await profileRes.json()
      const raw = d?.data ?? d
      const item = Array.isArray(raw) ? raw[0] : raw
      const { name, id } = extractUserFields(item)
      if (name) displayName      = name
      if (id)   resolvedChannelId = id
      console.log('[kick/channel] users/me ok — name:', name, 'id:', id, 'raw keys:', item ? Object.keys(item) : 'null')
    } catch (e) {
      console.warn('[kick/channel] users/me parse error:', e)
    }
  } else {
    console.warn('[kick/channel] users/me status:', profileRes.status)
  }

  // If still no username, try multiple lookup strategies by ID
  if (!displayName && resolvedChannelId) {
    const idLookups = [
      // Kick public v1: query by broadcaster_user_id
      () => fetch(`https://api.kick.com/public/v1/channels?broadcaster_user_id=${resolvedChannelId}`, { headers: authHeaders() }),
      // Kick legacy v2: look up user by numeric ID (no auth needed)
      () => fetch(`https://kick.com/api/v2/users/${resolvedChannelId}`),
      // Kick legacy v2: channel by numeric ID (might work as slug)
      () => fetch(`https://kick.com/api/v2/channels/${resolvedChannelId}`),
    ]
    for (const lookup of idLookups) {
      if (displayName) break
      try {
        const res = await lookup()
        if (!res.ok) continue
        const d = await res.json()
        const raw = d?.data ?? d
        const item = Array.isArray(raw) ? raw[0] : raw
        if (item) {
          const found = String(item.slug ?? item.username ?? item.channel?.slug ?? item.name ?? '') || ''
          if (found) { displayName = found; console.log('[kick/channel] id-lookup found:', found) }
        }
      } catch { /* ignore */ }
    }
  }

  // Persist updated info if we found something
  if ((displayName && displayName !== row.kick_username) || (resolvedChannelId && resolvedChannelId !== row.kick_channel_id)) {
    db.from('user_tokens').update({
      kick_username:   displayName || null,
      kick_channel_id: resolvedChannelId || null,
    }).eq('user_id', user.id).then(() => {})
  }

  // Fetch channel stats (followers, live status)
  let followersCount: number | null = null
  let isLive = false
  let streamTitle: string | null = null
  let viewerCount: number | null = null

  // Try all candidate slugs/IDs in order
  const candidates = [
    displayName.toLowerCase(),
    resolvedChannelId,
  ].filter((s, i, a) => s && a.indexOf(s) === i)

  for (const slug of candidates) {
    if (followersCount !== null) break
    // Try authenticated public v1, then unauthenticated v1, then legacy v2 API
    const attempts = [
      () => fetch(`https://api.kick.com/public/v1/channels/${slug}`, { headers: authHeaders() }),
      () => fetch(`https://api.kick.com/public/v1/channels/${slug}`, { headers: { 'Client-Id': clientId } }),
      () => fetch(`https://kick.com/api/v2/channels/${slug}`),
    ]
    for (const attempt of attempts) {
      try {
        const res = await attempt()
        if (!res.ok) continue
        const d = await res.json()
        const raw = d?.data ?? d
        const c = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>
        if (!c) continue
        followersCount = (c.followers_count ?? c.followersCount ?? null) as number | null
        isLive         = !!(c.is_live ?? c.livestream)
        const ls = (c.livestream ?? {}) as Record<string, unknown>
        streamTitle    = (ls.session_title ?? null) as string | null
        viewerCount    = (ls.viewer_count ?? null) as number | null
        if (!displayName) {
          displayName = String(c.slug ?? c.channel_name ?? '') || displayName
        }
        console.log('[kick/channel] channel data ok via', slug, '— followers:', followersCount)
        break
      } catch { /* ignore */ }
    }
  }

  return NextResponse.json({
    username:    displayName || null,
    channel_id:  resolvedChannelId || null,
    followers:   followersCount,
    is_live:     isLive,
    stream_title: streamTitle,
    viewer_count: viewerCount,
    token_valid: !tokenExpired,
  })
}
