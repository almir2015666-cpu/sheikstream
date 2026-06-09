import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

// Returns config + user's role + cooldown status
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? decodeSession(token) : null
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const db = getSupabaseAdmin()

  const [{ data: cfg }, { data: wlRow }] = await Promise.all([
    db.from('ai_image_config').select('enabled, cooldown_seconds, max_per_day, allowed_roles').maybeSingle(),
    db.from('waitlist').select('id').ilike('platform_username', session.name).maybeSingle(),
  ])

  const userId = wlRow?.id ?? session.id
  const ids = [wlRow?.id, session.id].filter(Boolean) as string[]
  const { data: roleRow } = await db.from('user_roles').select('role').in('user_id', ids).maybeSingle()
  const userRole = roleRow?.role ?? null

  // Cooldown remaining
  let cooldownRemaining = 0
  let usedToday = 0
  if (cfg) {
    const since = new Date(Date.now() - cfg.cooldown_seconds * 1000).toISOString()
    const [{ data: recent }, { count }] = await Promise.all([
      db.from('ai_image_generations').select('created_at').eq('user_id', userId).gt('created_at', since).order('created_at', { ascending: false }).limit(1),
      db.from('ai_image_generations').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
    ])
    if (recent && recent.length > 0) {
      const lastAt = new Date(recent[0].created_at).getTime()
      cooldownRemaining = Math.max(0, Math.ceil((lastAt + cfg.cooldown_seconds * 1000 - Date.now()) / 1000))
    }
    usedToday = count ?? 0
  }

  return NextResponse.json({ config: cfg, userRole, cooldownRemaining, usedToday })
}
