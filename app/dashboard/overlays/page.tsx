'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

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
  return                                <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
}

const CATALOG = [
  { type: 'subathon',       label: 'Subathon',        badge: 'NOVO', color: '#60a5fa', live: true,  desc: 'Cronômetro de live progressivo — cada contribuição adiciona tempo ao relógio.' },
  { type: 'meta-subs',      label: 'Meta de Subs',    badge: null,   color: '#34d399', live: true,  desc: 'Barra de progresso da meta de inscrições da Twitch em tempo real.' },
  { type: 'sorteio',        label: 'Meta de Sorteio', badge: null,   color: '#fbbf24', live: true,  desc: 'Progresso do sorteio unificado com contadores por fonte.' },
  { type: 'meta',           label: 'Meta',            badge: 'NOVO', color: '#f87171', live: true,  desc: 'Overlay de progresso de uma meta ativa criada pelo streamer.' },
  { type: 'patrocinadores', label: 'Patrocinadores',  badge: 'NOVO', color: '#a78bfa', live: false, desc: 'Carrossel de banners de patrocinadores com timing e layout configurável.' },
]

const EVENT_OVERLAYS = [
  { slug: 'twitch-sub',         label: 'Sub Twitch',          icon: '⭐', platform: 'Twitch',  color: '#9146ff' },
  { slug: 'twitch-giftsub',     label: 'Gift Sub Twitch',     icon: '🎁', platform: 'Twitch',  color: '#c084fc' },
  { slug: 'twitch-resub',       label: 'Resub Twitch',        icon: '🔁', platform: 'Twitch',  color: '#9146ff' },
  { slug: 'twitch-follow',      label: 'Follow Twitch',       icon: '❤️', platform: 'Twitch',  color: '#ff6eb6' },
  { slug: 'twitch-bits',        label: 'Bits Twitch',         icon: '💎', platform: 'Twitch',  color: '#fbbf24' },
  { slug: 'livepix',            label: 'Doação Livepix',      icon: '💸', platform: 'Livepix', color: '#39ff14' },
  { slug: 'paypal',             label: 'Doação PayPal',       icon: '💳', platform: 'PayPal',  color: '#1e9ef5' },
  { slug: 'kick-sub',           label: 'Sub Kick',            icon: '⭐', platform: 'Kick',    color: '#53fc18' },
  { slug: 'kick-follow',        label: 'Follow Kick',         icon: '❤️', platform: 'Kick',    color: '#53fc18' },
  { slug: 'kick-giftsub',       label: 'Gift Sub Kick',       icon: '🎁', platform: 'Kick',    color: '#53fc18' },
  { slug: 'youtube-member',     label: 'Membro YouTube',      icon: '🏅', platform: 'YouTube', color: '#ff4040' },
  { slug: 'youtube-giftmember', label: 'Gift Member YouTube', icon: '🎁', platform: 'YouTube', color: '#ff8080' },
]

const PLATFORM_COLORS: Record<string, string> = {
  Twitch: '#9146ff', Livepix: '#ff6eb6', PayPal: '#1e9ef5', Kick: '#53fc18', YouTube: '#ff4040',
}

function CatalogCard({ item }: { item: typeof CATALOG[0] }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: 12, padding: '1.1rem 1.2rem', position: 'relative' }}>
      <Link href={`/dashboard/overlays/${item.type}`} style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', padding: '0.3rem 0.35rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, display: 'flex', alignItems: 'center', color: C.dim, textDecoration: 'none' }} title="Editar overlay">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </Link>
      <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
        <Icon type={item.type} color={item.color} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.label}</span>
        {item.badge && (
          <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem', background: 'rgba(155,48,255,0.12)', color: C.primary, borderRadius: 999, border: `1px solid ${C.primaryB}` }}>{item.badge}</span>
        )}
      </div>
      <p style={{ margin: '0 0 0.7rem', fontSize: '0.76rem', color: C.dim, lineHeight: 1.5 }}>{item.desc}</p>
      <p style={{ margin: 0, fontSize: '0.72rem', color: C.vdim }}>
        {item.live ? 'Clique no lápis para editar e gerar a URL do OBS.' : 'Em breve — integração em desenvolvimento.'}
      </p>
    </div>
  )
}

function EventAlertCard({ ev, uid }: { ev: typeof EVENT_OVERLAYS[0]; uid: string }) {
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.sheikstream.com.br'
  const url = uid ? `${origin}/overlay/alert?uid=${uid}&event=${ev.slug}` : ''

  function copy() {
    if (!url) return
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: 12, padding: '0.9rem 1rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Link href={`/dashboard/overlays/alert?event=${ev.slug}`} style={{ position: 'absolute', top: '0.65rem', right: '0.65rem', padding: '0.25rem 0.3rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, display: 'flex', alignItems: 'center', color: C.dim, textDecoration: 'none' }} title="Editar overlay">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', paddingRight: '1.5rem' }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${ev.color}15`, border: `1px solid ${ev.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem' }}>
          {ev.icon}
        </div>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{ev.label}</div>
          <div style={{ fontSize: '0.64rem', fontWeight: 700, color: PLATFORM_COLORS[ev.platform] ?? C.dim, marginTop: '0.1rem' }}>{ev.platform}</div>
        </div>
      </div>

      {url ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#0a0b11', border: `1px solid ${C.cardB}`, borderRadius: 7, padding: '0.28rem 0.5rem' }}>
          <span style={{ flex: 1, fontSize: '0.6rem', color: C.vdim, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
          <button onClick={copy} style={{ flexShrink: 0, padding: '0.15rem 0.4rem', background: copied ? 'rgba(57,255,20,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${copied ? 'rgba(57,255,20,0.2)' : C.cardB}`, borderRadius: 4, color: copied ? '#39ff14' : C.dim, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700 }}>
            {copied ? '✓' : '⧉'}
          </button>
        </div>
      ) : (
        <div style={{ fontSize: '0.65rem', color: C.vdim, background: '#0a0b11', border: `1px solid ${C.cardB}`, borderRadius: 7, padding: '0.28rem 0.5rem' }}>
          Fazendo login...
        </div>
      )}
    </div>
  )
}

export default function OverlaysPage() {
  const [uid, setUid] = useState('')

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(u => { if (u?.id) setUid(u.id) }).catch(() => {})
  }, [])

  return (
    <div style={{ background: C.page, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Overlays</h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: C.dim }}>
          Configure e copie as URLs para usar no OBS Studio — cada overlay tem editor visual com prévia ao vivo.
        </p>
      </div>

      {/* ── Alertas por Evento ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(251,146,60,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Alertas por Evento</span>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem', background: 'rgba(251,146,60,0.1)', color: '#fb923c', borderRadius: 999, border: '1px solid rgba(251,146,60,0.2)' }}>NOVO</span>
        </div>
        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: C.dim }}>
          Cada evento tem sua própria URL e configuração visual independente. Use URLs diferentes no OBS para controle total.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {EVENT_OVERLAYS.map(ev => (
            <EventAlertCard key={ev.slug} ev={ev} uid={uid} />
          ))}
        </div>
      </div>

      {/* ── Outros Overlays ─────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Outros Overlays</span>
        </div>
        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: C.dim }}>Cronômetros, metas e patrocinadores para complementar sua transmissão.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.9rem' }}>
          {CATALOG.map(item => (
            <CatalogCard key={item.type} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
