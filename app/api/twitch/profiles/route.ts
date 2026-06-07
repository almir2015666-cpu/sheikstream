import { NextResponse } from 'next/server'
import { STREAMERS_USERNAMES } from '@/app/lib/site-info'

let cachedToken: { value: string; expiresAt: number } | null = null
let cachedProfiles: { username: string; image: string }[] | null = null
let profilesCachedAt = 0
const PROFILES_TTL = 1000 * 60 * 60 * 6 // 6 hours

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
  if (!res.ok) throw new Error('Failed to get Twitch app token')
  const data = await res.json()
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 - 60_000 }
  return cachedToken.value
}

export async function GET() {
  try {
    if (cachedProfiles && Date.now() - profilesCachedAt < PROFILES_TTL) {
      return NextResponse.json(cachedProfiles)
    }

    const token = await getAppToken()
    const logins = STREAMERS_USERNAMES.map(u => `login=${u}`).join('&')
    const res = await fetch(`https://api.twitch.tv/helix/users?${logins}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    })
    if (!res.ok) throw new Error('Twitch API error')
    const { data } = await res.json()

    cachedProfiles = (data as { login: string; profile_image_url: string }[]).map(u => ({
      username: u.login,
      image: u.profile_image_url,
    }))
    profilesCachedAt = Date.now()
    return NextResponse.json(cachedProfiles)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
