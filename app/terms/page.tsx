'use client'
import { useState, useEffect } from 'react'

const DARK = {
  bg: '#08090d', navBg: 'rgba(8,9,13,0.92)',
  cardBg: '#0f1018', cardBgAlt: '#1a1b2e',
  text: '#f0eefc', muted: 'rgba(240,238,252,0.5)', dim: 'rgba(240,238,252,0.28)',
  vdim: 'rgba(240,238,252,0.22)', vvdim: 'rgba(240,238,252,0.08)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  primaryBgMed: 'rgba(155,48,255,0.15)', primaryBgLight: 'rgba(155,48,255,0.07)',
  accent: '#39ff14', accentBg: 'rgba(57,255,20,0.1)', accentBorder: 'rgba(57,255,20,0.3)',
  border: 'rgba(155,48,255,0.18)', borderStrong: 'rgba(155,48,255,0.3)',
}
const LIGHT = {
  bg: '#f6f5ff', navBg: 'rgba(246,245,255,0.92)',
  cardBg: '#ffffff', cardBgAlt: '#faf9ff',
  text: '#0d0c1e', muted: 'rgba(13,12,30,0.55)', dim: 'rgba(13,12,30,0.32)',
  vdim: 'rgba(13,12,30,0.22)', vvdim: 'rgba(13,12,30,0.07)',
  primary: '#7c2af5', primaryBg: 'rgba(124,42,245,0.08)',
  primaryBgMed: 'rgba(124,42,245,0.12)', primaryBgLight: 'rgba(124,42,245,0.04)',
  accent: '#0a8c00', accentBg: 'rgba(10,140,0,0.08)', accentBorder: 'rgba(10,140,0,0.3)',
  border: 'rgba(124,42,245,0.12)', borderStrong: 'rgba(124,42,245,0.22)',
}

function makeCSS(C: typeof DARK) {
  return `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  .sk-nav { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
  .sk-theme-btn { transition: transform 0.25s; }
  .sk-theme-btn:hover { transform: rotate(18deg) scale(1.15); }
  .sk-checkbox { width:18px; height:18px; border:2px solid ${C.border}; border-radius:4px; background:${C.bg}; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:border-color 0.15s, background 0.15s; }
  .sk-checkbox.checked { border-color:${C.primary}; background:${C.primary}; }
  @keyframes sk-circle-collapse { from { clip-path: circle(200vmax at var(--tx) var(--ty)); } to { clip-path: circle(0px at var(--tx) var(--ty)); } }
  .sk-theme-overlay { animation: sk-circle-collapse 1.05s cubic-bezier(0.65, 0, 0.35, 1) forwards; }
  @keyframes sk-pop-in { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  .sk-card { animation: sk-pop-in 0.35s ease both; }
  `
}

type Overlay = { active: boolean; x: string; y: string; newTheme: 'dark' | 'light' }
type TermsState = { termos: boolean; privacidade: boolean; news: boolean }

export default function TermsPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [overlay, setOverlay] = useState<Overlay>({ active: false, x: '0px', y: '0px', newTheme: 'light' })
  const [terms, setTerms] = useState<TermsState>({ termos: false, privacidade: false, news: false })
  const [accepted, setAccepted] = useState(false)
  const isDark = theme === 'dark'
  const C = isDark ? DARK : LIGHT
  const canContinue = terms.termos && terms.privacidade

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

  const themeOverlay = overlay.active ? (
    <div className="sk-theme-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
      background: overlay.newTheme === 'dark' ? LIGHT.bg : DARK.bg,
      '--tx': overlay.x, '--ty': overlay.y,
    } as React.CSSProperties} />
  ) : null

  const checkboxItems = [
    { key: 'termos' as const, prefix: 'Li e concordo com os', link: 'Termos de Uso', slug: '/termos-e-condicoes', required: true },
    { key: 'privacidade' as const, prefix: 'Li e concordo com a', link: 'Política de Privacidade', slug: '/privacidade', required: true },
    { key: 'news' as const, prefix: 'Aceito receber novidades, dicas e promoções da Sheikstream', link: '', slug: '', required: false },
  ]

  if (accepted) {
    return (
      <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
        <style>{makeCSS(C)}</style>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: C.accentBg, border: `2px solid ${C.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: C.accent }}>✓</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: C.text, margin: 0 }}>Bem-vindo ao SheikSTREAM!</h2>
        <p style={{ fontSize: '0.9rem', color: C.muted, maxWidth: '340px', lineHeight: 1.7, margin: 0 }}>
          Seus termos foram aceitos. Em produção você seria redirecionado ao dashboard.
        </p>
        <a href="/" style={{ marginTop: '0.5rem', display: 'inline-block', background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
          Voltar ao início
        </a>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{makeCSS(C)}</style>
      {themeOverlay}

      {/* Nav */}
      <nav className="sk-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontSize: '1.55rem', fontWeight: 900, letterSpacing: '0.5px', color: C.text, textDecoration: 'none' }}>
          Sheik<span style={{ color: C.accent }}>STREAM</span>
        </a>
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
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          {/* Top brand + badge */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: C.text }}>
              Sheik<span style={{ color: C.accent }}>STREAM</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.6rem', background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: '0.72rem', padding: '0.22rem 0.85rem', borderRadius: '999px', fontWeight: 700 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
              Acesso aprovado!
            </div>
          </div>

          {/* Terms card */}
          <div className="sk-card" style={{ background: C.cardBgAlt, border: `1px solid ${C.borderStrong}`, borderRadius: '16px', overflow: 'hidden', boxShadow: `0 8px 40px ${C.primaryBgLight}` }}>
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: C.text, margin: '0 0 0.4rem' }}>Antes de continuar</h2>
              <p style={{ fontSize: '0.85rem', color: C.muted, margin: 0, lineHeight: 1.6 }}>
                Para usar a plataforma, você precisa aceitar os termos abaixo.
              </p>
            </div>

            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {checkboxItems.map(item => (
                <div
                  key={item.key}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}
                  onClick={() => setTerms(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                >
                  <div className={`sk-checkbox${terms[item.key] ? ' checked' : ''}`}>
                    {terms[item.key] && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '0.88rem', color: C.text, lineHeight: 1.55, userSelect: 'none' }}>
                    {item.link ? (
                      <>
                        {item.prefix}{' '}
                        <a
                          href={item.slug}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: C.primary, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}
                        >
                          {item.link}
                        </a>
                        {' '}da Sheikstream{item.required ? <span style={{ color: '#e55' }}> *</span> : ''}
                      </>
                    ) : (
                      item.prefix
                    )}
                  </span>
                </div>
              ))}
              <p style={{ fontSize: '0.75rem', color: C.vdim, margin: '0.25rem 0 0' }}>* campos obrigatórios</p>
            </div>

            <div style={{ padding: '0 1.75rem 1.75rem' }}>
              <button
                disabled={!canContinue}
                onClick={() => { if (canContinue) setAccepted(true) }}
                style={{
                  width: '100%', padding: '0.9rem',
                  background: canContinue ? `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})` : C.vvdim,
                  color: canContinue ? '#fff' : C.vdim,
                  border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700,
                  cursor: canContinue ? 'pointer' : 'not-allowed',
                  boxShadow: canContinue ? `0 4px 20px ${C.primaryBgMed}` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                Continuar
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
            <a href="/pending" style={{ color: C.vdim, fontSize: '0.8rem', textDecoration: 'none' }}>← Voltar</a>
          </div>
        </div>
      </div>
    </div>
  )
}
