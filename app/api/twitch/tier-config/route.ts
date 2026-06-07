import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

const DEFAULTS = {
  tier1_name: 'Tier 1', tier1_value: 9.9,
  tier2_name: 'Tier 2', tier2_value: 25.9,
  tier3_name: 'Tier 3', tier3_value: 49.9,
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data } = await db.from('twitch_tier_config').select('*').eq('broadcaster_id', user.id).single()
  return NextResponse.json(data ?? { broadcaster_id: user.id, ...DEFAULTS })
}

export async function PUT(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('twitch_tier_config').upsert({
    broadcaster_id: user.id,
    tier1_name: body.tier1_name || 'Tier 1',
    tier1_value: Number(body.tier1_value) || 9.9,
    tier2_name: body.tier2_name || 'Tier 2',
    tier2_value: Number(body.tier2_value) || 25.9,
    tier3_name: body.tier3_name || 'Tier 3',
    tier3_value: Number(body.tier3_value) || 49.9,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'broadcaster_id' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
