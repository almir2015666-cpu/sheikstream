import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function parseRoles(role: string | null): string[] {
  if (!role) return []
  try {
    const parsed = JSON.parse(role)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {}
  return [role]
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()

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

  const roles = parseRoles(data?.role ?? null)
  return NextResponse.json({ role: roles[0] ?? null, roles })
}
