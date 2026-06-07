'use client'
import Link from 'next/link'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
}

export default function BannersPage() {
  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Banners de patrocinadores</h2>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.12rem 0.5rem', background: 'rgba(59,130,246,0.18)', color: '#60a5fa', borderRadius: '999px', letterSpacing: '0.5px' }}>NOVO</span>
        </div>
        <Link href="/dashboard/banners/novo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.2rem', background: C.primary, color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
          + Novo banner
        </Link>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}>🖼️</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: '0.5rem' }}>Nenhum banner próprio cadastrado</div>
        <div style={{ fontSize: '0.84rem', color: C.dim, marginBottom: '1.5rem' }}>Adicione banners de patrocinadores para exibir nos seus overlays do OBS</div>
        <Link href="/dashboard/banners/novo" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.5rem', background: C.primary, color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700 }}>
          Criar primeiro banner
        </Link>
      </div>
    </div>
  )
}
