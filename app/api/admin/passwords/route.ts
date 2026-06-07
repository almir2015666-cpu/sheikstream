import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? '')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('admin_passwords')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? '')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const label = (body.label || '').trim()
  if (!label) return NextResponse.json({ error: 'Nome/label obrigatório' }, { status: 400 })
  const type = body.type === 'permanent' ? 'permanent' : 'temporary'
  const password = body.password?.trim() || crypto.randomBytes(8).toString('hex')
  const expiresAt = type === 'temporary' && body.expires_hours
    ? new Date(Date.now() + Number(body.expires_hours) * 3600 * 1000).toISOString()
    : null
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('admin_passwords').insert({
    label,
    password,
    type,
    expires_at: expiresAt,
    active: true,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? '')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  const db = getSupabaseAdmin()
  await db.from('admin_passwords').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? '')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  const db = getSupabaseAdmin()
  await db.from('admin_passwords').update({ active: body.active }).eq('id', body.id)
  return NextResponse.json({ ok: true })
}
