import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data } = await getSupabaseAdmin()
      .from('admin_login_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}
