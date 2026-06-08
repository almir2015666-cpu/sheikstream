import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()

  const [{ data: invites, error: invErr }, { data: tokens }] = await Promise.all([
    db.from('invites').select('*').order('created_at', { ascending: false }),
    db.from('user_tokens').select('user_id, twitch_username, invite_quota'),
  ])

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

  return NextResponse.json({
    invites: invites ?? [],
    quotas: (tokens ?? []).map(t => ({
      user_id: t.user_id,
      username: t.twitch_username ?? t.user_id,
      quota: t.invite_quota ?? 0,
    })),
  })
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const db = getSupabaseAdmin()

  // Veto a pending invite
  if (body.invite_id) {
    const { error } = await db
      .from('invites')
      .update({ status: 'vetado' })
      .eq('id', body.invite_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Set invite quota for a user
  if (body.user_id !== undefined && body.quota !== undefined) {
    const { error } = await db
      .from('user_tokens')
      .update({ invite_quota: Number(body.quota) })
      .eq('user_id', body.user_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
}
