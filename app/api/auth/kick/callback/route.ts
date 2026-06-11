import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import { registerKickEventSubscriptions } from '@/app/lib/kick-eventsub'

const BASE = 'https://sheikstream.com.br'
const REDIRECT_URI = `${BASE}/api/auth/kick/callback`

function makePopupHtml(ok: boolean, errMsg?: string) {
  const msg = ok ? 'Kick conectado! Fechando...' : `Erro: ${errMsg ?? 'desconhecido'}`
  const color = ok ? '#22c55e' : '#ef4444'
  const postMsg = ok ? `{type:'kick_connected'}` : `{type:'kick_error',error:${JSON.stringify(errMsg ?? '')}}`
  return `<!DOCTYPE html><html><body style="background:#0f172a;color:${color};font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center"><p style="max-width:300px">${msg}</p><script>try{window.opener&&window.opener.postMessage(${postMsg},'*')}catch(e){}setTimeout(()=>window.close(),400)</script></body></html>`
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')
  const state = req.nextUrl.searchParams.get('state') ?? 'default'
  const isPopup = state === 'popup'

  // state='kick' means user came from /dashboard/plataformas/kick reconnect button
  const successRedirect = state === 'kick'
    ? `${BASE}/dashboard/plataformas/kick`
    : `${BASE}/dashboard/conexoes`

  const fail = (msg: string) => isPopup
    ? new NextResponse(makePopupHtml(false, msg), { headers: { 'Content-Type': 'text/html' } })
    : NextResponse.redirect(`${BASE}/dashboard/conexoes?error=${msg}`)

  if (error || !code) return fail(error ?? 'oauth_failed')
  if (!process.env.KICK_CLIENT_ID || !process.env.KICK_CLIENT_SECRET) return fail('kick_not_configured')

  // Logged-in user (Kick is a secondary connection, not the main login)
  const sessionToken = req.cookies.get(COOKIE_NAME)?.value
  if (!sessionToken) return fail('not_logged_in')
  const sessionUser = decodeSession(sessionToken)
  if (!sessionUser) return fail('invalid_session')

  // Declare early so token exchange can pre-populate if provider includes user info
  let kickChannelId = ''
  let kickUsername = ''

  // Exchange code for token
  let access_token: string
  let refresh_token = ''
  try {
    const tokenRes = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.KICK_CLIENT_ID,
        client_secret: process.env.KICK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        ...(req.cookies.get('kick_verifier')?.value
          ? { code_verifier: req.cookies.get('kick_verifier')!.value }
          : {}),
      }),
    })
    if (!tokenRes.ok) {
      console.error('[kick/callback] token exchange failed:', tokenRes.status, await tokenRes.text())
      return fail('token_failed')
    }
    const tokenData = await tokenRes.json()
    console.log('[kick/callback] token response keys:', Object.keys(tokenData))
    access_token = tokenData.access_token
    refresh_token = tokenData.refresh_token ?? ''
    // Some OAuth providers include user info in the token response itself
    if (tokenData.username)    kickUsername  = String(tokenData.username)
    if (tokenData.user?.slug)  kickUsername  = kickUsername || String(tokenData.user.slug)
    if (tokenData.user_id)     kickChannelId = String(tokenData.user_id)
    if (tokenData.channel_id)  kickChannelId = kickChannelId || String(tokenData.channel_id)
  } catch (e) {
    console.error('[kick/callback] token exception:', e)
    return fail('token_exception')
  }

  // Fetch user info — correct endpoint is /users (not /users/me which returns 404)
  try {
    const userRes = await fetch('https://api.kick.com/public/v1/users', {
      headers: { Authorization: `Bearer ${access_token}`, 'Client-Id': process.env.KICK_CLIENT_ID },
    })
    if (userRes.ok) {
      const data = await userRes.json()
      const arr = data?.data ?? data
      const u = (Array.isArray(arr) ? arr[0] : arr) ?? {}
      kickChannelId = kickChannelId || String(u.user_id ?? u.id ?? '')
      kickUsername  = kickUsername  || String(u.name ?? u.username ?? u.slug ?? '')
    }
  } catch (e) {
    console.warn('[kick/callback] users fetch failed (non-fatal):', e)
  }

  // Fetch channel info — /channels returns authenticated user's channel with slug
  if (!kickUsername) {
    try {
      const chanRes = await fetch('https://api.kick.com/public/v1/channels', {
        headers: { Authorization: `Bearer ${access_token}`, 'Client-Id': process.env.KICK_CLIENT_ID },
      })
      if (chanRes.ok) {
        const data = await chanRes.json()
        const arr = data?.data ?? data
        const c = (Array.isArray(arr) ? arr[0] : arr) ?? {}
        kickUsername  = kickUsername  || String(c.slug ?? '')
        kickChannelId = kickChannelId || String(c.broadcaster_user_id ?? '')
      }
    } catch (e) {
      console.warn('[kick/callback] channels fetch failed (non-fatal):', e)
    }
  }

  // Persist kick token into user's row
  const { error: upsertErr } = await getSupabaseAdmin()
    .from('user_tokens')
    .upsert({
      user_id: sessionUser.id,
      kick_token: access_token,
      kick_refresh_token: refresh_token || null,
      kick_channel_id: kickChannelId || null,
      kick_username: kickUsername || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (upsertErr) {
    console.error('[kick/callback] upsert error:', upsertErr)
    return fail(`db_error: ${upsertErr.message}`)
  }

  // Subscribe to Kick events (non-blocking)
  registerKickEventSubscriptions(sessionUser.id, access_token).catch(e =>
    console.error('[kick/callback] eventsub register error:', e)
  )

  if (isPopup) return new NextResponse(makePopupHtml(true), { headers: { 'Content-Type': 'text/html' } })
  return NextResponse.redirect(successRedirect)
}
