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

  // Get slug from DB or from the v1/channels call
  let slug = row.kick_username?.toLowerCase() || ''
  if (!slug) {
    try {
      const r = await fetch('https://api.kick.com/public/v1/channels', { headers: h })
      if (r.ok) {
        const d = await r.json()
        slug = d?.data?.[0]?.slug || ''
      }
    } catch { /* ignore */ }
  }

  const results = await Promise.all([
    probe('v1_channels_slug_auth',   `https://api.kick.com/public/v1/channels/${slug}`),
    probe('v1_channels_slug_noauth', `https://api.kick.com/public/v1/channels/${slug}`, {}),
    probe('v1_channels_id_auth',     `https://api.kick.com/public/v1/channels/${row.kick_channel_id}`),
    probe('v1_channel_followers',    `https://api.kick.com/public/v1/channels/${slug}/followers`),
    probe('v1_channel_stats',        `https://api.kick.com/public/v1/channels/${slug}/statistics`),
    probe('v1_channel_subscribers',  `https://api.kick.com/public/v1/channels/${slug}/subscribers`),
    probe('v1_user_by_id',          `https://api.kick.com/public/v1/users?id=${row.kick_channel_id}`),
    probe('v1_user_by_slug',        `https://api.kick.com/public/v1/users?username=${slug}`),
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
