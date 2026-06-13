import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('agenda')
      .select('*')
      .eq('user_id', user.id)
      .order('day_of_week', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { title, day_of_week, start_time, duration_min, platforms, is_recurring } = body
    if (!title || day_of_week == null || !start_time) {
      return NextResponse.json({ error: 'Campos obrigatórios: title, day_of_week, start_time' }, { status: 400 })
    }
    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('agenda')
      .insert({
        user_id: user.id,
        title: String(title),
        day_of_week: Number(day_of_week),
        start_time: String(start_time),
        duration_min: Math.max(1, Number(duration_min ?? 60)),
        platforms: Array.isArray(platforms) ? platforms : [],
        is_recurring: Boolean(is_recurring ?? true),
        is_active: true,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const db = getSupabaseAdmin()
    const { data, error } = await db
      .from('agenda')
      .update(rest)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const db = getSupabaseAdmin()
    const { error } = await db.from('agenda').delete().eq('id', id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
