import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

async function getTwitchAppToken(): Promise<string | null> {
  try {
    const res = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        grant_type: 'client_credentials',
      }),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const d = await res.json()
    return d.access_token ?? null
  } catch { return null }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username: rawUsername } = await params
  const username = rawUsername?.toLowerCase()
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const db = getSupabaseAdmin()

  // Find user in user_tokens by twitch_username (case-insensitive)
  const { data: tok } = await db
    .from('user_tokens')
    .select('user_id, twitch_username')
    .ilike('twitch_username', username)
    .maybeSingle()

  if (!tok) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const userId = tok.user_id
  const displayName = tok.twitch_username

  // Fetch agenda
  const { data: agenda } = await db
    .from('agenda')
    .select('id,title,day_of_week,start_time,duration_min,platforms,is_recurring,is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })

  // Fetch Twitch profile + live status via Helix API
  let profileImage: string | null = null
  let description: string | null = null
  let isLive = false
  let streamTitle: string | null = null
  let streamGame: string | null = null
  let viewerCount = 0

  try {
    const appToken = await getTwitchAppToken()
    if (appToken && process.env.TWITCH_CLIENT_ID) {
      const headers = {
        Authorization: `Bearer ${appToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID,
      }
      // User profile
      const userRes = await fetch(
        `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`,
        { headers, next: { revalidate: 300 } }
      )
      if (userRes.ok) {
        const ud = await userRes.json()
        const u = ud.data?.[0]
        if (u) {
          profileImage = u.profile_image_url ?? null
          description = u.description ?? null
        }
      }
      // Live stream
      const streamRes = await fetch(
        `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(username)}`,
        { headers, next: { revalidate: 60 } }
      )
      if (streamRes.ok) {
        const sd = await streamRes.json()
        const s = sd.data?.[0]
        if (s) {
          isLive = true
          streamTitle = s.title ?? null
          streamGame = s.game_name ?? null
          viewerCount = s.viewer_count ?? 0
        }
      }
    }
  } catch { /* Twitch API unavailable — proceed without live data */ }

  return NextResponse.json({
    userId,
    displayName,
    username: displayName.toLowerCase(),
    profileImage,
    description,
    isLive,
    streamTitle,
    streamGame,
    viewerCount,
    agenda: agenda ?? [],
  })
}
