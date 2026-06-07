import { NextRequest, NextResponse } from 'next/server'
import { encodeSession, COOKIE_NAME, SessionUser } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import { logActivity } from '@/app/lib/log-activity'
import { registerEventSubSubscriptions } from '@/app/lib/eventsub'

const BASE = 'https://sheikstream.com.br'
const REDIRECT_URI = `${BASE}/api/auth/twitch/callback`

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${BASE}/login?error=oauth_failed`)
  }

  // ── 1. Exchange code for token ──────────────────────────────────────────
  let access_token: string
  try {
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    })
    if (!tokenRes.ok) return NextResponse.redirect(`${BASE}/login?error=token_failed`)
    const tokenData = await tokenRes.json()
    access_token = tokenData.access_token
  } catch {
    return NextResponse.redirect(`${BASE}/login?error=token_failed`)
  }

  // ── 2. Fetch Twitch user ────────────────────────────────────────────────
  let tw: { id: string; display_name: string; email?: string; profile_image_url?: string }
  try {
    const userRes = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    })
    if (!userRes.ok) return NextResponse.redirect(`${BASE}/login?error=user_failed`)
    const { data } = await userRes.json()
    if (!data?.[0]) return NextResponse.redirect(`${BASE}/login?error=no_user`)
    tw = data[0]
  } catch {
    return NextResponse.redirect(`${BASE}/login?error=user_failed`)
  }

  // ── 3. Waitlist gate (DB errors default to /pending, never block completely) ──
  let approved = false
  try {
    const db = getSupabaseAdmin()
    const { data: rows, error: fetchErr } = await db
      .from('waitlist')
      .select('id, status')
      .eq('platform', 'Twitch')
      .ilike('platform_username', tw.display_name)
      .limit(1)
    const existing = rows?.[0] ?? null

    if (fetchErr) {
      console.error('[twitch/callback] waitlist select error:', fetchErr)
      return NextResponse.redirect(`${BASE}/pending`)
    }

    if (existing?.status === 'banned') {
      return NextResponse.redirect(`${BASE}/login?error=banned`)
    }

    if (existing?.status === 'pending' || existing?.status === 'rejected') {
      return NextResponse.redirect(`${BASE}/pending`)
    }

    if (!existing) {
      const { error: insertErr } = await db.from('waitlist').insert({
        platform: 'Twitch',
        platform_username: tw.display_name,
        email: tw.email ?? '',
        status: 'pending',
      })
      if (insertErr) console.error('[twitch/callback] waitlist insert error:', insertErr)
      return NextResponse.redirect(`${BASE}/pending`)
    }

    // existing.status === 'approved'
    approved = true
  } catch (dbErr) {
    console.error('[twitch/callback] DB exception:', dbErr)
    return NextResponse.redirect(`${BASE}/pending`)
  }

  if (!approved) return NextResponse.redirect(`${BASE}/pending`)

  // ── 4. Issue session cookie ─────────────────────────────────────────────
  const user: SessionUser = {
    id: tw.id,
    name: tw.display_name,
    email: tw.email ?? '',
    image: tw.profile_image_url ?? '',
    platform: 'Twitch',
  }
  const token = encodeSession(user)
  const res = NextResponse.redirect(`${BASE}/dashboard`)
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  await logActivity('auth', 'login', tw.display_name, 'Twitch')
  // Register EventSub webhooks for this broadcaster (async, doesn't block login)
  registerEventSubSubscriptions(tw.id).catch(e => console.error('[callback] eventsub register error:', e))
  return res
}
