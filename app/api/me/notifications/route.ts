import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabaseAdmin()
    .from('admin_notifications')
    .select('id,title,message,icon,color,created_at,target_username,max_views')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const visible = (data ?? []).filter(n =>
    !n.target_username ||
    n.target_username.trim() === '' ||
    n.target_username.trim().toLowerCase() === user.name.toLowerCase()
  )
  return NextResponse.json(visible.slice(0, 10))
}
