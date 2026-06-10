import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = decodeSession(req.cookies.get(COOKIE_NAME)?.value ?? '')
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { username, tier, is_gift, tickets, date } = body

  if (!username) return NextResponse.json({ error: 'Usuário obrigatório' }, { status: 400 })

  const db = getSupabaseAdmin()

  const eventType = is_gift ? 'kick.subscription.gift' : 'kick.subscribe'
  const eventData: Record<string, unknown> = {
    subscriber_username: username,
    tier: tier ?? 'tier1',
    gifted_count: is_gift ? (tickets ?? 1) : undefined,
    manual: true,
  }

  const { error } = await db.from('twitch_events').insert({
    user_id: user.id,
    event_type: eventType,
    event_data: eventData,
    created_at: date ? new Date(date).toISOString() : new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
