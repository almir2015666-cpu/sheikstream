'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', dim: 'rgba(232,230,248,0.28)', vdim: 'rgba(232,230,248,0.12)',
  primary: '#9147ff', primaryBg: 'rgba(145,71,255,0.1)',
  accent: '#39ff14',
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div>
        <div style={{ fontSize: '0.87rem', fontWeight: 600, color: C.text }}>{label}</div>
        {desc && <div style={{ fontSize: '0.74rem', color: C.dim, marginTop: '0.1rem' }}>{desc}</div>}
      </div>
      <div onClick={onChange} style={{ width: '36px', height: '20px', borderRadius: '999px', background: checked ? C.primary : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '3px', left: checked ? '19px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
      </div>
    </div>
  )
}

export default function TwitchPlataformaPage() {
  const [user, setUser] = useState<{ name: string; image: string } | null>(null)
  const [cfg, setCfg] = useState({ subs: true, gifted: true, bits: true, follows: false, raids: true, sorteioAuto: false })

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(u => setUser(u)).catch(() => {})
  }, [])

  const toggle = (k: keyof typeof cfg) => setCfg(p => ({ ...p, [k]: !p[k] }))

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link href="/dashboard/plataformas" style={{ color: C.dim, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Plataformas
        </Link>
        <span style={{ color: C.vdim }}>/</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: C.primary }}>T</span>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Twitch</h2>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.18rem 0.6rem', background: 'rgba(57,255,20,0.1)', color: C.accent, borderRadius: '999px', border: '1px solid rgba(57,255,20,0.25)' }}>Conectado</span>
        </div>
      </div>

      <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Conta */}
        <div style={{ background: C.card, border: `1px solid rgba(145,71,255,0.25)`, borderRadius: '12px', padding: '1.3rem' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '1rem' }}>Conta conectada</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {user?.image ? (
                <img src={user.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(145,71,255,0.4)' }} />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: C.primaryBg, border: '2px solid rgba(145,71,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900, color: C.primary }}>T</div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: C.text }}>{user?.name || 'Carregando...'}</div>
                <div style={{ fontSize: '0.74rem', color: C.dim }}>twitch.tv/{(user?.name || '').toLowerCase()}</div>
              </div>
            </div>
            <button onClick={() => { window.location.href = '/api/logout' }} style={{ padding: '0.4rem 1rem', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff6b6b', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
              Desconectar
            </button>
          </div>
        </div>

        {/* Eventos */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.3rem' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '1rem' }}>Eventos monitorados</div>
          <Toggle label="Subs" desc="Monitorar novas inscrições no canal" checked={cfg.subs} onChange={() => toggle('subs')} />
          <Toggle label="Gifted Subs" desc="Contar subs presenteados por viewers" checked={cfg.gifted} onChange={() => toggle('gifted')} />
          <Toggle label="Bits / Cheers" desc="Integrar doações via bits" checked={cfg.bits} onChange={() => toggle('bits')} />
          <Toggle label="Follows" desc="Contar novos seguidores" checked={cfg.follows} onChange={() => toggle('follows')} />
          <Toggle label="Raids" desc="Detectar raids recebidos" checked={cfg.raids} onChange={() => toggle('raids')} />
        </div>

        {/* Sorteio */}
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.3rem' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '1rem' }}>Sorteios automáticos</div>
          <Toggle label="Sorteio automático ao receber sub" desc="Cria um ticket de sorteio automaticamente" checked={cfg.sorteioAuto} onChange={() => toggle('sorteioAuto')} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ padding: '0.55rem 1.5rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
            Salvar configurações
          </button>
        </div>
      </div>
    </div>
  )
}
