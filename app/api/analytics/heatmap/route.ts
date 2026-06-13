import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()

  // Last 90 days of activity for this user
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const { data: logs } = await db
    .from('activity_logs')
    .select('created_at, category, event')
    .eq('username', user.name)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000)

  // Build heatmap: day_of_week (0=Sun) x hour (0-23) -> count
  const heat: Record<string, number> = {}
  const weeklyTotals: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // last 12 weeks
  const categoryCount: Record<string, number> = {}

  for (const row of logs ?? []) {
    const d = new Date(row.created_at)
    const dow = d.getUTCDay()
    const hour = d.getUTCHours()
    const key = `${dow}:${hour}`
    heat[key] = (heat[key] ?? 0) + 1

    // Week index (0 = current week)
    const weeksAgo = Math.floor((Date.now() - d.getTime()) / (7 * 24 * 60 * 60 * 1000))
    if (weeksAgo < 13) weeklyTotals[weeksAgo] = (weeklyTotals[weeksAgo] ?? 0) + 1

    const cat = row.category ?? 'other'
    categoryCount[cat] = (categoryCount[cat] ?? 0) + 1
  }

  // Find peak day/hour
  let peakKey = '', peakCount = 0
  for (const [k, v] of Object.entries(heat)) {
    if (v > peakCount) { peakCount = v; peakKey = k }
  }
  const [peakDow, peakHour] = peakKey ? peakKey.split(':').map(Number) : [null, null]

  // Also pull subs and donations summaries (last 30 days)
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ count: subCount }, { count: donationCount }] = await Promise.all([
    db.from('twitch_subs').select('*', { count: 'exact', head: true }).eq('broadcaster_id', user.id).gte('created_at', since30),
    db.from('livepix_donations').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since30),
  ])

  return NextResponse.json({
    heat,
    weeklyTotals,
    categoryCount,
    peakDow,
    peakHour,
    peakCount,
    subCount: subCount ?? 0,
    donationCount: donationCount ?? 0,
    totalEvents: logs?.length ?? 0,
  })
}
