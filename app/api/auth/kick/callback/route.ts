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
    access_token = tokenData.access_token
    refresh_token = tokenData.refresh_token ?? ''
  } catch (e) {
    console.error('[kick/callback] token exception:', e)
    return fail('token_exception')
  }

  // Fetch Kick user profile
  let kickChannelId = ''
  let kickUsername = ''
  try {
    const userRes = await fetch('https://api.kick.com/public/v1/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Client-Id': process.env.KICK_CLIENT_ID,
      },
    })
    if (userRes.ok) {
      const data = await userRes.json()
      const raw = data?.data ?? data
      const u = (Array.isArray(raw) ? raw[0] : raw) ?? {}
      console.log('[kick/callback] users/me raw:', JSON.stringify(u).slice(0, 500))
      // Check top-level and nested channel object
      const ch = (u.channel ?? {}) as Record<string, unknown>
      kickChannelId = String(u.id ?? u.user_id ?? u.channel_id ?? u.broadcaster_user_id ?? ch.id ?? '')
      kickUsername  = String(u.username ?? u.slug ?? u.login ?? ch.slug ?? ch.name ?? u.name ?? u.display_name ?? '')
      console.log('[kick/callback] extracted — id:', kickChannelId, 'username:', kickUsername)
    } else {
      console.warn('[kick/callback] users/me failed:', userRes.status, await userRes.text())
    }
  } catch (e) {
    console.warn('[kick/callback] user fetch failed (non-fatal):', e)
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
