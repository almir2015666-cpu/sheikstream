import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data } = await getSupabaseAdmin()
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, status, admin_reply } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) update.status = status
    if (admin_reply !== undefined) update.admin_reply = admin_reply
    const { error } = await getSupabaseAdmin().from('support_tickets').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
