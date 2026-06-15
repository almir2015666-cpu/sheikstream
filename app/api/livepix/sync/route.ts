import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

async function getLivepixToken(clientId: string, clientSecret: string): Promise<{ token: string | null; error?: string }> {
  const body = `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=messages:read`
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

async function getLivepixMessages(token: string): Promise<{
  username: string; amount: number; message: string | null; created_at: string
}[]> {
  const all: Record<string, unknown>[] = []
  let page = 1
  while (page <= 20) {
    const res = await fetch(
      `https://api.livepix.gg/v2/messages?page=${page}&limit=100`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
    )
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`messages API ${res.status}: ${text.slice(0, 200)}`)
    }
    const data = await res.json()
    const items: Record<string, unknown>[] = data?.data ?? (Array.isArray(data) ? data : [])
    all.push(...items)
    if (items.length < 100) break
    page++
  }
  return all.map(p => ({
    username: String(p.username ?? 'Anônimo'),
    amount: Number(p.amount ?? 0) / 100, // always in cents
    message: p.message ? String(p.message) : null,
    created_at: String(p.createdAt ?? p.created_at ?? new Date().toISOString()),
  }))
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

  const { token, error: tokenError } = await getLivepixToken(cfg.client_id, cfg.client_secret)
  if (!token) {
    return NextResponse.json({ error: `Livepix OAuth falhou: ${tokenError ?? 'sem token na resposta'}` }, { status: 400 })
  }

  const broadcasterId = cfg.channel_id || user.id

  let messages: Awaited<ReturnType<typeof getLivepixMessages>> = []
  try {
    messages = await getLivepixMessages(token)
  } catch (e) {
    return NextResponse.json({ error: `Erro ao buscar doações: ${String(e)}` }, { status: 500 })
  }

  if (messages.length === 0) {
    const { count: totalInDb } = await db
      .from('livepix_donors')
      .select('id', { count: 'exact', head: true })
      .eq('broadcaster_id', broadcasterId)
    return NextResponse.json({ ok: true, synced: 0, totalInDb: totalInDb ?? 0, message: 'Nenhuma doação encontrada.' })
  }

  const { data: existing } = await db
    .from('livepix_donors')
    .select('username, amount, date')
    .eq('broadcaster_id', broadcasterId)

  // Count existing entries per (username, amount_cents, date)
  const existingCount = new Map<string, number>()
  for (const e of existing ?? []) {
    const key = `${String(e.username).toLowerCase().trim()}|${Math.round(Number(e.amount) * 100)}|${e.date}`
    existingCount.set(key, (existingCount.get(key) ?? 0) + 1)
  }

  // Count Livepix messages per group, insert only the excess
  const livepixCount = new Map<string, number>()
  for (const p of messages) {
    const key = `${p.username.toLowerCase().trim()}|${Math.round(p.amount * 100)}|${p.created_at.slice(0, 10)}`
    livepixCount.set(key, (livepixCount.get(key) ?? 0) + 1)
  }

  const toInsert: typeof messages[number][] = []
  for (const [key, lpCount] of livepixCount) {
    const dbCount = existingCount.get(key) ?? 0
    const missing = lpCount - dbCount
    if (missing <= 0) continue
    // Find `missing` messages for this key to insert
    const [username, amountCentsStr, dateStr] = key.split('|')
    const amountCents = Number(amountCentsStr)
    const matches = messages.filter(p =>
      p.username.toLowerCase().trim() === username &&
      p.created_at.slice(0, 10) === dateStr &&
      Math.round(p.amount * 100) === amountCents
    ).slice(0, missing)
    toInsert.push(...matches)
  }

  const rows = toInsert.map(p => ({
    broadcaster_id: broadcasterId,
    username: p.username,
    amount: p.amount,
    message: p.message,
    is_manual: false,
    tickets: Math.max(1, Math.floor(p.amount)),
    date: p.created_at.slice(0, 10),
  }))

  if (rows.length > 0) {
    const { error: insertError } = await db.from('livepix_donors').insert(rows)
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
    total: messages.length,
    totalInDb: totalInDb ?? 0,
  })
}
