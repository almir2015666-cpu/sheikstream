import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const user = decodeSession(req.cookies.get(COOKIE_NAME)?.value ?? '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url  = new URL(req.url)
  const from = url.searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const to   = url.searchParams.get('to')   ?? new Date().toISOString().split('T')[0]
  const db   = getSupabaseAdmin()

  let tiers = { tier1: 28.4, tier2: 56.95, tier3: 142.44 }
  try {
    const { data: kt } = await db.from('kick_tier_config')
      .select('tier1_value,tier2_value,tier3_value').eq('broadcaster_id', user.id).maybeSingle()
    if (kt) tiers = { tier1: Number(kt.tier1_value), tier2: Number(kt.tier2_value), tier3: Number(kt.tier3_value) }
  } catch {}

  const { data: events } = await db.from('twitch_events')
    .select('id,event_type,event_data,created_at')
    .eq('user_id', user.id)
    .in('event_type', ['kick.subscribe', 'kick.subscription.gift'])
    .gte('created_at', `${from}T00:00:00Z`)
    .lte('created_at', `${to}T23:59:59Z`)

  const subs  = (events ?? []).filter(e => e.event_type === 'kick.subscribe')
  const gifts = (events ?? []).filter(e => e.event_type === 'kick.subscription.gift')
  const giftCount = gifts.reduce((s, e) => {
    const d = (e.event_data ?? {}) as Record<string, unknown>
    return s + Number(d.gifted_count ?? d.total ?? 1)
  }, 0)

  const totalSubs   = subs.length + giftCount
  const totalBruto  = totalSubs * tiers.tier1
  const totalLiquido = totalBruto * 0.5

  return NextResponse.json({
    total_subs:      subs.length,
    gift_subs:       giftCount,
    tickets_gerados: totalSubs,
    total_bruto:     totalBruto,
    total_liquido:   totalLiquido,
    usd_rate:        5.70,
    tiers, from, to,
  })
}
