import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const db = getSupabaseAdmin()
  const [{ data: cfg }, { data: recent }] = await Promise.all([
    db.from('ai_image_config').select('*').maybeSingle(),
    db.from('ai_image_generations')
      .select('id, user_name, user_role, prompt, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return NextResponse.json({ config: cfg, recent: recent ?? [] })
}

export async function PUT(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const db = getSupabaseAdmin()

  const { data: existing } = await db.from('ai_image_config').select('id').maybeSingle()

  const payload = {
    ...(existing?.id ? { id: existing.id } : {}),
    enabled: body.enabled ?? true,
    cooldown_seconds: Number(body.cooldown_seconds ?? 300),
    max_per_day: Number(body.max_per_day ?? 10),
    allowed_roles: body.allowed_roles ?? ['admin', 'moderador', 'vip'],
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await db.from('ai_image_config').upsert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
