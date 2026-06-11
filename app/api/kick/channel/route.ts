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

  let displayName    = row.kick_username || ''
  let resolvedId     = row.kick_channel_id || ''
  let profilePicture: string | null = null

  if (usersRes.ok) {
    try {
      const d   = await usersRes.json()
      const arr = d?.data ?? d
      const u   = Array.isArray(arr) ? arr[0] : arr
      if (u) {
        if (u.name ?? u.username)            displayName    = String(u.name ?? u.username ?? '')
        if (u.user_id ?? u.id)               resolvedId     = String(u.user_id ?? u.id ?? '')
        if (u.profile_picture)               profilePicture = String(u.profile_picture)
      }
    } catch { /* ignore */ }
  }

  // GET /public/v1/channels — authenticated user's channel (slug, stream, subs, category)
  let isLive      = false
  let streamTitle: string | null = null
  let viewerCount: number | null = null
  let activeSubs  = 0
  let category:   string | null = null
  let slug        = displayName.toLowerCase()

  const channelsRes = await fetch('https://api.kick.com/public/v1/channels', { headers: authHeaders() })
  if (channelsRes.ok) {
    try {
      const d   = await channelsRes.json()
      const arr = d?.data ?? d
      const c   = Array.isArray(arr) ? arr[0] : arr
      if (c) {
        if (c.slug)  slug = String(c.slug)
        if (!displayName && c.slug) displayName = String(c.slug)
        if (!resolvedId && c.broadcaster_user_id) resolvedId = String(c.broadcaster_user_id)
        isLive      = !!(c.stream?.is_live)
        viewerCount = (c.stream?.viewer_count ?? null) as number | null
        streamTitle = (c.stream_title || null) as string | null
        activeSubs  = Number(c.active_subscribers_count ?? 0)
        const cat   = c.category as Record<string, unknown> | null
        if (cat?.name) category = String(cat.name)
      }
    } catch { /* ignore */ }
  }

  // Note: kick.com legacy API (followers_count) blocks server-side requests with 403.
  // Followers are fetched client-side from the browser instead.

  // Persist updated info
  if ((displayName && displayName !== row.kick_username) || (resolvedId && resolvedId !== row.kick_channel_id)) {
    db.from('user_tokens').update({
      kick_username:   displayName || null,
      kick_channel_id: resolvedId  || null,
    }).eq('user_id', user.id).then(() => {})
  }

  return NextResponse.json({
    username:        displayName    || null,
    channel_id:      resolvedId     || null,
    profile_picture: profilePicture,
    followers:       null, // fetched client-side (server blocked by Kick security policy)
    active_subs:     activeSubs,
    is_live:         isLive,
    stream_title:    streamTitle,
    viewer_count:    viewerCount,
    category:        category,
    token_valid:     !tokenExpired,
  })
}
