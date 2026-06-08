import { NextRequest, NextResponse } from 'next/server'
import { verifySignature } from '@/app/lib/eventsub'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const msgType  = req.headers.get('Twitch-Eventsub-Message-Type') ?? ''
  const msgId    = req.headers.get('Twitch-Eventsub-Message-Id') ?? ''
  const ts       = req.headers.get('Twitch-Eventsub-Message-Timestamp') ?? ''
  const sig      = req.headers.get('Twitch-Eventsub-Message-Signature') ?? ''

  if (!verifySignature(process.env.TWITCH_WEBHOOK_SECRET ?? '', msgId, ts, body, sig)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const payload = JSON.parse(body)

  if (msgType === 'webhook_callback_verification') {
    return new NextResponse(payload.challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } })
  }

  if (msgType === 'notification') {
    handleNotification(payload).catch(e => console.error('[eventsub] handler error:', e))
  }

  return new NextResponse(null, { status: 204 })
}

function resolveVars(text: string, chatter: string, channel: string, args: string[]): string {
  return text
    .replace(/\$\(user\)/gi, chatter)
    .replace(/\$\(channel\)/gi, channel)
    .replace(/\$\(touser\)/gi, args[0] ?? chatter)
    .replace(/\$\(1\)/g, args[0] ?? '')
    .replace(/\$\(2\)/g, args[1] ?? '')
    .replace(/\$\(3\)/g, args[2] ?? '')
    .trim()
}

async function sendChat(broadcasterId: string, message: string): Promise<void> {
  const db = getSupabaseAdmin()
  const { data: tok } = await db.from('user_tokens').select('twitch_token').eq('user_id', broadcasterId).single()
  if (!tok?.twitch_token) return
  await fetch('https://api.twitch.tv/helix/chat/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tok.twitch_token}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ broadcaster_id: broadcasterId, sender_id: broadcasterId, message }),
  })
}

async function handleNotification(payload: { subscription: { type: string }; event: Record<string, unknown> }) {
  const eventType: string = payload.subscription.type
  const event = payload.event
  const broadcasterId = (event.broadcaster_user_id ?? event.to_broadcaster_user_id ?? '') as string

  const db = getSupabaseAdmin()
  await db.from('twitch_events').insert({ broadcaster_id: broadcasterId, event_type: eventType, event_data: event })

  // ── Chat commands ─────────────────────────────────────────────────────────
  if (eventType === 'channel.chat.message') {
    const msgObj = event.message as { text?: string } | undefined
    const rawText = (msgObj?.text ?? '').trim()
    if (!rawText.startsWith('!')) return

    const parts   = rawText.slice(1).split(/\s+/)
    const trigger = parts[0].toLowerCase()
    const args    = parts.slice(1)
    const chatter = ((event.chatter_user_name ?? event.chatter_user_login) as string) ?? ''
    const channel = ((event.broadcaster_user_login) as string) ?? ''
    const now     = new Date()

    const { data: cmds } = await db
      .from('comandos')
      .select('id, trigger, resposta, cooldown_s, last_used_at')
      .eq('user_id', broadcasterId)
      .eq('habilitado', true)

    const cmd = (cmds ?? []).find(c => c.trigger.toLowerCase() === trigger)
    if (!cmd) return

    // Cooldown check
    if (cmd.last_used_at) {
      const elapsed = (now.getTime() - new Date(cmd.last_used_at).getTime()) / 1000
      if (elapsed < (cmd.cooldown_s ?? 30)) return
    }

    await db.from('comandos').update({ last_used_at: now.toISOString() }).eq('id', cmd.id)

    const response = resolveVars(cmd.resposta, chatter, channel, args)
    await sendChat(broadcasterId, response)
    return
  }

  // ── Subs / Resubs ────────────────────────────────────────────────────────
  if (eventType === 'channel.subscribe' || eventType === 'channel.subscription.message') {
    const username = ((event.user_name ?? event.user_login) as string) ?? ''
    const now = new Date()

    // Extend subathon
    const { data: sub } = await db.from('subathon_state').select('*').eq('broadcaster_id', broadcasterId).single()
    if (sub?.is_active) {
      if (!sub.is_paused && sub.end_time) {
        const currentEnd = new Date(sub.end_time)
        const base = currentEnd > now ? currentEnd : now
        await db.from('subathon_state').update({
          end_time: new Date(base.getTime() + sub.seconds_per_sub * 1000).toISOString(),
          updated_at: now.toISOString(),
        }).eq('broadcaster_id', broadcasterId)
      } else if (sub.is_paused) {
        await db.from('subathon_state').update({
          paused_remaining: (sub.paused_remaining ?? 0) + sub.seconds_per_sub,
          updated_at: now.toISOString(),
        }).eq('broadcaster_id', broadcasterId)
      }
    }

    // Update subs metas
    const { data: metas } = await db.from('metas').select('id,current_value').eq('broadcaster_id', broadcasterId).eq('type', 'subs').eq('status', 'active')
    for (const m of metas ?? []) {
      await db.from('metas').update({ current_value: m.current_value + 1 }).eq('id', m.id)
    }

    // Add to active sorteio
    if (username) {
      const { data: sorteios } = await db.from('sorteios').select('id,type').eq('broadcaster_id', broadcasterId).eq('status', 'active').in('type', ['subs', 'all']).limit(1)
      if (sorteios?.[0]) {
        await db.from('sorteio_participants').upsert(
          { sorteio_id: sorteios[0].id, username, tickets: sorteios[0].type === 'subs' ? 2 : 1 },
          { onConflict: 'sorteio_id,username', ignoreDuplicates: true }
        )
      }
    }
  }

  // ── Gift subs ────────────────────────────────────────────────────────────
  if (eventType === 'channel.subscription.gift') {
    const total = (event.total as number) ?? 1
    const now = new Date()

    const { data: sub } = await db.from('subathon_state').select('*').eq('broadcaster_id', broadcasterId).single()
    if (sub?.is_active && !sub.is_paused && sub.end_time) {
      const currentEnd = new Date(sub.end_time)
      const base = currentEnd > now ? currentEnd : now
      await db.from('subathon_state').update({
        end_time: new Date(base.getTime() + sub.seconds_per_sub * total * 1000).toISOString(),
        updated_at: now.toISOString(),
      }).eq('broadcaster_id', broadcasterId)
    }

    const { data: metas } = await db.from('metas').select('id,current_value').eq('broadcaster_id', broadcasterId).eq('type', 'gifted_subs').eq('status', 'active')
    for (const m of metas ?? []) {
      await db.from('metas').update({ current_value: m.current_value + total }).eq('id', m.id)
    }
  }

  // ── Bits ─────────────────────────────────────────────────────────────────
  if (eventType === 'channel.cheer') {
    const bits = (event.bits as number) ?? 0
    const username = ((event.user_name ?? '') as string)
    const now = new Date()

    if (bits >= 100) {
      const units = Math.floor(bits / 100)
      const { data: sub } = await db.from('subathon_state').select('*').eq('broadcaster_id', broadcasterId).single()
      if (sub?.is_active && !sub.is_paused && sub.end_time) {
        const currentEnd = new Date(sub.end_time)
        const base = currentEnd > now ? currentEnd : now
        await db.from('subathon_state').update({
          end_time: new Date(base.getTime() + sub.seconds_per_bits100 * units * 1000).toISOString(),
          updated_at: now.toISOString(),
        }).eq('broadcaster_id', broadcasterId)
      }
    }

    const { data: metas } = await db.from('metas').select('id,current_value').eq('broadcaster_id', broadcasterId).eq('type', 'bits').eq('status', 'active')
    for (const m of metas ?? []) {
      await db.from('metas').update({ current_value: m.current_value + bits }).eq('id', m.id)
    }

    if (username) {
      const { data: sorteios } = await db.from('sorteios').select('id,type').eq('broadcaster_id', broadcasterId).eq('status', 'active').eq('type', 'all').limit(1)
      if (sorteios?.[0]) {
        await db.from('sorteio_participants').upsert(
          { sorteio_id: sorteios[0].id, username, tickets: 1 },
          { onConflict: 'sorteio_id,username', ignoreDuplicates: true }
        )
      }
    }
  }
}
