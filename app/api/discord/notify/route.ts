import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

async function getUid(): Promise<string | null> {
  try {
    const jar = await cookies()
    const token = jar.get(COOKIE_NAME)?.value
    return token ? (decodeSession(token)?.id ?? null) : null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const uid = await getUid()
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const {
    title   = '🔴 Live iniciada!',
    message = '',
    color   = 0x9b30ff,
    fields  = [] as { name: string; value: string; inline?: boolean }[],
    isTest  = false,
    url: bodyUrl = '',
  } = body

  // For tests: use the URL passed directly in the body (before save).
  // For real notifications: load from DB.
  let webhookUrl = bodyUrl as string
  if (!webhookUrl) {
    const db = getSupabaseAdmin()
    const { data: cfgRow } = await db
      .from('overlay_configs')
      .select('config')
      .eq('broadcaster_id', uid)
      .eq('type', 'discord_webhook')
      .maybeSingle()
    webhookUrl = cfgRow?.config?.url as string ?? ''
  }

  if (!webhookUrl) return NextResponse.json({ error: 'Webhook não configurado' }, { status: 400 })

  const payload = {
    embeds: [{
      title: isTest ? '🧪 Teste de webhook — tudo certo!' : title,
      description: message || undefined,
      color,
      fields,
      footer: { text: 'SheikStream • Dashboard' },
      timestamp: new Date().toISOString(),
    }],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    return NextResponse.json({ error: `Discord retornou ${res.status}: ${err}` }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
