import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import { registerEventSubSubscriptions, registerChatSubscription } from '@/app/lib/eventsub'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? decodeSession(token) : null
}

const DEFAULT_EVENT_COMMANDS = [
  { trigger: 'event:twitch:follow',  resposta: 'Obrigado pelo follow, $user! Bem-vindo(a) à comunidade!' },
  { trigger: 'event:twitch:sub',     resposta: 'Muito obrigado pela sub, $user! Tier: $tier. Você ganhou $tickets ticket(s)!' },
  { trigger: 'event:twitch:resub',   resposta: '$user está no canal há $months meses! Valeu demais pela resub!' },
  { trigger: 'event:twitch:giftsub', resposta: 'Que generoso, $user! Obrigado pelos $count gift subs!' },
  { trigger: 'event:twitch:bits',    resposta: 'Valeu pelos $valor bits, $user! $msg' },
]

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const results: Record<string, unknown> = {}

  // 1. Re-register EventSub subscriptions with app token
  try {
    await registerEventSubSubscriptions(user.id)
    results.eventsub = 're-registered'
  } catch (e) {
    results.eventsub = `error: ${e}`
  }

  // 2. Re-register chat + follow subscription with user token (if token exists)
  const { data: tok } = await db
    .from('user_tokens')
    .select('twitch_token')
    .eq('user_id', user.id)
    .single()

  if (tok?.twitch_token) {
    try {
      await registerChatSubscription(user.id, tok.twitch_token)
      results.chatSub = 're-registered'
    } catch (e) {
      results.chatSub = `error: ${e}`
    }
  } else {
    results.chatSub = 'skipped: no token'
  }

  // 3. Seed missing event commands
  const seeded: string[] = []
  const skipped: string[] = []

  for (const cmd of DEFAULT_EVENT_COMMANDS) {
    const { data: existing } = await db
      .from('comandos')
      .select('id')
      .eq('user_id', user.id)
      .eq('trigger', cmd.trigger)
      .maybeSingle()

    if (!existing) {
      const { error } = await db.from('comandos').insert({
        user_id: user.id,
        trigger: cmd.trigger,
        resposta: cmd.resposta,
        cooldown_s: 0,
        habilitado: true,
        permissao: 'todos',
        platform: 'Twitch',
        notif_overlay: false,
      })
      if (!error) seeded.push(cmd.trigger)
      else skipped.push(`${cmd.trigger}: ${error.message}`)
    } else {
      skipped.push(`${cmd.trigger} (already exists)`)
    }
  }

  results.commandsSeeded = seeded
  results.commandsSkipped = skipped

  return NextResponse.json({ ok: true, ...results })
}
