import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const uid = req.nextUrl.searchParams.get('uid')
  if (uid) return uid
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)?.id ?? null
}

export async function GET(req: NextRequest) {
  const userId = await resolveUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data: tokenRow } = await db
    .from('user_tokens')
    .select('twitch_token, twitch_channel_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!tokenRow?.twitch_token) {
    return NextResponse.json({ error: 'Conta Twitch não conectada' }, { status: 400 })
  }

  const clientId = process.env.TWITCH_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 })

  const headers = {
    Authorization: `Bearer ${tokenRow.twitch_token}`,
    'Client-Id': clientId,
  }

  let broadcasterId = tokenRow.twitch_channel_id
  if (!broadcasterId) {
    const usersRes = await fetch('https://api.twitch.tv/helix/users', { headers })
    if (usersRes.ok) {
      const ud = await usersRes.json()
      broadcasterId = ud.data?.[0]?.id ?? null
      if (broadcasterId) {
        await db.from('user_tokens').update({ twitch_channel_id: broadcasterId }).eq('user_id', userId)
      }
    }
  }

  if (!broadcasterId) return NextResponse.json({ error: 'Canal Twitch não identificado' }, { status: 400 })

  const after = req.nextUrl.searchParams.get('after') // ISO timestamp to filter newer clips
  const url = new URL('https://api.twitch.tv/helix/clips')
  url.searchParams.set('broadcaster_id', broadcasterId)
  url.searchParams.set('first', '5')
  if (after) url.searchParams.set('started_at', after)

  const res = await fetch(url.toString(), { headers })
  if (!res.ok) {
    if (res.status === 401) return NextResponse.json({ error: 'Token expirado' }, { status: 401 })
    return NextResponse.json({ error: 'Erro ao buscar clipes' }, { status: res.status })
  }

  const { data } = await res.json()
  return NextResponse.json({ clips: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}
