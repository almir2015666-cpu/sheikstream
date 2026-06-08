import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import crypto from 'crypto'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

async function getUserQuota(username: string): Promise<number> {
  try {
    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('waitlist')
      .select('invite_quota')
      .ilike('platform_username', username)
      .eq('status', 'approved')
      .maybeSingle()
    if (error) return 0
    return (data as Record<string, unknown> | null)?.invite_quota as number ?? 0
  } catch {
    return 0
  }
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const db = getSupabaseAdmin()
  const [{ data }, quota] = await Promise.all([
    db.from('invites').select('*').eq('inviter_id', user.id).order('created_at', { ascending: false }),
    getUserQuota(user.name),
  ])
  return NextResponse.json({ invites: data ?? [], quota })
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const username = (body.username || '').trim().replace(/^@/, '')
  if (!username) return NextResponse.json({ error: 'Nome de usuário inválido' }, { status: 400 })
  const db = getSupabaseAdmin()

  const [quota, { count }] = await Promise.all([
    getUserQuota(user.name),
    db.from('invites').select('*', { count: 'exact', head: true }).eq('inviter_id', user.id),
  ])

  if (quota <= 0) return NextResponse.json({ error: 'Você não possui convites disponíveis' }, { status: 400 })
  if ((count || 0) >= quota) return NextResponse.json({ error: `Limite de ${quota} convite${quota !== 1 ? 's' : ''} atingido` }, { status: 400 })

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
