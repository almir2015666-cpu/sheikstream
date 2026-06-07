import { NextRequest, NextResponse } from 'next/server'
import { encodeSession, COOKIE_NAME, SessionUser } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const BASE = 'https://sheikstream.vercel.app'
const REDIRECT_URI = `${BASE}/api/auth/twitch/callback`

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${BASE}/login?error=oauth_failed`)
  }

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

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${BASE}/login?error=token_failed`)
    }

    const { access_token } = await tokenRes.json()

    const userRes = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(`${BASE}/login?error=user_failed`)
    }

    const { data } = await userRes.json()
    const tw = data[0]
    if (!tw) return NextResponse.redirect(`${BASE}/login?error=no_user`)

    const db = getSupabaseAdmin()
    const { data: existing } = await db
      .from('waitlist')
      .select('id, status')
      .eq('platform', 'Twitch')
      .eq('platform_username', tw.display_name)
      .maybeSingle()

    if (existing?.status === 'banned') {
      return NextResponse.redirect(`${BASE}/login?error=banned`)
    }

    if (existing?.status === 'pending' || existing?.status === 'rejected') {
      return NextResponse.redirect(`${BASE}/pending`)
    }

    if (!existing) {
      await db.from('waitlist').insert({
        platform: 'Twitch',
        platform_username: tw.display_name,
        email: tw.email ?? '',
        status: 'pending',
      })
      return NextResponse.redirect(`${BASE}/pending`)
    }

    // status === 'approved' — set session and allow in
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
    return res
  } catch {
    return NextResponse.redirect(`${BASE}/login?error=server_error`)
  }
}
