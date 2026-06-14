'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useLang } from '@/lib/i18n'
import type { CatalogItem } from '@/app/api/admin/overlays-catalog/route'

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
  if (type === 'countdown')      return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/></svg>
  if (type === 'polling')        return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  if (type === 'chat')           return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  if (type === 'goal')           return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill={color}/></svg>
  if (type === 'pedidos-musica') return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
  if (type === 'meta')           return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><circle cx="12" cy="12" r="3" fill={color} stroke="none"/></svg>
  return                                <svg width="20" height="20" viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
}

export default function OverlaysPage() {
  const { t } = useLang()
  const [items, setItems] = useState<CatalogItem[]>([])
  useEffect(() => {
    fetch('/api/admin/overlays-catalog').then(r => r.json()).then(d => setItems(d?.items ?? [])).catch(() => {})
  }, [])
  const visible = items.filter(item => !item.hidden)
  return (
    <div style={{ background: C.page, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{t('pt_overlays')}</h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: C.dim }}>{t('overlays_subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.9rem' }}>
        {visible.map(item => (
          <div key={item.type} style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: 12, padding: '1.1rem 1.2rem', position: 'relative', opacity: item.live ? 1 : 0.55 }}>
            {item.live && (
              <Link
                href={item.href || `/dashboard/overlays/${item.type}`}
                style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', padding: '0.3rem 0.35rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, display: 'flex', alignItems: 'center', color: C.dim, textDecoration: 'none' }}
                title="Editar overlay"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </Link>
            )}

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
