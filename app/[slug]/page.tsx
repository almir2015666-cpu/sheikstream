'use client'
import { use, useState, useEffect } from 'react'
import { LEGAL } from '../lib/legal'

const DARK = {
  bg: '#08090d', navBg: 'rgba(8,9,13,0.92)', footerBg: 'rgba(6,7,11,0.99)',
  cardBg: '#0f1018', cardBgAlt: '#0e0f17',
  text: '#f0eefc', muted: 'rgba(240,238,252,0.52)', dim: 'rgba(240,238,252,0.28)',
  vdim: 'rgba(240,238,252,0.18)', vvdim: 'rgba(240,238,252,0.07)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)', primaryBgLight: 'rgba(155,48,255,0.07)',
  primaryBgMed: 'rgba(155,48,255,0.18)', primaryBg3: 'rgba(155,48,255,0.3)',
  accent: '#39ff14', accentBg: 'rgba(57,255,20,0.1)', accentBorder: 'rgba(57,255,20,0.25)',
  border: 'rgba(155,48,255,0.18)', borderStrong: 'rgba(155,48,255,0.3)', borderFaint: 'rgba(155,48,255,0.1)',
  heroBg: 'rgba(155,48,255,0.06)',
}
const LIGHT = {
  bg: '#f6f5ff', navBg: 'rgba(246,245,255,0.92)', footerBg: 'rgba(236,234,255,0.99)',
  cardBg: '#ffffff', cardBgAlt: '#faf9ff',
  text: '#0d0c1e', muted: 'rgba(13,12,30,0.58)', dim: 'rgba(13,12,30,0.34)',
  vdim: 'rgba(13,12,30,0.22)', vvdim: 'rgba(13,12,30,0.07)',
  primary: '#7c2af5', primaryBg: 'rgba(124,42,245,0.08)', primaryBgLight: 'rgba(124,42,245,0.04)',
  primaryBgMed: 'rgba(124,42,245,0.14)', primaryBg3: 'rgba(124,42,245,0.22)',
  accent: '#0a8c00', accentBg: 'rgba(10,140,0,0.08)', accentBorder: 'rgba(10,140,0,0.25)',
  border: 'rgba(124,42,245,0.12)', borderStrong: 'rgba(124,42,245,0.22)', borderFaint: 'rgba(124,42,245,0.08)',
  heroBg: 'rgba(124,42,245,0.04)',
}

type C = typeof DARK

function makeCSS(C: typeof DARK) {
  return `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  .sk-nav { backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
  .sk-theme-btn { transition: transform 0.22s, opacity 0.15s; }
  .sk-theme-btn:hover { transform: rotate(18deg) scale(1.15); }
  .sk-back-btn { transition: color 0.15s, background 0.15s; }
  .sk-back-btn:hover { color: ${C.text} !important; background: ${C.primaryBgLight} !important; }
  .sk-legal-link { transition: color 0.15s; cursor: pointer; }
  .sk-legal-link:hover { color: ${C.primary} !important; }
  @keyframes sk-circle-expand { from { clip-path: circle(0px at var(--tx) var(--ty)); } to { clip-path: circle(200vmax at var(--tx) var(--ty)); } }
  .sk-theme-overlay { animation: sk-circle-expand 1.05s cubic-bezier(0.65, 0, 0.35, 1) forwards; }
  @keyframes sk-fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .sk-fade-up { animation: sk-fade-up 0.5s ease both; }
  .sk-section-link { transition: all 0.15s; cursor: pointer; }
  .sk-section-link:hover { color: ${C.primary} !important; }
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
      elements.push(<div key={i} style={{ height: '0.65rem' }} />)
      return
    }

    // Numbered section header: "1. TITLE"
    if (/^\d+\.\s/.test(line)) {
      elements.push(
        <h3 key={i} style={{ fontSize: '1rem', fontWeight: 800, color: C.text, marginTop: '1.8rem', marginBottom: '0.5rem', letterSpacing: '-0.3px' }}>
          {line}
        </h3>
      )
      return
    }

    // ALL-CAPS section header (len > 3, no emoji)
    if (
      line.trim().length > 3 &&
      line.trim() === line.trim().toUpperCase() &&
      !/^\d/.test(line) &&
      !EMOJI_HEADERS.test(line) &&
      !/^[•▪]/.test(line)
    ) {
      elements.push(
        <h3 key={i} style={{ fontSize: '0.75rem', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '2px', marginTop: '2rem', marginBottom: '0.7rem' }}>
          {line}
        </h3>
      )
      return
    }

    // Emoji-led feature headers (roadmap sections)
    if (EMOJI_HEADERS.test(line)) {
      elements.push(
        <div key={i} style={{ fontSize: '0.95rem', fontWeight: 700, color: C.text, marginTop: '1.6rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {line}
        </div>
      )
      return
    }

    // Bullet points
    if (/^[•▪]/.test(line)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', marginBottom: '0.4rem', paddingLeft: '0.25rem' }}>
          <span style={{ color: C.primary, fontWeight: 700, flexShrink: 0, marginTop: '0.1rem', fontSize: '0.75rem' }}>▸</span>
          <span style={{ color: C.muted, fontSize: '0.9rem', lineHeight: 1.75 }}>{line.replace(/^[•▪]\s*/, '')}</span>
        </div>
      )
      return
    }

    // Separator
    if (line.trim() === '---') {
      elements.push(<div key={i} style={{ height: '1px', background: C.border, margin: '1.5rem 0' }} />)
      return
    }

    // Email/link lines (contain @)
    if (line.includes('@sheikstream') || line.includes('@')) {
      elements.push(
        <div key={i} style={{ fontSize: '0.9rem', color: C.primary, marginBottom: '0.35rem', fontWeight: 500 }}>
          {line}
        </div>
      )
      return
    }

    // Default body text
    elements.push(
      <p key={i} style={{ fontSize: '0.9rem', color: C.muted, lineHeight: 1.85, margin: '0 0 0.35rem' }}>
        {line}
      </p>
    )
  })

  return elements
}

type Overlay = { active: boolean; x: string; y: string; newTheme: 'dark' | 'light' }

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
    setOverlay({ active: true, x, y, newTheme })
    setTimeout(() => {
      setTheme(newTheme)
      localStorage.setItem('sk-theme', newTheme)
      setOverlay(o => ({ ...o, active: false }))
    }, 1020)
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

  return (
    <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text, display: 'flex', flexDirection: 'column' }}>
      <style>{makeCSS(C)}</style>
      {themeOverlay}

      {/* Nav */}
      <nav className="sk-nav" style={{ position: 'sticky', top: 0, zIndex: 100, background: C.navBg, borderBottom: `1px solid ${C.border}`, padding: '0.85rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <a href="/" style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '0.5px', color: C.text, textDecoration: 'none' }}>
          Sheik<span style={{ color: C.accent }}>stream</span>
        </a>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            onClick={handleThemeToggle}
            className="sk-theme-btn"
            title={isDark ? 'Modo claro' : 'Modo escuro'}
            style={{ background: C.primaryBg, border: `1px solid ${C.border}`, color: C.primary, padding: '0.42rem 0.58rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <a href="/" className="sk-back-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: C.vvdim, border: `1px solid ${C.border}`, color: C.dim, padding: '0.42rem 1rem', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Início
          </a>
        </div>
      </nav>

      {/* Hero strip */}
      <div style={{ position: 'relative', overflow: 'hidden', background: C.heroBg, borderBottom: `1px solid ${C.border}`, padding: '3.5rem 2.5rem 3rem' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${C.primary}10 1px, transparent 1px)`, backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '250px', background: `radial-gradient(ellipse at center, ${C.primary}14 0%, transparent 65%)`, pointerEvents: 'none' }} />

        <div className="sk-fade-up" style={{ maxWidth: '740px', margin: '0 auto', position: 'relative' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: C.dim, marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            <a href="/" className="sk-section-link" style={{ color: C.dim, textDecoration: 'none' }}>Início</a>
            <span style={{ color: C.vdim }}>›</span>
            <span style={{ color: C.primary }}>{entry.category}</span>
            <span style={{ color: C.vdim }}>›</span>
            <span style={{ color: C.muted }}>{entry.title}</span>
          </div>

          {/* Category badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: C.primaryBg, border: `1px solid ${C.borderStrong}`, color: C.primary, fontSize: '0.66rem', padding: '0.22rem 0.85rem', borderRadius: '999px', marginBottom: '1rem', letterSpacing: '1.5px', fontWeight: 700, textTransform: 'uppercase' }}>
            {entry.category}
          </div>

          <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, color: C.text, margin: '0 0 0.8rem' }}>
            {entry.title}
          </h1>
          <p style={{ fontSize: '0.95rem', color: C.muted, margin: 0, lineHeight: 1.65, maxWidth: '520px' }}>
            {entry.desc}
          </p>
        </div>
      </div>

      {/* Content */}
      <main style={{ flex: 1, padding: '3rem 2.5rem 5rem', maxWidth: '740px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div className="sk-fade-up" style={{ animationDelay: '0.1s', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '2.5rem 2.8rem', boxShadow: isDark ? '0 4px 40px rgba(0,0,0,0.3)' : '0 4px 40px rgba(0,0,0,0.06)' }}>
          {renderContent(entry.content, C)}
        </div>

        {/* Quick links at bottom */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Termos e Condições', href: '/termos-e-condicoes' },
            { label: 'Privacidade', href: '/privacidade' },
            { label: 'Cookies', href: '/cookies' },
          ].filter(l => l.href !== `/${slug}`).map(l => (
            <a key={l.href} href={l.href} style={{ fontSize: '0.78rem', color: C.dim, textDecoration: 'none', padding: '0.3rem 0.85rem', background: C.vvdim, border: `1px solid ${C.border}`, borderRadius: '999px', transition: 'color 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.color = C.primary)}
              onMouseOut={e => (e.currentTarget.style.color = C.dim)}
            >
              {l.label}
            </a>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.footerBg, padding: '1.5rem 2.5rem' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: C.vdim }}>
            © 2025 Sheikstream. Feito com carinho para streamers brasileiros.
          </div>
          <div style={{ display: 'flex', gap: '1.4rem' }}>
            {[
              { label: 'Termos', href: '/termos-e-condicoes' },
              { label: 'Privacidade', href: '/privacidade' },
              { label: 'Cookies', href: '/cookies' },
              { label: 'Contato', href: '/contato' },
            ].map(l => (
              <a key={l.href} href={l.href} className="sk-legal-link" style={{ fontSize: '0.72rem', color: C.vdim, textDecoration: 'none' }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
