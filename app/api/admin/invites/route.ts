import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()

  const { data: invites, error: invErr } = await db
    .from('invites')
    .select('*')
    .order('created_at', { ascending: false })

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

  // Try selecting invite_quota — column may not exist yet
  let quotas: { user_id: string; username: string; quota: number }[] = []
  const { data: tokensWithQuota, error: quotaErr } = await db
    .from('user_tokens')
    .select('user_id, twitch_username, invite_quota')

  if (!quotaErr && tokensWithQuota) {
    quotas = tokensWithQuota.map(t => ({
      user_id: t.user_id,
      username: t.twitch_username ?? t.user_id,
      quota: (t as Record<string, unknown>).invite_quota as number ?? 0,
    }))
  } else {
    // Column doesn't exist yet — still show users with quota 0
    const { data: tokensBasic } = await db
      .from('user_tokens')
      .select('user_id, twitch_username')
    quotas = (tokensBasic ?? []).map(t => ({
      user_id: t.user_id,
      username: t.twitch_username ?? t.user_id,
      quota: 0,
    }))
  }

  return NextResponse.json({ invites: invites ?? [], quotas })
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
    if (error) {
      // Column likely doesn't exist — return helpful message
      return NextResponse.json({
        error: 'Coluna invite_quota não existe em user_tokens. Execute no Supabase SQL Editor: ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS invite_quota integer DEFAULT 0;',
      }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
}
