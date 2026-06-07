import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const endpoint = req.nextUrl.searchParams.get('endpoint')
  try {
    let query = getSupabaseAdmin()
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (endpoint) query = query.eq('endpoint', endpoint)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { error } = await getSupabaseAdmin()
      .from('error_logs')
      .delete()
      .gte('created_at', '2000-01-01')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
