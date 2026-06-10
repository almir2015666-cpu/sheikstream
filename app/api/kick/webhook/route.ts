import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import { fireEventCommand } from '@/app/lib/event-commands'

export const dynamic = 'force-dynamic'

function verifySignature(
  secret: string,
  msgId: string,
  timestamp: string,
  body: string,
  signature: string,
): boolean {
  const hmac = createHmac('sha256', secret)
  hmac.update(msgId + timestamp + body)
  const expected = 'sha256=' + hmac.digest('hex')
  return expected === signature
}

function normalizeEventType(kickType: string): string {
  if (kickType === 'channel.follow') return 'kick.follow'
  if (kickType === 'channel.subscription.new') return 'kick.subscribe'
  if (kickType === 'channel.subscription.renewal') return 'kick.subscribe'
  if (kickType === 'channel.subscription.gifts') return 'kick.subscription.gift'
  return kickType
}

async function handleNotification(
  kickEventType: string,
  event: Record<string, unknown>,
): Promise<void> {
  const db = getSupabaseAdmin()

  // Kick may send broadcaster id under different keys depending on event version
  const rawId = (
    event.broadcaster_user_id ??
    event.channel_id ??
    (event.channel as Record<string, unknown>)?.id ??
    ''
  ) as string

  if (!rawId) {
    console.warn('[kick/webhook] no broadcaster_id in event:', kickEventType)
    return
  }

  // Look up the SheikSTREAM user that owns this kick channel
  const { data: tok } = await db
    .from('user_tokens')
    .select('user_id')
    .eq('kick_channel_id', String(rawId))
    .maybeSingle()

  if (!tok?.user_id) {
    console.warn('[kick/webhook] unknown kick_channel_id:', rawId)
    return
  }
  const userId = tok.user_id

  // Store in shared events table (feeds the overlay alert poller)
  ;(async () => {
    try {
      await db.from('twitch_events').insert({
        broadcaster_id: userId,
        event_type: normalizeEventType(kickEventType),
        event_data: event,
      })
    } catch { /* ignore — table may not have kick rows yet */ }
  })()

  // Fire the matching event command (chat message + overlay trigger)
  if (kickEventType === 'channel.follow') {
    const username = String(
      (event.follower as Record<string, unknown>)?.username ??
      event.user_username ?? 'Anônimo'
    )
    await fireEventCommand(userId, 'event:kick:follow', { user: username })
      .catch(e => console.error('[kick/webhook] follow cmd:', e))
  }

  if (kickEventType === 'channel.subscription.new' || kickEventType === 'channel.subscription.renewal') {
    const username = String(
      (event.subscriber as Record<string, unknown>)?.username ??
      event.user_username ?? 'Anônimo'
    )
    await fireEventCommand(userId, 'event:kick:sub', { user: username, tickets: '1' })
      .catch(e => console.error('[kick/webhook] sub cmd:', e))
  }

  if (kickEventType === 'channel.subscription.gifts') {
    const username = String(
      (event.gifter as Record<string, unknown>)?.username ??
      event.user_username ?? 'Anônimo'
    )
    const count = String((event.gifts_count as number) ?? (event.count as number) ?? 1)
    await fireEventCommand(userId, 'event:kick:giftsub', { user: username, count, tickets: count })
      .catch(e => console.error('[kick/webhook] giftsub cmd:', e))
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  // Kick uses these headers (exact header names may vary between API versions)
  const msgType = (
    req.headers.get('Kick-Event-Message-Type') ??
    req.headers.get('Kick-Eventsub-Message-Type') ??
    ''
  )
  const msgId = (
    req.headers.get('Kick-Event-Message-Id') ??
    req.headers.get('Kick-Eventsub-Message-Id') ??
    ''
  )
  const timestamp = (
    req.headers.get('Kick-Event-Message-Timestamp') ??
    req.headers.get('Kick-Eventsub-Message-Timestamp') ??
    ''
  )
  const signature = (
    req.headers.get('Kick-Event-Signature') ??
    req.headers.get('Kick-Eventsub-Message-Signature') ??
    ''
  )

  console.log('[kick/webhook] incoming:', msgType || 'unknown', 'msgId:', msgId.slice(0, 8))

  const secret = process.env.KICK_WEBHOOK_SECRET ?? 'sheikstream-kick-secret-2024'

  // Verification challenge (sent when registering the subscription)
  if (msgType === 'webhook_callback_verification') {
    try {
      const payload = JSON.parse(body)
      console.log('[kick/webhook] challenge — responding')
      return new NextResponse(payload.challenge ?? '', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    } catch {
      return new NextResponse('', { status: 200 })
    }
  }

  // Verify HMAC signature
  if (signature && !verifySignature(secret, msgId, timestamp, body, signature)) {
    console.warn('[kick/webhook] signature mismatch')
    return new NextResponse('Forbidden', { status: 403 })
  }

  if (msgType === 'notification') {
    try {
      const payload = JSON.parse(body)
      const eventType = String(payload.subscription?.type ?? payload.event_type ?? '')
      const event = (payload.event ?? payload.data ?? {}) as Record<string, unknown>
      await handleNotification(eventType, event).catch(e =>
        console.error('[kick/webhook] handler error:', e)
      )
    } catch (e) {
      console.error('[kick/webhook] parse error:', e)
    }
  }

  return new NextResponse(null, { status: 204 })
}
