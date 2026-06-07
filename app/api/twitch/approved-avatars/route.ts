import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

let cachedToken: { value: string; expiresAt: number } | null = null
let cachedAvatars: { username: string; image: string }[] | null = null
let cachedAt = 0
const TTL = 1000 * 60 * 10 // 10 minutes

async function getAppToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
  })
  if (!res.ok) throw new Error('Twitch token failed')
  const data = await res.json()
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 - 60_000 }
  return cachedToken.value
}

export async function GET() {
  try {
    if (cachedAvatars && Date.now() - cachedAt < TTL) {
      return NextResponse.json(cachedAvatars)
    }

    const db = getSupabaseAdmin()
    const { data: rows } = await db
      .from('waitlist')
      .select('platform_username')
      .eq('platform', 'Twitch')
      .eq('status', 'approved')
      .limit(10)

    if (!rows || rows.length === 0) return NextResponse.json([])

    const usernames = rows.map(r => r.platform_username).filter(Boolean)
    const query = usernames.map(u => `login=${encodeURIComponent(u)}`).join('&')

    const token = await getAppToken()
    const res = await fetch(`https://api.twitch.tv/helix/users?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    })
    if (!res.ok) throw new Error('Twitch API error')
    const { data } = await res.json()

    cachedAvatars = (data as { login: string; profile_image_url: string }[]).map(u => ({
      username: u.login,
      image: u.profile_image_url,
    }))
    cachedAt = Date.now()
    return NextResponse.json(cachedAvatars)
  } catch {
    return NextResponse.json([])
  }
}
