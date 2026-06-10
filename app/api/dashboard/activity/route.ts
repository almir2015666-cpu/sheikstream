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

  // Source mapping (must match what the webhook handler actually stores):
  // channel.subscribe       → twitch_subs + twitch_events  → use twitch_subs (authoritative, includes manual adds)
  // channel.subscription.message (resub) → twitch_events ONLY
  // channel.subscription.gift            → twitch_events ONLY
  // channel.cheer (bits)    → twitch_cheers + twitch_events → use twitch_cheers (matches stats API)
  // kick.*                  → twitch_events ONLY
  // livepix / paypal        → twitch_events ONLY
  const TRACKED = [
    // channel.subscribe excluded — comes from twitch_subs below
    'channel.subscription.message', 'channel.subscription.gift',
    // channel.cheer excluded — bits come from twitch_cheers below
    'channel.follow',
    'kick.subscribe', 'kick.subscription.gift', 'kick.follow',
    'livepix.donation', 'paypal.donation',
  ]

  const [livepixRes, eventsRes, twitchSubsRes, tierRes, cheersRes] = await Promise.all([
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
      .select('id,tier,date,username')
      .eq('broadcaster_id', user.id)
      .gte('date', from).lte('date', to)
      .order('date', { ascending: false }).limit(500),
    db.from('twitch_tier_config')
      .select('tier1_value,tier2_value,tier3_value')
      .eq('broadcaster_id', user.id).maybeSingle(),
    db.from('twitch_cheers')
      .select('id,username,bits,is_anonymous,date,created_at')
      .eq('broadcaster_id', user.id)
      .gte('date', from).lte('date', to)
      .order('created_at', { ascending: false }).limit(200),
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

  // twitch_events: resubs, gift subs, follows, kick events, livepix/paypal donations
  // (channel.subscribe and channel.cheer are excluded from TRACKED above)
  const eventItems = (eventsRes.data ?? []).map(e => {
    const d = (e.event_data ?? {}) as Record<string, unknown>
    const platform = e.event_type.startsWith('kick.') ? 'kick'
      : e.event_type.startsWith('livepix.') ? 'livepix'
      : e.event_type.startsWith('paypal.') ? 'paypal' : 'twitch'
    const et = e.event_type
    const username = extractUsername(et, d)
    let type = 'event'; let amount: number | undefined

    if (et === 'channel.subscription.message') {
      type = 'resub'; amount = twitchSubVal(d)
    } else if (et === 'channel.subscription.gift') {
      type = 'giftsub'
      const cnt = Number(d.total ?? d.gifted_count ?? 1)
      amount = twitchSubVal(d) * cnt
    } else if (et === 'channel.follow' || et === 'kick.follow') {
      type = 'follow'
    } else if (et === 'kick.subscribe') {
      type = 'sub'; amount = kickTiers.tier1
    } else if (et === 'kick.subscription.gift') {
      type = 'giftsub'
      const cnt = Number(d.total ?? d.gifted_count ?? 1)
      amount = kickTiers.tier1 * cnt
    } else if (et === 'livepix.donation' || et === 'paypal.donation') {
      type = 'donation'; amount = Number(d.amount ?? 0)
    }

    return { id: `ev-${e.id}`, platform, type, username, amount, created_at: e.created_at as string }
  })

  // New subs from twitch_subs (includes webhook-generated + manually added)
  const subItems = (twitchSubsRes.data ?? []).map(s => ({
    id: `ts-${s.id}`,
    platform: 'twitch',
    type: 'sub',
    username: (s.username as string | null) ?? 'Inscrito',
    amount: twitchSubValByName(s.tier as string | null),
    created_at: `${s.date as string}T12:00:00Z`,
  }))

  // Bits from twitch_cheers (same source as stats API — captures both webhook + Twitch API synced bits)
  const cheerItems = (cheersRes.data ?? []).map(c => ({
    id: `cheer-${c.id as string}`,
    platform: 'twitch',
    type: 'bits',
    username: (c.is_anonymous as boolean) ? 'Anônimo' : ((c.username as string | null) ?? 'Anônimo'),
    amount: Number(c.bits) * 0.01 * 5.70,
    created_at: c.created_at as string,
  }))

  const all = [...livepixItems, ...eventItems, ...subItems, ...cheerItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json(all)
}
