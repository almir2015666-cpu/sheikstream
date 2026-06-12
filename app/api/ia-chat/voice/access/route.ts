import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? decodeSession(token) : null
  if (!session) return NextResponse.json({ canAccess: false, userRole: null })

  const db = getSupabaseAdmin()
  const { data } = await db.from('overlay_configs').select('config')
    .eq('broadcaster_id', '__global__').eq('type', 'feature-ia-voz').maybeSingle()

  const cfg = data?.config as { enabled: boolean } | null

  // Only block if admin explicitly disabled the feature
  if (cfg && cfg.enabled === false) {
    return NextResponse.json({ canAccess: false, userRole: null })
  }

  // Any authenticated user has access
  return NextResponse.json({ canAccess: true, userRole: null })
}
