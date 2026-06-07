import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data } = await getSupabaseAdmin().from('dev_banner').select('*').eq('id', 1).single()
    return NextResponse.json(data ?? {})
  } catch {
    return NextResponse.json({})
  }
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const allowed = ['active','icon','text_main','text_sub','text_note','action_label','action_url','color','amount_current','amount_goal','supporter_count']
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (key in body) update[key] = body[key]
    }
    const { error } = await getSupabaseAdmin()
      .from('dev_banner')
      .upsert({ id: 1, ...update }, { onConflict: 'id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
