'use client'
import { useEffect, useState } from 'react'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)', primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
}

const OVERLAYS = [
  { id: 'meta',           label: 'Overlay Meta',           desc: 'Barra de progresso da meta ativa — atualiza automaticamente via Twitch', path: '/overlay/meta',     live: true  },
  { id: 'sorteio',        label: 'Overlay Sorteio',        desc: 'Sorteio ativo com contagem de participantes e animação de vencedor',     path: '/overlay/sorteio',  live: true  },
  { id: 'subathon',       label: 'Overlay Subathon',       desc: 'Countdown do subathon — aumenta com subs e bits em tempo real',          path: '/overlay/subathon', live: true  },
  { id: 'patrocinadores', label: 'Overlay Patrocinadores', desc: 'Banner rotativo de patrocinadores',                                       path: '/overlay/banners',  live: false },
  { id: 'alertas',        label: 'Overlay Alertas',        desc: 'Notificações de subs, doações e follows',                                path: '/overlay/alertas',  live: false },
]

export default function OverlaysPage() {
  const [uid, setUid] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => { if (d?.id) setUid(d.id) }).catch(() => {})
  }, [])

  function getUrl(path: string, withUid = true) {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://sheikstream.vercel.app'
    return withUid && uid ? `${base}${path}?uid=${uid}` : `${base}${path}?uid=SEU_ID`
  }

  function copy(path: string) {
    navigator.clipboard.writeText(getUrl(path)).catch(() => {})
    setCopied(path)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', fontWeight: 800 }}>Overlays</h2>
        <p style={{ margin: 0, fontSize: '0.84rem', color: C.dim }}>
          Copie a URL e adicione como Browser Source no OBS Studio. Largura recomendada: 1920px · Altura: 100–200px
        </p>
      </div>

      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '0.85rem 1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span style={{ fontSize: '0.82rem', color: '#93c5fd' }}>
          No OBS: Adicione Fonte → Browser → cole a URL → desmarque "Controlar áudio via OBS". Fundo transparente — use Filtro de Chroma Key se necessário.
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.8rem' }}>
        {OVERLAYS.map(ov => (
          <div key={ov.id} style={{ background: C.card, border: `1px solid ${ov.live ? 'rgba(155,48,255,0.15)' : C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem', opacity: ov.live ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: C.text }}>{ov.label}</div>
                  {ov.live
                    ? <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.08rem 0.38rem', background: 'rgba(57,255,20,0.12)', color: C.accent, borderRadius: '999px' }}>AO VIVO</span>
                    : <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.08rem 0.38rem', background: 'rgba(255,255,255,0.06)', color: C.dim, borderRadius: '999px' }}>EM BREVE</span>
                  }
                </div>
                <div style={{ fontSize: '0.75rem', color: C.dim }}>{ov.desc}</div>
              </div>
              {ov.live && (
                <a href={getUrl(ov.path)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: C.primary, textDecoration: 'none', flexShrink: 0, marginLeft: '0.75rem' }}>
                  Preview ↗
                </a>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ flex: 1, background: '#08090d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.45rem 0.75rem', fontSize: '0.68rem', color: C.vdim, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getUrl(ov.path, !!uid)}
              </div>
              {ov.live && (
                <button onClick={() => copy(ov.path)} disabled={!uid} style={{ padding: '0.45rem 0.85rem', background: copied === ov.path ? 'rgba(57,255,20,0.1)' : C.primaryBg, border: `1px solid ${copied === ov.path ? 'rgba(57,255,20,0.3)' : 'rgba(155,48,255,0.25)'}`, color: copied === ov.path ? C.accent : C.primary, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: uid ? 'pointer' : 'not-allowed', flexShrink: 0, whiteSpace: 'nowrap', opacity: uid ? 1 : 0.5 }}>
                  {copied === ov.path ? '✓ Copiado' : 'Copiar URL'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
