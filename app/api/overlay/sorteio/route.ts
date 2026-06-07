import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data: sorteios } = await db
    .from('sorteios')
    .select('id,title,type,status,winner_username,started_at')
    .eq('broadcaster_id', uid)
    .in('status', ['active', 'finished'])
    .order('created_at', { ascending: false })
    .limit(1)

  const sorteio = sorteios?.[0] ?? null
  if (!sorteio) return NextResponse.json(null)

  const { count } = await db
    .from('sorteio_participants')
    .select('*', { count: 'exact', head: true })
    .eq('sorteio_id', sorteio.id)

  return NextResponse.json({ ...sorteio, participant_count: count ?? 0 })
}
