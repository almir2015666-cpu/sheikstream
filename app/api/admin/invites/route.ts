import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()

  // Fetch all invites
  const { data: invites, error: invErr } = await db.from('invites').select('*').order('created_at', { ascending: false })
  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

  // Fetch approved waitlist users — try with invite_quota first, fall back without
  let waitlist: { id: string; platform_username: string; invite_quota?: number }[] = []
  try {
    const { data, error } = await db.from('waitlist').select('id,platform_username,invite_quota').eq('status', 'approved').order('platform_username', { ascending: true })
    if (!error) {
      waitlist = data ?? []
    } else if (error.code === '42703') {
      // invite_quota column doesn't exist yet — fetch without it
      const { data: d2 } = await db.from('waitlist').select('id,platform_username').eq('status', 'approved').order('platform_username', { ascending: true })
      waitlist = (d2 ?? []).map(u => ({ ...u, invite_quota: 0 }))
    }
  } catch { /* ignore */ }

  // Try to look up Twitch IDs (inviter_id) for each invite via user_tokens
  let tokenMap: Record<string, string> = {} // user_id → twitch_username
  try {
    const { data: tokens } = await db.from('user_tokens').select('user_id, twitch_username')
    if (tokens) {
      for (const t of tokens) {
        if (t.user_id && t.twitch_username) tokenMap[t.user_id] = t.twitch_username
      }
    }
  } catch { /* user_tokens may not exist */ }

  const quotas = waitlist.map(u => ({
    platform_username: u.platform_username,
    quota: (u as Record<string, unknown>).invite_quota as number ?? 0,
  }))

  // Enrich invites with username from tokenMap
  const enrichedInvites = (invites ?? []).map(i => ({
    ...i,
    inviter_username: tokenMap[i.inviter_id] ?? i.inviter_id,
  }))

  return NextResponse.json({ invites: enrichedInvites, quotas })
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

  // Set invite quota for a waitlist user by platform_username
  if (body.platform_username !== undefined && body.quota !== undefined) {
    const { error } = await db
      .from('waitlist')
      .update({ invite_quota: Number(body.quota) })
      .ilike('platform_username', body.platform_username)
      .eq('status', 'approved')
    if (error) {
      if (error.code === '42703') {
        return NextResponse.json({
          error: 'Coluna invite_quota não existe em waitlist. Execute no Supabase SQL Editor: ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS invite_quota integer DEFAULT 0;',
        }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
}
