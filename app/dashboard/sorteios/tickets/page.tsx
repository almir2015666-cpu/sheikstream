'use client'
import { useState } from 'react'
import { useLang } from '@/lib/i18n'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
}

const PLATS = ['Todas plataformas', 'Livepix', 'PayPal', 'Twitch', 'YouTube', 'Kick', 'TikTok']
const ORDERS = ['Mais recente', 'Mais antigo', 'Ticket ↑', 'Ticket ↓']

export default function TicketsPage() {
  const { t } = useLang()
  const [search, setSearch] = useState('')
  const [plat, setPlat] = useState('Todas plataformas')
  const [sorteio, setSorteio] = useState('Todos os sorteios')
  const [order, setOrder] = useState('Mais recente')

  const selStyle = (val: string, cur: string): React.CSSProperties => ({
    padding: '0.42rem 0.75rem', borderRadius: '7px',
    border: `1px solid ${val === cur ? 'rgba(155,48,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
    background: val === cur ? 'rgba(155,48,255,0.1)' : 'rgba(255,255,255,0.03)',
    color: val === cur ? '#9b30ff' : 'rgba(232,230,248,0.5)',
    fontSize: '0.8rem', cursor: 'pointer',
  })

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{t('pt_raffle_tickets')}</h2>
        <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.12rem 0.5rem', background: 'rgba(59,130,246,0.18)', color: '#60a5fa', borderRadius: '999px', letterSpacing: '0.5px' }}>NOVO</span>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('tickets_search_placeholder')} style={{ padding: '0.42rem 0.85rem', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: C.text, fontSize: '0.8rem', outline: 'none', width: '200px' }} />
        <select value={plat} onChange={e => setPlat(e.target.value)} style={{ padding: '0.42rem 0.75rem', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)', background: '#0f1018', color: C.muted, fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}>
          {PLATS.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={sorteio} onChange={e => setSorteio(e.target.value)} style={{ padding: '0.42rem 0.75rem', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)', background: '#0f1018', color: C.muted, fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}>
          <option>Todos os sorteios</option>
        </select>
        <select value={order} onChange={e => setOrder(e.target.value)} style={{ padding: '0.42rem 0.75rem', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)', background: '#0f1018', color: C.muted, fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}>
          {ORDERS.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* Empty state */}
      <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}>🎟️</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: '0.5rem' }}>{t('tickets_no_results')}</div>
        <div style={{ fontSize: '0.84rem', color: C.dim }}>{t('tickets_no_results_desc')}</div>
      </div>
    </div>
  )
}
