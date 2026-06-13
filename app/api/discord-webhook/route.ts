import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/lib/session'
import { getSupabaseAdmin } from '@/app/lib/supabase'

function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

export async function GET(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await getSupabaseAdmin()
    .from('overlay_configs')
    .select('config')
    .eq('broadcaster_id', user.id)
    .eq('type', 'discord_webhook')
    .maybeSingle()

  const cfg = (data?.config as Record<string, string> | null) ?? {}
  return NextResponse.json({ webhookUrl: cfg.webhookUrl ?? '', enabled: cfg.enabled ?? true })
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { webhookUrl, enabled, test } = body as { webhookUrl?: string; enabled?: boolean; test?: boolean }

  if (test) {
    // Send a test message to the webhook
    const { data } = await getSupabaseAdmin()
      .from('overlay_configs')
      .select('config')
      .eq('broadcaster_id', user.id)
      .eq('type', 'discord_webhook')
      .maybeSingle()

    const cfg = (data?.config as Record<string, string> | null) ?? {}
    const url = webhookUrl || cfg.webhookUrl
    if (!url) return NextResponse.json({ error: 'Nenhuma URL configurada' }, { status: 400 })

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '✅ Webhook configurado com sucesso!',
            description: `Integração do **${user.name}** com SheikSTREAM está funcionando.\nVocê receberá notificações aqui quando estiver ao vivo.`,
            color: 0x9b30ff,
            footer: { text: 'SheikSTREAM' },
            timestamp: new Date().toISOString(),
          }],
        }),
      })
      if (res.ok || res.status === 204) return NextResponse.json({ ok: true })
      const t = await res.text().catch(() => '')
      return NextResponse.json({ error: `Discord respondeu ${res.status}: ${t}` }, { status: 400 })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  // Save config
  if (webhookUrl === undefined) return NextResponse.json({ error: 'webhookUrl required' }, { status: 400 })

  const cfg = { webhookUrl: webhookUrl.trim(), enabled: enabled !== false }
  const { error } = await getSupabaseAdmin()
    .from('overlay_configs')
    .upsert(
      { broadcaster_id: user.id, type: 'discord_webhook', config: cfg },
      { onConflict: 'broadcaster_id,type' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
