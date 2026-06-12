import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? decodeSession(token) : null
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data } = await db.from('overlay_configs').select('config')
    .eq('broadcaster_id', '__global__').eq('type', 'feature-ia-voz').maybeSingle()

  const cfg = data?.config as { enabled: boolean; allowed_roles: string[] } | null

  if (!cfg) return NextResponse.json({ canAccess: true, userRole: null })
  if (!cfg.enabled) return NextResponse.json({ canAccess: false, userRole: null })

  const { data: roleRow } = await db.from('user_roles').select('role').eq('user_id', session.id).maybeSingle()
  const userRole = roleRow?.role ?? null

  const allowed = cfg.allowed_roles ?? []

  // Empty allowed_roles = no restriction configured yet → allow all
  if (allowed.length === 0) return NextResponse.json({ canAccess: true, userRole })

  if (allowed.includes('todos')) return NextResponse.json({ canAccess: true, userRole })

  if (userRole !== null && allowed.includes(userRole)) return NextResponse.json({ canAccess: true, userRole })

  // Fallback: broadcaster/owner without a role assignment — check approved status in users table
  const { data: userRow } = await db.from('users').select('status').eq('id', session.id).maybeSingle()
  if (userRow?.status === 'approved' && userRole === null) return NextResponse.json({ canAccess: true, userRole: null })

  return NextResponse.json({ canAccess: false, userRole })
}
