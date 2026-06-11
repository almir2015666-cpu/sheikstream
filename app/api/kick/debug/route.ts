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

  const h = { Authorization: `Bearer ${token}`, 'Client-Id': clientId }
  const hNoClient = { Authorization: `Bearer ${token}` }

  async function probe(label: string, url: string, headers: Record<string, string> = h) {
    try {
      const r = await fetch(url, { headers })
      const body = r.ok ? await r.json() : await r.text()
      return { label, status: r.status, body }
    } catch (e) { return { label, status: -1, body: String(e) } }
  }

  const results = await Promise.all([
    // OIDC userinfo (standard endpoint for OAuth 2.0 providers)
    probe('oidc_userinfo',       'https://id.kick.com/oauth/userinfo', hNoClient),
    probe('oidc_userinfo_cid',   'https://id.kick.com/oauth/userinfo'),
    // Kick public v1 variants
    probe('v1_users_me',         'https://api.kick.com/public/v1/users/me'),
    probe('v1_user_me',          'https://api.kick.com/public/v1/user/me'),
    probe('v1_users',            'https://api.kick.com/public/v1/users'),
    probe('v1_channels_authed',  'https://api.kick.com/public/v1/channels'),
    probe('v1_channels_me',      'https://api.kick.com/public/v1/channels/me'),
    // Token introspect
    probe('introspect',          'https://id.kick.com/oauth/introspect', hNoClient),
  ])

  return NextResponse.json({
    db: {
      kick_username:  row.kick_username,
      kick_channel_id: row.kick_channel_id,
      token_prefix:   token.slice(0, 20) + '...',
      is_jwt:         token.split('.').length === 3,
    },
    jwt_claims: jwtClaims,
    probes: results,
  })
}
