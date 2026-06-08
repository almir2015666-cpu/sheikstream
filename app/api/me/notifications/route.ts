import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token || !decodeSession(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data } = await getSupabaseAdmin()
      .from('admin_notifications')
      .select('id,title,message,icon,color,created_at')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(10)
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}
