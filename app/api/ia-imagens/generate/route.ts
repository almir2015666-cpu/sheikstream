import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, decodeSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ALLOWED_SIZES = ['1024x1024', '1792x1024', '1024x1792'] as const
type Size = typeof ALLOWED_SIZES[number]

const DEFAULT_CFG = {
  enabled: true,
  cooldown_seconds: 300,
  max_per_day: 10,
  allowed_roles: ['admin', 'moderador', 'vip'],
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? decodeSession(token) : null
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const db = getSupabaseAdmin()

  const { data: wlRow } = await db.from('waitlist').select('id, status').ilike('platform_username', session.name).maybeSingle()
  if (wlRow?.status === 'banned' || wlRow?.status === 'pending' || wlRow?.status === 'rejected')
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const ids = [wlRow?.id, session.id].filter(Boolean) as string[]
  const { data: roleRow } = await db.from('user_roles').select('role').in('user_id', ids).maybeSingle()
  const userRole = roleRow?.role ?? null

  const cfgRes = await db.from('ai_image_config').select('*').maybeSingle()
  const cfg = cfgRes.data ?? DEFAULT_CFG

  if (!cfg.enabled) return NextResponse.json({ error: 'Recurso desativado pelo administrador' }, { status: 403 })

  const allowedRoles: string[] = cfg.allowed_roles ?? []
  const roleOk = allowedRoles.includes('todos') || (userRole && allowedRoles.includes(userRole))
  if (!roleOk) return NextResponse.json({ error: `Seu grupo (${userRole ?? 'sem grupo'}) não tem acesso. Grupos permitidos: ${allowedRoles.join(', ')}`, requiredRoles: allowedRoles }, { status: 403 })

  const userId = wlRow?.id ?? session.id

  if (cfgRes.data) {
    try {
      const since = new Date(Date.now() - cfg.cooldown_seconds * 1000).toISOString()
      const { data: recent } = await db.from('ai_image_generations')
        .select('created_at').eq('user_id', userId)
        .gt('created_at', since).order('created_at', { ascending: false }).limit(1)

      if (recent && recent.length > 0) {
        const lastAt = new Date(recent[0].created_at).getTime()
        const waitSec = Math.ceil((lastAt + cfg.cooldown_seconds * 1000 - Date.now()) / 1000)
        return NextResponse.json({ error: `Aguarde ${waitSec}s antes de gerar outra imagem`, waitSeconds: waitSec }, { status: 429 })
      }

      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
      const { count } = await db.from('ai_image_generations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId).gte('created_at', startOfDay.toISOString())
      const roleLimits: Record<string, number> = (cfg as Record<string, unknown>).role_limits as Record<string, number> ?? {}
      const userMaxPerDay = roleLimits[userRole ?? ''] ?? cfg.max_per_day
      if ((count ?? 0) >= userMaxPerDay)
        return NextResponse.json({ error: `Limite diário de ${userMaxPerDay} imagens atingido` }, { status: 429 })
    } catch {}
  }

  const body = await req.json()
  const prompt: string = (body.prompt ?? '').trim().slice(0, 1000)
  if (!prompt) return NextResponse.json({ error: 'Prompt obrigatório' }, { status: 400 })
  const size: Size = ALLOWED_SIZES.includes(body.size) ? body.size : '1792x1024'
  const quality: 'standard' | 'hd' = body.quality === 'hd' ? 'hd' : 'standard'
  // Support both single referenceImage (legacy) and multiple referenceImages
  const refImgs: string[] = body.referenceImages ?? (body.referenceImage ? [body.referenceImage] : [])
  const referenceImage: string | undefined = refImgs[0]

  // gpt-image-1 uses different size names and quality values
  const SIZE_MAP: Record<Size, string> = {
    '1024x1024': '1024x1024',
    '1792x1024': '1536x1024',
    '1024x1792': '1024x1536',
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY não configurada no servidor' }, { status: 500 })

  let imageUrl = ''
  let revisedPrompt = prompt
  try {
    if (refImgs.length > 0) {
      // Image edits mode: use reference images as visual context
      const fd = new FormData()
      fd.append('model', 'gpt-image-1')
      fd.append('prompt', prompt)
      fd.append('n', '1')
      fd.append('size', SIZE_MAP[size])
      fd.append('quality', quality === 'hd' ? 'high' : 'medium')
      for (let i = 0; i < refImgs.length; i++) {
        const img = refImgs[i]
        const b64Data = img.includes(',') ? img.split(',')[1] : img
        const mimeType = img.startsWith('data:') ? (img.split(';')[0].split(':')[1] ?? 'image/png') : 'image/png'
        const imageBlob = new Blob([Buffer.from(b64Data, 'base64')], { type: mimeType })
        fd.append('image[]', imageBlob, `reference_${i}.png`)
      }
      const res = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) {
        const raw: string = json?.error?.message ?? json?.error?.code ?? 'Erro desconhecido'
        return NextResponse.json({ error: `OpenAI: ${raw}` }, { status: res.status })
      }
      const b64 = json.data?.[0]?.b64_json ?? ''
      if (!b64) return NextResponse.json({ error: 'Nenhuma imagem retornada' }, { status: 502 })
      imageUrl = `data:image/png;base64,${b64}`
    } else {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt,
          n: 1,
          size: SIZE_MAP[size],
          quality: quality === 'hd' ? 'high' : 'medium',
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        const raw: string = json?.error?.message ?? json?.error?.code ?? 'Erro desconhecido'
        return NextResponse.json({ error: `OpenAI: ${raw}` }, { status: res.status })
      }
      // gpt-image-1 returns base64, convert to data URL
      const b64 = json.data?.[0]?.b64_json ?? ''
      if (!b64) return NextResponse.json({ error: 'Nenhuma imagem retornada' }, { status: 502 })
      imageUrl = `data:image/png;base64,${b64}`
    }
  } catch {
    return NextResponse.json({ error: 'Falha ao contactar a OpenAI' }, { status: 502 })
  }

  try {
    await db.from('ai_image_generations').insert({
      user_id: userId, user_name: session.name, user_role: userRole,
      prompt, image_url: imageUrl, revised_prompt: revisedPrompt,
      image_format: size, status: 'done',
    })
  } catch {}

  return NextResponse.json({ imageUrl, revisedPrompt, modelUsed: 'dall-e-3' })
}
