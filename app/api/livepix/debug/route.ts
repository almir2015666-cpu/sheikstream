import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const ADD_COLUMN_SQL = `ALTER TABLE public.livepix_config ADD COLUMN IF NOT EXISTS debug_payloads jsonb DEFAULT '[]'::jsonb;`

export async function storeDebugPayload(db: ReturnType<typeof getSupabaseAdmin>, userId: string, slug: string, body: unknown) {
  try {
    const { data: cfg } = await db
      .from('livepix_config')
      .select('debug_payloads')
      .eq('user_id', userId)
      .maybeSingle()

    const existing: unknown[] = Array.isArray((cfg as { debug_payloads?: unknown })?.debug_payloads)
      ? (cfg as { debug_payloads: unknown[] }).debug_payloads
      : []

    const entry = { ts: new Date().toISOString(), slug, body }
    const updated = [entry, ...existing].slice(0, 5)

    await db.from('livepix_config').update({ debug_payloads: updated }).eq('user_id', userId)
  } catch { /* ignore — column may not exist yet */ }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('livepix_config')
    .select('debug_payloads, slug')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error?.message?.includes('column') || error?.code === 'PGRST204' || (error && !data)) {
    return NextResponse.json({
      recent_webhooks: [],
      setup_sql: ADD_COLUMN_SQL,
      note: 'Execute o SQL acima no Supabase SQL Editor para ativar o debug persistente.',
    })
  }

  const payloads = Array.isArray((data as { debug_payloads?: unknown })?.debug_payloads)
    ? (data as { debug_payloads: unknown[] }).debug_payloads
    : []

  return NextResponse.json({
    recent_webhooks: payloads,
    slug: (data as { slug?: string })?.slug ?? '',
    note: 'Últimos 5 payloads recebidos pelo webhook Livepix',
  })
}
