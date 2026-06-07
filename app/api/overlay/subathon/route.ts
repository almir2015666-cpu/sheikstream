import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data } = await db.from('subathon_state').select('*').eq('broadcaster_id', uid).single()
  return NextResponse.json(data ?? null)
}
