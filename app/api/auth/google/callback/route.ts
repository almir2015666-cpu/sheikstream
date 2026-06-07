import { NextRequest, NextResponse } from 'next/server'
import { encodeSession, COOKIE_NAME, SessionUser } from '@/lib/session'

const BASE = 'https://sheikstream.vercel.app'
const REDIRECT_URI = 'https://sheikstream.vercel.app/api/auth/google/callback'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${BASE}/login?error=oauth_failed`)
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(`${BASE}/login?error=google_not_configured`)
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${BASE}/login?error=token_failed`)
    }

    const { access_token } = await tokenRes.json()

    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(`${BASE}/login?error=user_failed`)
    }

    const gu = await userRes.json()
    if (!gu.sub) return NextResponse.redirect(`${BASE}/login?error=no_user`)

    const user: SessionUser = {
      id: gu.sub,
      name: gu.name ?? gu.email ?? '',
      email: gu.email ?? '',
      image: gu.picture ?? '',
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
