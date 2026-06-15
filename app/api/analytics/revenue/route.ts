import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

function monthKey(iso: string) { return iso.slice(0, 7) } // "2025-03"

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()

  // Tier config
  const { data: tierRow } = await db
    .from('twitch_tier_config')
    .select('tier1_value, tier2_value, tier3_value')
    .eq('broadcaster_id', user.id)
    .maybeSingle()
  const t1 = tierRow?.tier1_value ?? 9.9
  const t2 = tierRow?.tier2_value ?? 25.9
  const t3 = tierRow?.tier3_value ?? 49.9
  function tierVal(tier: string) {
    if (tier === 'tier2') return t2
    if (tier === 'tier3') return t3
    return t1
  }

  const [{ data: subs }, { data: cheers }, { data: donations }] = await Promise.all([
    db.from('twitch_subs').select('created_at, tier').eq('broadcaster_id', user.id).gte('created_at', since),
    db.from('twitch_cheers').select('created_at, bits').eq('broadcaster_id', user.id).gte('created_at', since),
    db.from('livepix_donations').select('created_at, amount').eq('user_id', user.id).gte('created_at', since),
  ])

  // Build last 6 months keys
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    months.push(d.toISOString().slice(0, 7))
  }

  const subsByMonth: Record<string, number>   = {}
  const bitsByMonth: Record<string, number>   = {}
  const donsByMonth: Record<string, number>   = {}

  for (const m of months) { subsByMonth[m] = 0; bitsByMonth[m] = 0; donsByMonth[m] = 0 }

  for (const s of subs ?? []) {
    const m = monthKey(s.created_at)
    if (subsByMonth[m] !== undefined) subsByMonth[m] += tierVal(s.tier ?? 'tier1')
  }
  for (const c of cheers ?? []) {
    const m = monthKey(c.created_at)
    const brl = (Number(c.bits) || 0) * 0.01 * 5.7 // ~R$0.057 per bit
    if (bitsByMonth[m] !== undefined) bitsByMonth[m] += brl
  }
  for (const d of donations ?? []) {
    const m = monthKey(d.created_at)
    if (donsByMonth[m] !== undefined) donsByMonth[m] += Number(d.amount) || 0
  }

  const totalSubs = Object.values(subsByMonth).reduce((a, b) => a + b, 0)
  const totalBits = Object.values(bitsByMonth).reduce((a, b) => a + b, 0)
  const totalDons = Object.values(donsByMonth).reduce((a, b) => a + b, 0)

  return NextResponse.json({
    months,
    subsByMonth,
    bitsByMonth,
    donsByMonth,
    totalSubs,
    totalBits,
    totalDons,
    total: totalSubs + totalBits + totalDons,
  })
}
