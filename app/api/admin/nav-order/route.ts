import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const GLOBAL_ID = '_global_'
const NAV_TYPE  = 'nav_order'

export async function GET() {
  try {
    const { data } = await getSupabaseAdmin()
      .from('overlay_configs')
      .select('config')
      .eq('broadcaster_id', GLOBAL_ID)
      .eq('type', NAV_TYPE)
      .single()
    const order               = data?.config?.order               ?? null
    const itemStatus          = data?.config?.itemStatus          ?? {}
    const children            = data?.config?.children            ?? {}
    const removedHardChildren = data?.config?.removedHardChildren ?? []
    return NextResponse.json({ order, itemStatus, children, removedHardChildren })
  } catch {
    return NextResponse.json({ order: null, itemStatus: {} })
  }
}

export async function PUT(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { order, itemStatus, children, removedHardChildren } = body
    if (!Array.isArray(order)) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    const { error } = await getSupabaseAdmin()
      .from('overlay_configs')
      .upsert({
        broadcaster_id: GLOBAL_ID,
        type: NAV_TYPE,
        config: { order, itemStatus: itemStatus ?? {}, children: children ?? {}, removedHardChildren: removedHardChildren ?? [] },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'broadcaster_id,type' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
