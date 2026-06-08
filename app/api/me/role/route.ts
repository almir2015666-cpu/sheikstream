import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()

  // Admin assigns roles using waitlist.id (UUID), but session user.id is the Twitch numeric ID.
  // Look up the waitlist UUID for this user first, then check both IDs.
  const { data: wlRow } = await db
    .from('waitlist')
    .select('id')
    .ilike('platform_username', user.name)
    .maybeSingle()

  const ids = [wlRow?.id, user.id].filter(Boolean) as string[]
  const { data } = await db
    .from('user_roles')
    .select('role')
    .in('user_id', ids)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ role: data?.role ?? null })
}
