import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

async function getAuthUid(): Promise<string | null> {
  try {
    const jar = await cookies()
    const token = jar.get(COOKIE_NAME)?.value
    if (!token) return null
    return decodeSession(token)?.id ?? null
  } catch { return null }
}

export async function GET() {
  const uid = await getAuthUid()
  if (!uid) return NextResponse.json(null, { status: 401 })
  const { data } = await getSupabaseAdmin()
    .from('overlay_configs')
    .select('config')
    .eq('broadcaster_id', uid)
    .eq('type', 'chat_overlay')
    .maybeSingle()
  return NextResponse.json(data?.config ?? null, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const uid = await getAuthUid()
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { error } = await getSupabaseAdmin()
    .from('overlay_configs')
    .upsert({ broadcaster_id: uid, type: 'chat_overlay', config: body, updated_at: new Date().toISOString() },
      { onConflict: 'broadcaster_id,type' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
