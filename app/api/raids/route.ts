import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

// SQL to create table (run once in Supabase):
// CREATE TABLE raid_history (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id text NOT NULL,
//   raid_type text NOT NULL,  -- 'incoming' | 'outgoing'
//   partner_name text NOT NULL,
//   partner_image text,
//   viewer_count integer DEFAULT 0,
//   notes text,
//   occurred_at timestamptz DEFAULT now()
// );
// CREATE INDEX ON raid_history(user_id, occurred_at DESC);

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await getSupabaseAdmin()
    .from('raid_history')
    .select('*')
    .eq('user_id', user.id)
    .order('occurred_at', { ascending: false })
    .limit(100)

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { raid_type, partner_name, partner_image, viewer_count, notes, occurred_at } = body

  if (!raid_type || !['incoming', 'outgoing'].includes(raid_type))
    return NextResponse.json({ error: 'raid_type deve ser incoming ou outgoing' }, { status: 400 })
  if (!partner_name?.trim())
    return NextResponse.json({ error: 'partner_name obrigatório' }, { status: 400 })

  const { data, error } = await getSupabaseAdmin()
    .from('raid_history')
    .insert({
      user_id: user.id,
      raid_type,
      partner_name: partner_name.trim(),
      partner_image: partner_image?.trim() ?? null,
      viewer_count: Number(viewer_count) || 0,
      notes: notes?.trim() ?? null,
      occurred_at: occurred_at || new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await getSupabaseAdmin()
    .from('raid_history')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
