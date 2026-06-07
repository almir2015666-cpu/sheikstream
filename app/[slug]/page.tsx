'use client'
import { use, useState, useEffect } from 'react'
import {
  SiTwitch, SiYoutube, SiKick, SiTiktok, SiFacebook,
  SiDiscord, SiInstagram, SiGoogle, SiX, SiWhatsapp,
} from 'react-icons/si'
import type { IconType } from 'react-icons'
import { LEGAL } from '../lib/legal'

const PLATFORM_ICONS: Record<string, IconType> = {
  Twitch: SiTwitch, YouTube: SiYoutube, Kick: SiKick,
  TikTok: SiTiktok, Facebook: SiFacebook, Discord: SiDiscord,
  Instagram: SiInstagram, Google: SiGoogle, X: SiX, WhatsApp: SiWhatsapp,
}
function PIcon({ id, color, size = 18 }: { id: string; color: string; size?: number }) {
  const Icon = PLATFORM_ICONS[id]
  return Icon ? <Icon size={size} color={color} /> : null
}

const DARK = {
  bg: '#08090d', navBg: 'rgba(8,9,13,0.92)', footerBg: 'rgba(6,7,11,0.99)',
  cardBg: '#0f1018', cardBgAlt: '#0e0f17',
  text: '#f0eefc', muted: 'rgba(240,238,252,0.5)', dim: 'rgba(240,238,252,0.28)',
  vdim: 'rgba(240,238,252,0.22)', vvdim: 'rgba(240,238,252,0.08)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  primaryBgMed: 'rgba(155,48,255,0.15)', primaryBgLight: 'rgba(155,48,255,0.07)',
  primaryBg3: 'rgba(155,48,255,0.3)',
  accent: '#39ff14', accentBg: 'rgba(57,255,20,0.1)', accentBg15: 'rgba(57,255,20,0.15)',
  accentBorder: 'rgba(57,255,20,0.3)',
  border: 'rgba(155,48,255,0.18)', borderStrong: 'rgba(155,48,255,0.3)',
  borderGlow: 'rgba(155,48,255,0.35)', borderFaint: 'rgba(155,48,255,0.15)',
  appBtn: 'rgba(155,48,255,0.15)', appBtnBorder: 'rgba(155,48,255,0.4)',
}
const LIGHT = {
  bg: '#f6f5ff', navBg: 'rgba(246,245,255,0.92)', footerBg: 'rgba(236,234,255,0.99)',
  cardBg: '#ffffff', cardBgAlt: '#faf9ff',
  text: '#0d0c1e', muted: 'rgba(13,12,30,0.55)', dim: 'rgba(13,12,30,0.32)',
  vdim: 'rgba(13,12,30,0.22)', vvdim: 'rgba(13,12,30,0.07)',
  primary: '#7c2af5', primaryBg: 'rgba(124,42,245,0.08)',
  primaryBgMed: 'rgba(124,42,245,0.12)', primaryBgLight: 'rgba(124,42,245,0.04)',
  primaryBg3: 'rgba(124,42,245,0.22)',
  accent: '#0a8c00', accentBg: 'rgba(10,140,0,0.08)', accentBg15: 'rgba(10,140,0,0.12)',
  accentBorder: 'rgba(10,140,0,0.3)',
  border: 'rgba(124,42,245,0.12)', borderStrong: 'rgba(124,42,245,0.22)',
  borderGlow: 'rgba(124,42,245,0.3)', borderFaint: 'rgba(124,42,245,0.1)',
  appBtn: 'rgba(124,42,245,0.1)', appBtnBorder: 'rgba(124,42,245,0.35)',
}

function makeCSS(C: typeof DARK) {
  return `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  .sk-nav { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
  .sk-nav-link { transition: color 0.15s; }
  .sk-nav-link:hover { color: ${C.text} !important; }
  .sk-theme-btn { transition: transform 0.25s, opacity 0.15s; }
  .sk-theme-btn:hover { transform: rotate(18deg) scale(1.15); }
  .sk-btn-cta { transition: all 0.2s; }
  .sk-btn-cta:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 8px 32px ${C.primaryBg3} !important; }
  .sk-app-btn { transition: all 0.18s; }
  .sk-app-btn:hover { background: ${C.appBtn} !important; border-color: ${C.primary} !important; color: ${C.primary} !important; }
  .sk-legal-link { transition: color 0.15s; }
  .sk-legal-link:hover { color: ${C.primary} !important; }
  .sk-social-icon { transition: all 0.18s; }
  .sk-social-icon:hover { border-color: ${C.borderStrong} !important; background: ${C.primaryBg} !important; transform: translateY(-3px); }
  .sk-content-link { transition: color 0.15s; }
  .sk-content-link:hover { color: ${C.primary} !important; }
  @keyframes sk-circle-expand { from { clip-path: circle(0px at var(--tx) var(--ty)); } to { clip-path: circle(200vmax at var(--tx) var(--ty)); } }
  @keyframes sk-glow-pulse { 0%,100% { opacity: 0.28; } 50% { opacity: 0.52; } }
  @keyframes sk-fade-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  .sk-theme-overlay { animation: sk-circle-expand 1.05s cubic-bezier(0.65, 0, 0.35, 1) forwards; }
  .sk-fade-up { animation: sk-fade-up 0.5s ease both; }
  .sk-fade-up-2 { animation: sk-fade-up 0.5s 0.12s ease both; }
  .sk-glow { animation: sk-glow-pulse 3.5s ease-in-out infinite; }
  `
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

const EMOJI_HEADERS = /^[✅🔨📋💡📧🐛💼🔒💬⚡📚📬✍️]/u

function renderContent(content: string, C: typeof DARK) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, i) => {
    if (!line.trim()) {
      elements.push(<div key={i} style={{ height: '0.6rem' }} />)
      return
    }

    if (/^\d+\.\s/.test(line)) {
      elements.push(
        <h3 key={i} style={{ fontSize: '1.05rem', fontWeight: 800, color: C.text, marginTop: '2rem', marginBottom: '0.5rem', letterSpacing: '-0.3px', borderLeft: `3px solid ${C.primary}`, paddingLeft: '0.85rem' }}>
          {line}
        </h3>
      )
      return
    }

    if (
      line.trim().length > 3 &&
      line.trim() === line.trim().toUpperCase() &&
      !/^\d/.test(line) &&
      !EMOJI_HEADERS.test(line) &&
      !/^[•▪]/.test(line)
    ) {
      elements.push(
        <h3 key={i} style={{ fontSize: '0.7rem', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '2.5px', marginTop: '2.2rem', marginBottom: '0.7rem' }}>
          {line}
        </h3>
      )
      return
    }

    if (EMOJI_HEADERS.test(line)) {
      elements.push(
        <div key={i} style={{ fontSize: '0.97rem', fontWeight: 700, color: C.text, marginTop: '1.8rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', background: C.primaryBg, border: `1px solid ${C.border}`, borderRadius: '8px' }}>
          {line}
        </div>
      )
      return
    }

    if (/^[•▪]/.test(line)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.5rem', paddingLeft: '0.25rem' }}>
          <span style={{ color: C.primary, fontWeight: 700, flexShrink: 0, marginTop: '0.15rem', fontSize: '0.7rem' }}>▸</span>
          <span style={{ color: C.muted, fontSize: '0.9rem', lineHeight: 1.8 }}>{line.replace(/^[•▪]\s*/, '')}</span>
        </div>
      )
      return
    }

    if (line.trim() === '---') {
      elements.push(<div key={i} style={{ height: '1px', background: C.border, margin: '1.8rem 0' }} />)
      return
    }

    if (line.includes('@sheikstream') || (line.includes('@') && !line.includes(' '))) {
      elements.push(
        <div key={i} style={{ fontSize: '0.9rem', color: C.primary, marginBottom: '0.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.primary, display: 'inline-block', flexShrink: 0 }} />
          {line}
        </div>
      )
      return
    }

    elements.push(
      <p key={i} style={{ fontSize: '0.9rem', color: C.muted, lineHeight: 1.9, margin: '0 0 0.4rem' }}>
        {line}
      </p>
    )
  })

  return elements
}

type Overlay = { active: boolean; x: string; y: string; newTheme: 'dark' | 'light' }

const CATEGORY_ICONS: Record<string, string> = {
  Legal: '⚖️', Empresa: '🏢', Produto: '🚀', 'Conteúdo': '📝',
}

export default function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
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
    setTimeout(() => {
      setOverlay(o => ({ ...o, active: false }))
    }, 1100)
  }

  const entry = LEGAL[slug]

  const themeOverlay = overlay.active ? (
    <div className="sk-theme-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
      background: overlay.newTheme === 'dark' ? DARK.bg : LIGHT.bg,
      '--tx': overlay.x, '--ty': overlay.y,
    } as React.CSSProperties} />
  ) : null

  if (!entry) {
    return (
      <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: DARK.bg, minHeight: '100vh', color: DARK.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '4rem', fontWeight: 900, color: DARK.primary }}>404</div>
        <div style={{ color: DARK.muted }}>Página não encontrada</div>
        <a href="/" style={{ color: DARK.primary, textDecoration: 'none', marginTop: '0.5rem', fontSize: '0.9rem' }}>← Voltar ao início</a>
      </div>
    )
  }

  const socialLinks = [
    { id: 'X', color: isDark ? '#e7e9ea' : '#1d1d1d' },
    { id: 'Discord', color: '#5865f2' },
    { id: 'Twitch', color: '#9147ff' },
    { id: 'Instagram', color: '#e1306c' },
  ]

  return (
    <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text, display: 'flex', flexDirection: 'column' }}>
      <style>{makeCSS(C)}</style>
      {themeOverlay}

      {/* ── Nav — igual à página principal ── */}
      <nav className="sk-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 2.5rem', borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontSize: '1.55rem', fontWeight: 900, letterSpacing: '0.5px', color: C.text, textDecoration: 'none' }}>
          Sheik<span style={{ color: C.accent }}>STREAM</span>
        </a>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a href="/" className="sk-nav-link" style={{ color: C.muted, fontSize: '0.88rem', fontWeight: 500, textDecoration: 'none' }}>Início</a>
          <a href="/roadmap" className="sk-nav-link" style={{ color: C.muted, fontSize: '0.88rem', fontWeight: 500, textDecoration: 'none' }}>Roadmap</a>
          <a href="/contato" className="sk-nav-link" style={{ color: C.muted, fontSize: '0.88rem', fontWeight: 500, textDecoration: 'none' }}>Contato</a>
          {themeBtn(C, isDark, handleThemeToggle)}
          <a href="/" className="sk-app-btn" style={{
            background: C.appBtn, color: C.primary,
            border: `1px solid ${C.appBtnBorder}`,
            padding: '0.48rem 1.2rem', borderRadius: '7px',
            fontSize: '0.87rem', fontWeight: 700, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.85 }}>
              <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
            </svg>
            App
          </a>
        </div>
      </nav>

      {/* ── Hero — mesmo estilo da landing ── */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '4rem 2.5rem 3.5rem', borderBottom: `1px solid ${C.border}` }}>
        {/* Gradient top line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg,transparent 5%,${C.primary},${C.accent},${C.primary},transparent 95%)` }} />
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${C.primary}18 1px, transparent 1px)`, backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        {/* Radial glow */}
        <div className="sk-glow" style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '400px', background: `radial-gradient(ellipse at center, ${C.primary}18 0%, transparent 65%)`, pointerEvents: 'none' }} />

        <div className="sk-fade-up" style={{ maxWidth: '820px', margin: '0 auto', position: 'relative' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', color: C.dim, marginBottom: '1.3rem', flexWrap: 'wrap' }}>
            <a href="/" style={{ color: C.dim, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.color = C.primary)}
              onMouseOut={e => (e.currentTarget.style.color = C.dim)}>
              Início
            </a>
            <span style={{ color: C.vdim }}>›</span>
            <span style={{ color: C.primary, fontWeight: 600 }}>{entry.category}</span>
            <span style={{ color: C.vdim }}>›</span>
            <span style={{ color: C.muted }}>{entry.title}</span>
          </div>

          {/* Category badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: C.primaryBg, border: `1px solid ${C.borderStrong}`, color: C.primary, fontSize: '0.66rem', padding: '0.24rem 0.9rem', borderRadius: '999px', marginBottom: '1.1rem', letterSpacing: '1.5px', fontWeight: 700, textTransform: 'uppercase' }}>
            {CATEGORY_ICONS[entry.category] || '📄'} {entry.category}
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.08, margin: '0 0 1rem', color: C.text }}>
            {entry.title}
          </h1>
          <p style={{ fontSize: '1rem', color: C.muted, margin: 0, lineHeight: 1.7, maxWidth: '540px' }}>
            {entry.desc}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <main style={{ flex: 1, padding: '3rem 2.5rem 5rem', maxWidth: '820px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div className="sk-fade-up-2" style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '2.8rem 3rem', boxShadow: isDark ? '0 4px 40px rgba(0,0,0,0.35)' : '0 4px 40px rgba(100,80,200,0.06)' }}>
          {renderContent(entry.content, C)}
        </div>

        {/* Quick links */}
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: '← Voltar ao início', href: '/' },
            { label: 'Roadmap', href: '/roadmap' },
            { label: 'Sobre', href: '/sobre' },
            { label: 'Contato', href: '/contato' },
            { label: 'Termos', href: '/termos-e-condicoes' },
            { label: 'Privacidade', href: '/privacidade' },
          ].filter(l => l.href !== `/${slug}`).map(l => (
            <a key={l.href} href={l.href} className="sk-content-link" style={{
              fontSize: '0.8rem', color: C.dim, textDecoration: 'none',
              padding: '0.35rem 0.95rem', background: C.vvdim,
              border: `1px solid ${C.border}`, borderRadius: '999px',
            }}>
              {l.label}
            </a>
          ))}
        </div>
      </main>

      {/* ── Footer — mesmo estilo da landing ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.footerBg }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2.5rem 2.5rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
            {/* Brand */}
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.65rem', color: C.text }}>
                Sheik<span style={{ color: C.accent }}>STREAM</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: C.dim, lineHeight: 1.75, margin: '0 0 1.2rem', maxWidth: '210px' }}>
                O hub definitivo para streamers brasileiros gerenciarem todas as suas plataformas.
              </p>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {socialLinks.map(s => (
                  <a key={s.id} href="#" className="sk-social-icon" style={{ width: '30px', height: '30px', background: C.vvdim, border: `1px solid ${C.border}`, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                    <PIcon id={s.id} color={s.color} size={13} />
                  </a>
                ))}
              </div>
            </div>

            {/* Produto */}
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '1.8px', color: C.vdim, textTransform: 'uppercase', marginBottom: '1rem' }}>Produto</div>
              {[
                { label: 'Início', href: '/' },
                { label: 'Roadmap', href: '/roadmap' },
                { label: 'Changelog', href: '/changelog' },
              ].map(l => (
                <a key={l.label} href={l.href} className="sk-legal-link" style={{ display: 'block', fontSize: '0.82rem', color: C.dim, marginBottom: '0.55rem', textDecoration: 'none' }}>{l.label}</a>
              ))}
            </div>

            {/* Legal */}
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '1.8px', color: C.vdim, textTransform: 'uppercase', marginBottom: '1rem' }}>Legal</div>
              {[
                { label: 'Sobre', href: '/sobre' },
                { label: 'Contato', href: '/contato' },
                { label: 'Termos', href: '/termos-e-condicoes' },
                { label: 'Privacidade', href: '/privacidade' },
                { label: 'Cookies', href: '/cookies' },
              ].map(l => (
                <a key={l.label} href={l.href} className="sk-legal-link" style={{ display: 'block', fontSize: '0.82rem', color: C.dim, marginBottom: '0.55rem', textDecoration: 'none' }}>{l.label}</a>
              ))}
            </div>
          </div>

          <div style={{ height: '1px', background: C.border, marginBottom: '1.3rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.72rem', color: C.vdim }}>© 2025 Sheikstream. Feito com carinho para streamers brasileiros.</div>
            <div style={{ display: 'flex', gap: '1.2rem' }}>
              {[
                { label: 'Termos', href: '/termos-e-condicoes' },
                { label: 'Privacidade', href: '/privacidade' },
                { label: 'Cookies', href: '/cookies' },
              ].map(l => (
                <a key={l.label} href={l.href} className="sk-legal-link" style={{ fontSize: '0.72rem', color: C.vdim, textDecoration: 'none' }}>{l.label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function themeBtn(C: typeof DARK, isDark: boolean, handler: (e: React.MouseEvent<HTMLButtonElement>) => void) {
  return (
    <button
      onClick={handler}
      className="sk-theme-btn"
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      style={{
        background: C.primaryBg, border: `1px solid ${C.border}`,
        color: C.primary, padding: '0.45rem 0.6rem', borderRadius: '8px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {isDark
        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
      }
    </button>
  )
}
