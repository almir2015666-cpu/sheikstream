import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

const DEFAULT_CFG = {
  enabled: true,
  cooldown_seconds: 300,
  max_per_day: 10,
  allowed_roles: ['admin', 'moderador', 'vip'],
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? decodeSession(token) : null
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const db = getSupabaseAdmin()

  const [cfgRes, wlRes] = await Promise.all([
    db.from('ai_image_config').select('*').maybeSingle(),
    db.from('waitlist').select('id').ilike('platform_username', session.name).maybeSingle(),
  ])

  // If table doesn't exist yet, use defaults so admin can always access
  const cfg = cfgRes.data ?? DEFAULT_CFG

  const wlRow = wlRes.data
  const userId = wlRow?.id ?? session.id
  const ids = [wlRow?.id, session.id].filter(Boolean) as string[]

  const { data: roleRow } = await db.from('user_roles').select('role').in('user_id', ids).maybeSingle()
  const userRole = roleRow?.role ?? null

  // Cooldown remaining (skip if tables don't exist yet)
  let cooldownRemaining = 0
  let usedToday = 0

  const rawRoles: string[] = (cfg as Record<string, unknown>).allowed_roles as string[] ?? []
  const extEntry = rawRoles.find(r => typeof r === 'string' && r.startsWith('__ext__:'))
  let roleLimits: Record<string, number> = {}
  let roleDelays: Record<string, number> = {}
  if (extEntry) {
    try {
      const parsed = JSON.parse(extEntry.slice(8))
      roleLimits = parsed.limits ?? {}
      roleDelays = parsed.delays ?? {}
    } catch {}
  }
  const effectiveMaxPerDay = roleLimits[userRole ?? ''] ?? cfg.max_per_day
  const effectiveCooldown  = roleDelays[userRole ?? ''] ?? cfg.cooldown_seconds

  if (cfgRes.data && !cfgRes.error) {
    try {
      const since = new Date(Date.now() - effectiveCooldown * 1000).toISOString()
      const [{ data: recent }, { count }] = await Promise.all([
        db.from('ai_image_generations').select('created_at').eq('user_id', userId).gt('created_at', since).order('created_at', { ascending: false }).limit(1),
        db.from('ai_image_generations').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
      ])
      if (recent && recent.length > 0) {
        const lastAt = new Date(recent[0].created_at).getTime()
        cooldownRemaining = Math.max(0, Math.ceil((lastAt + effectiveCooldown * 1000 - Date.now()) / 1000))
      }
      usedToday = count ?? 0
    } catch {}
  }

  const cleanRoles = rawRoles.filter(r => typeof r === 'string' && !r.startsWith('__ext__:'))
  return NextResponse.json({
    config: { ...cfg, allowed_roles: cleanRoles, effective_max_per_day: effectiveMaxPerDay, effective_cooldown_seconds: effectiveCooldown },
    userRole, cooldownRemaining, usedToday,
  })
}
