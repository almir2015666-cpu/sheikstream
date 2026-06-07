import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  const metaId = req.nextUrl.searchParams.get('meta_id')
  if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 })

  const db = getSupabaseAdmin()

  if (metaId) {
    const { data } = await db.from('metas').select('*').eq('id', metaId).eq('broadcaster_id', uid).single()
    return NextResponse.json(data ?? null)
  }

  const { data } = await db.from('metas').select('*').eq('broadcaster_id', uid).eq('status', 'active').order('created_at').limit(1)
  return NextResponse.json(data?.[0] ?? null)
}
