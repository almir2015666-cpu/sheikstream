import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data: sorteio } = await db.from('sorteios').select('id,status').eq('id', id).eq('broadcaster_id', user.id).single()
  if (!sorteio) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: participants } = await db.from('sorteio_participants').select('username,tickets').eq('sorteio_id', id)
  if (!participants?.length) return NextResponse.json({ error: 'Nenhum participante' }, { status: 400 })

  // Weighted random selection
  const pool: string[] = []
  for (const p of participants) {
    for (let i = 0; i < (p.tickets ?? 1); i++) pool.push(p.username)
  }
  const winner = pool[Math.floor(Math.random() * pool.length)]

  await db.from('sorteios').update({
    winner_username: winner,
    status: 'finished',
    ended_at: new Date().toISOString(),
  }).eq('id', id)

  return NextResponse.json({ winner, total_participants: participants.length })
}
