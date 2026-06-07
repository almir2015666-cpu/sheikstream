import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('banners')
    .select('*')
    .eq('broadcaster_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.nome?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('banners').insert({
    broadcaster_id: user.id,
    nome: body.nome.trim(),
    imgs: body.imgs ?? [],
    etiqueta: body.etiqueta ?? false,
    cooldown: body.cooldown ?? 5,
    intervalo_aleatorio: body.intervalo_aleatorio ?? false,
    transicao_saida: body.transicao_saida ?? 'Fade Out',
    vis: body.vis ?? {},
    habilitado: body.vis?.habilitado ?? true,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
