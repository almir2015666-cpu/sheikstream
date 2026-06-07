import { NextRequest, NextResponse } from 'next/server'
import { encodeSession, COOKIE_NAME, SessionUser } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
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
        redirect_uri: `${origin}/api/auth/twitch/callback`,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${origin}/login?error=token_failed`)
    }

    const { access_token } = await tokenRes.json()

    const userRes = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(`${origin}/login?error=user_failed`)
    }

    const { data } = await userRes.json()
    const tw = data[0]
    if (!tw) return NextResponse.redirect(`${origin}/login?error=no_user`)

    const user: SessionUser = {
      id: tw.id,
      name: tw.display_name,
      email: tw.email ?? '',
      image: tw.profile_image_url ?? '',
    }

    const token = encodeSession(user)
    const res = NextResponse.redirect(`${origin}/dashboard`)
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return res
  } catch {
    return NextResponse.redirect(`${origin}/login?error=server_error`)
  }
}
