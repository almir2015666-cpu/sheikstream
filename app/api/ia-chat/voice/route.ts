import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

type IaChatCfg = {
  enabled: boolean; personality: string; bot_name: string
  response_size: string; language: string
  channel_context: string; allowed_topics: string; forbidden_topics: string
  mention_user: boolean; react_emotes: boolean; memory: boolean
  lurk_mode: boolean; reply_to_streamer: boolean; ignore_commands: boolean
  words_to_ignore: string; whitelist: string; blacklist: string
  cooldown_user: number; response_chance: number; max_delay: number
  generated_prompt: string
}

const IA_LANGS: Record<string, string> = {
  'pt-BR': 'Português (BR)', 'en-US': 'English (US)', 'es': 'Español',
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
  if (cfg.react_emotes) lines.push('- Use emotes e reações quando apropriado')
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

  lines.push('=== REGRAS GERAIS ===')
  lines.push('- Seja natural, animado e autêntico')
  lines.push('- Nunca invente informações')
  lines.push('- Resposta máxima: uma mensagem de chat, sem markdown, sem asteriscos, texto puro')

  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? decodeSession(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const text: string = (body.text ?? '').trim()
  const sendToChat: boolean = body.sendToChat !== false
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  const db = getSupabaseAdmin()

  const { data: cfgRow } = await db
    .from('overlay_configs')
    .select('config')
    .eq('broadcaster_id', user.id)
    .eq('type', 'ia-chat')
    .maybeSingle()

  const cfg = cfgRow?.config?.cfg as IaChatCfg | undefined
  const systemPrompt = cfg
    ? buildSystemPrompt(cfg)
    : 'Você é um assistente de chat ao vivo. Responda de forma natural e concisa em português. Sem markdown, texto puro.'

  const maxTokens = cfg?.response_size === 'long' ? 300 : cfg?.response_size === 'medium' ? 150 : 120

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let reply: string
  try {
    const completion = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: `[Streamer]: ${text}` }],
    })
    const block = completion.content[0]
    if (block.type !== 'text') return NextResponse.json({ error: 'No text response' }, { status: 500 })
    reply = block.text.trim()
  } catch (e) {
    console.error('[ia-voz] Claude error:', e)
    return NextResponse.json({ error: 'Claude error' }, { status: 500 })
  }

  if (!reply) return NextResponse.json({ error: 'Empty response' }, { status: 500 })

  if (!sendToChat) return NextResponse.json({ reply })

  // Send to Twitch chat
  const { data: tok } = await db.from('user_tokens').select('twitch_token').eq('user_id', user.id).single()
  if (!tok?.twitch_token) {
    console.error('[ia-voz] no twitch_token for user', user.id)
    return NextResponse.json({ reply, warn: 'no twitch token' })
  }

  const chatRes = await fetch('https://api.twitch.tv/helix/chat/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tok.twitch_token}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ broadcaster_id: user.id, sender_id: user.id, message: reply }),
  })

  if (!chatRes.ok) {
    const errBody = await chatRes.text()
    console.error('[ia-voz] sendChat failed:', chatRes.status, errBody)
    return NextResponse.json({ reply, warn: `chat error ${chatRes.status}: ${errBody}` })
  }

  return NextResponse.json({ reply })
}
