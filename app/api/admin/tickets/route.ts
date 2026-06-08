import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data } = await getSupabaseAdmin()
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, status, admin_reply } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const db = getSupabaseAdmin()

    // Fetch ticket for email info before updating
    const { data: ticket } = await db
      .from('support_tickets')
      .select('reply_email, subject, username')
      .eq('id', id)
      .maybeSingle()

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) update.status = status
    if (admin_reply !== undefined) update.admin_reply = admin_reply
    const { error } = await db.from('support_tickets').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Send email reply if there's a reply and a destination email
    if (admin_reply?.trim() && ticket?.reply_email) {
      const key = process.env.RESEND_API_KEY
      const from = process.env.RESEND_FROM_EMAIL || 'SheikSTREAM <onboarding@resend.dev>'
      if (key) {
        const html = `
          <div style="font-family:-apple-system,sans-serif;max-width:580px;margin:0 auto;padding:32px;background:#08090d;border-radius:16px;color:#e8e6f8">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
              <span style="font-size:1.4rem;font-weight:900;color:#9b30ff">Sheik</span>
              <span style="font-size:1.4rem;font-weight:900;color:#e8e6f8">STREAM</span>
            </div>
            <h2 style="margin:0 0 12px;font-size:1.1rem;font-weight:700;color:#e8e6f8">Resposta ao seu ticket</h2>
            <p style="margin:0 0 6px;font-size:0.82rem;color:rgba(232,230,248,0.45)">Ticket: ${ticket.subject ?? 'Suporte'}</p>
            <div style="margin:20px 0;padding:18px;background:#111219;border-radius:10px;border-left:3px solid #9b30ff;font-size:0.9rem;line-height:1.7;color:#e8e6f8;white-space:pre-wrap">${admin_reply.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
            <p style="font-size:0.78rem;color:rgba(232,230,248,0.3);margin-top:28px">Para responder ou abrir novo ticket, acesse nossa plataforma.</p>
          </div>
        `
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: [ticket.reply_email], subject: `Re: ${ticket.subject ?? 'Ticket de suporte'} — SheikSTREAM`, html }),
        }).catch(() => {})
      }
    }

    return NextResponse.json({ ok: true, email_sent: !!(admin_reply?.trim() && ticket?.reply_email && process.env.RESEND_API_KEY) })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const { error } = await getSupabaseAdmin().from('support_tickets').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
