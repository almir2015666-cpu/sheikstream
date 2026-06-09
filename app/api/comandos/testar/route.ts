import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const TEST_VARS: Record<string, string> = {
  user: 'TesteSheik', valor: '5,00', tickets: '10',
  msg: 'Mensagem de teste!', tier: 'Tier 1', months: '3',
  count: '5', gifter: 'TesteSheik', nums: '1, 2, 3', platform: 'Twitch',
}

function resolveVars(text: string): string {
  let result = text
  for (const [k, v] of Object.entries(TEST_VARS)) {
    result = result.replace(new RegExp('\\$' + k, 'gi'), v)
  }
  return result.trim()
}

const TEST_EVENTS: Record<string, { event_type: string; event_data: object }> = {
  'twitch-sub':         { event_type: 'channel.subscribe',            event_data: { user_name: 'TesteSheik', user_login: 'testesheik', tier: '1000', _test: true } },
  'twitch-giftsub':     { event_type: 'channel.subscription.gift',    event_data: { user_name: 'TesteSheik', total: 1, _test: true } },
  'twitch-resub':       { event_type: 'channel.subscription.message', event_data: { user_name: 'TesteSheik', cumulative_months: 6, _test: true } },
  'twitch-follow':      { event_type: 'channel.follow',               event_data: { user_name: 'TesteSheik', _test: true } },
  'twitch-bits':        { event_type: 'channel.cheer',                event_data: { user_name: 'TesteSheik', bits: 100, _test: true } },
  'livepix':            { event_type: 'livepix.donation',             event_data: { user_name: 'TesteSheik', amount: 5.00, message: { text: 'Mensagem de teste!' }, _test: true } },
  'paypal':             { event_type: 'paypal.donation',              event_data: { user_name: 'TesteSheik', amount: 5.00, _test: true } },
  'kick-sub':           { event_type: 'kick.subscribe',               event_data: { user_name: 'TesteSheik', _test: true } },
  'kick-follow':        { event_type: 'kick.follow',                  event_data: { user_name: 'TesteSheik', _test: true } },
  'kick-giftsub':       { event_type: 'kick.subscription.gift',       event_data: { user_name: 'TesteSheik', total: 1, _test: true } },
  'youtube-member':     { event_type: 'youtube.member',               event_data: { user_name: 'TesteSheik', _test: true } },
  'youtube-giftmember': { event_type: 'youtube.giftmember',          event_data: { user_name: 'TesteSheik', total: 1, _test: true } },
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { resposta, eventSlug } = body as { resposta?: string; eventSlug?: string }

  const db = getSupabaseAdmin()
  const errors: string[] = []

  // ── 1. Send chat message with test variables substituted ───────────────
  if (resposta) {
    const message = resolveVars(resposta)
    const { data: tok } = await db
      .from('user_tokens')
      .select('twitch_token, twitch_refresh_token')
      .eq('user_id', user.id)
      .single()

    if (tok?.twitch_token) {
      const chatRes = await fetch('https://api.twitch.tv/helix/chat/messages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tok.twitch_token}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ broadcaster_id: user.id, sender_id: user.id, message }),
      })

      // Token expired — refresh once and retry
      if (chatRes.status === 401 && tok.twitch_refresh_token) {
        const refreshRes = await fetch('https://id.twitch.tv/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tok.twitch_refresh_token,
            client_id: process.env.TWITCH_CLIENT_ID!,
            client_secret: process.env.TWITCH_CLIENT_SECRET!,
          }),
        })
        if (refreshRes.ok) {
          const { access_token, refresh_token } = await refreshRes.json()
          await db.from('user_tokens').update({
            twitch_token: access_token,
            twitch_refresh_token: refresh_token ?? tok.twitch_refresh_token,
            updated_at: new Date().toISOString(),
          }).eq('user_id', user.id)
          await fetch('https://api.twitch.tv/helix/chat/messages', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${access_token}`,
              'Client-Id': process.env.TWITCH_CLIENT_ID!,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ broadcaster_id: user.id, sender_id: user.id, message }),
          })
        } else {
          errors.push('token_expired')
        }
      } else if (!chatRes.ok) {
        errors.push('chat_failed')
      }
    } else {
      errors.push('no_token')
    }
  }

  // ── 2. Insert overlay test event ──────────────────────────────────────
  if (eventSlug) {
    const ev = TEST_EVENTS[eventSlug]
    if (ev) {
      const { error: dbErr } = await db
        .from('twitch_events')
        .insert({
          broadcaster_id: user.id,
          event_type: ev.event_type,
          event_data: ev.event_data,
        })
      if (dbErr) errors.push('overlay_failed: ' + dbErr.message)
    }
  }

  return NextResponse.json({ ok: true, errors })
}
