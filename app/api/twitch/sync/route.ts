import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const db = getSupabaseAdmin()

  // Get stored Twitch token
  const { data: tokenRow } = await db
    .from('user_tokens')
    .select('twitch_token, twitch_channel_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!tokenRow?.twitch_token) {
    return NextResponse.json({ error: 'Conta Twitch não conectada. Vá em Conexões e conecte sua conta Twitch.' }, { status: 400 })
  }

  const clientId = process.env.TWITCH_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 })

  const broadcasterId = tokenRow.twitch_channel_id || user.id

  // Fetch subs from Twitch Helix API (paginated)
  const allSubs: { user_name: string; tier: string; is_gift: boolean; gifter_name?: string }[] = []
  let cursor: string | null = null

  try {
    do {
      const url = new URL('https://api.twitch.tv/helix/subscriptions')
      url.searchParams.set('broadcaster_id', broadcasterId)
      url.searchParams.set('first', '100')
      if (cursor) url.searchParams.set('after', cursor)

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${tokenRow.twitch_token}`,
          'Client-Id': clientId,
        },
      })

      if (res.status === 401) {
        return NextResponse.json({ error: 'Token Twitch expirado. Reconecte sua conta em Conexões.' }, { status: 401 })
      }
      if (res.status === 403) {
        return NextResponse.json({ error: 'Canal não é Parceiro ou Afiliado da Twitch. Apenas Parceiros e Afiliados podem ver a lista de inscritos.' }, { status: 403 })
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        return NextResponse.json({ error: body?.message || 'Erro ao buscar inscritos da Twitch' }, { status: 502 })
      }

      const json = await res.json()
      const subs = json.data ?? []
      allSubs.push(...subs)
      cursor = json.pagination?.cursor ?? null
    } while (cursor && allSubs.length < 2000)
  } catch {
    return NextResponse.json({ error: 'Falha de conexão com a Twitch. Tente novamente.' }, { status: 502 })
  }

  // Upsert into twitch_subs table (skip broadcaster themselves)
  const today = new Date().toISOString().split('T')[0]
  let inserted = 0

  for (const sub of allSubs) {
    if (sub.user_name?.toLowerCase() === user.name?.toLowerCase()) continue
    const tier = sub.tier === '1000' ? 'tier1' : sub.tier === '2000' ? 'tier2' : sub.tier === '3000' ? 'tier3' : 'tier1'
    const { data: existing } = await db
      .from('twitch_subs')
      .select('id')
      .eq('broadcaster_id', user.id)
      .ilike('username', sub.user_name)
      .single()

    if (!existing) {
      await db.from('twitch_subs').insert({
        broadcaster_id: user.id,
        username: sub.user_name,
        tier,
        is_gift: sub.is_gift ?? false,
        gifted_by: sub.gifter_name || null,
        tickets: 1,
        date: today,
      })
      inserted++
    }
  }

  return NextResponse.json({ ok: true, total: allSubs.length, inserted, message: `${allSubs.length} inscritos encontrados, ${inserted} novos adicionados.` })
}
