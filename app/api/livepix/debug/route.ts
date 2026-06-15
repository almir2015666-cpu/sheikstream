import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

// Kept for backward compat — no longer used
export async function storeDebugPayload(
  _db: ReturnType<typeof getSupabaseAdmin>,
  _userId: string,
  _slug: string,
  _body: unknown,
) {}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()

  // Read last 5 raw webhook debug events from twitch_events (no migration needed)
  const { data, error } = await db
    .from('twitch_events')
    .select('created_at, event_data')
    .eq('broadcaster_id', user.id)
    .eq('event_type', 'livepix.webhook.raw')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) return NextResponse.json({ error: error.message, recent_webhooks: [] })

  const recent_webhooks = (data ?? []).map(row => ({
    ts: row.created_at,
    slug: (row.event_data as { slug?: string })?.slug ?? '',
    body: (row.event_data as { raw?: unknown })?.raw ?? row.event_data,
  }))

  return NextResponse.json({ recent_webhooks })
}
