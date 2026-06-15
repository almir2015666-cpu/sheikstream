import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'
const TYPE = 'voice_commands'

async function getUid(): Promise<string | null> {
  try {
    const jar = await cookies()
    const token = jar.get(COOKIE_NAME)?.value
    return token ? (decodeSession(token)?.id ?? null) : null
  } catch { return null }
}

export async function GET() {
  const uid = await getUid()
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await getSupabaseAdmin()
    .from('overlay_configs')
    .select('config')
    .eq('broadcaster_id', uid)
    .eq('type', TYPE)
    .maybeSingle()
  return NextResponse.json(data?.config ?? { commands: [] })
}

export async function POST(req: NextRequest) {
  const uid = await getUid()
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { error } = await getSupabaseAdmin()
    .from('overlay_configs')
    .upsert({ broadcaster_id: uid, type: TYPE, config: body, updated_at: new Date().toISOString() },
      { onConflict: 'broadcaster_id,type' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
