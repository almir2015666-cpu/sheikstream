import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

async function getAppToken(): Promise<string> {
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
  })
  if (!res.ok) throw new Error('Twitch app token failed')
  const data = await res.json()
  return data.access_token
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const results: Record<string, unknown> = {}

  // 1. Check stored token
  const { data: tok } = await db
    .from('user_tokens')
    .select('twitch_token, twitch_refresh_token, updated_at')
    .eq('user_id', user.id)
    .single()

  results.token = {
    hasToken: !!tok?.twitch_token,
    hasRefreshToken: !!tok?.twitch_refresh_token,
    updatedAt: tok?.updated_at ?? null,
  }

  // 2. Validate token with Twitch
  if (tok?.twitch_token) {
    try {
      const validateRes = await fetch('https://id.twitch.tv/oauth2/validate', {
        headers: { Authorization: `OAuth ${tok.twitch_token}` },
      })
      const validateData = await validateRes.json()
      results.tokenValidation = validateRes.ok
        ? { valid: true, scopes: validateData.scopes, login: validateData.login, expiresIn: validateData.expires_in }
        : { valid: false, error: validateData.message ?? 'invalid' }
    } catch (e) {
      results.tokenValidation = { valid: false, error: String(e) }
    }
  } else {
    results.tokenValidation = { valid: false, error: 'no token stored' }
  }

  // 3. List EventSub subscriptions from Twitch
  try {
    const appToken = await getAppToken()
    const subRes = await fetch(
      `https://api.twitch.tv/helix/eventsub/subscriptions?user_id=${user.id}`,
      {
        headers: {
          Authorization: `Bearer ${appToken}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID!,
        },
      }
    )
    const subData = await subRes.json()
    results.eventsubSubscriptions = subData.data?.map((s: Record<string, unknown>) => ({
      type: s.type,
      status: s.status,
      createdAt: s.created_at,
    })) ?? []
    results.eventsubTotal = subData.total ?? 0
  } catch (e) {
    results.eventsubSubscriptions = []
    results.eventsubError = String(e)
  }

  // 4. Check event commands in DB
  const { data: cmds } = await db
    .from('comandos')
    .select('trigger, habilitado, resposta')
    .eq('user_id', user.id)
    .like('trigger', 'event:%')

  results.eventCommands = cmds ?? []

  // 5. Check twitch_cheers table exists
  const { error: cheerErr } = await db
    .from('twitch_cheers')
    .select('id')
    .eq('broadcaster_id', user.id)
    .limit(1)

  results.cheersTableExists = !cheerErr
  results.cheersTableError = cheerErr?.message ?? null

  // 6. Recent twitch_events log (own events + webhook diagnostic)
  const { data: events, error: eventsErr } = await db
    .from('twitch_events')
    .select('broadcaster_id, event_type, event_data')
    .or(`broadcaster_id.eq.${user.id},broadcaster_id.eq._webhook`)
    .limit(20)

  results.recentEvents = events ?? []
  results.eventsTableError = eventsErr?.message ?? null

  // 7. Webhook callback URL being used
  results.webhookUrl = `${process.env.APP_URL ?? 'https://sheikstream.com.br'}/api/twitch/eventsub`

  return NextResponse.json(results)
}
