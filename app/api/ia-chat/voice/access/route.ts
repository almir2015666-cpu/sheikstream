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

  // No config saved yet → allow all
  if (!cfg) return NextResponse.json({ canAccess: true, userRole: null })
  // Explicitly disabled → block all
  if (!cfg.enabled) return NextResponse.json({ canAccess: false, userRole: null })

  const allowed = cfg.allowed_roles ?? []

  // 'todos' or empty list → allow all authenticated users
  if (allowed.length === 0 || allowed.includes('todos')) {
    return NextResponse.json({ canAccess: true, userRole: null })
  }

  // Specific roles configured — check user's role
  const { data: roleRow } = await db.from('user_roles').select('role').eq('user_id', session.id).maybeSingle()
  const userRole = roleRow?.role ?? null

  // Role matches
  if (userRole !== null && allowed.includes(userRole)) {
    return NextResponse.json({ canAccess: true, userRole })
  }

  // Approved user (any role or no role) — grant access
  const { data: userRow } = await db.from('users').select('status').eq('id', session.id).maybeSingle()
  if (userRow?.status === 'approved') {
    return NextResponse.json({ canAccess: true, userRole })
  }

  return NextResponse.json({ canAccess: false, userRole })
}
