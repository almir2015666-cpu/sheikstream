'use client'
import Link from 'next/link'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
}

export default function SorteiosPage() {
  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Sorteios</h2>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.12rem 0.5rem', background: 'rgba(59,130,246,0.18)', color: '#60a5fa', borderRadius: '999px', letterSpacing: '0.5px' }}>NOVO</span>
        </div>
        <Link href="/dashboard/sorteios/novo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.2rem', background: C.primary, color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
          + Novo sorteio
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.25rem', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
        {['Todos', 'Ativos', 'Encerrados', 'Rascunhos'].map((tab, i) => (
          <button key={tab} style={{ padding: '0.3rem 1rem', borderRadius: '6px', border: 'none', background: i === 0 ? C.primaryBg : 'transparent', color: i === 0 ? C.primary : C.dim, fontSize: '0.8rem', fontWeight: i === 0 ? 700 : 400, cursor: 'pointer', outline: i === 0 ? `1px solid rgba(155,48,255,0.3)` : 'none', outlineOffset: '-1px' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}>🎰</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: '0.5rem' }}>Nenhum sorteio criado ainda</div>
        <div style={{ fontSize: '0.84rem', color: C.dim, marginBottom: '1.5rem' }}>Crie seu primeiro sorteio e comece a engajar sua comunidade</div>
        <Link href="/dashboard/sorteios/novo" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.5rem', background: C.primary, color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700 }}>
          + Criar primeiro sorteio
        </Link>
      </div>
    </div>
  )
}
