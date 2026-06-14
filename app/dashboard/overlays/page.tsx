'use client'
import Link from 'next/link'
import { useLang } from '@/lib/i18n'

const C = {
  page: '#08090d', card: '#111219', cardB: 'rgba(255,255,255,0.06)',
  text: '#e8e6f8', dim: 'rgba(232,230,248,0.28)', vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryB: 'rgba(155,48,255,0.2)',
}

function Icon({ type, color }: { type: string; color: string }) {
  const s = { stroke: color, fill: 'none', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'patrocinadores') return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M22 8.01c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8.01z"/><line x1="7" y1="12" x2="7" y2="16"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="17" y1="12" x2="17" y2="16"/></svg>
  if (type === 'subathon')       return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  if (type === 'meta-subs')      return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill={color}/></svg>
  if (type === 'sorteio')        return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M8 21h8M12 17v4M17 3H7l-2 6h14L17 3z"/><path d="M5 9c0 3.5 2 6 7 6s7-2.5 7-6"/></svg>
  if (type === 'alert')          return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  if (type === 'countdown')      return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/></svg>
  if (type === 'polling')        return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  if (type === 'chat')           return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  if (type === 'goal')           return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill={color}/></svg>
  if (type === 'pedidos-musica') return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
  return                                <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
}

const CATALOG: { type: string; label: string; badge: string | null; color: string; live: boolean; desc: string; href?: string }[] = [
  { type: 'subathon',      label: 'Subathon',        badge: 'NOVO', color: '#60a5fa', live: true,
    desc: 'Cronômetro de live progressivo — cada contribuição adiciona tempo ao relógio.' },
  { type: 'meta-subs',     label: 'Meta de Subs',    badge: null,   color: '#34d399', live: true,
    desc: 'Barra de progresso da meta de inscrições da Twitch em tempo real.' },
  { type: 'sorteio',       label: 'Meta de Sorteio', badge: null,   color: '#fbbf24', live: true,
    desc: 'Progresso do sorteio unificado com contadores por fonte.' },
  { type: 'meta',          label: 'Meta',            badge: 'NOVO', color: '#f87171', live: true,
    desc: 'Overlay de progresso de uma meta ativa criada pelo streamer.' },
  { type: 'countdown',     label: 'Countdown',       badge: 'NOVO', color: '#9b30ff', live: true,
    desc: 'Contagem regressiva para o início da live — compatível com Browser Source no OBS.',
    href: '/dashboard/countdown' },
  { type: 'polling',       label: 'Enquete ao vivo', badge: 'NOVO', color: '#22c55e', live: true,
    desc: 'Crie enquetes e exiba os resultados em tempo real no OBS. Viewers votam pelo navegador.',
    href: '/dashboard/polling' },
  { type: 'chat',          label: 'Chat Overlay',    badge: 'NOVO', color: '#60a5fa', live: true,
    desc: 'Exibe mensagens do chat da Twitch em tempo real sobre a tela — sem banco de dados.',
    href: '/dashboard/overlays/chat' },
  { type: 'goal',          label: 'Meta (Goal)',      badge: 'NOVO', color: '#f59e0b', live: true,
    desc: 'Barra de progresso de meta personalizada: subs, bits, doações ou valor manual.',
    href: '/dashboard/overlays/goal' },
  { type: 'patrocinadores',label: 'Patrocinadores',  badge: 'NOVO', color: '#a78bfa', live: false,
    desc: 'Carrossel de banners de patrocinadores com timing e layout configurável.' },
  { type: 'pedidos-musica', label: 'Pedidos de Música', badge: 'NOVO', color: '#f472b6', live: true,
    desc: 'Viewers pedem músicas pelo chat — aprovação manual e fila de reprodução em tempo real.',
    href: '/dashboard/pedidos-musica' },
]

export default function OverlaysPage() {
  const { t } = useLang()
  return (
    <div style={{ background: C.page, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{t('pt_overlays')}</h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: C.dim }}>
          {t('overlays_subtitle')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.9rem' }}>
        {CATALOG.map(item => (
          <div key={item.type} style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: 12, padding: '1.1rem 1.2rem', position: 'relative' }}>
            <Link
              href={item.href ?? `/dashboard/overlays/${item.type}`}
              style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', padding: '0.3rem 0.35rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, display: 'flex', alignItems: 'center', color: C.dim, textDecoration: 'none' }}
              title="Editar overlay"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </Link>

            <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
              <Icon type={item.type} color={item.color} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.label}</span>
              {item.badge && (
                <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem', background: 'rgba(155,48,255,0.12)', color: C.primary, borderRadius: '999px', border: `1px solid ${C.primaryB}` }}>
                  {item.badge}
                </span>
              )}
            </div>
            <p style={{ margin: '0 0 0.7rem', fontSize: '0.76rem', color: C.dim, lineHeight: 1.5 }}>{item.desc}</p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: C.vdim }}>
              {item.live ? t('overlay_obs_instruction') : t('overlay_coming_soon_msg')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
