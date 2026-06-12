import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const db = getSupabaseAdmin()
  const types = ['feature-ia-chat', 'feature-ia-voz', 'feature-ia-imagens']

  const { data: allRows } = await db.from('overlay_configs').select('broadcaster_id, type, config')
    .eq('broadcaster_id', '__global__').in('type', types)

  const { data: allRoles } = await db.from('user_roles').select('user_id, role')

  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? decodeSession(token) : null
  let currentUserRole: string | null = null
  if (session) {
    const { data: roleRow } = await db.from('user_roles').select('role').eq('user_id', session.id).maybeSingle()
    currentUserRole = roleRow?.role ?? null
  }

  return NextResponse.json({
    overlay_rows: allRows ?? [],
    user_roles: allRoles ?? [],
    current_user: session ? { id: session.id, name: session.name, role: currentUserRole } : null,
  })
}
