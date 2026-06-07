import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const db = getSupabaseAdmin()
  const updates: Record<string, unknown> = {}

  if (body.title !== undefined) updates.title = body.title
  if (body.current_value !== undefined) updates.current_value = Number(body.current_value)
  if (body.target_value !== undefined) updates.target_value = Number(body.target_value)
  if (body.status !== undefined) updates.status = body.status

  const { data, error } = await db.from('metas').update(updates).eq('id', id).eq('broadcaster_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { error } = await db.from('metas').delete().eq('id', id).eq('broadcaster_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
