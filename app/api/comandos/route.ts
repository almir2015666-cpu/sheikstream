import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

function isEventTrigger(t: string) {
  return t.startsWith('event:') || t.startsWith('donation:')
}

async function ensureUsuario(userId: string, name: string, email: string, image: string) {
  try {
    await getSupabaseAdmin()
      .from('usuarios')
      .upsert({ id: userId, nome: name, email, imagem: image, atualizado_em: new Date().toISOString() }, { onConflict: 'id' })
  } catch { /* non-fatal */ }
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getSupabaseAdmin()
    .from('comandos')
    .select('*')
    .eq('user_id', user.id)
    .order('criado_em', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const trigger  = (body.trigger ?? '').trim().replace(/^\!/, '')
  const resposta = (body.resposta ?? '').trim()
  if (!trigger || !resposta) return NextResponse.json({ error: 'trigger e resposta são obrigatórios' }, { status: 400 })

  await ensureUsuario(user.id, user.name, user.email ?? '', user.image ?? '')

  const db = getSupabaseAdmin()

  // UPDATE if real id provided
  if (body.id) {
    const { data, error } = await db
      .from('comandos')
      .update({
        trigger,
        resposta,
        cooldown_s: body.cooldown_s ?? 0,
        habilitado: body.habilitado ?? true,
        permissao:  body.permissao  ?? 'todos',
        platform:   body.platform   ?? 'Twitch',
      })
      .eq('id', body.id)
      .eq('user_id', user.id)
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // For event/donation triggers: upsert by (user_id, trigger) to avoid duplicates
  if (isEventTrigger(trigger)) {
    const { data: existing } = await db
      .from('comandos')
      .select('id')
      .eq('user_id', user.id)
      .eq('trigger', trigger)
      .maybeSingle()

    if (existing) {
      const { data, error } = await db
        .from('comandos')
        .update({
          resposta,
          cooldown_s: body.cooldown_s ?? 0,
          habilitado: body.habilitado ?? true,
          permissao:  body.permissao  ?? 'todos',
          platform:   body.platform   ?? 'Twitch',
        })
        .eq('id', existing.id)
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }
  }

  // INSERT
  const { data, error } = await db
    .from('comandos')
    .insert({
      user_id:    user.id,
      trigger,
      resposta,
      cooldown_s: body.cooldown_s ?? 0,
      habilitado: body.habilitado ?? true,
      permissao:  body.permissao  ?? 'todos',
      platform:   body.platform   ?? 'Twitch',
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates = await req.json()
  const { data, error } = await getSupabaseAdmin()
    .from('comandos')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await getSupabaseAdmin()
    .from('comandos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
