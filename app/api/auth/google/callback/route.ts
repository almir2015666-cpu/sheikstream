import { NextRequest, NextResponse } from 'next/server'
import { encodeSession, COOKIE_NAME, SessionUser } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import { logActivity } from '@/app/lib/log-activity'

const BASE = 'https://sheikstream.com.br'
const REDIRECT_URI = 'https://sheikstream.com.br/api/auth/google/callback'

const POPUP_HTML = `<!DOCTYPE html><html><body style="background:#0f172a;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p>Conectado! Fechando...</p><script>window.close()</script></body></html>`

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const isPopup = searchParams.get('state') === 'popup'

  if (error || !code) {
    if (isPopup) return new NextResponse(POPUP_HTML, { headers: { 'Content-Type': 'text/html' } })
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
      platform: 'Google',
    }

    const token = encodeSession(user)
    const res = isPopup
      ? new NextResponse(POPUP_HTML, { headers: { 'Content-Type': 'text/html' } })
      : NextResponse.redirect(`${BASE}/dashboard`)
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    await logActivity('auth', 'login', user.name, 'Google')

    // Persist YouTube token for timer/chat integrations
    getSupabaseAdmin()
      .from('user_tokens')
      .upsert(
        {
          user_id: gu.sub,
          youtube_token: access_token,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .then(({ error: e }) => { if (e) console.error('[google/callback] user_tokens upsert error:', e) })

    return res
  } catch {
    return NextResponse.redirect(`${BASE}/login?error=server_error`)
  }
}
