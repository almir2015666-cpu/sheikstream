import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const user = decodeSession(req.cookies.get(COOKIE_NAME)?.value ?? '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url  = new URL(req.url)
  const from = url.searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const to   = url.searchParams.get('to')   ?? new Date().toISOString().split('T')[0]

  const { data } = await getSupabaseAdmin().from('twitch_events')
    .select('id,event_type,event_data,created_at')
    .eq('user_id', user.id)
    .in('event_type', ['kick.subscribe', 'kick.subscription.gift'])
    .gte('created_at', `${from}T00:00:00Z`)
    .lte('created_at', `${to}T23:59:59Z`)
    .order('created_at', { ascending: false })
    .limit(500)

  const subs = (data ?? []).map(e => {
    const d = (e.event_data ?? {}) as Record<string, unknown>
    return {
      id:       e.id,
      type:     e.event_type === 'kick.subscription.gift' ? 'gift' : 'sub',
      username: String(d.subscriber_username ?? d.gifter_username ?? 'Anônimo'),
      count:    e.event_type === 'kick.subscription.gift' ? Number(d.gifted_count ?? d.total ?? 1) : 1,
      created_at: e.created_at,
    }
  })

  return NextResponse.json(subs)
}
