import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const SLUG_TO_TYPES: Record<string, string[]> = {
  'twitch-sub':         ['channel.subscribe'],
  'twitch-giftsub':     ['channel.subscription.gift'],
  'twitch-resub':       ['channel.subscription.message'],
  'twitch-follow':      ['channel.follow'],
  'twitch-bits':        ['channel.cheer'],
  'livepix':            ['livepix.donation'],
  'paypal':             ['paypal.donation'],
  'kick-sub':           ['kick.subscribe'],
  'kick-follow':        ['kick.follow'],
  'kick-giftsub':       ['kick.subscription.gift'],
  'youtube-member':     ['youtube.member'],
  'youtube-giftmember': ['youtube.giftmember'],
}

// Prevent edge/CDN caching — overlay must always get fresh events
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const eventSlug = req.nextUrl.searchParams.get('event')

  // uid param kept for backwards compat but no longer required —
  // overlay is global: returns events for the main broadcaster stored in env
  const uid = req.nextUrl.searchParams.get('uid') ?? process.env.BROADCASTER_ID ?? null

  const db = getSupabaseAdmin()
  let query = db
    .from('twitch_events')
    .select('id, event_type, event_data')
    .order('id', { ascending: false })
    .limit(20)

  if (uid) query = query.eq('broadcaster_id', uid)

  // after=<id>: only return events strictly newer than this ID
  const after = req.nextUrl.searchParams.get('after')
  if (after && /^\d+$/.test(after)) query = query.gt('id', parseInt(after, 10))

  if (eventSlug && SLUG_TO_TYPES[eventSlug]) {
    query = query.in('event_type', SLUG_TO_TYPES[eventSlug])
  }

  const { data: events } = await query

  const alerts = (events ?? []).map(e => {
    const d = e.event_data as Record<string, unknown> ?? {}
    const type = mapEventType(e.event_type)
    return {
      id: e.id,
      type,
      user: String(d.user_name ?? d.user_login ?? d.gifter_user_name ?? 'Anônimo'),
      amount: extractAmount(e.event_type, d),
      extra: extractExtra(e.event_type, d),
    }
  })

  return NextResponse.json(alerts, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  })
}

function mapEventType(eventType: string): string {
  if (eventType === 'channel.subscribe') return 'sub'
  if (eventType === 'channel.subscription.message') return 'resub'
  if (eventType === 'channel.subscription.gift') return 'giftsub'
  if (eventType === 'channel.follow') return 'follow'
  if (eventType === 'channel.cheer') return 'bits'
  if (eventType === 'livepix.donation') return 'donation'
  if (eventType === 'channel.channel_points_custom_reward_redemption.add') return 'command'
  return 'command'
}

function extractAmount(eventType: string, d: Record<string, unknown>): number | undefined {
  if (eventType === 'channel.cheer') return Number(d.bits ?? 0)
  if (eventType === 'livepix.donation') return Number(d.amount ?? 0)
  if (eventType === 'channel.subscription.gift') return Number(d.total ?? 1)
  return undefined
}

function extractExtra(eventType: string, d: Record<string, unknown>): string | undefined {
  if (eventType === 'channel.subscription.message') {
    const months = d.cumulative_months
    return months ? `${months} meses` : undefined
  }
  if (d.message) {
    const msg = d.message as Record<string, unknown>
    const text = typeof msg === 'string' ? msg : String(msg.text ?? '')
    return text.length > 0 ? text.slice(0, 60) : undefined
  }
  return undefined
}
