import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'
import { getSupabaseAdmin } from '@/app/lib/supabase'

const GLOBAL_ID = '_global_'
const TYPE      = 'overlay_catalog'

export type CatalogItem = {
  type: string
  label: string
  desc: string
  badge: string | null
  color: string
  live: boolean
  status?: 'live' | 'soon' | 'maintenance'
  href: string
  hidden: boolean
  removed?: boolean
  showInNav?: boolean
}

const DEFAULTS: CatalogItem[] = [
  { type: 'subathon',       label: 'Subathon',          badge: 'NOVO', color: '#60a5fa', live: true,  hidden: false, desc: 'Cronômetro de live progressivo — cada contribuição adiciona tempo ao relógio.',                  href: '/dashboard/overlays/subathon' },
  { type: 'meta-subs',      label: 'Meta de Subs',      badge: null,   color: '#34d399', live: true,  hidden: false, desc: 'Barra de progresso da meta de inscrições da Twitch em tempo real.',                            href: '/dashboard/overlays/meta-subs' },
  { type: 'sorteio',        label: 'Meta de Sorteio',   badge: null,   color: '#fbbf24', live: true,  hidden: false, desc: 'Progresso do sorteio unificado com contadores por fonte.',                                      href: '/dashboard/overlays/sorteio' },
  { type: 'meta',           label: 'Meta',              badge: 'NOVO', color: '#f87171', live: true,  hidden: false, desc: 'Overlay de progresso de uma meta ativa criada pelo streamer.',                                  href: '/dashboard/overlays/meta' },
  { type: 'countdown',      label: 'Countdown',         badge: 'NOVO', color: '#9b30ff', live: true,  hidden: false, desc: 'Contagem regressiva para o início da live — compatível com Browser Source no OBS.',             href: '/dashboard/countdown' },
  { type: 'polling',        label: 'Enquete ao vivo',   badge: 'NOVO', color: '#22c55e', live: true,  hidden: false, desc: 'Crie enquetes e exiba os resultados em tempo real no OBS. Viewers votam pelo navegador.',        href: '/dashboard/polling' },
  { type: 'chat',           label: 'Chat Overlay',      badge: 'NOVO', color: '#60a5fa', live: true,  hidden: false, desc: 'Exibe mensagens do chat da Twitch em tempo real sobre a tela — sem banco de dados.',             href: '/dashboard/overlays/chat' },
  { type: 'goal',           label: 'Meta (Goal)',        badge: 'NOVO', color: '#f59e0b', live: true,  hidden: false, desc: 'Barra de progresso de meta personalizada: subs, bits, doações ou valor manual.',                href: '/dashboard/overlays/goal' },
  { type: 'patrocinadores', label: 'Patrocinadores',    badge: 'NOVO', color: '#a78bfa', live: false, hidden: false, desc: 'Carrossel de banners de patrocinadores com timing e layout configurável.',                      href: '/dashboard/overlays/patrocinadores' },
  { type: 'pedidos-musica',  label: 'Pedidos de Música', badge: 'NOVO', color: '#f472b6', live: true,  hidden: false, desc: 'Viewers pedem músicas pelo chat — aprovação manual e fila de reprodução em tempo real.',              href: '/dashboard/pedidos-musica' },
  { type: 'clip-display',    label: 'Clip Display',       badge: 'NOVO', color: '#60a5fa', live: true,  hidden: false, desc: 'Notificação automática no OBS quando alguém cria um clipe durante a live — com thumbnail e título.',  href: '/dashboard/overlays/clip-display' },
  { type: 'discord',         label: 'Discord Webhook',    badge: 'NOVO', color: '#5865F2', live: true,  hidden: false, desc: 'Envie notificações automáticas para o seu servidor Discord quando iniciar a live.',                    href: '/dashboard/discord' },
  { type: 'comandos-voz',   label: 'Comandos de Voz',   badge: 'NOVO', color: '#22c55e', live: true,  hidden: false, desc: 'Acione ações do dashboard por reconhecimento de voz durante a live — sorteio, timer, alertas e mais.', href: '/dashboard/comandos-voz' },
]

export async function GET() {
  try {
    const { data } = await getSupabaseAdmin()
      .from('overlay_configs')
      .select('config')
      .eq('broadcaster_id', GLOBAL_ID)
      .eq('type', TYPE)
      .single()
    const items: CatalogItem[] = data?.config?.items ?? DEFAULTS
    return NextResponse.json({ items, defaults: DEFAULTS })
  } catch {
    return NextResponse.json({ items: DEFAULTS, defaults: DEFAULTS })
  }
}

export async function PUT(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { items } = await req.json()
    if (!Array.isArray(items)) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    const { error } = await getSupabaseAdmin()
      .from('overlay_configs')
      .upsert({
        broadcaster_id: GLOBAL_ID,
        type: TYPE,
        config: { items },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'broadcaster_id,type' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
