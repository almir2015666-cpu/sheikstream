import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import { fireEventCommand } from '@/app/lib/event-commands'
import { storeDebugPayload } from '@/app/api/livepix/debug/route'

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
    .select('user_id, channel_id')
    .eq('slug', slug)
    .maybeSingle()

  if (!cfg) return NextResponse.json({ error: 'config not found for slug' }, { status: 404 })

  // Store raw payload in twitch_events for debug (before any parsing)
  try {
    await db.from('twitch_events').insert({
      broadcaster_id: cfg.user_id,
      event_type: 'livepix.webhook.raw',
      event_data: { slug, raw: body, ts: new Date().toISOString() },
    })
  } catch { /* ignore */ }

  const broadcasterId = cfg.channel_id || cfg.user_id

  // Livepix webhook payload — try all known field variants
  const payment = (body.payment ?? body.data ?? body) as Record<string, unknown>

  const username = String(
    payment.username ?? payment.sender_name ?? payment.donor_name ?? payment.name ??
    body.username ?? body.sender_name ?? 'Anônimo'
  )

  // Amount: Livepix sends in cents (always divide by 100)
  const amountRaw = Number(payment.amount ?? body.amount ?? 0)
  const amount = amountRaw >= 100 ? amountRaw / 100 : amountRaw

  const message = payment.message
    ? String(payment.message)
    : body.message ? String(body.message) : null

  const createdAt = String(payment.created_at ?? payment.createdAt ?? body.created_at ?? new Date().toISOString())
  const dateStr = createdAt.slice(0, 10)

  console.log(`[livepix webhook] parsed: slug=${slug} user=${username} amount=${amount} date=${dateStr}`)

  if (!username || username === 'Anônimo' && amount <= 0) {
    return NextResponse.json({ ok: true, skipped: 'no amount or username' })
  }
  if (amount <= 0) {
    return NextResponse.json({ ok: true, skipped: 'amount zero' })
  }

  // Dedup: check username + date + amount (allow multiple donations same day)
  const amountCents = Math.round(amount * 100)
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

  console.log(`[livepix webhook] ok: ${slug} ${username} R$${amount} cents=${amountCents}`)
  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'sheikstream-livepix-webhook' })
}
