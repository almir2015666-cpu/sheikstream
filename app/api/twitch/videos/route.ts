import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const from = url.searchParams.get('from') ?? ''
  const to = url.searchParams.get('to') ?? ''

  const db = getSupabaseAdmin()
  const { data: tokenRow } = await db
    .from('user_tokens')
    .select('twitch_token, twitch_channel_id')
    .eq('user_id', user.id)
    .single()

  if (!tokenRow?.twitch_token) {
    return NextResponse.json({ error: 'Conta Twitch não conectada' }, { status: 400 })
  }

  const broadcasterId = tokenRow.twitch_channel_id || user.id
  const clientId = process.env.TWITCH_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 })

  // Fetch past broadcasts from Twitch (up to 100)
  const helix = new URL('https://api.twitch.tv/helix/videos')
  helix.searchParams.set('broadcaster_id', broadcasterId)
  helix.searchParams.set('type', 'archive')
  helix.searchParams.set('first', '100')
  helix.searchParams.set('sort', 'time')

  const res = await fetch(helix.toString(), {
    headers: {
      Authorization: `Bearer ${tokenRow.twitch_token}`,
      'Client-Id': clientId,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (res.status === 401) {
      return NextResponse.json({ error: 'Token Twitch expirado — reconecte em Conexões' }, { status: 401 })
    }
    return NextResponse.json({ error: err?.message || 'Erro ao buscar transmissões' }, { status: res.status })
  }

  const { data: videos } = await res.json()

  // Filter by date range if provided
  let filtered = (videos ?? []) as {
    id: string; title: string; url: string; created_at: string
    duration: string; view_count: number; thumbnail_url: string
  }[]

  if (from) {
    filtered = filtered.filter(v => v.created_at >= from)
  }
  if (to) {
    const toEnd = to + 'T23:59:59Z'
    filtered = filtered.filter(v => v.created_at <= toEnd)
  }

  return NextResponse.json(filtered)
}
