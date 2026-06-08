import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const BASE         = 'https://sheikstream.com.br'
const REDIRECT_URI = `${BASE}/api/auth/spotify/callback`

function makePopupHtml(ok: boolean, errMsg?: string) {
  const msg     = ok ? 'Spotify conectado! Fechando...' : `Erro: ${errMsg ?? 'desconhecido'}`
  const color   = ok ? '#22c55e' : '#ef4444'
  const postMsg = ok
    ? `{type:'spotify_connected'}`
    : `{type:'spotify_error',error:${JSON.stringify(errMsg ?? '')}}`
  return `<!DOCTYPE html><html><body style="background:#0f172a;color:${color};font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center"><p style="max-width:300px">${msg}</p><script>try{window.opener&&window.opener.postMessage(${postMsg},'*')}catch(e){}setTimeout(()=>window.close(),400)</script></body></html>`
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code    = searchParams.get('code')
  const error   = searchParams.get('error')
  const isPopup = searchParams.get('state') === 'popup'

  if (error || !code) {
    if (isPopup) return new NextResponse(makePopupHtml(false, error ?? 'oauth_failed'), { headers: { 'Content-Type': 'text/html' } })
    return NextResponse.redirect(`${BASE}/dashboard/conexoes?error=oauth_failed`)
  }

  // Need user session to know which user is connecting Spotify
  const sessionToken = req.cookies.get(COOKIE_NAME)?.value
  const user = sessionToken ? decodeSession(sessionToken) : null
  if (!user) {
    if (isPopup) return new NextResponse(makePopupHtml(false, 'Sessão expirada — faça login novamente'), { headers: { 'Content-Type': 'text/html' } })
    return NextResponse.redirect(`${BASE}/login`)
  }

  // Exchange code for access + refresh tokens
  const credentials = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
  let access_token = '', refresh_token = ''
  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        code,
        redirect_uri:  REDIRECT_URI,
        grant_type:    'authorization_code',
      }),
    })
    if (!tokenRes.ok) {
      if (isPopup) return new NextResponse(makePopupHtml(false, 'Falha ao obter token'), { headers: { 'Content-Type': 'text/html' } })
      return NextResponse.redirect(`${BASE}/dashboard/conexoes?error=token_failed`)
    }
    const d = await tokenRes.json()
    access_token  = d.access_token  ?? ''
    refresh_token = d.refresh_token ?? ''
  } catch {
    if (isPopup) return new NextResponse(makePopupHtml(false, 'Erro de rede'), { headers: { 'Content-Type': 'text/html' } })
    return NextResponse.redirect(`${BASE}/dashboard/conexoes?error=token_failed`)
  }

  // Fetch Spotify user profile (best-effort; username is optional)
  let spotifyUsername = ''
  try {
    const profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (profileRes.ok) {
      const p = await profileRes.json()
      spotifyUsername = (p.display_name ?? p.id ?? '').toString()
    }
  } catch { /* non-fatal */ }

  // Upsert into user_tokens
  const { error: dbErr } = await getSupabaseAdmin()
    .from('user_tokens')
    .upsert({
      user_id:                user.id,
      spotify_token:          access_token,
      spotify_refresh_token:  refresh_token,
      spotify_username:       spotifyUsername,
      updated_at:             new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (dbErr) {
    if (isPopup) return new NextResponse(makePopupHtml(false, dbErr.message), { headers: { 'Content-Type': 'text/html' } })
    return NextResponse.redirect(`${BASE}/dashboard/conexoes?error=db_failed`)
  }

  if (isPopup) return new NextResponse(makePopupHtml(true), { headers: { 'Content-Type': 'text/html' } })
  return NextResponse.redirect(`${BASE}/dashboard/conexoes`)
}
