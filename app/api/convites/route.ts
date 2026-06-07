import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import crypto from 'crypto'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data } = await db.from('invites').select('*').eq('inviter_id', user.id).order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const username = (body.username || '').trim().replace(/^@/, '')
  if (!username) return NextResponse.json({ error: 'Nome de usuário inválido' }, { status: 400 })
  const db = getSupabaseAdmin()
  const { count } = await db.from('invites').select('*', { count: 'exact', head: true }).eq('inviter_id', user.id)
  if ((count || 0) >= 10) return NextResponse.json({ error: 'Limite de 10 convites atingido' }, { status: 400 })
  const { data: existing } = await db.from('invites').select('id').eq('inviter_id', user.id).eq('invitee_email', username).single()
  if (existing) return NextResponse.json({ error: 'Usuário já foi convidado' }, { status: 400 })
  const token = crypto.randomBytes(12).toString('hex')
  const { data, error } = await db.from('invites').insert({
    inviter_id: user.id,
    invitee_email: username,
    token,
    status: 'pendente',
  }).select().single()
  if (error) return NextResponse.json({ error: 'Erro ao criar convite: ' + error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
