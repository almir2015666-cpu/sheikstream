import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

// Debug endpoint — shows last 10 events in twitch_events for the logged-in user
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const db = getSupabaseAdmin()

  const { data: events, error } = await db
    .from('twitch_events')
    .select('id, broadcaster_id, event_type, event_data, created_at')
    .eq('broadcaster_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const since30 = new Date(Date.now() - 30000).toISOString()
  const recent = (events ?? []).filter(e => e.created_at >= since30)

  return NextResponse.json({
    user_id: user.id,
    total_events: events?.length ?? 0,
    recent_events_30s: recent.length,
    events: events ?? [],
    db_error: error?.message ?? null,
    server_time: new Date().toISOString(),
    since_30s: since30,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
