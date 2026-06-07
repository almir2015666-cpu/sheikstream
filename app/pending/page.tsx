'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SiTwitch, SiYoutube, SiKick, SiDiscord, SiGoogle } from 'react-icons/si'
import type { IconType } from 'react-icons'

const PLATFORM_ICONS: Record<string, IconType> = {
  Twitch: SiTwitch, YouTube: SiYoutube, Kick: SiKick,
  Discord: SiDiscord, Google: SiGoogle,
}
const PLATFORM_COLORS: Record<string, string> = {
  Twitch: '#9147ff', YouTube: '#ff0000', Kick: '#53fc18',
  Discord: '#5865f2', Google: '#4285f4', email: '#9b30ff',
}

const DARK = {
  bg: '#08090d', navBg: 'rgba(8,9,13,0.92)',
  cardBg: '#0f1018', cardBgAlt: '#0e0f17',
  text: '#f0eefc', muted: 'rgba(240,238,252,0.5)', dim: 'rgba(240,238,252,0.28)',
  vdim: 'rgba(240,238,252,0.22)', vvdim: 'rgba(240,238,252,0.08)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  primaryBgMed: 'rgba(155,48,255,0.15)', primaryBgLight: 'rgba(155,48,255,0.07)',
  primaryBg3: 'rgba(155,48,255,0.3)',
  accent: '#39ff14', accentBg: 'rgba(57,255,20,0.1)', accentBg15: 'rgba(57,255,20,0.15)',
  accentBorder: 'rgba(57,255,20,0.3)',
  border: 'rgba(155,48,255,0.18)', borderStrong: 'rgba(155,48,255,0.3)',
}
const LIGHT = {
  bg: '#f6f5ff', navBg: 'rgba(246,245,255,0.92)',
  cardBg: '#ffffff', cardBgAlt: '#faf9ff',
  text: '#0d0c1e', muted: 'rgba(13,12,30,0.55)', dim: 'rgba(13,12,30,0.32)',
  vdim: 'rgba(13,12,30,0.22)', vvdim: 'rgba(13,12,30,0.07)',
  primary: '#7c2af5', primaryBg: 'rgba(124,42,245,0.08)',
  primaryBgMed: 'rgba(124,42,245,0.12)', primaryBgLight: 'rgba(124,42,245,0.04)',
  primaryBg3: 'rgba(124,42,245,0.22)',
  accent: '#0a8c00', accentBg: 'rgba(10,140,0,0.08)', accentBg15: 'rgba(10,140,0,0.12)',
  accentBorder: 'rgba(10,140,0,0.3)',
  border: 'rgba(124,42,245,0.12)', borderStrong: 'rgba(124,42,245,0.22)',
}

function makeCSS(C: typeof DARK) {
  return `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  .sk-nav { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
  .sk-theme-btn { transition: transform 0.25s; }
  .sk-theme-btn:hover { transform: rotate(18deg) scale(1.15); }
  .sk-btn-cta { transition: all 0.2s; }
  .sk-btn-cta:hover { filter: brightness(1.1); transform: translateY(-2px); }
  @keyframes sk-circle-collapse { from { clip-path: circle(200vmax at var(--tx) var(--ty)); } to { clip-path: circle(0px at var(--tx) var(--ty)); } }
  .sk-theme-overlay { animation: sk-circle-collapse 1.05s cubic-bezier(0.65, 0, 0.35, 1) forwards; }
  @keyframes sk-pending-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.94); } }
  .sk-pending-pulse { animation: sk-pending-pulse 2s ease-in-out infinite; }
  @keyframes sk-pop-in { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  .sk-card { animation: sk-pop-in 0.35s ease both; }
  `
}

type Overlay = { active: boolean; x: string; y: string; newTheme: 'dark' | 'light' }

function PendingContent() {
  const searchParams = useSearchParams()
  const platform = searchParams.get('platform') || 'Twitch'

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [overlay, setOverlay] = useState<Overlay>({ active: false, x: '0px', y: '0px', newTheme: 'light' })
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

  const platColor = PLATFORM_COLORS[platform] || C.primary
  const PlatIcon = PLATFORM_ICONS[platform]
  const themeOverlay = overlay.active ? (
    <div className="sk-theme-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
      background: overlay.newTheme === 'dark' ? LIGHT.bg : DARK.bg,
      '--tx': overlay.x, '--ty': overlay.y,
    } as React.CSSProperties} />
  ) : null

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
            style={{ background: C.primaryBg, border: `1px solid ${C.border}`, color: C.primary, padding: '0.45rem 0.6rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isDark
              ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            }
          </button>
          <a href="/" style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', textDecoration: 'none' }}>
            Início
          </a>
        </div>
      </nav>

      {/* Content */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem' }}>
        <div className="sk-card" style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderTop: `3px solid ${C.primary}`, borderRadius: '18px', padding: '3rem 2.5rem', width: '100%', maxWidth: '460px', textAlign: 'center', boxShadow: `0 12px 50px ${C.primaryBgLight}` }}>

          <div className="sk-pending-pulse" style={{ width: '72px', height: '72px', borderRadius: '50%', background: C.primaryBg, border: `2px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
            ⏳
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: '0.68rem', padding: '0.22rem 0.85rem', borderRadius: '999px', marginBottom: '1.4rem', fontWeight: 700, letterSpacing: '1px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
            AGUARDANDO APROVAÇÃO
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.6rem', color: C.text }}>Quase lá!</h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            {PlatIcon && <PlatIcon size={18} color={platColor} />}
            <span style={{ fontSize: '0.88rem', color: C.muted }}>
              Conectado via <strong style={{ color: C.text }}>{platform === 'email' ? 'e-mail' : platform}</strong>
            </span>
          </div>

          <p style={{ fontSize: '0.87rem', color: C.muted, lineHeight: 1.75, maxWidth: '340px', margin: '0 auto 2rem' }}>
            Sua conta está aguardando aprovação manual. Você será notificado assim que o acesso for liberado.
          </p>

          <div style={{ background: C.cardBgAlt, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1.2rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.7rem', color: C.vdim, marginBottom: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Sua posição na fila</div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: C.primary, lineHeight: 1 }}>#247</div>
            <div style={{ fontSize: '0.78rem', color: C.dim, marginTop: '0.3rem' }}>Tempo estimado: 24–48h</div>
          </div>

          {/* Demo: simular aprovação */}
          <div style={{ background: C.accentBg15, border: `1px dashed ${C.accentBorder}`, borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.6rem', letterSpacing: '0.5px' }}>DEMONSTRAÇÃO</div>
            <a
              href="/terms"
              style={{ display: 'block', background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
            >
              Simular aprovação do admin →
            </a>
          </div>

          <a href="/" style={{ display: 'inline-block', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.6rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem', textDecoration: 'none' }}>
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  )
}

export default function PendingPage() {
  return (
    <Suspense fallback={<div style={{ background: '#08090d', minHeight: '100vh' }} />}>
      <PendingContent />
    </Suspense>
  )
}
