import { createHmac } from 'crypto'

const EVENT_TYPES = [
  { type: 'channel.subscribe',             version: '1', cond: (id: string) => ({ broadcaster_user_id: id }) },
  { type: 'channel.subscription.gift',     version: '1', cond: (id: string) => ({ broadcaster_user_id: id }) },
  { type: 'channel.subscription.message',  version: '1', cond: (id: string) => ({ broadcaster_user_id: id }) },
  { type: 'channel.cheer',                 version: '1', cond: (id: string) => ({ broadcaster_user_id: id }) },
  { type: 'channel.raid',                  version: '1', cond: (id: string) => ({ to_broadcaster_user_id: id }) },
]

let _appToken: { value: string; expiresAt: number } | null = null

async function getAppToken(): Promise<string> {
  if (_appToken && Date.now() < _appToken.expiresAt) return _appToken.value
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
  })
  if (!res.ok) throw new Error('Twitch app token failed')
  const data = await res.json()
  _appToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 - 60_000 }
  return _appToken.value
}

export async function registerEventSubSubscriptions(broadcasterId: string): Promise<void> {
  const token = await getAppToken()
  const appUrl = process.env.APP_URL ?? 'https://sheikstream.com.br'
  const secret = process.env.TWITCH_WEBHOOK_SECRET ?? ''

  for (const sub of EVENT_TYPES) {
    try {
      const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID!,
        },
        body: JSON.stringify({
          type: sub.type,
          version: sub.version,
          condition: sub.cond(broadcasterId),
          transport: {
            method: 'webhook',
            callback: `${appUrl}/api/twitch/eventsub`,
            secret,
          },
        }),
      })
      if (!res.ok && res.status !== 409) {
        console.error(`[eventsub] failed to register ${sub.type}:`, await res.text())
      }
    } catch (e) {
      console.error(`[eventsub] error registering ${sub.type}:`, e)
    }
  }
}

export async function registerChatSubscription(broadcasterId: string, userToken: string): Promise<void> {
  const appUrl = process.env.APP_URL ?? 'https://sheikstream.com.br'
  const secret = process.env.TWITCH_WEBHOOK_SECRET ?? ''
  try {
    const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
      body: JSON.stringify({
        type: 'channel.chat.message',
        version: '1',
        condition: { broadcaster_user_id: broadcasterId, user_id: broadcasterId },
        transport: { method: 'webhook', callback: `${appUrl}/api/twitch/eventsub`, secret },
      }),
    })
    if (!res.ok && res.status !== 409) {
      console.error('[eventsub] failed to register channel.chat.message:', await res.text())
    }
  } catch (e) {
    console.error('[eventsub] error registering channel.chat.message:', e)
  }
}

export function verifySignature(secret: string, msgId: string, timestamp: string, body: string, signature: string): boolean {
  const hmac = createHmac('sha256', secret)
  hmac.update(msgId + timestamp + body)
  return 'sha256=' + hmac.digest('hex') === signature
}
