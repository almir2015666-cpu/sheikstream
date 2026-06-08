import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subject, message, reply_email, username } = body
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Assunto e mensagem são obrigatórios' }, { status: 400 })
    }
    const ua = req.headers.get('user-agent') ?? 'unknown'
    const { error } = await getSupabaseAdmin().from('support_tickets').insert({
      subject: subject.slice(0, 200),
      message: message.slice(0, 2000),
      reply_email: reply_email?.slice(0, 200) || null,
      username: username?.slice(0, 100) || null,
      user_agent: ua,
      status: 'open',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
