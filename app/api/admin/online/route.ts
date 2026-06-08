import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

async function getTwitchAppToken(): Promise<string | null> {
  try {
    const res = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        grant_type:    'client_credentials',
      }),
    })
    if (!res.ok) return null
    const d = await res.json()
    return d.access_token ?? null
  } catch { return null }
}

async function fetchLiveUsernames(usernames: string[]): Promise<Set<string>> {
  if (!usernames.length || !process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) return new Set()
  const token = await getTwitchAppToken()
  if (!token) return new Set()
  const liveSet = new Set<string>()
  for (let i = 0; i < usernames.length; i += 100) {
    const batch = usernames.slice(i, i + 100)
    const qs = batch.map(u => `user_login=${encodeURIComponent(u)}`).join('&')
    try {
      const res = await fetch(`https://api.twitch.tv/helix/streams?${qs}&first=100`, {
        headers: { Authorization: `Bearer ${token}`, 'Client-Id': process.env.TWITCH_CLIENT_ID! },
      })
      if (res.ok) {
        const { data } = await res.json()
        for (const s of data ?? []) liveSet.add((s.user_login as string).toLowerCase())
      }
    } catch { /* ignore — just show as offline */ }
  }
  return liveSet
}

export async function GET(req: NextRequest) {
  const pw = req.headers.get('x-admin-password') ?? ''
  if (!await isAdminPassword(pw)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const sevenDaysAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: users },
    { data: recent },
    { data: allAct },
    { data: tokens },
    { data: lpCfgs },
    { data: authLogs },
  ] = await Promise.all([
    db.from('waitlist').select('id,platform,platform_username,email,status,created_at').eq('status', 'approved').order('created_at', { ascending: false }),
    db.from('activity_logs').select('username,performed_at').gte('performed_at', fifteenMinAgo).not('username', 'is', null),
    db.from('activity_logs').select('username,performed_at').gte('performed_at', sevenDaysAgo).not('username', 'is', null).order('performed_at', { ascending: false }).limit(5000),
    db.from('user_tokens').select('user_id,twitch_token,twitch_username').limit(1000),
    db.from('livepix_config').select('user_id').not('client_id', 'is', null).limit(1000),
    db.from('system_logs').select('user_id,data').eq('type', 'auth.login').not('user_id', 'is', null).order('created_at', { ascending: false }).limit(2000),
  ])

  const onlineSet   = new Set<string>()
  const lastSeenMap = new Map<string, string>()
  const accessCount = new Map<string, number>()

  for (const a of recent ?? []) {
    if (a.username) onlineSet.add(a.username.toLowerCase())
  }
  for (const a of allAct ?? []) {
    if (!a.username) continue
    const k = a.username.toLowerCase()
    if (!lastSeenMap.has(k)) lastSeenMap.set(k, a.performed_at)
    accessCount.set(k, (accessCount.get(k) ?? 0) + 1)
  }

  const tokenByName    = new Map<string, string>()
  const userIdHasToken = new Set<string>()
  for (const t of tokens ?? []) {
    if (t.twitch_username) tokenByName.set(t.twitch_username.toLowerCase(), t.user_id)
    if (t.twitch_token)    userIdHasToken.add(t.user_id)
  }

  const logUserIdToName = new Map<string, string>()
  for (const log of authLogs ?? []) {
    if (!log.user_id || logUserIdToName.has(log.user_id)) continue
    const uname = (log.data as Record<string, unknown>)?.username
    if (typeof uname === 'string') logUserIdToName.set(log.user_id, uname.toLowerCase())
  }

  const userIdToName = new Map<string, string>()
  for (const [name, uid] of tokenByName) userIdToName.set(uid, name)
  for (const [uid, name] of logUserIdToName) if (!userIdToName.has(uid)) userIdToName.set(uid, name)

  const lpUserIds = new Set<string>((lpCfgs ?? []).map(c => c.user_id))

  const twitchUsernames  = new Set<string>()
  const livepixUsernames = new Set<string>()
  for (const uid of userIdHasToken) { const n = userIdToName.get(uid); if (n) twitchUsernames.add(n) }
  for (const uid of lpUserIds)      { const n = userIdToName.get(uid); if (n) livepixUsernames.add(n) }

  // Check live status on Twitch for all approved users
  const allUsernames = (users ?? []).map(u => u.platform_username).filter(Boolean) as string[]
  const liveUsernames = await fetchLiveUsernames(allUsernames)

  const result = (users ?? []).map(u => {
    const key = (u.platform_username ?? '').toLowerCase()
    return {
      id:                u.id,
      platform:          u.platform,
      username:          u.platform_username,
      email:             u.email,
      status:            u.status,
      created_at:        u.created_at,
      last_seen_at:      lastSeenMap.get(key) ?? null,
      is_online:         onlineSet.has(key),
      access_count:      accessCount.get(key) ?? 0,
      twitch_connected:  twitchUsernames.has(key),
      livepix_connected: livepixUsernames.has(key),
      is_live:           liveUsernames.has(key),
      twitch_url:        u.platform_username ? `https://twitch.tv/${u.platform_username}` : null,
    }
  })

  result.sort((a, b) => {
    if (a.is_live !== b.is_live) return a.is_live ? -1 : 1
    if (a.is_online !== b.is_online) return a.is_online ? -1 : 1
    if (a.last_seen_at && b.last_seen_at) return b.last_seen_at.localeCompare(a.last_seen_at)
    return a.last_seen_at ? -1 : b.last_seen_at ? 1 : 0
  })

  return NextResponse.json(result)
}
