import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from '@/app/lib/site-info'

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { content: 'Assistente temporariamente indisponível. Tente novamente mais tarde.' },
      { status: 503 },
    )
  }

  const { messages } = await request.json()
  const client = new Anthropic()

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: buildSystemPrompt(),
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return Response.json({ content: text })
}
