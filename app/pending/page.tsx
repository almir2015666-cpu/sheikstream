'use client'
import { useState, useEffect } from 'react'

const DARK = {
  bg: '#08090d', navBg: 'rgba(8,9,13,0.92)',
  cardBg: '#0f1018',
  text: '#f0eefc', muted: 'rgba(240,238,252,0.5)', dim: 'rgba(240,238,252,0.28)',
  vvdim: 'rgba(240,238,252,0.08)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  primaryBgLight: 'rgba(155,48,255,0.07)',
  accent: '#39ff14', accentBg: 'rgba(57,255,20,0.1)',
  accentBorder: 'rgba(57,255,20,0.3)',
  border: 'rgba(155,48,255,0.18)', borderStrong: 'rgba(155,48,255,0.3)',
}
const LIGHT = {
  bg: '#f6f5ff', navBg: 'rgba(246,245,255,0.92)',
  cardBg: '#ffffff',
  text: '#0d0c1e', muted: 'rgba(13,12,30,0.55)', dim: 'rgba(13,12,30,0.32)',
  vvdim: 'rgba(13,12,30,0.07)',
  primary: '#7c2af5', primaryBg: 'rgba(124,42,245,0.08)',
  primaryBgLight: 'rgba(124,42,245,0.04)',
  accent: '#0a8c00', accentBg: 'rgba(10,140,0,0.08)',
  accentBorder: 'rgba(10,140,0,0.3)',
  border: 'rgba(124,42,245,0.12)', borderStrong: 'rgba(124,42,245,0.22)',
}

function makeCSS() {
  return `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  .sk-nav { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
  .sk-theme-btn { transition: transform 0.11s; background: transparent; border: none; cursor: pointer; padding: 0.4rem; }
  .sk-theme-btn:hover { transform: rotate(18deg) scale(1.15); }
  @keyframes sk-pending-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.65; transform:scale(0.93); } }
  .sk-pending-pulse { animation: sk-pending-pulse 2.2s ease-in-out infinite; }
  @keyframes sk-pop-in { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  .sk-card { animation: sk-pop-in 0.3s ease both; }
  `
}

export default function PendingPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const isDark = theme === 'dark'
  const C = isDark ? DARK : LIGHT

  useEffect(() => {
    const saved = localStorage.getItem('sk-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  function toggleTheme() {
    const t = isDark ? 'light' : 'dark'
    setTheme(t)
    localStorage.setItem('sk-theme', t)
  }

  return (
    <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{makeCSS()}</style>

      <nav className="sk-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontSize: '1.55rem', fontWeight: 900, letterSpacing: '0.5px', color: C.text, textDecoration: 'none' }}>
          Sheik<span style={{ color: C.accent }}>STREAM</span>
        </a>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={toggleTheme} className="sk-theme-btn" style={{ color: C.muted }}>
            {isDark
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
          <a href="/" style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', textDecoration: 'none' }}>
            Início
          </a>
        </div>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem' }}>
        <div className="sk-card" style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderTop: `3px solid ${C.primary}`, borderRadius: '18px', padding: '3rem 2.5rem', width: '100%', maxWidth: '440px', textAlign: 'center', boxShadow: `0 12px 50px ${C.primaryBgLight}` }}>

          <div className="sk-pending-pulse" style={{ width: '72px', height: '72px', borderRadius: '50%', background: C.primaryBg, border: `2px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
            ⏳
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: '0.68rem', padding: '0.22rem 0.85rem', borderRadius: '999px', marginBottom: '1.4rem', fontWeight: 700, letterSpacing: '1px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
            AGUARDANDO APROVAÇÃO
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '1rem', color: C.text }}>Acesso pendente</h1>

          <p style={{ fontSize: '0.9rem', color: C.muted, lineHeight: 1.75, maxWidth: '340px', margin: '0 auto 2rem' }}>
            Sua conta está na fila de espera. O administrador irá revisar seu acesso em breve e você será notificado assim que for aprovado.
          </p>

          <p style={{ fontSize: '0.78rem', color: C.dim, marginBottom: '2rem' }}>
            Após aprovado, basta entrar com a Twitch novamente.
          </p>

          <a href="/" style={{ display: 'inline-block', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.65rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem', textDecoration: 'none' }}>
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  )
}
