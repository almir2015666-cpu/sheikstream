import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

async function getLivepixToken(clientId: string, clientSecret: string): Promise<{ token: string | null; error?: string }> {
  // Correct endpoint per LivePix docs: https://oauth.livepix.gg/oauth2/token
  const body = `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=payments:read`
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

async function getLivepixPayments(token: string, page = 1): Promise<{
  username: string; amount: number; message: string | null; created_at: string
}[]> {
  try {
    const res = await fetch(
      `https://api.livepix.gg/v1/payments?page=${page}&per_page=100&sort=created_at&direction=desc`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
    )
    if (!res.ok) return []
    const data = await res.json()
    const items = data?.data ?? data?.payments ?? data ?? []
    return (Array.isArray(items) ? items : []).map((p: Record<string, unknown>) => ({
      username: String(p.sender_name ?? p.donor_name ?? p.name ?? 'Anônimo'),
      amount:   Number(p.amount ?? 0) / 100,
      message:  p.message ? String(p.message) : null,
      created_at: String(p.created_at ?? new Date().toISOString()),
    }))
  } catch {
    return []
  }
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
  const payments = await getLivepixPayments(token)
  if (payments.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, message: 'Nenhuma doação encontrada no Livepix.' })
  }

  // Get existing entries to avoid duplicates (by username + amount + created_at date)
  const { data: existing } = await db
    .from('livepix_donors')
    .select('username, amount, date')
    .eq('broadcaster_id', broadcasterId)
    .eq('is_manual', false)

  const existingSet = new Set(
    (existing ?? []).map(e => `${e.username}|${Number(e.amount).toFixed(2)}|${e.date}`)
  )

  const toInsert = payments
    .filter(p => {
      const dateStr = p.created_at.slice(0, 10)
      const key = `${p.username}|${p.amount.toFixed(2)}|${dateStr}`
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
    await db.from('livepix_donors').insert(toInsert)
  }

  const { count: totalInDb } = await db
    .from('livepix_donors')
    .select('id', { count: 'exact', head: true })
    .eq('broadcaster_id', broadcasterId)

  return NextResponse.json({ ok: true, synced: toInsert.length, total: payments.length, totalInDb: totalInDb ?? 0 })
}
