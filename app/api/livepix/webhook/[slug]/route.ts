import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

// Livepix sends a POST to this URL when a donation is received.
// URL pattern: /api/livepix/webhook/[slug]
// Livepix webhook payload varies by version — we handle both v1 and v2 shapes.

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  if (!slug) return NextResponse.json({ error: 'missing slug' }, { status: 400 })

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  const db = getSupabaseAdmin()

  // Look up the livepix_config by slug to get broadcaster_id
  const { data: cfg } = await db
    .from('livepix_config')
    .select('user_id, channel_id')
    .eq('slug', slug)
    .maybeSingle()

  if (!cfg) return NextResponse.json({ error: 'config not found for slug' }, { status: 404 })

  const broadcasterId = cfg.channel_id || cfg.user_id

  // Normalize payment from webhook payload (v1 / v2 variants)
  const payment = (body.payment ?? body.data ?? body) as Record<string, unknown>
  const username = String(payment.sender_name ?? payment.donor_name ?? payment.name ?? body.sender_name ?? 'Anônimo')
  const amountRaw = Number(payment.amount ?? body.amount ?? 0)
  const amount = amountRaw > 1000 ? amountRaw / 100 : amountRaw  // cents vs reais
  const message = payment.message ? String(payment.message) : (body.message ? String(body.message) : null)
  const createdAt = String(payment.created_at ?? body.created_at ?? new Date().toISOString())
  const dateStr = createdAt.slice(0, 10)

  if (!username || amount <= 0) {
    return NextResponse.json({ ok: true, skipped: 'no amount or username' })
  }

  // Dedup check
  const key = `${username}|${amount.toFixed(2)}|${dateStr}`
  const { data: existing } = await db
    .from('livepix_donors')
    .select('id')
    .eq('broadcaster_id', broadcasterId)
    .eq('username', username)
    .eq('date', dateStr)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: true, skipped: 'duplicate' })

  await db.from('livepix_donors').insert({
    broadcaster_id: broadcasterId,
    username,
    amount,
    message,
    is_manual: false,
    tickets: Math.max(1, Math.floor(amount)),
    date: dateStr,
  })

  console.log(`[livepix webhook] ${slug}: ${username} R$${amount} — ${key}`)
  return NextResponse.json({ ok: true })
}

// Livepix may send a GET to verify the webhook URL
export async function GET() {
  return NextResponse.json({ ok: true, service: 'sheikstream-livepix-webhook' })
}
