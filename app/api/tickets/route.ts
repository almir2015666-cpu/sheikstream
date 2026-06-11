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

    // Send thank-you email if the user provided an email
    if (reply_email?.trim()) {
      const key = process.env.RESEND_API_KEY
      const from = process.env.RESEND_FROM_EMAIL
      if (key && from) {
        const name = username?.trim() || 'você'
        const isBug = /bug|erro|problema|falha|crash/i.test(subject)
        const typeLabel = isBug ? 'reporte de bug' : 'sugestão'
        const html = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#08090d;border-radius:18px;overflow:hidden;color:#e8e6f8">
            <!-- Header -->
            <div style="padding:28px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.07)">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:1.5rem;font-weight:900;letter-spacing:-0.5px;color:#9b30ff">Sheik</span><span style="font-size:1.5rem;font-weight:900;letter-spacing:-0.5px;color:#e8e6f8">STREAM</span>
              </div>
            </div>
            <!-- Body -->
            <div style="padding:32px">
              <div style="font-size:2rem;margin-bottom:16px">🙏</div>
              <h1 style="margin:0 0 10px;font-size:1.2rem;font-weight:800;color:#e8e6f8">Obrigado pelo seu ${typeLabel}!</h1>
              <p style="margin:0 0 20px;font-size:0.9rem;line-height:1.7;color:rgba(232,230,248,0.6)">
                Olá${name !== 'você' ? `, <strong style="color:#e8e6f8">${name}</strong>` : ''}! Recebemos sua mensagem sobre <strong style="color:#e8e6f8">"${subject.slice(0, 80)}"</strong> e já está na nossa fila de análise.
              </p>
              <div style="background:#111219;border-radius:12px;border:1px solid rgba(155,48,255,0.2);padding:20px;margin-bottom:24px">
                <div style="font-size:0.7rem;font-weight:700;color:#9b30ff;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">Sua mensagem</div>
                <div style="font-size:0.88rem;line-height:1.7;color:rgba(232,230,248,0.75);white-space:pre-wrap">${message.slice(0, 500).replace(/</g,'&lt;').replace(/>/g,'&gt;')}${message.length > 500 ? '…' : ''}</div>
              </div>
              <p style="margin:0 0 6px;font-size:0.88rem;line-height:1.7;color:rgba(232,230,248,0.6)">
                Nossa equipe vai analisar e, se precisar de mais detalhes, responderemos diretamente neste e-mail. Contribuições como a sua ajudam a tornar a plataforma cada vez melhor! 💜
              </p>
            </div>
            <!-- Footer -->
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
              to: [reply_email.trim()],
              subject: `Recebemos sua ${typeLabel}! — SheikSTREAM`,
              html,
            }),
          })
          if (!emailRes.ok) {
            const ed = await emailRes.json().catch(() => ({}))
            console.error('[tickets] Resend error:', ed)
          }
        } catch (e) {
          console.error('[tickets] Resend fetch error:', e)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
