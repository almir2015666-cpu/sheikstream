import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const GLOBAL_ID = '_global_'
const TYPE      = 'overlay_catalog_visibility'

export async function GET() {
  try {
    const { data } = await getSupabaseAdmin()
      .from('overlay_configs')
      .select('config')
      .eq('broadcaster_id', GLOBAL_ID)
      .eq('type', TYPE)
      .single()
    return NextResponse.json({ hidden: data?.config?.hidden ?? [] })
  } catch {
    return NextResponse.json({ hidden: [] })
  }
}

export async function PUT(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { hidden } = await req.json()
    if (!Array.isArray(hidden)) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    const { error } = await getSupabaseAdmin()
      .from('overlay_configs')
      .upsert({
        broadcaster_id: GLOBAL_ID,
        type: TYPE,
        config: { hidden },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'broadcaster_id,type' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
