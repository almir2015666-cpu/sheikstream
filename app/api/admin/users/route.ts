import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function checkAuth(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  return pw === process.env.ADMIN_PASSWORD
}

async function sendApprovalEmail(email: string, username: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !email) return
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? 'SheikSTREAM <onboarding@resend.dev>',
        to: [email],
        subject: 'Seu acesso ao SheikSTREAM foi aprovado!',
        html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#08090d;font-family:-apple-system,'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#08090d;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0f1018;border-radius:16px;border:1px solid rgba(155,48,255,0.25);overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a0a2e,#0d0515);padding:32px;text-align:center;border-bottom:1px solid rgba(155,48,255,0.2);">
            <p style="margin:0;font-size:22px;font-weight:900;color:#f0eefc;letter-spacing:0.5px;">
              Sheik<span style="color:#39ff14;">STREAM</span>
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;text-align:center;">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(57,255,20,0.12);border:2px solid rgba(57,255,20,0.3);display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:24px;">✅</div>
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#f0eefc;">Acesso aprovado!</h1>
            <p style="margin:0 0 8px;font-size:15px;color:rgba(240,238,252,0.6);line-height:1.6;">
              Olá, <strong style="color:#f0eefc;">${username}</strong>!
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:rgba(240,238,252,0.6);line-height:1.6;">
              Seu acesso ao SheikSTREAM foi aprovado. Agora você pode entrar na plataforma usando sua conta da Twitch.
            </p>
            <a href="https://sheikstream.vercel.app/login"
               style="display:inline-block;background:linear-gradient(135deg,#9b30ff,#7b1fff);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
              Entrar agora →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;text-align:center;border-top:1px solid rgba(155,48,255,0.1);">
            <p style="margin:0;font-size:12px;color:rgba(240,238,252,0.25);">
              SheikSTREAM · sheikstream.vercel.app
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }),
    })
  } catch {
    // Email failure is non-critical — approval still succeeds
  }
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message, hint: error.hint }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, status } = await req.json()
    if (!['approved', 'rejected', 'banned'].includes(status))
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('waitlist')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (status === 'approved' && data?.email) {
      await sendApprovalEmail(data.email, data.platform_username ?? 'streamer')
    }
    try {
      await db.from('admin_logs').insert({
        action: status,
        target_username: data?.platform_username ?? null,
        target_platform: data?.platform ?? null,
      })
    } catch { /* log failure is non-critical */ }
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
