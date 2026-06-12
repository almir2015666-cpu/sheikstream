import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

const GLOBAL_ID = '__global__'
const TYPE = 'feature-ia-chat'
const DEFAULT = { enabled: true, allowed_roles: ['todos'] }

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data } = await db.from('overlay_configs').select('config')
    .eq('broadcaster_id', GLOBAL_ID).eq('type', TYPE).maybeSingle()
  return NextResponse.json({ config: data?.config ?? DEFAULT })
}

export async function PUT(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const db = getSupabaseAdmin()
  await db.from('overlay_configs').upsert(
    { broadcaster_id: GLOBAL_ID, type: TYPE, config: { enabled: body.enabled ?? true, allowed_roles: body.allowed_roles ?? [] } },
    { onConflict: 'broadcaster_id,type' }
  )
  return NextResponse.json({ ok: true })
}
