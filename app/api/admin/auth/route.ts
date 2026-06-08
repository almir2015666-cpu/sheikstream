import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (!password) return NextResponse.json({ ok: false, error: 'Senha obrigatória' }, { status: 400 })
  const ok = await isAdminPassword(password)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
  const ua = req.headers.get('user-agent') ?? 'unknown'
  void getSupabaseAdmin().from('admin_login_logs').insert({ ip, user_agent: ua, success: ok })
  if (ok) return NextResponse.json({ ok: true })
  return NextResponse.json({ ok: false, error: 'Senha incorreta' }, { status: 401 })
}
