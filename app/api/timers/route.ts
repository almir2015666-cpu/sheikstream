import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('timers')
      .select(`
        *,
        timer_logs (
          id, plataforma, status, erro, created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { nome, mensagem, intervalo_minutos, min_mensagens, plataformas, tipo_saida, ativo } = body

    if (!nome || !mensagem || !intervalo_minutos) {
      return NextResponse.json({ error: 'Campos obrigatórios: nome, mensagem, intervalo_minutos' }, { status: 400 })
    }

    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('timers')
      .insert({
        user_id: user.id,
        nome: String(nome),
        mensagem: String(mensagem),
        intervalo_minutos: Math.max(1, Number(intervalo_minutos)),
        min_mensagens: Math.max(0, Number(min_mensagens ?? 0)),
        plataformas: Array.isArray(plataformas) ? plataformas : [],
        tipo_saida: String(tipo_saida ?? 'chat'),
        ativo: Boolean(ativo ?? true),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
