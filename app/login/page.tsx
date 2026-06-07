'use client'
import { useState, useEffect } from 'react'
import {
  SiTwitch, SiYoutube, SiKick, SiDiscord, SiGoogle,
} from 'react-icons/si'
import type { IconType } from 'react-icons'

const PLATFORM_ICONS: Record<string, IconType> = {
  Twitch: SiTwitch, YouTube: SiYoutube, Kick: SiKick,
  Discord: SiDiscord, Google: SiGoogle,
}

const DARK = {
  bg: '#08090d', navBg: 'rgba(8,9,13,0.92)',
  cardBg: '#0f1018', cardBgAlt: '#0e0f17',
  text: '#f0eefc', muted: 'rgba(240,238,252,0.5)', dim: 'rgba(240,238,252,0.28)',
  vdim: 'rgba(240,238,252,0.22)', vvdim: 'rgba(240,238,252,0.08)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  primaryBgMed: 'rgba(155,48,255,0.15)', primaryBgLight: 'rgba(155,48,255,0.07)',
  primaryBg3: 'rgba(155,48,255,0.3)',
  accent: '#39ff14',
  border: 'rgba(155,48,255,0.18)', borderStrong: 'rgba(155,48,255,0.3)',
  inputBg: '#08090d', inputBorder: 'rgba(155,48,255,0.3)',
  oauthBtnBg: 'rgba(255,255,255,0.03)', oauthBtnBorder: 'rgba(255,255,255,0.1)',
  separatorBg: 'rgba(255,255,255,0.08)',
}
const LIGHT = {
  bg: '#f6f5ff', navBg: 'rgba(246,245,255,0.92)',
  cardBg: '#ffffff', cardBgAlt: '#faf9ff',
  text: '#0d0c1e', muted: 'rgba(13,12,30,0.55)', dim: 'rgba(13,12,30,0.32)',
  vdim: 'rgba(13,12,30,0.22)', vvdim: 'rgba(13,12,30,0.07)',
  primary: '#7c2af5', primaryBg: 'rgba(124,42,245,0.08)',
  primaryBgMed: 'rgba(124,42,245,0.12)', primaryBgLight: 'rgba(124,42,245,0.04)',
  primaryBg3: 'rgba(124,42,245,0.22)',
  accent: '#0a8c00',
  border: 'rgba(124,42,245,0.12)', borderStrong: 'rgba(124,42,245,0.22)',
  inputBg: '#f6f5ff', inputBorder: 'rgba(124,42,245,0.28)',
  oauthBtnBg: 'rgba(13,12,30,0.02)', oauthBtnBorder: 'rgba(13,12,30,0.1)',
  separatorBg: 'rgba(13,12,30,0.08)',
}

function makeCSS(C: typeof DARK) {
  return `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  .sk-nav { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
  .sk-theme-btn { transition: transform 0.25s, opacity 0.15s; }
  .sk-theme-btn:hover { transform: rotate(18deg) scale(1.15); }
  .sk-btn-cta { transition: all 0.2s; }
  .sk-btn-cta:hover { filter: brightness(1.1); transform: translateY(-2px); }
  .sk-oauth-btn { transition: all 0.18s; }
  .sk-oauth-btn:hover { border-color: rgba(155,48,255,0.4) !important; background: ${C.primaryBgLight} !important; }
  @keyframes sk-circle-expand { from { clip-path: circle(0px at var(--tx) var(--ty)); } to { clip-path: circle(200vmax at var(--tx) var(--ty)); } }
  .sk-theme-overlay { animation: sk-circle-expand 1.05s cubic-bezier(0.65, 0, 0.35, 1) forwards; }
  @keyframes sk-pop-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .sk-card { animation: sk-pop-in 0.35s ease both; }
  `
}

type Overlay = { active: boolean; x: string; y: string; newTheme: 'dark' | 'light' }

export default function LoginPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [overlay, setOverlay] = useState<Overlay>({ active: false, x: '0px', y: '0px', newTheme: 'light' })
  const [loading, setLoading] = useState('')
  const isDark = theme === 'dark'
  const C = isDark ? DARK : LIGHT

  useEffect(() => {
    const saved = localStorage.getItem('sk-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  function handleThemeToggle(e: React.MouseEvent<HTMLButtonElement>) {
    if (overlay.active) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = `${Math.round(rect.left + rect.width / 2)}px`
    const y = `${Math.round(rect.top + rect.height / 2)}px`
    const newTheme = isDark ? 'light' : 'dark'
    setTheme(newTheme)
    setOverlay({ active: true, x, y, newTheme })
    localStorage.setItem('sk-theme', newTheme)
    setTimeout(() => setOverlay(o => ({ ...o, active: false })), 1100)
  }

  function handleOAuth(platform: string) {
    setLoading(platform)
    setTimeout(() => {
      window.location.href = `/pending?platform=${encodeURIComponent(platform)}`
    }, 1200)
  }

  const themeOverlay = overlay.active ? (
    <div className="sk-theme-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
      background: overlay.newTheme === 'dark' ? DARK.bg : LIGHT.bg,
      '--tx': overlay.x, '--ty': overlay.y,
    } as React.CSSProperties} />
  ) : null

  const oauthPlatforms = [
    { id: 'Twitch',  color: '#9147ff', bg: 'rgba(145,71,255,0.12)', label: 'Entrar com Twitch' },
    { id: 'YouTube', color: '#ff0000', bg: 'rgba(255,0,0,0.08)',    label: 'Entrar com YouTube' },
    { id: 'Kick',    color: '#53fc18', bg: 'rgba(83,252,24,0.08)',  label: 'Entrar com Kick' },
    { id: 'Discord', color: '#5865f2', bg: 'rgba(88,101,242,0.1)',  label: 'Entrar com Discord' },
    { id: 'Google',  color: '#4285f4', bg: 'rgba(66,133,244,0.08)', label: 'Entrar com Google' },
  ]

  return (
    <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{makeCSS(C)}</style>
      {themeOverlay}

      {/* Nav */}
      <nav className="sk-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontSize: '1.55rem', fontWeight: 900, letterSpacing: '0.5px', color: C.text, textDecoration: 'none' }}>
          Sheik<span style={{ color: C.accent }}>STREAM</span>
        </a>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleThemeToggle}
            className="sk-theme-btn"
            title={isDark ? 'Modo claro' : 'Modo escuro'}
            style={{ background: C.primaryBg, border: `1px solid ${C.border}`, color: C.primary, padding: '0.45rem 0.6rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isDark
              ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            }
          </button>
          <a href="/" style={{ background: 'transparent', border: `1px solid ${C.vvdim}`, color: C.muted, padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block' }}>
            Voltar
          </a>
        </div>
      </nav>

      {/* Login card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem' }}>
        <div className="sk-card" style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderTop: `3px solid ${C.primary}`, borderRadius: '16px', padding: '2.2rem', width: '100%', maxWidth: '410px', boxShadow: `0 8px 40px ${C.primaryBgLight}` }}>
          <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '0.5px', color: C.text }}>
              Sheik<span style={{ color: C.accent }}>STREAM</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: C.muted, marginTop: '0.4rem' }}>
              Conecte sua plataforma e entre no hub
            </div>
          </div>

          {oauthPlatforms.map(p => {
            const Icon = PLATFORM_ICONS[p.id]
            const isLoading = loading === p.id
            return (
              <button
                key={p.id}
                onClick={() => handleOAuth(p.id)}
                disabled={!!loading}
                className="sk-oauth-btn"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: '0.72rem 1rem', borderRadius: '8px', marginBottom: '0.6rem',
                  border: `1px solid ${isLoading ? p.color : C.oauthBtnBorder}`,
                  background: isLoading ? p.bg : C.oauthBtnBg,
                  color: C.text, fontSize: '0.9rem', fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left',
                  opacity: loading && !isLoading ? 0.45 : 1,
                }}
              >
                <span style={{ width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {Icon && <Icon size={20} color={p.color} />}
                </span>
                <span style={{ flex: 1 }}>{isLoading ? 'Conectando...' : p.label}</span>
                <span style={{ color: C.vdim, fontSize: '13px' }}>{isLoading ? '⏳' : '›'}</span>
              </button>
            )
          })}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: C.separatorBg }} />
            <span style={{ fontSize: '0.75rem', color: C.vdim }}>ou entre com e-mail</span>
            <div style={{ flex: 1, height: '1px', background: C.separatorBg }} />
          </div>

          <input
            type="email"
            placeholder="seu@email.com"
            style={{ width: '100%', padding: '0.72rem 1rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.9rem', outline: 'none', marginBottom: '0.6rem', boxSizing: 'border-box' }}
          />
          <button
            onClick={() => { window.location.href = '/pending?platform=email' }}
            className="sk-btn-cta"
            style={{ width: '100%', padding: '0.72rem', background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: `0 4px 20px ${C.primaryBgMed}` }}
          >
            Entrar com e-mail
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.78rem', color: C.vdim }}>
            Não tem conta?{' '}
            <a href="/" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>
              Criar conta grátis
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
