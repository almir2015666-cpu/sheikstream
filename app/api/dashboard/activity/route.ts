import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const user = decodeSession(req.cookies.get(COOKIE_NAME)?.value ?? '')
  if (!user) return NextResponse.json([], { status: 401 })

  const url = new URL(req.url)
  const from = url.searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const to   = url.searchParams.get('to')   ?? new Date().toISOString().split('T')[0]
  const db   = getSupabaseAdmin()

  let livepixBids = [user.id]
  try {
    const { data: lpCfg } = await db.from('livepix_config').select('channel_id').eq('user_id', user.id).maybeSingle()
    if (lpCfg?.channel_id && lpCfg.channel_id !== user.id) livepixBids.push(lpCfg.channel_id)
  } catch {}

  const TRACKED = [
    'channel.subscribe', 'channel.subscription.message', 'channel.subscription.gift',
    'channel.cheer', 'channel.follow',
    'kick.subscribe', 'kick.subscription.gift', 'kick.follow',
    'livepix.donation', 'paypal.donation',
  ]

  const [livepixRes, eventsRes, twitchSubsRes, tierRes] = await Promise.all([
    db.from('livepix_donors')
      .select('id,username,amount,message,date,created_at')
      .in('broadcaster_id', livepixBids)
      .gte('date', from).lte('date', to)
      .order('created_at', { ascending: false }).limit(200),
    db.from('twitch_events')
      .select('id,event_type,event_data,created_at')
      .eq('user_id', user.id)
      .in('event_type', TRACKED)
      .gte('created_at', `${from}T00:00:00Z`)
      .lte('created_at', `${to}T23:59:59Z`)
      .order('created_at', { ascending: false }).limit(500),
    db.from('twitch_subs')
      .select('id,tier,date')
      .eq('broadcaster_id', user.id)
      .gte('date', from).lte('date', to)
      .order('date', { ascending: false }).limit(500),
    db.from('twitch_tier_config')
      .select('tier1_value,tier2_value,tier3_value')
      .eq('broadcaster_id', user.id).maybeSingle(),
  ])

  const tiers = {
    tier1: Number(tierRes.data?.tier1_value ?? 9.9),
    tier2: Number(tierRes.data?.tier2_value ?? 25.9),
    tier3: Number(tierRes.data?.tier3_value ?? 49.9),
  }

  let kickTiers = { tier1: 28.4, tier2: 56.95, tier3: 142.44 }
  try {
    const { data: kt } = await db.from('kick_tier_config')
      .select('tier1_value,tier2_value,tier3_value')
      .eq('broadcaster_id', user.id).maybeSingle()
    if (kt) kickTiers = { tier1: Number(kt.tier1_value), tier2: Number(kt.tier2_value), tier3: Number(kt.tier3_value) }
  } catch {}

  function twitchSubVal(d: Record<string, unknown>): number {
    const t = String(d.tier ?? '1000')
    if (t === '2000') return tiers.tier2
    if (t === '3000') return tiers.tier3
    return tiers.tier1
  }

  // tier name format used in twitch_subs legacy table ('tier1'/'tier2'/'tier3')
  function twitchSubValByName(tier: string | null): number {
    if (tier === 'tier2') return tiers.tier2
    if (tier === 'tier3') return tiers.tier3
    return tiers.tier1
  }

  function extractUsername(et: string, d: Record<string, unknown>): string {
    if (et.startsWith('kick.')) return String(d.subscriber_username ?? d.gifter_username ?? d.follower_username ?? d.username ?? 'Anônimo')
    return String(d.user_name ?? d.user_login ?? d.gifter_login ?? d.from_broadcaster_user_name ?? 'Anônimo')
  }

  const livepixItems = (livepixRes.data ?? []).map(d => ({
    id: `lp-${d.id}`, platform: 'livepix', type: 'donation',
    username: d.username as string, amount: Number(d.amount),
    created_at: d.created_at as string,
  }))

  const eventItems = (eventsRes.data ?? []).map(e => {
    const d = (e.event_data ?? {}) as Record<string, unknown>
    const platform = e.event_type.startsWith('kick.') ? 'kick'
      : e.event_type.startsWith('livepix.') ? 'livepix'
      : e.event_type.startsWith('paypal.') ? 'paypal' : 'twitch'
    const et = e.event_type
    const username = extractUsername(et, d)
    let type = 'event'; let amount: number | undefined

    if (et === 'channel.subscribe' || et === 'kick.subscribe') {
      type = 'sub'; amount = platform === 'kick' ? kickTiers.tier1 : twitchSubVal(d)
    } else if (et === 'channel.subscription.message') {
      type = 'resub'; amount = twitchSubVal(d)
    } else if (et === 'channel.subscription.gift' || et === 'kick.subscription.gift') {
      type = 'giftsub'
      const cnt = Number(d.total ?? d.gifted_count ?? 1)
      amount = (platform === 'kick' ? kickTiers.tier1 : twitchSubVal(d)) * cnt
    } else if (et === 'channel.cheer') {
      type = 'bits'; amount = Number(d.bits ?? 0) * 0.01 * 5.70
    } else if (et === 'channel.follow' || et === 'kick.follow') {
      type = 'follow'
    } else if (et === 'livepix.donation' || et === 'paypal.donation') {
      type = 'donation'; amount = Number(d.amount ?? 0)
    }

    return { id: `ev-${e.id}`, platform, type, username, amount, created_at: e.created_at as string }
  })

  // Only include twitch_subs legacy entries if twitch_events has no sub events for this period
  // (avoids double-counting when both tables have the same subs)
  const hasEventSubSubs = (eventsRes.data ?? []).some(e =>
    e.event_type === 'channel.subscribe' ||
    e.event_type === 'channel.subscription.message' ||
    e.event_type === 'channel.subscription.gift'
  )

  const legacySubItems = hasEventSubSubs ? [] : (twitchSubsRes.data ?? []).map(s => ({
    id: `ts-${s.id}`,
    platform: 'twitch',
    type: 'sub',
    username: 'Inscrito',
    amount: twitchSubValByName(s.tier as string | null),
    created_at: `${s.date as string}T12:00:00Z`,
  }))

  const all = [...livepixItems, ...eventItems, ...legacySubItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json(all)
}
