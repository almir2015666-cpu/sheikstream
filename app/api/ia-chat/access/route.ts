import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? decodeSession(token) : null
  if (!session) return NextResponse.json({ canAccess: false, userRole: null })

  const db = getSupabaseAdmin()
  const { data: rows } = await db.from('overlay_configs').select('config')
    .eq('broadcaster_id', '__global__').eq('type', 'feature-ia-chat')

  const cfg = (rows?.[0]?.config ?? null) as { enabled: boolean; allowed_roles: string[] } | null

  if (!cfg) return NextResponse.json({ canAccess: true, userRole: null })
  if (cfg.enabled === false) return NextResponse.json({ canAccess: false, userRole: null })

  const allowed = (cfg.allowed_roles ?? []).map(r => r.toLowerCase())

  if (allowed.length === 0 || allowed.includes('todos')) {
    return NextResponse.json({ canAccess: true, userRole: null })
  }

  // Admin assigns roles using waitlist UUID; session.id is the Twitch numeric ID.
  // Check both IDs so role lookup works regardless of which was stored.
  const { data: wlRow } = await db.from('waitlist').select('id')
    .ilike('platform_username', session.name).maybeSingle()
  const ids = [wlRow?.id, session.id].filter(Boolean) as string[]

  const { data: roleRow } = await db.from('user_roles').select('role')
    .in('user_id', ids).order('created_at', { ascending: false }).limit(1).maybeSingle()

  let userRoles: string[] = []
  if (roleRow?.role) {
    try { const p = JSON.parse(roleRow.role); userRoles = Array.isArray(p) ? p.map(String) : [roleRow.role] } catch { userRoles = [roleRow.role] }
  }

  const canAccess = userRoles.length > 0 && userRoles.some(r => allowed.includes(r.toLowerCase()))
  return NextResponse.json({ canAccess, userRole: userRoles[0] ?? null, userRoles })
}
