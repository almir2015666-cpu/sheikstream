'use client'
import { useState, useEffect } from 'react'
import { SiTwitch, SiYoutube, SiKick } from 'react-icons/si'

const DARK = {
  bg: '#0d0e16',
  card: '#161824',
  cardBorder: 'rgba(255,255,255,0.07)',
  text: '#ffffff',
  muted: 'rgba(255,255,255,0.45)',
  footer: 'rgba(255,255,255,0.22)',
  primary: '#9b30ff',
  accent: '#39ff14',
  border: 'rgba(155,48,255,0.2)',
  inputBg: '#0d0e16',
  inputBorder: 'rgba(155,48,255,0.3)',
}
const LIGHT = {
  bg: '#f0eeff',
  card: '#ffffff',
  cardBorder: 'rgba(124,42,245,0.12)',
  text: '#0d0c1e',
  muted: 'rgba(13,12,30,0.5)',
  footer: 'rgba(13,12,30,0.35)',
  primary: '#7c2af5',
  accent: '#0a8c00',
  border: 'rgba(124,42,245,0.15)',
  inputBg: '#f8f7ff',
  inputBorder: 'rgba(124,42,245,0.28)',
}

function makeCSS() {
  return `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  .sk-oauth-btn { transition: opacity 0.15s, transform 0.15s, filter 0.15s; border: none; border-radius: 10px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.95rem 1.2rem; font-size: 1rem; font-weight: 700; cursor: pointer; color: #fff; }
  .sk-oauth-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-2px); filter: brightness(1.08); }
  .sk-oauth-btn:disabled { cursor: not-allowed; opacity: 0.5; }
  .sk-theme-btn { transition: transform 0.22s; background: transparent; border: none; cursor: pointer; opacity: 0.5; position: fixed; top: 1.1rem; right: 1.5rem; z-index: 200; padding: 0.4rem; }
  .sk-theme-btn:hover { transform: rotate(18deg) scale(1.15); opacity: 0.85; }
  @keyframes sk-pop-in { from { opacity: 0; transform: translateY(18px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
  .sk-card { animation: sk-pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
  @keyframes sk-logo-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  .sk-logo { animation: sk-logo-in 0.35s ease both; }
  `
}

type Overlay = { active: boolean; x: string; y: string; newTheme: 'dark' | 'light' }

export default function LoginPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [loading, setLoading] = useState('')
  const isDark = theme === 'dark'
  const C = isDark ? DARK : LIGHT

  useEffect(() => {
    const saved = localStorage.getItem('sk-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  function toggleTheme() {
    const newTheme = isDark ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('sk-theme', newTheme)
  }

  function handleOAuth(platform: string) {
    if (loading) return
    setLoading(platform)
    setTimeout(() => {
      window.location.href = `/pending?platform=${encodeURIComponent(platform)}`
    }, 1100)
  }

  const platforms = [
    {
      id: 'Twitch',
      label: 'Entrar com Twitch',
      bg: '#6441a5',
      hover: '#7c52c8',
      icon: <SiTwitch size={22} color="#fff" />,
    },
    {
      id: 'YouTube',
      label: 'Entrar com YouTube',
      bg: '#cc0000',
      hover: '#e60000',
      icon: <SiYoutube size={24} color="#fff" />,
    },
    {
      id: 'Kick',
      label: 'Entrar com Kick',
      bg: '#1a1a1a',
      hover: '#2a2a2a',
      icon: <SiKick size={20} color="#53fc18" />,
    },
  ]

  return (
    <div style={{
      fontFamily: "-apple-system,'Inter',system-ui,sans-serif",
      background: C.bg,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      transition: 'background 0.3s',
    }}>
      <style>{makeCSS()}</style>

      {/* Theme toggle — fixed top right */}
      <button onClick={toggleTheme} className="sk-theme-btn" title={isDark ? 'Modo claro' : 'Modo escuro'} style={{ color: C.muted }}>
        {isDark
          ? <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        }
      </button>

      {/* Logo */}
      <div className="sk-logo" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        {/* Icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          background: `linear-gradient(135deg, ${C.primary}, ${isDark ? '#6b1fc2' : '#5a15d0'})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
          boxShadow: `0 8px 24px ${isDark ? 'rgba(155,48,255,0.4)' : 'rgba(124,42,245,0.3)'}`,
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
        <div style={{ fontSize: '1.55rem', fontWeight: 900, letterSpacing: '0.5px', color: C.text }}>
          Sheik<span style={{ color: C.accent }}>STREAM</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: C.muted, marginTop: '0.25rem' }}>
          Acesso streamer
        </div>
      </div>

      {/* Card */}
      <div className="sk-card" style={{
        background: C.card,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: '16px',
        padding: '1.75rem',
        width: '100%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 8px 32px rgba(100,80,200,0.1)',
      }}>
        {platforms.map(p => (
          <button
            key={p.id}
            onClick={() => handleOAuth(p.id)}
            disabled={!!loading}
            className="sk-oauth-btn"
            style={{ background: loading === p.id ? p.hover : p.bg }}
          >
            {p.icon}
            {loading === p.id ? 'Conectando...' : p.label}
          </button>
        ))}

        <p style={{ fontSize: '0.78rem', color: C.muted, textAlign: 'center', margin: '0.5rem 0 0', lineHeight: 1.6 }}>
          Sem convite? Ao entrar com Twitch, YouTube ou Kick<br />você entra automaticamente na fila de espera.
        </p>
      </div>

      {/* Back */}
      <a href="/" style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: C.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: 0.75, transition: 'opacity 0.15s' }}
        onMouseOver={e => (e.currentTarget.style.opacity = '1')}
        onMouseOut={e => (e.currentTarget.style.opacity = '0.75')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Voltar ao início
      </a>

      {/* Footer */}
      <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: C.footer }}>
        <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>SheikSTREAM</a>
        {' '}© 2025
        <span style={{ margin: '0 0.6rem', opacity: 0.4 }}>·</span>
        <a href="/termos-e-condicoes" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}>Termos</a>
        <span style={{ margin: '0 0.6rem', opacity: 0.4 }}>·</span>
        <a href="/privacidade" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}>Privacidade</a>
      </div>
    </div>
  )
}
