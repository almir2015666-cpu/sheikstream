import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('metas')
    .select('*')
    .eq('broadcaster_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, type, current_value, target_value } = await req.json()
  if (!title || !type || target_value == null) {
    return NextResponse.json({ error: 'title, type, target_value required' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('metas')
    .insert({
      broadcaster_id: user.id,
      title,
      type,
      current_value: Number(current_value ?? 0),
      target_value: Number(target_value),
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
