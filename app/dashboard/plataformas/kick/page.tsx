'use client'
import Link from 'next/link'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', dim: 'rgba(232,230,248,0.28)', vdim: 'rgba(232,230,248,0.12)',
  primary: '#53fc18', primaryBg: 'rgba(83,252,24,0.07)',
}

export default function KickPlataformaPage() {
  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link href="/dashboard/plataformas" style={{ color: C.dim, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Plataformas
        </Link>
        <span style={{ color: C.vdim }}>/</span>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Kick</h2>
      </div>

      <div style={{ maxWidth: '540px' }}>
        <div style={{ background: C.card, border: `1px solid rgba(83,252,24,0.18)`, borderRadius: '14px', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: C.primaryBg, border: `1px solid rgba(83,252,24,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem', fontSize: '2rem', fontWeight: 900, color: C.primary }}>K</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: C.text, marginBottom: '0.5rem' }}>Conectar Kick</div>
          <div style={{ fontSize: '0.84rem', color: C.dim, marginBottom: '1.8rem', lineHeight: 1.6 }}>
            Integre sua conta Kick para monitorar subs, gifted subs e eventos do chat durante suas lives.
          </div>
          <button style={{ padding: '0.65rem 2rem', background: C.primary, color: '#000', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer' }}>
            Conectar com Kick
          </button>
          <div style={{ marginTop: '1rem', fontSize: '0.74rem', color: C.dim }}>Em breve — integração em desenvolvimento</div>
        </div>
      </div>
    </div>
  )
}
