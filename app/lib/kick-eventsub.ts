import { getSupabaseAdmin } from '@/app/lib/supabase'

const KICK_API = 'https://api.kick.com/public/v1'
const BASE = 'https://sheikstream.com.br'
const WEBHOOK_URL = `${BASE}/api/kick/webhook`

const KICK_EVENT_TYPES = [
  'channel.follow',
  'channel.subscription.new',
  'channel.subscription.renewal',
  'channel.subscription.gifts',
]

export async function registerKickEventSubscriptions(
  userId: string,
  accessToken: string,
): Promise<void> {
  const db = getSupabaseAdmin()

  const { data: tok } = await db
    .from('user_tokens')
    .select('kick_channel_id')
    .eq('user_id', userId)
    .single()

  const channelId = tok?.kick_channel_id
  if (!accessToken || !channelId) {
    console.warn('[kick-eventsub] missing token or channel_id for user', userId)
    return
  }

  const secret = process.env.KICK_WEBHOOK_SECRET ?? 'sheikstream-kick-secret-2024'

  for (const eventType of KICK_EVENT_TYPES) {
    try {
      const res = await fetch(`${KICK_API}/events/subscriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': process.env.KICK_CLIENT_ID ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: eventType,
          version: 1,
          condition: { broadcaster_user_id: channelId },
          transport: {
            method: 'webhook',
            callback: WEBHOOK_URL,
            secret,
          },
        }),
      })
      if (!res.ok) {
        console.warn(`[kick-eventsub] subscribe failed ${eventType}:`, res.status, await res.text())
      } else {
        console.log(`[kick-eventsub] subscribed to ${eventType} for ${userId}`)
      }
    } catch (e) {
      console.error(`[kick-eventsub] exception subscribing ${eventType}:`, e)
    }
  }
}
