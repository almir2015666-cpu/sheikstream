import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

const DEFAULT_EVENT_COMMANDS = [
  { trigger: 'event:twitch:follow',  resposta: 'Obrigado pelo follow, $user! Bem-vindo(a) à comunidade!' },
  { trigger: 'event:twitch:sub',     resposta: 'Muito obrigado pela sub, $user! Tier: $tier. Você ganhou $tickets ticket(s)!' },
  { trigger: 'event:twitch:resub',   resposta: '$user está no canal há $months meses! Valeu demais pela resub!' },
  { trigger: 'event:twitch:giftsub', resposta: 'Que generoso, $user! Obrigado pelos $count gift subs!' },
  { trigger: 'event:twitch:bits',    resposta: 'Valeu pelos $valor bits, $user! $msg' },
]

// Most webhook subscriptions use app access token
const APP_TOKEN_SUBS = [
  { type: 'channel.subscribe',            version: '1', cond: (id: string) => ({ broadcaster_user_id: id }) },
  { type: 'channel.subscription.gift',    version: '1', cond: (id: string) => ({ broadcaster_user_id: id }) },
  { type: 'channel.subscription.message', version: '1', cond: (id: string) => ({ broadcaster_user_id: id }) },
  { type: 'channel.cheer',               version: '1', cond: (id: string) => ({ broadcaster_user_id: id }) },
  { type: 'channel.raid',                version: '1', cond: (id: string) => ({ to_broadcaster_user_id: id }) },
  { type: 'channel.follow',             version: '2', cond: (id: string) => ({ broadcaster_user_id: id, moderator_user_id: id }) },
]

// channel.chat.message requires the broadcaster's user access token
const USER_TOKEN_SUBS = [
  { type: 'channel.chat.message', version: '1', cond: (id: string) => ({ broadcaster_user_id: id, user_id: id }) },
]

async function getAppToken(): Promise<string> {
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
  })
  if (!res.ok) throw new Error('app token failed')
  const data = await res.json()
  return data.access_token
}

async function deleteSubscription(id: string, appToken: string): Promise<void> {
  await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${appToken}`, 'Client-Id': process.env.TWITCH_CLIENT_ID! },
  })
}

async function registerSub(
  type: string, version: string, condition: Record<string, string>,
  token: string, appUrl: string, secret: string,
): Promise<{ ok: boolean; status?: number; body?: string }> {
  const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'Client-Id': process.env.TWITCH_CLIENT_ID! },
    body: JSON.stringify({
      type, version, condition,
      transport: { method: 'webhook', callback: `${appUrl}/api/twitch/eventsub`, secret },
    }),
  })
  if (res.ok || res.status === 409) return { ok: true, status: res.status }
  const body = await res.text()
  return { ok: false, status: res.status, body }
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const appUrl = process.env.APP_URL ?? 'https://sheikstream.com.br'
  const secret = process.env.TWITCH_WEBHOOK_SECRET ?? 'sheikstream-eventsub-secret-2024'
  const subResults: Record<string, string> = {}

  // 1. Get app token
  let appToken: string
  try {
    appToken = await getAppToken()
  } catch (e) {
    return NextResponse.json({ ok: false, error: `App token failed: ${e}` }, { status: 500 })
  }

  // 2. List existing subscriptions and delete stuck ones (non-enabled)
  let deletedCount = 0
  try {
    const listRes = await fetch(
      `https://api.twitch.tv/helix/eventsub/subscriptions?user_id=${user.id}`,
      { headers: { Authorization: `Bearer ${appToken}`, 'Client-Id': process.env.TWITCH_CLIENT_ID! } },
    )
    if (listRes.ok) {
      const listData = await listRes.json()
      const existing: Array<{ id: string; type: string; status: string }> = listData.data ?? []
      for (const sub of existing) {
        if (sub.status !== 'enabled') {
          await deleteSubscription(sub.id, appToken)
          deletedCount++
        }
      }
    }
  } catch { /* ignore — will still try to register */ }

  // 3. Register app-token subscriptions
  for (const sub of APP_TOKEN_SUBS) {
    try {
      const r = await registerSub(sub.type, sub.version, sub.cond(user.id), appToken, appUrl, secret)
      subResults[sub.type] = r.ok ? (r.status === 409 ? 'already_exists' : 'registered') : `error_${r.status}: ${r.body ?? ''}`
    } catch (e) {
      subResults[sub.type] = `exception: ${e}`
    }
  }

  // 4. Register user-token subscriptions (channel.chat.message needs broadcaster's user token)
  const { data: tokRow } = await db.from('user_tokens').select('twitch_token').eq('user_id', user.id).single()
  const userToken = tokRow?.twitch_token
  if (userToken) {
    for (const sub of USER_TOKEN_SUBS) {
      try {
        const r = await registerSub(sub.type, sub.version, sub.cond(user.id), userToken, appUrl, secret)
        subResults[sub.type] = r.ok ? (r.status === 409 ? 'already_exists' : 'registered') : `error_${r.status}: ${r.body ?? ''}`
      } catch (e) {
        subResults[sub.type] = `exception: ${e}`
      }
    }
  } else {
    subResults['channel.chat.message'] = 'skipped: no user token stored'
  }

  // 5. Seed missing event commands
  const seeded: string[] = []
  for (const cmd of DEFAULT_EVENT_COMMANDS) {
    const { data: existing } = await db.from('comandos').select('id').eq('user_id', user.id).eq('trigger', cmd.trigger).maybeSingle()
    if (!existing) {
      const { error } = await db.from('comandos').insert({
        user_id: user.id, trigger: cmd.trigger, resposta: cmd.resposta,
        cooldown_s: 0, habilitado: true, permissao: 'todos', platform: 'Twitch', notif_overlay: false,
      })
      if (!error) seeded.push(cmd.trigger)
    }
  }

  return NextResponse.json({ ok: true, deletedStuck: deletedCount, subscriptions: subResults, commandsSeeded: seeded })
}
