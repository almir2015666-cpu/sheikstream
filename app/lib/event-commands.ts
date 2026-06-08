import { getSupabaseAdmin } from '@/app/lib/supabase'

type EventVars = Record<string, string>

function resolveEventVars(text: string, vars: EventVars): string {
  let result = text
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp('\\$' + key, 'gi'), value)
  }
  return result.trim()
}

async function refreshTwitchToken(userId: string, refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
      }),
    })
    if (!res.ok) {
      console.error('[event-commands] token refresh failed:', res.status, await res.text())
      return null
    }
    const data = await res.json()
    const newToken: string = data.access_token
    const newRefresh: string = data.refresh_token ?? refreshToken

    await getSupabaseAdmin().from('user_tokens').update({
      twitch_token: newToken,
      twitch_refresh_token: newRefresh,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId)

    return newToken
  } catch (e) {
    console.error('[event-commands] token refresh exception:', e)
    return null
  }
}

async function sendChatMessage(broadcasterId: string, token: string, message: string): Promise<Response> {
  return fetch('https://api.twitch.tv/helix/chat/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ broadcaster_id: broadcasterId, sender_id: broadcasterId, message }),
  })
}

export async function fireEventCommand(
  broadcasterId: string,
  eventTrigger: string,
  vars: EventVars,
): Promise<void> {
  const db = getSupabaseAdmin()

  const { data: cmd, error: cmdErr } = await db
    .from('comandos')
    .select('id, resposta, habilitado, cooldown_s, last_used_at')
    .eq('user_id', broadcasterId)
    .eq('trigger', eventTrigger)
    .maybeSingle()

  if (cmdErr) {
    console.error(`[event-commands] DB error fetching command ${eventTrigger}:`, cmdErr.message)
    return
  }
  if (!cmd) {
    console.warn(`[event-commands] command not found: trigger=${eventTrigger} broadcaster=${broadcasterId}`)
    return
  }
  if (!cmd.habilitado) return

  const now = new Date()
  if (cmd.last_used_at && cmd.cooldown_s > 0) {
    const elapsed = (now.getTime() - new Date(cmd.last_used_at).getTime()) / 1000
    if (elapsed < cmd.cooldown_s) return
  }

  const response = resolveEventVars(cmd.resposta, vars)
  if (!response) return

  await db.from('comandos').update({ last_used_at: now.toISOString() }).eq('id', cmd.id)

  const { data: tok, error: tokErr } = await db
    .from('user_tokens')
    .select('twitch_token, twitch_refresh_token')
    .eq('user_id', broadcasterId)
    .single()

  if (tokErr || !tok?.twitch_token) {
    console.warn(`[event-commands] no token for broadcaster ${broadcasterId}`)
    return
  }

  let res = await sendChatMessage(broadcasterId, tok.twitch_token, response)

  // Token expired — try to refresh once
  if (res.status === 401 && tok.twitch_refresh_token) {
    console.warn(`[event-commands] token expired for ${broadcasterId}, refreshing...`)
    const newToken = await refreshTwitchToken(broadcasterId, tok.twitch_refresh_token)
    if (newToken) {
      res = await sendChatMessage(broadcasterId, newToken, response)
    }
  }

  if (!res.ok) {
    console.error(`[event-commands] chat send failed (${res.status}) for ${eventTrigger}:`, await res.text())
  }
}
