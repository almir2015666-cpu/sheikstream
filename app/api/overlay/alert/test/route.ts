import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const TEST_EVENTS: Record<string, { event_type: string; event_data: object }> = {
  'twitch-sub':         { event_type: 'channel.subscribe',            event_data: { user_name: 'TesteSheik', user_login: 'testesheik', tier: '1000', _test: true } },
  'twitch-giftsub':     { event_type: 'channel.subscription.gift',    event_data: { user_name: 'TesteSheik', total: 1, _test: true } },
  'twitch-resub':       { event_type: 'channel.subscription.message', event_data: { user_name: 'TesteSheik', cumulative_months: 6, _test: true } },
  'twitch-follow':      { event_type: 'channel.follow',               event_data: { user_name: 'TesteSheik', _test: true } },
  'twitch-bits':        { event_type: 'channel.cheer',                event_data: { user_name: 'TesteSheik', bits: 100, _test: true } },
  'livepix':            { event_type: 'livepix.donation',             event_data: { user_name: 'TesteSheik', amount: 5.00, message: { text: 'Teste de alerta!' }, _test: true } },
  'paypal':             { event_type: 'paypal.donation',              event_data: { user_name: 'TesteSheik', amount: 5.00, _test: true } },
  'kick-sub':           { event_type: 'kick.subscribe',               event_data: { user_name: 'TesteSheik', _test: true } },
  'kick-follow':        { event_type: 'kick.follow',                  event_data: { user_name: 'TesteSheik', _test: true } },
  'kick-giftsub':       { event_type: 'kick.subscription.gift',       event_data: { user_name: 'TesteSheik', total: 1, _test: true } },
  'youtube-member':     { event_type: 'youtube.member',               event_data: { user_name: 'TesteSheik', _test: true } },
  'youtube-giftmember': { event_type: 'youtube.giftmember',          event_data: { user_name: 'TesteSheik', total: 1, _test: true } },
}

const DEFAULT_TEST = { event_type: 'channel.subscribe', event_data: { user_name: 'TesteSheik', tier: '1000', _test: true } }

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const ev = (body.eventSlug && TEST_EVENTS[body.eventSlug]) ?? DEFAULT_TEST

  const { error } = await getSupabaseAdmin()
    .from('twitch_events')
    .insert({ broadcaster_id: user.id, event_type: ev.event_type, event_data: ev.event_data })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
