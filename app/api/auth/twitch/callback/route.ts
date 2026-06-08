import { NextRequest, NextResponse } from 'next/server'
import { encodeSession, COOKIE_NAME, SessionUser } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import { logActivity } from '@/app/lib/log-activity'
import { logSystem } from '@/app/lib/logger'
import { registerEventSubSubscriptions, registerChatSubscription } from '@/app/lib/eventsub'

const BASE = 'https://sheikstream.com.br'
const REDIRECT_URI = `${BASE}/api/auth/twitch/callback`

function makePopupHtml(ok: boolean, errMsg?: string) {
  const msg = ok ? 'Conectado! Fechando...' : `Erro ao salvar token: ${errMsg ?? 'desconhecido'}`
  const color = ok ? '#22c55e' : '#ef4444'
  const postMsg = ok ? `{type:'twitch_connected'}` : `{type:'twitch_error',error:${JSON.stringify(errMsg ?? '')}}`
  return `<!DOCTYPE html><html><body style="background:#0f172a;color:${color};font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center"><p style="max-width:300px">${msg}</p><script>try{window.opener&&window.opener.postMessage(${postMsg},'*')}catch(e){}setTimeout(()=>window.close(),400)</script></body></html>`
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const isPopup = searchParams.get('state') === 'popup'

  if (error || !code) {
    if (isPopup) return new NextResponse(makePopupHtml(false, error ?? 'oauth_failed'), { headers: { 'Content-Type': 'text/html' } })
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
      await logSystem('auth.new_user', `Novo usuário Twitch na waitlist: ${tw.display_name}`, tw.id, { platform: 'Twitch', username: tw.display_name })
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
  // Persist Twitch token before building response so we know if it succeeded
  let upsertErrMsg: string | undefined
  try {
    const { error: upsertErr } = await getSupabaseAdmin()
      .from('user_tokens')
      .upsert(
        {
          user_id: tw.id,
          twitch_token: access_token,
          twitch_channel_id: tw.id,
          twitch_username: tw.display_name,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    if (upsertErr) {
      upsertErrMsg = `${upsertErr.code}: ${upsertErr.message}`
      console.error('[twitch/callback] user_tokens upsert error:', upsertErr)
    }
  } catch (e) {
    upsertErrMsg = String(e)
    console.error('[twitch/callback] user_tokens upsert exception:', e)
  }

  const res = isPopup
    ? new NextResponse(makePopupHtml(!upsertErrMsg, upsertErrMsg), { headers: { 'Content-Type': 'text/html' } })
    : NextResponse.redirect(`${BASE}/dashboard`)
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  await logActivity('auth', 'login', tw.display_name, 'Twitch')
  await logSystem('auth.login', `Login Twitch: ${tw.display_name}`, tw.id, { platform: 'Twitch', username: tw.display_name, is_popup: isPopup })

  // Upsert usuario profile (needed for comandos FK)
  getSupabaseAdmin().from('usuarios').upsert({
    id: tw.id, nome: tw.display_name, email: tw.email ?? '', imagem: tw.profile_image_url ?? '',
    atualizado_em: new Date().toISOString(),
  }, { onConflict: 'id' }).then()

  // Register EventSub webhooks for this broadcaster (async, doesn't block login)
  registerEventSubSubscriptions(tw.id).catch(e => console.error('[callback] eventsub register error:', e))
  // Register chat message subscription using broadcaster's user token
  registerChatSubscription(tw.id, access_token).catch(e => console.error('[callback] chat sub error:', e))
  return res
}
