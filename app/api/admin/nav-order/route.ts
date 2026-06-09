import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET() {
  try {
    const { data } = await getSupabaseAdmin()
      .from('app_settings')
      .select('value')
      .eq('key', 'nav_order')
      .single()
    return NextResponse.json({ order: data?.value ?? null })
  } catch {
    return NextResponse.json({ order: null })
  }
}

export async function PUT(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { order } = await req.json()
    if (!Array.isArray(order)) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    const { error } = await getSupabaseAdmin()
      .from('app_settings')
      .upsert({ key: 'nav_order', value: order, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
