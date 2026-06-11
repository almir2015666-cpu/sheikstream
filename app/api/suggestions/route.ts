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

  // Send thank-you email
  if (user.email) {
    const key = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM_EMAIL
    if (key && from) {
      const isBug = type === 'bug'
      const typeLabel = isBug ? 'reporte de bug' : 'sugestão'
      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#08090d;border-radius:18px;overflow:hidden;color:#e8e6f8">
          <div style="padding:28px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.07)">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:1.5rem;font-weight:900;letter-spacing:-0.5px;color:#9b30ff">Sheik</span><span style="font-size:1.5rem;font-weight:900;letter-spacing:-0.5px;color:#e8e6f8">STREAM</span>
            </div>
          </div>
          <div style="padding:32px">
            <div style="font-size:2rem;margin-bottom:16px">${isBug ? '🐛' : '💡'}</div>
            <h1 style="margin:0 0 10px;font-size:1.2rem;font-weight:800;color:#e8e6f8">Obrigado pelo seu ${typeLabel}!</h1>
            <p style="margin:0 0 20px;font-size:0.9rem;line-height:1.7;color:rgba(232,230,248,0.6)">
              Olá, <strong style="color:#e8e6f8">${user.name}</strong>! Recebemos sua mensagem e já está na nossa fila de análise.
            </p>
            <div style="background:#111219;border-radius:12px;border:1px solid rgba(155,48,255,0.2);padding:20px;margin-bottom:24px">
              <div style="font-size:0.7rem;font-weight:700;color:#9b30ff;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">Sua mensagem</div>
              <div style="font-size:0.88rem;line-height:1.7;color:rgba(232,230,248,0.75);white-space:pre-wrap">${message.slice(0, 500).replace(/</g,'&lt;').replace(/>/g,'&gt;')}${message.length > 500 ? '…' : ''}</div>
            </div>
            <p style="margin:0;font-size:0.88rem;line-height:1.7;color:rgba(232,230,248,0.6)">
              Nossa equipe vai analisar e, se precisar de mais detalhes, responderemos diretamente neste e-mail. Contribuições como a sua ajudam a tornar a plataforma cada vez melhor! 💜
            </p>
          </div>
          <div style="padding:18px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
            <p style="margin:0;font-size:0.72rem;color:rgba(232,230,248,0.25)">SheikSTREAM · sheikstream.com.br</p>
          </div>
        </div>
      `
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from,
            to: [user.email],
            subject: `Recebemos sua ${typeLabel}! — SheikSTREAM`,
            html,
          }),
        })
        if (!emailRes.ok) {
          const ed = await emailRes.json().catch(() => ({}))
          console.error('[suggestions] Resend error:', ed)
        }
      } catch (e) {
        console.error('[suggestions] Resend fetch error:', e)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
