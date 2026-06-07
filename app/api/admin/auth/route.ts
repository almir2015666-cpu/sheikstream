import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (!password) return NextResponse.json({ ok: false, error: 'Senha obrigatória' }, { status: 400 })
  const ok = await isAdminPassword(password)
  if (ok) return NextResponse.json({ ok: true })
  return NextResponse.json({ ok: false, error: 'Senha incorreta' }, { status: 401 })
}
