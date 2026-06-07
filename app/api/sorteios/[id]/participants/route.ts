import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username, tickets } = await req.json()
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const db = getSupabaseAdmin()

  // Verify ownership
  const { data: sorteio } = await db.from('sorteios').select('id').eq('id', id).eq('broadcaster_id', user.id).single()
  if (!sorteio) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await db
    .from('sorteio_participants')
    .upsert(
      { sorteio_id: id, username: username.trim(), tickets: Number(tickets ?? 1) },
      { onConflict: 'sorteio_id,username', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
