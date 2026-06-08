import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const pw = req.headers.get('x-admin-password') ?? ''
  if (!await isAdminPassword(pw)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const sevenDaysAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: users }, { data: recent }, { data: allAct }, { data: tokens }, { data: lpCfgs }] = await Promise.all([
    db.from('waitlist').select('id,platform,platform_username,email,status,created_at').eq('status', 'approved').order('created_at', { ascending: false }),
    db.from('activity_logs').select('username,performed_at').gte('performed_at', fifteenMinAgo).not('username', 'is', null),
    db.from('activity_logs').select('username,performed_at').gte('performed_at', sevenDaysAgo).not('username', 'is', null).order('performed_at', { ascending: false }).limit(5000),
    db.from('user_tokens').select('user_id,twitch_token,twitch_username').limit(1000),
    db.from('livepix_config').select('user_id').not('channel_id', 'is', null).limit(1000),
  ])

  const onlineSet     = new Set<string>()
  const lastSeenMap   = new Map<string, string>()
  const accessCount   = new Map<string, number>()
  const tokenByName   = new Map<string, string>() // lowercase username -> user_id
  const lpUserIds     = new Set<string>((lpCfgs ?? []).map(c => c.user_id))

  for (const a of recent ?? []) {
    if (a.username) onlineSet.add(a.username.toLowerCase())
  }
  for (const a of allAct ?? []) {
    if (!a.username) continue
    const k = a.username.toLowerCase()
    if (!lastSeenMap.has(k)) lastSeenMap.set(k, a.performed_at)
    accessCount.set(k, (accessCount.get(k) ?? 0) + 1)
  }
  for (const t of tokens ?? []) {
    if (t.twitch_username) tokenByName.set(t.twitch_username.toLowerCase(), t.user_id)
  }

  const result = (users ?? []).map(u => {
    const key      = (u.platform_username ?? '').toLowerCase()
    const userId   = tokenByName.get(key) ?? null
    const livepix  = userId ? lpUserIds.has(userId) : false
    return {
      id:               u.id,
      platform:         u.platform,
      username:         u.platform_username,
      email:            u.email,
      status:           u.status,
      created_at:       u.created_at,
      last_seen_at:     lastSeenMap.get(key) ?? null,
      is_online:        onlineSet.has(key),
      access_count:     accessCount.get(key) ?? 0,
      twitch_connected: true,
      livepix_connected: livepix,
    }
  })

  result.sort((a, b) => {
    if (a.is_online !== b.is_online) return a.is_online ? -1 : 1
    if (a.last_seen_at && b.last_seen_at) return b.last_seen_at.localeCompare(a.last_seen_at)
    return a.last_seen_at ? -1 : b.last_seen_at ? 1 : 0
  })

  return NextResponse.json(result)
}
