import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const BROADCASTER = '_global_'
const TYPE = 'custom_groups'

type Group = { id: string; name: string; color: string }

async function getGroups() {
  const { data } = await getSupabaseAdmin()
    .from('overlay_configs').select('config')
    .eq('broadcaster_id', BROADCASTER).eq('type', TYPE).single()
  return (data?.config?.groups ?? []) as Group[]
}

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? '')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return NextResponse.json({ groups: await getGroups() })
}

export async function POST(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? '')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { name, color } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name obrigatório' }, { status: 400 })
  const groups = await getGroups()
  const id = name.trim().toLowerCase().replace(/\s+/g, '-')
  if (groups.some(g => g.id === id)) return NextResponse.json({ error: 'Grupo já existe' }, { status: 409 })
  const newGroup: Group = { id, name: name.trim(), color: color || '#9b30ff' }
  const updated = [...groups, newGroup]
  await getSupabaseAdmin().from('overlay_configs').upsert({
    broadcaster_id: BROADCASTER, type: TYPE,
    config: { groups: updated }, updated_at: new Date().toISOString(),
  }, { onConflict: 'broadcaster_id,type' })
  return NextResponse.json({ groups: updated })
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? '')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const groups = (await getGroups()).filter(g => g.id !== id)
  await getSupabaseAdmin().from('overlay_configs').upsert({
    broadcaster_id: BROADCASTER, type: TYPE,
    config: { groups }, updated_at: new Date().toISOString(),
  }, { onConflict: 'broadcaster_id,type' })
  return NextResponse.json({ groups })
}
