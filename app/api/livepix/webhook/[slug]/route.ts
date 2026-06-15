import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import { fireEventCommand } from '@/app/lib/event-commands'

async function getLivepixToken(clientId: string, clientSecret: string): Promise<string | null> {
  try {
    const res = await fetch('https://oauth.livepix.gg/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=messages:read`,
    })
    const data = await res.json().catch(() => ({}))
    return data.access_token ? String(data.access_token) : null
  } catch { return null }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  if (!slug) return NextResponse.json({ error: 'missing slug' }, { status: 400 })

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  console.log('[livepix webhook] raw body:', JSON.stringify(body).slice(0, 500))

  const db = getSupabaseAdmin()

  const { data: cfg } = await db
    .from('livepix_config')
    .select('user_id, channel_id, client_id, client_secret')
    .eq('slug', slug)
    .maybeSingle()

  if (!cfg) return NextResponse.json({ error: 'config not found for slug' }, { status: 404 })

  const broadcasterId = cfg.channel_id || cfg.user_id

  // Livepix sends: { event: "new", resource: { id: "...", type: "message", ... } }
  // We must fetch payment details from their API using the resource.id
  const resource = body.resource as { id?: string; type?: string } | undefined
  const resourceId = resource?.id ?? ''
  const resourceType = resource?.type ?? ''
  const eventType = String(body.event ?? '')

  // Store raw payload in twitch_events for debug (includes resource info)
  try {
    await db.from('twitch_events').insert({
      broadcaster_id: cfg.user_id,
      event_type: 'livepix.webhook.raw',
      event_data: { slug, raw: body, ts: new Date().toISOString() },
    })
  } catch { /* ignore */ }

  if (!resourceId || resourceType !== 'message' || eventType !== 'new') {
    console.log(`[livepix webhook] skipped: event=${eventType} type=${resourceType} id=${resourceId}`)
    return NextResponse.json({ ok: true, skipped: 'not a new message event' })
  }

  // Fetch payment details from Livepix API
  const clientId = cfg.client_id as string | null
  const clientSecret = cfg.client_secret as string | null
  if (!clientId || !clientSecret) {
    console.error('[livepix webhook] no client_id/client_secret configured')
    return NextResponse.json({ ok: true, skipped: 'no api credentials' })
  }

  const token = await getLivepixToken(clientId, clientSecret)
  if (!token) {
    console.error('[livepix webhook] failed to get OAuth token')
    // Store token failure in debug
    try { await db.from('twitch_events').insert({ broadcaster_id: cfg.user_id, event_type: 'livepix.webhook.error', event_data: { error: 'token_failed', resourceId } }) } catch { /**/ }
    return NextResponse.json({ ok: true, skipped: 'token error' })
  }

  const msgRes = await fetch(`https://api.livepix.gg/v2/messages/${resourceId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  const payment = await msgRes.json().catch(() => ({})) as Record<string, unknown>

  console.log('[livepix webhook] payment details:', JSON.stringify(payment).slice(0, 300))

  // Store payment API response in debug
  try { await db.from('twitch_events').insert({ broadcaster_id: cfg.user_id, event_type: 'livepix.webhook.payment', event_data: { resourceId, status: msgRes.status, payment } }) } catch { /**/ }

  const username = String(payment.username ?? payment.sender_name ?? 'Anônimo')
  const amountRaw = Number(payment.amount ?? 0)
  const amount = amountRaw / 100  // Livepix always sends in cents
  const message = payment.message ? String(payment.message) : null
  const createdAt = String(payment.createdAt ?? payment.created_at ?? new Date().toISOString())
  const dateStr = createdAt.slice(0, 10)

  if (amount <= 0) {
    return NextResponse.json({ ok: true, skipped: `amount zero (raw=${amountRaw})` })
  }

  // Dedup by resource ID first (fastest)
  const { data: existingById } = await db
    .from('livepix_donors')
    .select('id')
    .eq('broadcaster_id', broadcasterId)
    .eq('livepix_resource_id', resourceId)
    .maybeSingle()

  if (existingById) {
    return NextResponse.json({ ok: true, skipped: 'duplicate resource_id' })
  }

  // Secondary dedup by username+date+amount
  const { data: existing } = await db
    .from('livepix_donors')
    .select('id')
    .eq('broadcaster_id', broadcasterId)
    .eq('username', username)
    .eq('date', dateStr)
    .gte('amount', amount - 0.01)
    .lte('amount', amount + 0.01)
    .maybeSingle()

  if (existing) {
    console.log(`[livepix webhook] duplicate skipped: ${username} R$${amount} ${dateStr}`)
    return NextResponse.json({ ok: true, skipped: 'duplicate' })
  }

  const tickets = Math.max(1, Math.floor(amount))

  await db.from('livepix_donors').insert({
    broadcaster_id: broadcasterId,
    username,
    amount,
    message,
    is_manual: false,
    tickets,
    date: dateStr,
  })

  // Insert into twitch_events so the overlay alert fires
  try {
    await db.from('twitch_events').insert({
      broadcaster_id: broadcasterId,
      event_type: 'livepix.donation',
      event_data: { user_name: username, amount, message: message ?? '', platform: 'Livepix' },
    })
  } catch { /* ignore */ }

  // Fire bot chat command
  fireEventCommand(cfg.user_id, 'donation:livepix', {
    user: username, valor: `R$${amount.toFixed(2)}`,
    tickets: String(tickets), nums: '', msg: message ?? '', platform: 'Livepix',
  }).catch(e => console.error('[livepix webhook] event cmd error:', e))

  console.log(`[livepix webhook] ok: ${slug} ${username} R$${amount}`)
  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'sheikstream-livepix-webhook' })
}
