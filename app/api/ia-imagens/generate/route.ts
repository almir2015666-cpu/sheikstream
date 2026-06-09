import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

const ALLOWED_SIZES = ['1024x1024', '1792x1024', '1024x1792'] as const
type Size = typeof ALLOWED_SIZES[number]

export async function POST(req: NextRequest) {
  // Auth
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? decodeSession(token) : null
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const db = getSupabaseAdmin()

  // Get user role
  const { data: wlRow } = await db.from('waitlist').select('id, status').ilike('platform_username', session.name).maybeSingle()
  if (wlRow?.status === 'banned' || wlRow?.status === 'pending' || wlRow?.status === 'rejected')
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const ids = [wlRow?.id, session.id].filter(Boolean) as string[]
  const { data: roleRow } = await db.from('user_roles').select('role').in('user_id', ids).maybeSingle()
  const userRole = roleRow?.role ?? null

  // Get AI config
  const { data: cfg } = await db.from('ai_image_config').select('*').maybeSingle()
  if (!cfg || !cfg.enabled) return NextResponse.json({ error: 'Recurso desativado pelo administrador' }, { status: 403 })

  const allowedRoles: string[] = cfg.allowed_roles ?? []
  const roleOk = allowedRoles.includes('todos') || (userRole && allowedRoles.includes(userRole))
  if (!roleOk) return NextResponse.json({ error: 'Seu grupo não tem acesso a esta funcionalidade', requiredRoles: allowedRoles }, { status: 403 })

  // Cooldown check
  const userId = wlRow?.id ?? session.id
  const since = new Date(Date.now() - cfg.cooldown_seconds * 1000).toISOString()
  const { data: recent } = await db.from('ai_image_generations')
    .select('created_at').eq('user_id', userId)
    .gt('created_at', since).order('created_at', { ascending: false }).limit(1)

  if (recent && recent.length > 0) {
    const lastAt = new Date(recent[0].created_at).getTime()
    const waitSec = Math.ceil((lastAt + cfg.cooldown_seconds * 1000 - Date.now()) / 1000)
    return NextResponse.json({ error: `Aguarde ${waitSec}s antes de gerar outra imagem`, waitSeconds: waitSec }, { status: 429 })
  }

  // Daily limit
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
  const { count } = await db.from('ai_image_generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId).gte('created_at', startOfDay.toISOString())
  if ((count ?? 0) >= cfg.max_per_day)
    return NextResponse.json({ error: `Limite diário de ${cfg.max_per_day} imagens atingido` }, { status: 429 })

  // Parse request body
  const body = await req.json()
  const prompt: string = (body.prompt ?? '').trim().slice(0, 1000)
  if (!prompt) return NextResponse.json({ error: 'Prompt obrigatório' }, { status: 400 })
  const size: Size = ALLOWED_SIZES.includes(body.size) ? body.size : '1792x1024'
  const quality: 'standard' | 'hd' = body.quality === 'hd' ? 'hd' : 'standard'

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY não configurada no servidor' }, { status: 500 })

  // Call DALL-E 3
  let imageUrl = ''
  let revisedPrompt = ''
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, quality, response_format: 'url' }),
    })
    const json = await res.json()
    if (!res.ok) {
      const msg = json?.error?.message ?? 'Erro na API da OpenAI'
      return NextResponse.json({ error: msg }, { status: res.status })
    }
    imageUrl = json.data?.[0]?.url ?? ''
    revisedPrompt = json.data?.[0]?.revised_prompt ?? prompt
  } catch (e) {
    return NextResponse.json({ error: 'Falha ao contactar a OpenAI' }, { status: 502 })
  }

  // Log generation
  await db.from('ai_image_generations').insert({
    user_id: userId,
    user_name: session.name,
    user_role: userRole,
    prompt,
    image_url: imageUrl,
    revised_prompt: revisedPrompt,
    image_format: size,
    status: 'done',
  })

  return NextResponse.json({ imageUrl, revisedPrompt })
}
