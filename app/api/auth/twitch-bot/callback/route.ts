import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const BASE = 'https://sheikstream.com.br'
const REDIRECT_URI = `${BASE}/api/auth/twitch-bot/callback`

function popupHtml(ok: boolean, botName?: string, err?: string) {
  const msg = ok ? `✓ Conta bot <b>${botName}</b> conectada!` : `Erro: ${err ?? 'desconhecido'}`
  const color = ok ? '#22c55e' : '#ef4444'
  const postMsg = ok ? `{type:'twitch_bot_connected',botName:${JSON.stringify(botName)}}` : `{type:'twitch_bot_error'}`
  return `<!DOCTYPE html><html><body style="background:#0f172a;color:${color};font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center"><p style="max-width:300px">${msg}</p><script>try{window.opener&&window.opener.postMessage(${postMsg},'*')}catch(e){}setTimeout(()=>window.close(),800)</script></body></html>`
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state') ?? ''
  const broadcasterId = state.replace('popup:', '')

  if (!code || !broadcasterId) {
    return new NextResponse(popupHtml(false, undefined, 'missing code or state'), { headers: { 'Content-Type': 'text/html' } })
  }

  // Exchange code for token
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
  if (!tokenRes.ok) return new NextResponse(popupHtml(false, undefined, 'token_failed'), { headers: { 'Content-Type': 'text/html' } })
  const { access_token, refresh_token } = await tokenRes.json()

  // Get bot's Twitch user info
  const userRes = await fetch('https://api.twitch.tv/helix/users', {
    headers: { Authorization: `Bearer ${access_token}`, 'Client-Id': process.env.TWITCH_CLIENT_ID! },
  })
  if (!userRes.ok) return new NextResponse(popupHtml(false, undefined, 'user_failed'), { headers: { 'Content-Type': 'text/html' } })
  const { data } = await userRes.json()
  const bot = data?.[0]
  if (!bot) return new NextResponse(popupHtml(false, undefined, 'no_user'), { headers: { 'Content-Type': 'text/html' } })

  // Store bot token with composite key broadcasterId:bot
  const db = getSupabaseAdmin()
  const { error } = await db.from('user_tokens').upsert({
    user_id: `${broadcasterId}:bot`,
    twitch_token: access_token,
    twitch_refresh_token: refresh_token ?? '',
    twitch_channel_id: bot.id,
    twitch_username: bot.display_name,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) return new NextResponse(popupHtml(false, undefined, error.message), { headers: { 'Content-Type': 'text/html' } })
  return new NextResponse(popupHtml(true, bot.display_name), { headers: { 'Content-Type': 'text/html' } })
}
