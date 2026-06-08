import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const from = url.searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const to = url.searchParams.get('to') ?? new Date().toISOString().split('T')[0]
  const db = getSupabaseAdmin()
  const bid = user.id

  // Webhook donations may be stored with livepix channel_id instead of twitch user_id
  let livepixBids = [bid]
  try {
    const { data: lpCfg } = await db.from('livepix_config').select('channel_id').eq('user_id', bid).maybeSingle()
    if (lpCfg?.channel_id && lpCfg.channel_id !== bid) livepixBids.push(lpCfg.channel_id)
  } catch { /* table may not exist */ }

  const [livepixRes, twitchRes, ticketsRes] = await Promise.all([
    db.from('livepix_donors').select('amount,username').in('broadcaster_id', livepixBids).gte('date', from).lte('date', to),
    db.from('twitch_subs').select('id,tier,tickets').eq('broadcaster_id', bid).gte('date', from).lte('date', to),
    db.from('sorteio_tickets').select('id,donor_name').eq('broadcaster_id', bid),
  ])

  const livepixDonors = livepixRes.data ?? []
  const twitchSubs = twitchRes.data ?? []
  const tickets = ticketsRes.data ?? []

  const livepixTotal = livepixDonors.reduce((s, d) => s + Number(d.amount), 0)
  const livepixUnique = new Set(livepixDonors.map(d => d.username)).size
  const twitchCount = twitchSubs.length
  const twitchTickets = twitchSubs.reduce((s, s2) => s + (s2.tickets ?? 1), 0)
  const totalTickets = tickets.length
  const totalParticipants = new Set(tickets.map((t: { donor_name: string }) => t.donor_name)).size

  return NextResponse.json({
    livepix_total: livepixTotal,
    livepix_donors: livepixDonors.length,
    livepix_unique: livepixUnique,
    twitch_subs: twitchCount,
    twitch_tickets: twitchTickets,
    tickets_total: totalTickets,
    participants: totalParticipants,
    from,
    to,
  })
}
