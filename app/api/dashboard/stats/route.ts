import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

const DEFAULT_TIERS = { tier1_value: 9.9, tier2_value: 25.9, tier3_value: 49.9 }

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const from = url.searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const to = url.searchParams.get('to') ?? new Date().toISOString().split('T')[0]
  const db = getSupabaseAdmin()
  const bid = user.id

  // Livepix may store donations under channel_id instead of twitch user_id
  let livepixBids = [bid]
  try {
    const { data: lpCfg } = await db.from('livepix_config').select('channel_id').eq('user_id', bid).maybeSingle()
    if (lpCfg?.channel_id && lpCfg.channel_id !== bid) livepixBids.push(lpCfg.channel_id)
  } catch { /* table may not exist */ }

  const [livepixRes, twitchRes, ticketsRes, tierRes, cheersRes] = await Promise.all([
    db.from('livepix_donors').select('amount,username').in('broadcaster_id', livepixBids).gte('date', from).lte('date', to),
    db.from('twitch_subs').select('id,tier,tickets').eq('broadcaster_id', bid).gte('date', from).lte('date', to),
    db.from('sorteio_tickets').select('id,donor_name').eq('broadcaster_id', bid),
    db.from('twitch_tier_config').select('tier1_value,tier2_value,tier3_value').eq('broadcaster_id', bid).maybeSingle(),
    db.from('twitch_cheers').select('bits').eq('broadcaster_id', bid).gte('date', from).lte('date', to),
  ])

  const livepixDonors = livepixRes.data ?? []
  const twitchSubs = twitchRes.data ?? []
  const tickets = ticketsRes.data ?? []
  const tiers = tierRes.data ?? DEFAULT_TIERS
  const cheers = cheersRes.data ?? []

  const livepixTotal = livepixDonors.reduce((s, d) => s + Number(d.amount), 0)
  const livepixUnique = new Set(livepixDonors.map(d => d.username)).size
  const twitchCount = twitchSubs.length
  const twitchTickets = twitchSubs.reduce((s, s2) => s + (s2.tickets ?? 1), 0)
  const totalTickets = tickets.length
  const totalParticipants = new Set(tickets.map((t: { donor_name: string }) => t.donor_name)).size

  // Calculate Twitch total: subs revenue + bits ($0.01/bit * 5.70 BRL/USD)
  const BITS_TO_BRL = 0.01 * 5.70
  const twitchSubsTotal = twitchSubs.reduce((s, sub) => {
    const t = sub.tier ?? 'tier1'
    const v = t === 'tier2' ? Number(tiers.tier2_value)
            : t === 'tier3' ? Number(tiers.tier3_value)
            : Number(tiers.tier1_value)
    return s + v
  }, 0)
  const bitsTotal = cheers.reduce((s, c) => s + (c.bits ?? 0), 0)
  const twitchTotal = twitchSubsTotal + bitsTotal * BITS_TO_BRL

  return NextResponse.json({
    livepix_total: livepixTotal,
    livepix_donors: livepixDonors.length,
    livepix_unique: livepixUnique,
    twitch_subs: twitchCount,
    twitch_tickets: twitchTickets,
    twitch_total: twitchTotal,
    tickets_total: totalTickets,
    participants: totalParticipants,
    from,
    to,
  })
}
