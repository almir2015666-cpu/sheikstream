'use client'
import { useState, useEffect } from 'react'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14', accentBg: 'rgba(57,255,20,0.08)',
}

const PLATS = [
  { id: 'twitch',   label: 'Twitch',   color: '#9147ff', bg: 'rgba(145,71,255,0.1)',  desc: 'Sorteios de subs, alertas de follow e cheers', badge: 'ATUALIZADO' },
  { id: 'youtube',  label: 'YouTube',  color: '#ff0000', bg: 'rgba(255,0,0,0.08)',    desc: 'Membros, super chats e alertas de inscrição', badge: 'NOVO' },
  { id: 'kick',     label: 'Kick',     color: '#53fc18', bg: 'rgba(83,252,24,0.07)',  desc: 'Subs, gifted subs e chat da live' },
  { id: 'tiktok',   label: 'TikTok',   color: '#69c9d0', bg: 'rgba(105,201,208,0.08)', desc: 'Gifts, inscrições e alertas do LIVE' },
  { id: 'discord',  label: 'Discord',  color: '#5865f2', bg: 'rgba(88,101,242,0.1)',  desc: 'Notificações automáticas para seu servidor' },
]

export default function ConexoesPage() {
  const [connected, setConnected] = useState<Record<string, boolean>>({ twitch: false })
  const [userName, setUserName] = useState('')

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u) { setConnected(p => ({ ...p, twitch: true })); setUserName(u.name) } })
      .catch(() => {})
  }, [])

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Conexões</h2>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0.12rem 0.5rem', background: 'rgba(57,255,20,0.12)', color: '#39ff14', borderRadius: '999px', letterSpacing: '0.5px' }}>ATUALIZADO</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.84rem', color: C.dim }}>
          Conecte suas plataformas de streaming para ativar sorteios, alertas e estatísticas em tempo real
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {PLATS.map(p => {
          const isConn = connected[p.id]
          return (
            <div key={p.id} style={{ background: C.card, border: `1px solid ${isConn ? p.color + '30' : C.cardB}`, borderRadius: '12px', padding: '1.1rem 1.3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: p.bg, border: `1px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: p.color }}>{p.label[0]}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: C.text }}>{p.label}</span>
                  {p.badge && (
                    <span style={{ fontSize: '0.52rem', fontWeight: 700, padding: '0.08rem 0.38rem', background: p.badge === 'NOVO' ? 'rgba(59,130,246,0.18)' : 'rgba(57,255,20,0.12)', color: p.badge === 'NOVO' ? '#60a5fa' : '#39ff14', borderRadius: '999px' }}>
                      {p.badge}
                    </span>
                  )}
                  {isConn && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: C.accent, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
                      {p.id === 'twitch' && userName ? `@${userName}` : 'Conectado'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.77rem', color: C.dim }}>{p.desc}</div>
              </div>
              {isConn ? (
                <button onClick={() => setConnected(pr => ({ ...pr, [p.id]: false }))} style={{ padding: '0.42rem 1rem', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', color: '#ff6b6b', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  Desconectar
                </button>
              ) : (
                <button onClick={() => p.id === 'twitch' ? (window.location.href = '/api/auth/twitch') : undefined} style={{ padding: '0.42rem 1.2rem', background: p.bg, border: `1px solid ${p.color}40`, color: p.color, borderRadius: '7px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  Conectar
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
