import { getSupabaseAdmin } from '@/app/lib/supabase'

type EventVars = Record<string, string>

function resolveEventVars(text: string, vars: EventVars): string {
  let result = text
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp('\\$' + key, 'gi'), value)
  }
  return result.trim()
}

export async function fireEventCommand(
  broadcasterId: string,
  eventTrigger: string,
  vars: EventVars,
): Promise<void> {
  const db = getSupabaseAdmin()

  const { data: cmd } = await db
    .from('comandos')
    .select('id, resposta, habilitado, cooldown_s, last_used_at')
    .eq('user_id', broadcasterId)
    .eq('trigger', eventTrigger)
    .maybeSingle()

  if (!cmd || !cmd.habilitado) return

  const now = new Date()
  if (cmd.last_used_at && cmd.cooldown_s > 0) {
    const elapsed = (now.getTime() - new Date(cmd.last_used_at).getTime()) / 1000
    if (elapsed < cmd.cooldown_s) return
  }

  const response = resolveEventVars(cmd.resposta, vars)
  if (!response) return

  await db.from('comandos').update({ last_used_at: now.toISOString() }).eq('id', cmd.id)

  const { data: tok } = await db
    .from('user_tokens')
    .select('twitch_token')
    .eq('user_id', broadcasterId)
    .single()

  if (!tok?.twitch_token) return

  const res = await fetch('https://api.twitch.tv/helix/chat/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tok.twitch_token}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ broadcaster_id: broadcasterId, sender_id: broadcasterId, message: response }),
  })

  if (!res.ok) {
    console.error(`[event-commands] chat send failed for ${eventTrigger}:`, await res.text())
  }
}
