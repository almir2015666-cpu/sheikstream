import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

async function getLivepixToken(clientId: string, clientSecret: string, scope = 'payments:read'): Promise<{ token: string | null; error?: string }> {
  const body = `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=${encodeURIComponent(scope)}`
  try {
    const res = await fetch('https://oauth.livepix.gg/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body,
    })
    const text = await res.text()
    let data: Record<string, unknown> = {}
    try { data = JSON.parse(text) } catch { /**/ }
    if (res.ok && data.access_token) return { token: String(data.access_token) }
    return { token: null, error: `HTTP ${res.status}: ${data.error_description ?? data.error ?? text.slice(0, 120)}` }
  } catch (e) {
    return { token: null, error: String(e) }
  }
}

async function getLivepixChannelId(token: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.livepix.gg/v1/channel', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    return String(data?.data?.id ?? data?.id ?? data?.channel_id ?? '') || null
  } catch {
    return null
  }
}

async function fetchPaymentsPage(token: string, page: number): Promise<{ items: Record<string, unknown>[]; hasMore: boolean }> {
  const res = await fetch(
    `https://api.livepix.gg/v2/payments?page=${page}&per_page=100&sort=createdAt&direction=desc`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`payments API ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  const items: Record<string, unknown>[] = data?.data ?? data?.payments ?? (Array.isArray(data) ? data : [])
  const total = Number(data?.meta?.total ?? data?.total ?? 0)
  const hasMore = items.length === 100 && (total === 0 || page * 100 < total)
  return { items, hasMore }
}

function normalizePayment(p: Record<string, unknown>) {
  // v2 API: sender may be nested or missing
  const sender = p.sender as Record<string, unknown> | undefined
  const user   = p.user   as Record<string, unknown> | undefined
  const username = String(
    sender?.name ?? sender?.username ?? sender?.display_name ??
    user?.name   ?? user?.username   ?? user?.display_name   ??
    p.sender_name ?? p.donor_name ?? p.username ?? p.name ?? 'Anônimo'
  )
  // v2 returns amount in cents as integer
  const amountRaw = Number(p.amount ?? p.value ?? 0)
  const amount = amountRaw > 1000 ? amountRaw / 100 : amountRaw
  // v2 uses camelCase: createdAt
  const created_at = String(p.createdAt ?? p.created_at ?? p.paid_at ?? new Date().toISOString())
  return {
    username,
    amount,
    message: p.message ? String(p.message) : null,
    created_at,
  }
}

async function getLivepixPayments(token: string): Promise<{
  username: string; amount: number; message: string | null; created_at: string
}[]> {
  const all: Record<string, unknown>[] = []
  let page = 1
  while (page <= 10) {
    const { items, hasMore } = await fetchPaymentsPage(token, page)
    all.push(...items)
    if (!hasMore) break
    page++
  }
  return all.map(normalizePayment)
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data: cfg } = await db.from('livepix_config').select('client_id, client_secret').eq('user_id', user.id).maybeSingle()
  if (!cfg?.client_id || !cfg?.client_secret) return NextResponse.json({ error: 'not configured' }, { status: 400 })

  // Try with broad scopes
  const allScopes = 'payments:read messages:read wallet:read'
  const { token, error: tokenError } = await getLivepixToken(cfg.client_id, cfg.client_secret, allScopes)
  if (!token) return NextResponse.json({ error: tokenError }, { status: 400 })

  async function probe(url: string) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
    const t = await r.text()
    try { return { status: r.status, data: JSON.parse(t) } } catch { return { status: r.status, data: t } }
  }

  const [payments, paymentsBRL, messages, walletBRL] = await Promise.all([
    probe('https://api.livepix.gg/v2/payments?page=1&limit=5'),
    probe('https://api.livepix.gg/v2/payments?page=1&limit=5&currency=BRL'),
    probe('https://api.livepix.gg/v2/messages?page=1&limit=5'),
    probe('https://api.livepix.gg/v2/wallet/BRL/transactions?page=1&limit=5'),
  ])

  return NextResponse.json({ payments, paymentsBRL, messages, walletBRL })
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data: cfg } = await db
    .from('livepix_config')
    .select('client_id, client_secret, channel_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!cfg?.client_id || !cfg?.client_secret) {
    return NextResponse.json({ error: 'Configure o Client ID e Client Secret do Livepix em Conexões.' }, { status: 400 })
  }

  // Get OAuth token
  const { token, error: tokenError } = await getLivepixToken(cfg.client_id, cfg.client_secret)
  if (!token) {
    return NextResponse.json({ error: `Livepix OAuth falhou: ${tokenError ?? 'sem token na resposta'}` }, { status: 400 })
  }

  // Auto-detect channel_id if not set
  let channelId = cfg.channel_id
  if (!channelId) {
    channelId = await getLivepixChannelId(token)
    if (channelId) {
      await db.from('livepix_config').update({ channel_id: channelId }).eq('user_id', user.id)
    }
  }

  const broadcasterId = channelId || user.id

  // Fetch payments from Livepix
  let payments: Awaited<ReturnType<typeof getLivepixPayments>> = []
  try {
    payments = await getLivepixPayments(token)
  } catch (e) {
    return NextResponse.json({ error: `Erro ao buscar pagamentos: ${String(e)}` }, { status: 500 })
  }

  if (payments.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, totalInDb: 0, message: 'Nenhuma doação encontrada no Livepix.' })
  }

  // Get existing entries — match by broadcaster_id (all entries, not just is_manual=false, to prevent duplicates)
  const { data: existing } = await db
    .from('livepix_donors')
    .select('username, amount, date')
    .eq('broadcaster_id', broadcasterId)

  // Build dedup set: username (lowercase) | rounded amount | date
  const existingSet = new Set(
    (existing ?? []).map(e =>
      `${String(e.username).toLowerCase().trim()}|${Math.round(Number(e.amount) * 100)}|${e.date}`
    )
  )

  const toInsert = payments
    .filter(p => {
      const dateStr = p.created_at.slice(0, 10)
      const key = `${p.username.toLowerCase().trim()}|${Math.round(p.amount * 100)}|${dateStr}`
      return !existingSet.has(key)
    })
    .map(p => ({
      broadcaster_id: broadcasterId,
      username:       p.username,
      amount:         p.amount,
      message:        p.message,
      is_manual:      false,
      tickets:        Math.max(1, Math.floor(p.amount)),
      date:           p.created_at.slice(0, 10),
    }))

  if (toInsert.length > 0) {
    const { error: insertError } = await db.from('livepix_donors').insert(toInsert)
    if (insertError) {
      return NextResponse.json({ error: `Erro ao inserir doações: ${insertError.message}` }, { status: 500 })
    }
  }

  const { count: totalInDb } = await db
    .from('livepix_donors')
    .select('id', { count: 'exact', head: true })
    .eq('broadcaster_id', broadcasterId)

  return NextResponse.json({
    ok: true,
    synced: toInsert.length,
    total: payments.length,
    existing: (existing ?? []).length,
    totalInDb: totalInDb ?? 0,
  })
}
