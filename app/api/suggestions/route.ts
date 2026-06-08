import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { type?: string; message?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const { type = 'suggestion', message } = body
  if (!message?.trim()) return NextResponse.json({ error: 'Mensagem obrigatória' }, { status: 400 })

  const subject = type === 'bug'
    ? `🐛 Bug reportado por ${user.name}`
    : `💡 Sugestão de ${user.name}`

  const { error } = await getSupabaseAdmin()
    .from('support_tickets')
    .insert({
      subject,
      message: message.trim(),
      username: user.name,
      reply_email: user.email || null,
      status: 'open',
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
