import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('admin_logs')
      .select('*')
      .order('performed_at', { ascending: false })
      .limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
