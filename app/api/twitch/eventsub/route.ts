import { NextRequest, NextResponse } from 'next/server'
import { verifySignature } from '@/app/lib/eventsub'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import { fireEventCommand } from '@/app/lib/event-commands'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  return new NextResponse(JSON.stringify({ ok: true, endpoint: 'twitch-eventsub', ts: Date.now() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const msgType  = req.headers.get('Twitch-Eventsub-Message-Type') ?? ''
  const msgId    = req.headers.get('Twitch-Eventsub-Message-Id') ?? ''
  const ts       = req.headers.get('Twitch-Eventsub-Message-Timestamp') ?? ''
  const sig      = req.headers.get('Twitch-Eventsub-Message-Signature') ?? ''

  console.log('[eventsub] incoming:', msgType || 'unknown', 'bodyLen:', body.length, 'msgId:', msgId.slice(0, 8))

  // Respond to verification challenge immediately (before any async work)
  if (msgType === 'webhook_callback_verification') {
    try {
      const payload = JSON.parse(body)
      console.log('[eventsub] challenge received — responding')
      return new NextResponse(payload.challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } })
    } catch {
      return new NextResponse('', { status: 200 })
    }
  }

  if (!verifySignature(process.env.TWITCH_WEBHOOK_SECRET ?? 'sheikstream-eventsub-secret-2024', msgId, ts, body, sig)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const payload = JSON.parse(body)

  if (msgType === 'notification') {
    await handleNotification(payload).catch(e => console.error('[eventsub] handler error:', e))
  }

  return new NextResponse(null, { status: 204 })
}

function resolveChatVars(text: string, chatter: string, channel: string, args: string[]): string {
  return text
    .replace(/\$\(user\)/gi, chatter)
    .replace(/\$\(channel\)/gi, channel)
    .replace(/\$\(touser\)/gi, args[0] ?? chatter)
    .replace(/\$\(1\)/g, args[0] ?? '')
    .replace(/\$\(2\)/g, args[1] ?? '')
    .replace(/\$\(3\)/g, args[2] ?? '')
    .trim()
}

function tierLabel(tier: unknown): string {
  return ({ '1000': 'Tier 1', '2000': 'Tier 2', '3000': 'Tier 3' } as Record<string, string>)[String(tier ?? '1000')] ?? 'Tier 1'
}

async function sendChat(broadcasterId: string, message: string): Promise<void> {
  const db = getSupabaseAdmin()
  const { data: tok } = await db.from('user_tokens').select('twitch_token').eq('user_id', broadcasterId).single()
  if (!tok?.twitch_token) return
  await fetch('https://api.twitch.tv/helix/chat/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tok.twitch_token}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ broadcaster_id: broadcasterId, sender_id: broadcasterId, message }),
  })
}

// ── IA Chat ──────────────────────────────────────────────────────────────────

type IaChatCfg = {
  enabled: boolean
  personality: string
  bot_name: string
  response_chance: number
  max_delay: number
  response_size: string
  language: string
  cooldown_user: number
  mention_user: boolean
  ignore_commands: boolean
  reply_to_streamer: boolean
  lurk_mode: boolean
  react_emotes: boolean
  memory: boolean
  words_to_ignore: string
  whitelist: string
  blacklist: string
  channel_context: string
  allowed_topics: string
  forbidden_topics: string
  generated_prompt: string
}

type IaState = { user_cooldowns?: Record<string, string>; global_last_at?: string; last_bot_msgs?: string[] }

const IA_LANGS: Record<string, string> = {
  'pt-BR': 'Português (BR)',
  'en-US': 'English (US)',
  'es': 'Español',
}

function buildSystemPrompt(cfg: IaChatCfg): string {
  const lines: string[] = []
  const name = (cfg.bot_name ?? '').trim() || 'Assistente'
  lines.push(`Você é ${name}, um assistente de chat ao vivo para streamers.`)
  lines.push('')

  if ((cfg.personality ?? '').trim()) {
    lines.push('=== PERSONALIDADE ===')
    lines.push(cfg.personality.trim())
    lines.push('')
  }

  if ((cfg.channel_context ?? '').trim()) {
    lines.push('=== CONTEXTO DO CANAL ===')
    lines.push(cfg.channel_context.trim())
    lines.push('')
  }

  lines.push('=== COMPORTAMENTO ===')
  const sizeLbl = cfg.response_size === 'short' ? '1 linha' : cfg.response_size === 'medium' ? '2-4 linhas' : '5+ linhas'
  lines.push(`- Mantenha respostas com ${sizeLbl}`)
  lines.push(`- Responda em ${IA_LANGS[cfg.language] ?? 'Português (BR)'}`)
  if (cfg.mention_user) lines.push('- Mencione o usuário com @nome quando responder')
  if (cfg.react_emotes) lines.push('- Use emotes e reações quando apropriado para o contexto')
  if (cfg.memory) lines.push('- Considere o histórico da conversa para contextualizar suas respostas')
  if (cfg.lurk_mode) lines.push('- Você está em modo silencioso: responda SOMENTE quando for diretamente mencionado pelo nome')
  if (!cfg.reply_to_streamer) lines.push('- Não responda mensagens do próprio dono do canal')
  if (cfg.ignore_commands) lines.push('- Ignore mensagens que começam com !, / ou ? (são comandos de outros bots)')
  lines.push('')

  if ((cfg.allowed_topics ?? '').trim()) {
    lines.push('=== TÓPICOS PERMITIDOS ===')
    lines.push(cfg.allowed_topics.trim())
    lines.push('')
  }

  if ((cfg.forbidden_topics ?? '').trim()) {
    lines.push('=== TÓPICOS PROIBIDOS ===')
    lines.push(`Nunca aborde: ${cfg.forbidden_topics.trim()}`)
    lines.push('')
  }

  if ((cfg.words_to_ignore ?? '').trim()) {
    lines.push('=== PALAVRAS A IGNORAR ===')
    lines.push(`Ignore mensagens contendo: ${cfg.words_to_ignore.trim()}`)
    lines.push('')
  }

  lines.push('=== REGRAS GERAIS ===')
  lines.push('- Seja natural, animado e autêntico')
  lines.push('- Nunca invente informações')
  lines.push('- Não responda conteúdo ofensivo, preconceituoso ou spam')
  lines.push('- Adapte o tom ao contexto da conversa')
  lines.push('- Resposta máxima: uma mensagem de chat, sem markdown, sem asteriscos, texto puro')

  return lines.join('\n')
}

async function handleIaChat(
  broadcasterId: string,
  event: Record<string, unknown>,
  rawText: string,
  chatter: string,
): Promise<void> {
  console.log('[ia-chat] start — broadcaster:', broadcasterId, 'chatter:', chatter, 'text:', rawText.slice(0, 60))

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[ia-chat] skip: no ANTHROPIC_API_KEY')
    return
  }

  const db = getSupabaseAdmin()

  // Load IA config
  const { data: cfgRow, error: cfgErr } = await db
    .from('overlay_configs')
    .select('config')
    .eq('broadcaster_id', broadcasterId)
    .eq('type', 'ia-chat')
    .maybeSingle()

  if (cfgErr) console.log('[ia-chat] db error:', cfgErr.message)
  if (!cfgRow?.config?.cfg) {
    console.log('[ia-chat] skip: no config found. raw:', JSON.stringify(cfgRow?.config).slice(0, 100))
    return
  }
  const cfg = cfgRow.config.cfg as IaChatCfg
  if (!cfg.enabled) {
    console.log('[ia-chat] skip: disabled')
    return
  }

  // Ignore commands (!, /, ?)
  if (cfg.ignore_commands && /^[!/?]/.test(rawText)) {
    console.log('[ia-chat] skip: ignore_commands')
    return
  }

  // Blacklist
  if (cfg.blacklist) {
    const bl = cfg.blacklist.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    if (bl.includes(chatter.toLowerCase())) {
      console.log('[ia-chat] skip: blacklisted')
      return
    }
  }

  // Whitelist — if populated, only respond to those users
  const wlEntries = (cfg.whitelist ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  const hasWhitelist = wlEntries.length > 0
  if (hasWhitelist && !wlEntries.includes(chatter.toLowerCase())) {
    console.log('[ia-chat] skip: not in whitelist')
    return
  }

  // Words to ignore
  if (cfg.words_to_ignore) {
    const words = cfg.words_to_ignore.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    if (words.some(w => rawText.toLowerCase().includes(w))) {
      console.log('[ia-chat] skip: ignored word')
      return
    }
  }

  // Lurk mode — only respond if bot name is mentioned
  if (cfg.lurk_mode) {
    const botName = (cfg.bot_name ?? '').trim().toLowerCase()
    if (botName && !rawText.toLowerCase().includes(botName)) {
      console.log('[ia-chat] skip: lurk_mode')
      return
    }
  }

  // Cooldown check
  const cooldown = cfg.cooldown_user ?? 30
  const { data: stateRow } = await db
    .from('overlay_configs')
    .select('config')
    .eq('broadcaster_id', broadcasterId)
    .eq('type', 'ia-chat-state')
    .maybeSingle()

  const state = (stateRow?.config ?? {}) as IaState

  // Skip if message is identical to one the bot recently sent (loop prevention)
  if ((state.last_bot_msgs ?? []).some(m => m.toLowerCase() === rawText.toLowerCase())) {
    console.log('[ia-chat] skip: matches recent bot response')
    return
  }

  // Global cooldown — prevent bot from responding multiple times in rapid succession (anti-loop)
  if (state.global_last_at) {
    const elapsed = (Date.now() - new Date(state.global_last_at).getTime()) / 1000
    if (elapsed < Math.max(cooldown, 5)) {
      console.log('[ia-chat] skip: global cooldown', elapsed.toFixed(1))
      return
    }
  }

  if (cooldown > 0) {
    const lastAt = state.user_cooldowns?.[chatter]
    if (lastAt) {
      const elapsed = (Date.now() - new Date(lastAt).getTime()) / 1000
      if (elapsed < cooldown) {
        console.log('[ia-chat] skip: cooldown', elapsed.toFixed(1), '/', cooldown)
        return
      }
    }
  }

  // Response chance (whitelist users always get a response)
  if (!hasWhitelist) {
    const chance = (cfg.response_chance ?? 40) / 100
    const roll = Math.random()
    if (roll > chance) {
      console.log('[ia-chat] skip: chance', roll.toFixed(2), '>', chance)
      return
    }
  }

  // Call Claude
  console.log('[ia-chat] calling Claude...')
  const maxTokens = cfg.response_size === 'long' ? 300 : cfg.response_size === 'medium' ? 150 : 80
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const completion = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    system: buildSystemPrompt(cfg),
    messages: [{ role: 'user', content: `${chatter}: ${rawText}` }],
  })

  const block = completion.content[0]
  if (block.type !== 'text') return
  const reply = block.text.trim()
  if (!reply) return

  console.log('[ia-chat] reply:', reply.slice(0, 80))

  // Persist cooldown state (merge with existing cooldowns)
  const now = new Date().toISOString()
  const newState: IaState = {
    global_last_at: now,
    user_cooldowns: { ...(state.user_cooldowns ?? {}), [chatter]: now },
    last_bot_msgs: [reply, ...(state.last_bot_msgs ?? []).slice(0, 9)],
  }
  await db.from('overlay_configs').upsert(
    { broadcaster_id: broadcasterId, type: 'ia-chat-state', config: newState },
    { onConflict: 'broadcaster_id,type' }
  )

  // Optional delay (capped at 8s to stay within serverless limits)
  const delay = Math.min(cfg.max_delay ?? 0, 8)
  if (delay > 0) await new Promise(r => setTimeout(r, delay * 1000))

  await sendChat(broadcasterId, reply)
  console.log('[ia-chat] sent!')
}

// ─────────────────────────────────────────────────────────────────────────────

async function handleNotification(payload: { subscription: { type: string }; event: Record<string, unknown> }) {
  const eventType: string = payload.subscription.type
  const event = payload.event
  const broadcasterId = (event.broadcaster_user_id ?? event.to_broadcaster_user_id ?? '') as string

  const db = getSupabaseAdmin()
  // Non-blocking log — table may not exist, never crash the handler
  ;(async () => {
    try {
      const r = await db.from('twitch_events').insert({ broadcaster_id: broadcasterId, event_type: eventType, event_data: event })
      if (r.error) console.warn('[eventsub] twitch_events insert skipped:', r.error.message)
    } catch { /* ignore */ }
  })()

  // ── Chat messages ─────────────────────────────────────────────────────────
  if (eventType === 'channel.chat.message') {
    const msgObj  = event.message as { text?: string } | undefined
    const rawText = (msgObj?.text ?? '').trim()
    const chatter = ((event.chatter_user_name ?? event.chatter_user_login) as string) ?? ''
    const channel = ((event.broadcaster_user_login) as string) ?? ''

    // Handle ! commands first
    if (rawText.startsWith('!')) {
      const parts   = rawText.slice(1).split(/\s+/)
      const trigger = parts[0].toLowerCase()
      const args    = parts.slice(1)
      const now     = new Date()

      const { data: cmds } = await db
        .from('comandos')
        .select('id, trigger, resposta, cooldown_s, last_used_at')
        .eq('user_id', broadcasterId)
        .eq('habilitado', true)

      const cmd = (cmds ?? []).find(c => c.trigger.toLowerCase() === trigger)
      if (cmd) {
        if (!cmd.last_used_at || (now.getTime() - new Date(cmd.last_used_at).getTime()) / 1000 >= (cmd.cooldown_s ?? 30)) {
          await db.from('comandos').update({ last_used_at: now.toISOString() }).eq('id', cmd.id)
          const response = resolveChatVars(cmd.resposta, chatter, channel, args)
          await sendChat(broadcasterId, response)
        }
        return
      }
      // Unknown command — fall through to IA
    }

    await handleIaChat(broadcasterId, event, rawText, chatter)
      .catch(e => console.error('[ia-chat] error:', e))
    return
  }

  // ── Follow ───────────────────────────────────────────────────────────────
  if (eventType === 'channel.follow') {
    const username = ((event.user_name ?? event.user_login) as string) ?? ''
    await fireEventCommand(broadcasterId, 'event:twitch:follow', { user: username })
      .catch(e => console.error('[eventsub] follow cmd error:', e))
    return
  }

  // ── Subs / Resubs ────────────────────────────────────────────────────────
  if (eventType === 'channel.subscribe' || eventType === 'channel.subscription.message') {
    const username = ((event.user_name ?? event.user_login) as string) ?? ''
    const isGift = (event.is_gift as boolean) === true
    const now = new Date()
    const tierKey = String(event.tier ?? '1000') === '2000' ? 'tier2' : String(event.tier ?? '1000') === '3000' ? 'tier3' : 'tier1'

    // Record the sub in twitch_subs (new sub + gift subs; skip resub to avoid duplication)
    if (eventType === 'channel.subscribe') {
      try {
        await db.from('twitch_subs').insert({
          broadcaster_id: broadcasterId,
          username,
          tier: tierKey,
          is_gift: isGift,
          tickets: 1,
          date: now.toISOString().split('T')[0],
        })
      } catch { /* ignore */ }
    }

    // Fire event command
    if (eventType === 'channel.subscribe' && !isGift) {
      await fireEventCommand(broadcasterId, 'event:twitch:sub', {
        user: username, tier: tierLabel(event.tier), tickets: '1',
      }).catch(e => console.error('[eventsub] sub cmd error:', e))
    } else if (eventType === 'channel.subscription.message') {
      const months = String((event.cumulative_months as number) ?? 1)
      const msgText = ((event.message as Record<string, unknown>)?.text as string) ?? ''
      await fireEventCommand(broadcasterId, 'event:twitch:resub', {
        user: username, months, tier: tierLabel(event.tier), msg: msgText, tickets: '1',
      }).catch(e => console.error('[eventsub] resub cmd error:', e))
    }

    // Extend subathon
    const { data: sub } = await db.from('subathon_state').select('*').eq('broadcaster_id', broadcasterId).single()
    if (sub?.is_active) {
      if (!sub.is_paused && sub.end_time) {
        const currentEnd = new Date(sub.end_time)
        const base = currentEnd > now ? currentEnd : now
        await db.from('subathon_state').update({
          end_time: new Date(base.getTime() + sub.seconds_per_sub * 1000).toISOString(),
          updated_at: now.toISOString(),
        }).eq('broadcaster_id', broadcasterId)
      } else if (sub.is_paused) {
        await db.from('subathon_state').update({
          paused_remaining: (sub.paused_remaining ?? 0) + sub.seconds_per_sub,
          updated_at: now.toISOString(),
        }).eq('broadcaster_id', broadcasterId)
      }
    }

    // Update subs metas
    const { data: metas } = await db.from('metas').select('id,current_value').eq('broadcaster_id', broadcasterId).eq('type', 'subs').eq('status', 'active')
    for (const m of metas ?? []) {
      await db.from('metas').update({ current_value: m.current_value + 1 }).eq('id', m.id)
    }

    // Add to active sorteio
    if (username) {
      const { data: sorteios } = await db.from('sorteios').select('id,type').eq('broadcaster_id', broadcasterId).eq('status', 'active').in('type', ['subs', 'all']).limit(1)
      if (sorteios?.[0]) {
        await db.from('sorteio_participants').upsert(
          { sorteio_id: sorteios[0].id, username, tickets: sorteios[0].type === 'subs' ? 2 : 1 },
          { onConflict: 'sorteio_id,username', ignoreDuplicates: true }
        )
      }
    }
  }

  // ── Gift subs ────────────────────────────────────────────────────────────
  if (eventType === 'channel.subscription.gift') {
    const total = (event.total as number) ?? 1
    const username = ((event.user_name ?? event.user_login ?? 'Anônimo') as string)
    const now = new Date()

    // Fire event command
    await fireEventCommand(broadcasterId, 'event:twitch:giftsub', {
      user: username, count: String(total), tier: tierLabel(event.tier), tickets: String(total),
    }).catch(e => console.error('[eventsub] giftsub cmd error:', e))

    const { data: sub } = await db.from('subathon_state').select('*').eq('broadcaster_id', broadcasterId).single()
    if (sub?.is_active && !sub.is_paused && sub.end_time) {
      const currentEnd = new Date(sub.end_time)
      const base = currentEnd > now ? currentEnd : now
      await db.from('subathon_state').update({
        end_time: new Date(base.getTime() + sub.seconds_per_sub * total * 1000).toISOString(),
        updated_at: now.toISOString(),
      }).eq('broadcaster_id', broadcasterId)
    }

    const { data: metas } = await db.from('metas').select('id,current_value').eq('broadcaster_id', broadcasterId).eq('type', 'gifted_subs').eq('status', 'active')
    for (const m of metas ?? []) {
      await db.from('metas').update({ current_value: m.current_value + total }).eq('id', m.id)
    }
  }

  // ── Bits ─────────────────────────────────────────────────────────────────
  if (eventType === 'channel.cheer') {
    const bits = (event.bits as number) ?? 0
    const username = ((event.user_name ?? '') as string)
    const isAnon = (event.is_anonymous as boolean) ?? false
    const cheerMsg = ((event.message as string) ?? '')
    const now = new Date()

    // Fire chat command to thank the cheerer
    await fireEventCommand(broadcasterId, 'event:twitch:bits', {
      user: username || 'Anônimo',
      valor: String(bits),
      msg: cheerMsg,
    }).catch(e => console.error('[eventsub] bits cmd error:', e))

    // Track in twitch_cheers
    try {
      const r = await db.from('twitch_cheers').insert({
        broadcaster_id: broadcasterId,
        username: isAnon ? null : (username || null),
        bits,
        message: cheerMsg || null,
        is_anonymous: isAnon,
        date: now.toISOString().split('T')[0],
      })
      if (r.error) console.warn('[eventsub] twitch_cheers insert skipped:', r.error.message)
    } catch { /* ignore */ }

    if (bits >= 100) {
      const units = Math.floor(bits / 100)
      const { data: sub } = await db.from('subathon_state').select('*').eq('broadcaster_id', broadcasterId).single()
      if (sub?.is_active && !sub.is_paused && sub.end_time) {
        const currentEnd = new Date(sub.end_time)
        const base = currentEnd > now ? currentEnd : now
        await db.from('subathon_state').update({
          end_time: new Date(base.getTime() + sub.seconds_per_bits100 * units * 1000).toISOString(),
          updated_at: now.toISOString(),
        }).eq('broadcaster_id', broadcasterId)
      }
    }

    const { data: metas } = await db.from('metas').select('id,current_value').eq('broadcaster_id', broadcasterId).eq('type', 'bits').eq('status', 'active')
    for (const m of metas ?? []) {
      await db.from('metas').update({ current_value: m.current_value + bits }).eq('id', m.id)
    }

    if (username) {
      const { data: sorteios } = await db.from('sorteios').select('id,type').eq('broadcaster_id', broadcasterId).eq('status', 'active').eq('type', 'all').limit(1)
      if (sorteios?.[0]) {
        await db.from('sorteio_participants').upsert(
          { sorteio_id: sorteios[0].id, username, tickets: 1 },
          { onConflict: 'sorteio_id,username', ignoreDuplicates: true }
        )
      }
    }
  }
}
