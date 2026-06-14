import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const BASE         = 'https://sheikstream.com.br'
const REDIRECT_URI = `${BASE}/api/auth/spotify/callback`

function fail(isPopup: boolean, msg: string) {
  const encoded = encodeURIComponent(msg)
  if (isPopup) {
    const postMsg = `{type:'spotify_error',error:${JSON.stringify(msg)}}`
    return new NextResponse(
      `<!DOCTYPE html><html><body style="background:#0f172a;color:#ef4444;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center"><p style="max-width:320px;font-size:1rem">Erro Spotify:<br><strong>${msg}</strong></p><script>try{window.opener&&window.opener.postMessage(${postMsg},'*')}catch(e){}setTimeout(()=>window.close(),10000)</script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
  return NextResponse.redirect(`${BASE}/dashboard/conexoes?error=${encoded}`)
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code    = searchParams.get('code')
  const error   = searchParams.get('error')
  const isPopup = searchParams.get('state') === 'popup'

  if (error || !code) return fail(isPopup, error ?? 'oauth_cancelled')

  // Session check
  const sessionToken = req.cookies.get(COOKIE_NAME)?.value
  const user = sessionToken ? decodeSession(sessionToken) : null
  if (!user) return fail(isPopup, 'sessao_expirada — faca login novamente')

  // Exchange code for tokens
  const credentials = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
  let access_token = '', refresh_token = ''
  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({ code, redirect_uri: REDIRECT_URI, grant_type: 'authorization_code' }),
    })
    if (!tokenRes.ok) {
      const body = await tokenRes.text()
      return fail(isPopup, `token_exchange_${tokenRes.status}: ${body.slice(0, 120)}`)
    }
    const d = await tokenRes.json()
    access_token  = d.access_token  ?? ''
    refresh_token = d.refresh_token ?? ''
  } catch (e) {
    return fail(isPopup, `network_error: ${String(e).slice(0, 80)}`)
  }

  // Fetch Spotify user profile (best-effort)
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

  // Save to DB
  const { error: dbErr } = await getSupabaseAdmin()
    .from('user_tokens')
    .upsert({
      user_id:               user.id,
      spotify_token:         access_token,
      spotify_refresh_token: refresh_token,
      spotify_username:      spotifyUsername,
      updated_at:            new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (dbErr) return fail(isPopup, `db_error: ${dbErr.message}`)

  if (isPopup) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="background:#0f172a;color:#22c55e;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center"><p>Spotify conectado! Fechando...</p><script>try{window.opener&&window.opener.postMessage({type:'spotify_connected'},'*')}catch(e){}setTimeout(()=>window.close(),400)</script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
  return NextResponse.redirect(`${BASE}/dashboard/pedidos-musica`)
}
