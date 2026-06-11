import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

function extractExt(roles: string[]): {
  limits: Record<string, number>
  delays: Record<string, number>
  cleanRoles: string[]
} {
  const extEntry = (roles ?? []).find(r => typeof r === 'string' && r.startsWith('__ext__:'))
  let limits: Record<string, number> = {}
  let delays: Record<string, number> = {}
  if (extEntry) {
    try {
      const parsed = JSON.parse((extEntry as string).slice(8))
      limits = parsed.limits ?? {}
      delays = parsed.delays ?? {}
    } catch {}
  }
  return {
    limits,
    delays,
    cleanRoles: (roles ?? []).filter((r): r is string => typeof r === 'string' && !r.startsWith('__ext__:')),
  }
}

function packExt(cleanRoles: string[], limits: Record<string, number>, delays: Record<string, number>): string[] {
  return [...cleanRoles, `__ext__:${JSON.stringify({ limits, delays })}`]
}

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

  const { limits: roleLimits, delays: roleDelays, cleanRoles } = extractExt(cfg?.allowed_roles ?? [])

  return NextResponse.json({
    config: cfg ? {
      ...cfg,
      allowed_roles: cleanRoles,
      role_limits: roleLimits,
      role_delays: roleDelays,
    } : cfg,
    recent: recent ?? [],
  })
}

export async function PUT(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const db = getSupabaseAdmin()

  const { data: existing } = await db.from('ai_image_config').select('id').maybeSingle()

  // Per-group config encoded inside allowed_roles — no extra DB columns needed
  const allowedRoles = packExt(body.allowed_roles ?? [], body.role_limits ?? {}, body.role_delays ?? {})

  const payload = {
    ...(existing?.id ? { id: existing.id } : {}),
    enabled: body.enabled ?? true,
    cooldown_seconds: Number(body.cooldown_seconds ?? 300),
    max_per_day: Number(body.max_per_day ?? 10),
    allowed_roles: allowedRoles,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await db.from('ai_image_config').upsert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
