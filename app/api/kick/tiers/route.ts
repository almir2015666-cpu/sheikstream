import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const DEFAULTS = { tier1_name: 'Tier 1', tier1_value: 28.4, tier2_name: 'Tier 2', tier2_value: 56.95, tier3_name: 'Tier 3', tier3_value: 142.44 }

export async function GET(req: NextRequest) {
  const user = decodeSession(req.cookies.get(COOKIE_NAME)?.value ?? '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await getSupabaseAdmin()
    .from('kick_tier_config').select('*').eq('broadcaster_id', user.id).maybeSingle()
  return NextResponse.json(data ?? DEFAULTS)
}

export async function POST(req: NextRequest) {
  const user = decodeSession(req.cookies.get(COOKIE_NAME)?.value ?? '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  await getSupabaseAdmin().from('kick_tier_config').upsert({
    broadcaster_id: user.id,
    tier1_name:  body.tier1_name  ?? DEFAULTS.tier1_name,
    tier1_value: Number(body.tier1_value)  || DEFAULTS.tier1_value,
    tier2_name:  body.tier2_name  ?? DEFAULTS.tier2_name,
    tier2_value: Number(body.tier2_value)  || DEFAULTS.tier2_value,
    tier3_name:  body.tier3_name  ?? DEFAULTS.tier3_name,
    tier3_value: Number(body.tier3_value)  || DEFAULTS.tier3_value,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'broadcaster_id' })
  return NextResponse.json({ ok: true })
}
