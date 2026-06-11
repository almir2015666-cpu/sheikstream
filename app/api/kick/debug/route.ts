import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8')
    return JSON.parse(payload)
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const user = decodeSession(req.cookies.get(COOKIE_NAME)?.value ?? '')
  if (!user) return NextResponse.json({ error: 'not_logged_in' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data: row } = await db
    .from('user_tokens')
    .select('kick_token, kick_refresh_token, kick_channel_id, kick_username')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!row?.kick_token) return NextResponse.json({ error: 'no_kick_token' })

  const token = row.kick_token
  const clientId = process.env.KICK_CLIENT_ID ?? ''

  // Decode JWT payload (no verification — just to see claims)
  const jwtClaims = decodeJwt(token)

  // Try /users/me
  let usersMe: unknown = null
  let usersMeStatus = 0
  try {
    const r = await fetch('https://api.kick.com/public/v1/users/me', {
      headers: { Authorization: `Bearer ${token}`, 'Client-Id': clientId },
    })
    usersMeStatus = r.status
    usersMe = r.ok ? await r.json() : await r.text()
  } catch (e) { usersMe = String(e) }

  // Try /channels with broadcaster_user_id if we have it
  let channelsByBid: unknown = null
  if (row.kick_channel_id) {
    try {
      const r = await fetch(`https://api.kick.com/public/v1/channels?broadcaster_user_id=${row.kick_channel_id}`, {
        headers: { Authorization: `Bearer ${token}`, 'Client-Id': clientId },
      })
      channelsByBid = r.ok ? await r.json() : `${r.status}: ${await r.text()}`
    } catch (e) { channelsByBid = String(e) }
  }

  // Try legacy API lookup by channel_id
  let legacyUser: unknown = null
  if (row.kick_channel_id) {
    try {
      const r = await fetch(`https://kick.com/api/v2/users/${row.kick_channel_id}`)
      legacyUser = r.ok ? await r.json() : `${r.status}: ${await r.text()}`
    } catch (e) { legacyUser = String(e) }
  }

  return NextResponse.json({
    db: {
      kick_username: row.kick_username,
      kick_channel_id: row.kick_channel_id,
      token_prefix: token.slice(0, 20) + '...',
      is_jwt: token.split('.').length === 3,
    },
    jwt_claims: jwtClaims,
    users_me: { status: usersMeStatus, body: usersMe },
    channels_by_bid: channelsByBid,
    legacy_user: legacyUser,
  })
}
