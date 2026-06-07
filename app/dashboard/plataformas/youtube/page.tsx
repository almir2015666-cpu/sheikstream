'use client'
import Link from 'next/link'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', dim: 'rgba(232,230,248,0.28)', vdim: 'rgba(232,230,248,0.12)',
  primary: '#ff0000', primaryBg: 'rgba(255,0,0,0.08)',
  accent: '#39ff14',
}

export default function YouTubePlataformaPage() {
  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link href="/dashboard/plataformas" style={{ color: C.dim, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Plataformas
        </Link>
        <span style={{ color: C.vdim }}>/</span>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>YouTube</h2>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.18rem 0.6rem', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', borderRadius: '999px', border: '1px solid rgba(59,130,246,0.25)' }}>NOVO</span>
      </div>

      <div style={{ maxWidth: '540px' }}>
        <div style={{ background: C.card, border: `1px solid rgba(255,0,0,0.18)`, borderRadius: '14px', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: C.primaryBg, border: `1px solid rgba(255,0,0,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem', fontSize: '2rem', fontWeight: 900, color: C.primary }}>Y</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: C.text, marginBottom: '0.5rem' }}>Conectar YouTube</div>
          <div style={{ fontSize: '0.84rem', color: C.dim, marginBottom: '1.8rem', lineHeight: 1.6 }}>
            Conecte sua conta do YouTube para monitorar membros, super chats e inscrições em tempo real durante suas lives.
          </div>
          <button style={{ padding: '0.65rem 2rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}>
            Conectar com YouTube
          </button>
          <div style={{ marginTop: '1rem', fontSize: '0.74rem', color: C.dim }}>
            Em breve — integração em desenvolvimento
          </div>
        </div>
      </div>
    </div>
  )
}
