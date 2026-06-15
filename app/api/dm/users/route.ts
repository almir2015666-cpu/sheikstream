import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

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

async function fetchProfileImages(usernames: string[], token: string): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (!usernames.length || !process.env.TWITCH_CLIENT_ID) return map
  const qs = usernames.map(u => `login=${encodeURIComponent(u)}`).join('&')
  try {
    const res = await fetch(`https://api.twitch.tv/helix/users?${qs}`, {
      headers: { Authorization: `Bearer ${token}`, 'Client-Id': process.env.TWITCH_CLIENT_ID! },
    })
    if (res.ok) {
      const { data } = await res.json()
      for (const u of data ?? []) map.set((u.login as string).toLowerCase(), u.profile_image_url as string)
    }
  } catch {}
  return map
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getSupabaseAdmin()
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const [{ data: tokens }, { data: recent }] = await Promise.all([
      db.from('user_tokens')
        .select('user_id, twitch_username')
        .not('twitch_token', 'is', null)
        .neq('user_id', user.id)
        .limit(100),
      db.from('activity_logs')
        .select('username')
        .gte('performed_at', fiveMinAgo)
        .not('username', 'is', null),
    ])

    const onlineSet = new Set<string>(
      (recent ?? []).map(r => (r.username as string).toLowerCase())
    )

    // Deduplicate by twitch_username (some users may have multiple rows)
    const seenNames = new Set<string>()
    const uniqueTokens = (tokens ?? []).filter(t => {
      const name = ((t.twitch_username as string) ?? '').toLowerCase()
      if (!name || seenNames.has(name)) return false
      seenNames.add(name)
      return true
    })

    const usernames = uniqueTokens.map(t => t.twitch_username as string).filter(Boolean)

    // Fetch profile images from Twitch in parallel with the rest
    let profileImages = new Map<string, string>()
    if (usernames.length && process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
      const appToken = await getTwitchAppToken()
      if (appToken) profileImages = await fetchProfileImages(usernames, appToken)
    }

    const users = uniqueTokens.map(t => {
      const name = (t.twitch_username as string) ?? 'Usuário'
      return {
        id: t.user_id as string,
        name,
        image: profileImages.get(name.toLowerCase()) ?? null,
        is_online: onlineSet.has(name.toLowerCase()),
      }
    })

    users.sort((a, b) => Number(b.is_online) - Number(a.is_online) || a.name.localeCompare(b.name))

    return NextResponse.json(users)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
