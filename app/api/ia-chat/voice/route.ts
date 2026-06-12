import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

type IaVozFullCfg = {
  lang?: string
  personality?: string
  botName?: string
  channelContext?: string
  allowedTopics?: string
  forbiddenTopics?: string
  responseSize?: string
  emojiEnabled?: boolean
}

const IA_LANGS: Record<string, string> = {
  'pt-BR': 'Português (BR)', 'en-US': 'English (US)', 'es': 'Español',
}

function buildVozPrompt(vozCfg: IaVozFullCfg, effectiveSize: string, emojiEnabled: boolean): string {
  const lines: string[] = []
  const name = (vozCfg.botName ?? '').trim() || 'Assistente'
  const sizeLbl = effectiveSize === 'short' ? '1 linha' : effectiveSize === 'medium' ? '2-4 linhas' : '5+ linhas'

  lines.push(`Você é ${name}, um assistente de chat ao vivo para streamers.`)
  lines.push('')

  if ((vozCfg.personality ?? '').trim()) {
    lines.push('=== PERSONALIDADE ===')
    lines.push(vozCfg.personality!.trim())
    lines.push('')
  }

  if ((vozCfg.channelContext ?? '').trim()) {
    lines.push('=== CONTEXTO DO CANAL ===')
    lines.push(vozCfg.channelContext!.trim())
    lines.push('')
  }

  lines.push('=== COMPORTAMENTO ===')
  lines.push(`- Mantenha respostas com ${sizeLbl}`)
  lines.push(`- Responda em ${IA_LANGS[vozCfg.lang ?? 'pt-BR'] ?? 'Português (BR)'}`)
  if (emojiEnabled) lines.push('- Use emotes e reações quando apropriado')
  else lines.push('- NÃO use emojis, emoticons ou reações de nenhum tipo')
  lines.push('')

  if ((vozCfg.allowedTopics ?? '').trim()) {
    lines.push('=== TÓPICOS PERMITIDOS ===')
    lines.push(vozCfg.allowedTopics!.trim())
    lines.push('')
  }

  if ((vozCfg.forbiddenTopics ?? '').trim()) {
    lines.push('=== TÓPICOS PROIBIDOS ===')
    lines.push(`Nunca aborde: ${vozCfg.forbiddenTopics!.trim()}`)
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
  const emojiEnabled: boolean = body.emojiEnabled !== false
  const bodyResponseSize: string | undefined = body.responseSize
  const bodyUserName: string | undefined = (body.userName ?? '').trim() || undefined
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  const db = getSupabaseAdmin()

  // Read ia-voz-config for personality (separate from ia-chat config)
  const { data: cfgRow } = await db
    .from('overlay_configs')
    .select('config')
    .eq('broadcaster_id', user.id)
    .eq('type', 'ia-voz-config')
    .maybeSingle()

  const vozCfg = (cfgRow?.config ?? {}) as IaVozFullCfg

  const effectiveSize = bodyResponseSize ?? vozCfg.responseSize ?? 'medium'
  const sizeLbl = effectiveSize === 'short' ? '1 linha' : effectiveSize === 'medium' ? '2-4 linhas' : '5+ linhas'

  let systemPrompt = buildVozPrompt(vozCfg, effectiveSize, emojiEnabled)

  // Inject userName directive
  if (bodyUserName) {
    systemPrompt += `\n\nIMPORTANTE: Chame o streamer/usuário pelo nome "${bodyUserName}" sempre que se dirigir a ele.`
  }

  const maxTokens = effectiveSize === 'long' ? 300 : effectiveSize === 'medium' ? 150 : 80

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
