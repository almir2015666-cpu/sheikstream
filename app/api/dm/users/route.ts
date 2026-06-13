import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getSupabaseAdmin()
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const [{ data: tokens }, { data: recent }] = await Promise.all([
      db.from('user_tokens')
        .select('user_id, twitch_username')
        .not('twitch_token', 'is', null)
        .neq('user_id', user.id)
        .limit(100),
      db.from('activity_logs')
        .select('username')
        .gte('performed_at', fiveMinAgo)
        .not('username', 'is', null),
    ])

    const onlineSet = new Set<string>(
      (recent ?? []).map(r => (r.username as string).toLowerCase())
    )

    const users = (tokens ?? []).map(t => ({
      id: t.user_id as string,
      name: (t.twitch_username as string) ?? 'Usuário',
      image: null,
      is_online: onlineSet.has(((t.twitch_username as string) ?? '').toLowerCase()),
    }))

    users.sort((a, b) => Number(b.is_online) - Number(a.is_online) || a.name.localeCompare(b.name))

    return NextResponse.json(users)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
