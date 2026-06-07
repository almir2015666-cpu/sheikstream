import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? '')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('user_roles').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? '')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { user_id, role } = await req.json()
  if (!user_id || !role) return NextResponse.json({ error: 'user_id e role são obrigatórios' }, { status: 400 })
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('user_roles')
    .upsert({ user_id, role }, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? '')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const user_id = new URL(req.url).searchParams.get('user_id')
  if (!user_id) return NextResponse.json({ error: 'user_id obrigatório' }, { status: 400 })
  const db = getSupabaseAdmin()
  await db.from('user_roles').delete().eq('user_id', user_id)
  return NextResponse.json({ ok: true })
}
