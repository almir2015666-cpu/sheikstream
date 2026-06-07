'use client'
import { useState, useRef, useEffect } from 'react'
import {
  SiTwitch, SiYoutube, SiKick, SiTiktok, SiFacebook,
  SiDiscord, SiInstagram, SiGoogle, SiX, SiWhatsapp,
} from 'react-icons/si'
import type { IconType } from 'react-icons'

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
  iconGreen: '#39ff14', iconGreenBg: 'rgba(57,255,20,0.1)',
  iconPurple: '#c98fff', iconPurpleBg: 'rgba(155,48,255,0.15)',
  heroBadgeBg: 'rgba(46,13,92,0.6)', heroBadgeBorder: '#6b1fc2', heroBadgeText: '#c98fff',
  chatBtnGrad: 'linear-gradient(135deg,#9b30ff,#6b1fc2)',
  chatUserBg: '#9b30ff', chatAiBg: 'rgba(255,255,255,0.07)',
  chatAiBorder: 'rgba(255,255,255,0.08)',
  inputBg: '#08090d', inputBorder: 'rgba(155,48,255,0.3)',
  oauthBtnBg: 'rgba(255,255,255,0.03)', oauthBtnBorder: 'rgba(255,255,255,0.1)',
  separatorBg: 'rgba(255,255,255,0.08)',
  featureSep: 'rgba(155,48,255,0.15)', statColor: '#39ff14',
  pricingFreeBorder: 'rgba(57,255,20,0.4)',
  shadowPricing: 'rgba(155,48,255,0.2)',
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
  iconGreen: '#0a8c00', iconGreenBg: 'rgba(10,140,0,0.08)',
  iconPurple: '#7c2af5', iconPurpleBg: 'rgba(124,42,245,0.1)',
  heroBadgeBg: 'rgba(124,42,245,0.07)', heroBadgeBorder: 'rgba(124,42,245,0.3)', heroBadgeText: '#7c2af5',
  chatBtnGrad: 'linear-gradient(135deg,#7c2af5,#5a15d0)',
  chatUserBg: '#7c2af5', chatAiBg: 'rgba(13,12,30,0.04)',
  chatAiBorder: 'rgba(13,12,30,0.08)',
  inputBg: '#f6f5ff', inputBorder: 'rgba(124,42,245,0.28)',
  oauthBtnBg: 'rgba(13,12,30,0.02)', oauthBtnBorder: 'rgba(13,12,30,0.1)',
  separatorBg: 'rgba(13,12,30,0.08)',
  featureSep: 'rgba(124,42,245,0.1)', statColor: '#0a8c00',
  pricingFreeBorder: 'rgba(10,140,0,0.4)',
  shadowPricing: 'rgba(124,42,245,0.15)',
  appBtn: 'rgba(124,42,245,0.1)', appBtnBorder: 'rgba(124,42,245,0.35)',
}

function makeCSS(C: typeof DARK) {
  return `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  .sk-feature-card { transition: background 0.2s, transform 0.2s, border-color 0.2s; cursor: default; }
  .sk-feature-card:hover { background: ${C.primaryBgLight} !important; transform: translateY(-4px); border-color: ${C.borderGlow} !important; }
  .sk-platform { transition: all 0.15s; cursor: pointer; }
  .sk-platform:hover { border-color: ${C.borderStrong} !important; background: ${C.primaryBg} !important; transform: translateY(-2px); }
  .sk-nav-link { transition: color 0.15s; }
  .sk-nav-link:hover { color: ${C.text} !important; }
  .sk-legal-link { transition: color 0.15s; cursor: pointer; }
  .sk-legal-link:hover { color: ${C.primary} !important; }
  .sk-social-icon { transition: all 0.18s; }
  .sk-social-icon:hover { border-color: ${C.borderStrong} !important; background: ${C.primaryBg} !important; transform: translateY(-3px); }
  .sk-pricing-card { transition: transform 0.22s, box-shadow 0.22s; }
  .sk-pricing-card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px ${C.shadowPricing}; }
  .sk-chat-toggle { transition: transform 0.2s, box-shadow 0.2s; }
  .sk-chat-toggle:hover { transform: scale(1.08); box-shadow: 0 4px 24px ${C.primaryBgMed}; }
  .sk-send-btn { transition: opacity 0.15s; }
  .sk-send-btn:hover:not(:disabled) { opacity: 0.82; }
  .sk-theme-btn { transition: transform 0.25s, opacity 0.15s; }
  .sk-theme-btn:hover { transform: rotate(18deg) scale(1.15); }
  .sk-nav { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
  .sk-btn-cta { transition: all 0.2s; }
  .sk-btn-cta:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 8px 32px ${C.primaryBg3} !important; }
  .sk-btn-ghost { transition: all 0.18s; }
  .sk-btn-ghost:hover { background: ${C.primaryBgLight} !important; border-color: ${C.borderStrong} !important; color: ${C.text} !important; }
  .sk-app-btn { transition: all 0.18s; }
  .sk-app-btn:hover { background: ${C.appBtn} !important; border-color: ${C.primary} !important; color: ${C.primary} !important; }
  .sk-oauth-btn { transition: all 0.18s; }
  .sk-oauth-btn:hover { border-color: rgba(155,48,255,0.3) !important; background: ${C.primaryBgLight} !important; }
  .sk-checkbox { width:18px; height:18px; border:2px solid ${C.border}; border-radius:4px; background:${C.inputBg}; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:border-color 0.15s, background 0.15s; }
  .sk-checkbox.checked { border-color:${C.primary}; background:${C.primary}; }
  @keyframes sk-slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes sk-pop-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  @keyframes sk-dot { 0%,80%,100% { opacity: 0.2; } 40% { opacity: 1; } }
  @keyframes sk-circle-collapse { from { clip-path: circle(200vmax at var(--tx) var(--ty)); } to { clip-path: circle(0px at var(--tx) var(--ty)); } }
  @keyframes sk-glow-pulse { 0%,100% { opacity: 0.28; } 50% { opacity: 0.52; } }
  @keyframes sk-float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
  @keyframes sk-pending-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.96); } }
  .sk-mock-glow { animation: sk-glow-pulse 3.5s ease-in-out infinite; }
  .sk-mock-float { animation: sk-float 5s ease-in-out infinite; }
  .sk-chat-window { animation: sk-pop-in 0.22s ease; }
  .sk-chat-msg { animation: sk-slide-up 0.18s ease; }
  .sk-dot-1 { animation: sk-dot 1.4s infinite 0s; }
  .sk-dot-2 { animation: sk-dot 1.4s infinite 0.2s; }
  .sk-dot-3 { animation: sk-dot 1.4s infinite 0.4s; }
  .sk-theme-overlay { animation: sk-circle-collapse 1.05s cubic-bezier(0.65, 0, 0.35, 1) forwards; }
  .sk-gradient-text { display: inline-block; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; }
  .sk-pending-pulse { animation: sk-pending-pulse 2s ease-in-out infinite; }
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

type ChatMsg = { role: 'user' | 'assistant'; content: string }
type Overlay = { active: boolean; x: string; y: string; newTheme: 'dark' | 'light' }
type TermsState = { termos: boolean; privacidade: boolean; news: boolean }

const PLATFORM_COLORS: Record<string, string> = {
  Twitch: '#9147ff', YouTube: '#ff0000', Kick: '#53fc18',
  Discord: '#5865f2', Google: '#4285f4',
}

export default function Home() {
  const [page, setPage] = useState('landing')
  const [loading, setLoading] = useState('')
  const [loginPlatform, setLoginPlatform] = useState('')
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterDone, setNewsletterDone] = useState(false)
  const [termsState, setTermsState] = useState<TermsState>({ termos: false, privacidade: false, news: false })

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [overlay, setOverlay] = useState<Overlay>({ active: false, x: '0px', y: '0px', newTheme: 'light' })
  const C = theme === 'dark' ? DARK : LIGHT
  const isDark = theme === 'dark'

  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: 'Olá! Sou o assistente do Sheikstream. Pode me perguntar qualquer coisa sobre a plataforma!' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('sk-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  function handleOAuth(platform: string) {
    setLoading(platform)
    setTimeout(() => {
      setLoading('')
      setLoginPlatform(platform)
      setPage('pending')
    }, 1500)
  }

  function handleWaitlistSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (waitlistEmail.trim()) setWaitlistDone(true)
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleThemeToggle(e: React.MouseEvent<HTMLButtonElement>) {
    if (overlay.active) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = `${Math.round(rect.left + rect.width / 2)}px`
    const y = `${Math.round(rect.top + rect.height / 2)}px`
    const newTheme = isDark ? 'light' : 'dark'
    // Batch both in same render: theme changes under the overlay, no flash
    setTheme(newTheme)
    setOverlay({ active: true, x, y, newTheme })
    localStorage.setItem('sk-theme', newTheme)
    setTimeout(() => {
      setOverlay(o => ({ ...o, active: false }))
    }, 1100)
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const userMsg: ChatMsg = { role: 'user', content: chatInput.trim() }
    const updated = [...chatMessages, userMsg]
    setChatMessages(updated)
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated.slice(1) }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Ops, tive um problema. Tente novamente.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const themeBtn = (
    <button
      onClick={handleThemeToggle}
      className="sk-theme-btn"
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      style={{
        background: C.primaryBg, border: `1px solid ${C.border}`,
        color: C.primary, padding: '0.45rem 0.6rem', borderRadius: '8px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )

  const chatWidget = (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
      {chatOpen && (
        <div className="sk-chat-window" style={{ width: '340px', height: '480px', background: C.cardBgAlt, border: `1px solid ${C.borderStrong}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: `0 8px 40px ${C.primaryBgMed}` }}>
          <div style={{ padding: '0.9rem 1rem', background: C.primaryBg, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: C.chatBtnGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#fff', fontWeight: 900 }}>S</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: C.text }}>Assistente Sheikstream</div>
              <div style={{ fontSize: '0.7rem', color: C.accent, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
                Online
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0.2rem' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: C.cardBgAlt }}>
            {chatMessages.map((m, i) => (
              <div key={i} className="sk-chat-msg" style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '0.6rem 0.85rem',
                  borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: m.role === 'user' ? C.chatUserBg : C.chatAiBg,
                  border: m.role === 'user' ? 'none' : `1px solid ${C.chatAiBorder}`,
                  color: m.role === 'user' ? '#fff' : C.text,
                  fontSize: '0.82rem', lineHeight: 1.6,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="sk-chat-msg" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '0.6rem 1rem', borderRadius: '12px 12px 12px 4px', background: C.chatAiBg, border: `1px solid ${C.chatAiBorder}`, display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[1, 2, 3].map(n => <span key={n} className={`sk-dot-${n}`} style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.dim, display: 'inline-block' }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: '0.75rem', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '0.5rem', background: C.cardBgAlt }}>
            <input
              type="text" value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
              placeholder="Pergunte qualquer coisa..."
              disabled={chatLoading}
              style={{ flex: 1, padding: '0.55rem 0.8rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.82rem', outline: 'none', opacity: chatLoading ? 0.6 : 1 }}
            />
            <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="sk-send-btn"
              style={{ padding: '0.55rem 0.9rem', background: C.primary, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', cursor: chatLoading ? 'not-allowed' : 'pointer', opacity: !chatInput.trim() ? 0.45 : 1 }}>
              →
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setChatOpen(v => !v)} className="sk-chat-toggle"
        style={{ width: '52px', height: '52px', borderRadius: '50%', background: C.chatBtnGrad, border: `2px solid ${C.primaryBg3}`, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px ${C.primaryBgMed}`, fontSize: chatOpen ? '1.1rem' : '1.3rem' }}>
        {chatOpen ? '✕' : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        )}
      </button>
    </div>
  )

  const themeOverlay = overlay.active ? (
    <div className="sk-theme-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
      background: overlay.newTheme === 'dark' ? LIGHT.bg : DARK.bg,
      '--tx': overlay.x, '--ty': overlay.y,
    } as React.CSSProperties} />
  ) : null

  const brandLogo = (onClick?: () => void) => (
    <div
      onClick={onClick}
      style={{ fontSize: '1.55rem', fontWeight: 900, letterSpacing: '0.5px', color: C.text, cursor: onClick ? 'pointer' : 'default' }}
    >
      Sheik<span style={{ color: C.accent }}>STREAM</span>
    </div>
  )

  // ── PENDING PAGE ────────────────────────────────────────────────────────────
  if (page === 'pending') {
    const platColor = PLATFORM_COLORS[loginPlatform] || C.primary
    return (
      <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
        <style>{makeCSS(C)}</style>
        {themeOverlay}
        <nav className="sk-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100 }}>
          {brandLogo(() => setPage('landing'))}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {themeBtn}
            <button onClick={() => setPage('landing')} style={{ background: 'transparent', border: `1px solid ${C.vvdim}`, color: C.muted, padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
              Voltar
            </button>
          </div>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem' }}>
          <div style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderTop: `3px solid ${C.primary}`, borderRadius: '18px', padding: '3rem 2.5rem', width: '100%', maxWidth: '460px', textAlign: 'center', boxShadow: `0 12px 50px ${C.primaryBgLight}` }}>
            {/* Pulsing icon */}
            <div className="sk-pending-pulse" style={{ width: '72px', height: '72px', borderRadius: '50%', background: C.primaryBg, border: `2px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
              ⏳
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: '0.68rem', padding: '0.22rem 0.85rem', borderRadius: '999px', marginBottom: '1.4rem', fontWeight: 700, letterSpacing: '1px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
              AGUARDANDO APROVAÇÃO
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.6rem', color: C.text }}>Quase lá!</h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <PIcon id={loginPlatform} color={platColor} size={18} />
              <span style={{ fontSize: '0.88rem', color: C.muted }}>Conectado via <strong style={{ color: C.text }}>{loginPlatform}</strong></span>
            </div>
            <p style={{ fontSize: '0.87rem', color: C.muted, lineHeight: 1.75, maxWidth: '340px', margin: '0 auto 2rem' }}>
              Sua conta está aguardando aprovação manual. Você será notificado por e-mail assim que o acesso for liberado.
            </p>

            <div style={{ background: C.cardBgAlt, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1.2rem', marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.7rem', color: C.vdim, marginBottom: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Sua posição na fila</div>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: C.primary, lineHeight: 1 }}>#247</div>
              <div style={{ fontSize: '0.78rem', color: C.dim, marginTop: '0.3rem' }}>Tempo estimado: 24–48h</div>
            </div>

            {/* Demo button - simulates admin approval */}
            <div style={{ background: C.accentBg15, border: `1px dashed ${C.accentBorder}`, borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.6rem', letterSpacing: '0.5px' }}>DEMONSTRAÇÃO</div>
              <button
                onClick={() => setPage('terms')}
                style={{ background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', width: '100%' }}
              >
                Simular aprovação do admin →
              </button>
            </div>

            <button onClick={() => setPage('landing')} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.6rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              Voltar ao início
            </button>
          </div>
        </div>
        {chatWidget}
      </div>
    )
  }

  // ── TERMS PAGE ────────────────────────────────────────────────────────────
  if (page === 'terms') {
    const canContinue = termsState.termos && termsState.privacidade
    function toggleTerm(key: keyof TermsState) {
      setTermsState(prev => ({ ...prev, [key]: !prev[key] }))
    }
    const checkboxItems = [
      { key: 'termos' as const, label: 'Li e concordo com os', link: 'Termos de Uso', required: true, slug: '/termos-e-condicoes' },
      { key: 'privacidade' as const, label: 'Li e concordo com a', link: 'Política de Privacidade', required: true, slug: '/privacidade' },
      { key: 'news' as const, label: 'Aceito receber novidades, dicas e promoções da Sheikstream', link: '', required: false, slug: '' },
    ]
    return (
      <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <style>{makeCSS(C)}</style>
        {themeOverlay}
        <div style={{ width: '100%', maxWidth: '480px' }}>
          {/* Top brand */}
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
          <div style={{ background: isDark ? '#1a1b2e' : '#ffffff', border: `1px solid ${C.borderStrong}`, borderRadius: '16px', overflow: 'hidden', boxShadow: `0 8px 40px ${C.primaryBgLight}` }}>
            {/* Header */}
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: C.text, margin: 0, marginBottom: '0.4rem' }}>Antes de continuar</h2>
              <p style={{ fontSize: '0.85rem', color: C.muted, margin: 0, lineHeight: 1.6 }}>
                Para usar a plataforma, você precisa aceitar os termos abaixo.
              </p>
            </div>

            {/* Checkboxes */}
            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {checkboxItems.map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }} onClick={() => toggleTerm(item.key)}>
                  <div className={`sk-checkbox${termsState[item.key] ? ' checked' : ''}`}>
                    {termsState[item.key] && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '0.88rem', color: C.text, lineHeight: 1.55, userSelect: 'none' }}>
                    {item.link ? (
                      <>
                        {item.label}{' '}
                        <a
                          href={item.slug}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: C.primary, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}
                        >
                          {item.link}
                        </a>
                        {' '}da Sheikstream{item.required ? <span style={{ color: '#e55', marginLeft: '2px' }}> *</span> : ''}
                      </>
                    ) : (
                      <>{item.label}</>
                    )}
                  </span>
                </div>
              ))}

              <p style={{ fontSize: '0.75rem', color: C.vdim, margin: '0.25rem 0 0' }}>* campos obrigatórios</p>
            </div>

            {/* Action */}
            <div style={{ padding: '0 1.75rem 1.75rem' }}>
              <button
                disabled={!canContinue}
                onClick={() => {
                  if (canContinue) {
                    // In production: save terms acceptance, redirect to app
                    alert('Bem-vindo ao SheikSTREAM! (Em produção você seria redirecionado ao dashboard.)')
                    setPage('landing')
                    setTermsState({ termos: false, privacidade: false, news: false })
                  }
                }}
                className="sk-btn-cta"
                style={{
                  width: '100%', padding: '0.85rem',
                  background: canContinue
                    ? `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`
                    : C.vvdim,
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
            <button onClick={() => setPage('pending')} style={{ background: 'transparent', border: 'none', color: C.vdim, fontSize: '0.8rem', cursor: 'pointer' }}>
              ← Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── WAITLIST PAGE ──────────────────────────────────────────────────────────
  if (page === 'waitlist') {
    return (
      <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
        <style>{makeCSS(C)}</style>
        {themeOverlay}
        <nav className="sk-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100 }}>
          {brandLogo(() => { setPage('landing'); setWaitlistDone(false); setWaitlistEmail('') })}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {themeBtn}
            <button onClick={() => { setPage('landing'); setWaitlistDone(false); setWaitlistEmail('') }} style={{ background: 'transparent', border: `1px solid ${C.vvdim}`, color: C.muted, padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
              Voltar
            </button>
          </div>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem' }}>
          {!waitlistDone ? (
            <div style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderTop: `3px solid ${C.primary}`, borderRadius: '16px', padding: '2.5rem 2rem', width: '100%', maxWidth: '440px', textAlign: 'center', boxShadow: `0 8px 40px ${C.primaryBgLight}` }}>
              <div style={{ width: '58px', height: '58px', borderRadius: '14px', background: C.primaryBg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.7rem' }}>⏳</div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, marginBottom: '0.5rem', color: C.text }}>Lista de espera</h1>
              <p style={{ fontSize: '0.88rem', color: C.muted, lineHeight: 1.7, maxWidth: '320px', margin: '0 auto 2rem' }}>
                O SheikSTREAM está em beta fechado. Cadastre seu e-mail e avisamos quando sua vaga abrir.
              </p>
              <form onSubmit={handleWaitlistSubmit}>
                <input type="email" required placeholder="seu@email.com" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.9rem', outline: 'none', marginBottom: '0.75rem', boxSizing: 'border-box' }}
                />
                <button type="submit" className="sk-btn-cta" style={{ width: '100%', padding: '0.82rem', background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 20px ${C.primaryBgMed}` }}>
                  Garantir minha vaga grátis
                </button>
              </form>
              <p style={{ marginTop: '1.2rem', fontSize: '0.75rem', color: C.vdim }}>Sem spam. Apenas um aviso quando sua vaga abrir.</p>
            </div>
          ) : (
            <div style={{ background: C.cardBg, border: `1px solid ${C.accentBorder}`, borderTop: `3px solid ${C.accent}`, borderRadius: '16px', padding: '2.5rem 2rem', width: '100%', maxWidth: '440px', textAlign: 'center', boxShadow: `0 8px 40px ${C.accentBg}` }}>
              <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: C.accentBg, border: `1px solid ${C.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem', fontSize: '1.7rem', color: C.accent }}>✓</div>
              <div style={{ display: 'inline-block', background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: '0.68rem', padding: '0.22rem 0.8rem', borderRadius: '999px', marginBottom: '1.2rem', fontWeight: 700, letterSpacing: '1px' }}>
                VOCÊ ESTÁ NA FILA
              </div>
              <div style={{ fontSize: '3.2rem', fontWeight: 900, color: C.accent, lineHeight: 1, marginBottom: '0.2rem' }}>#247</div>
              <div style={{ fontSize: '0.82rem', color: C.dim, marginBottom: '1.5rem' }}>sua posição na fila de espera</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: C.text }}>Cadastro confirmado!</h2>
              <p style={{ fontSize: '0.85rem', color: C.muted, lineHeight: 1.7, marginBottom: '2rem' }}>
                Avisamos em <strong style={{ color: C.text }}>{waitlistEmail}</strong> assim que sua vaga abrir.
              </p>
              <div style={{ background: C.primaryBg, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '1.2rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: C.dim, marginBottom: '0.7rem' }}>Indique amigos e avance na fila</div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[{ label: 'Twitter / X', id: 'X', color: isDark ? '#e7e9ea' : '#1d1d1d' }, { label: 'Discord', id: 'Discord', color: '#5865f2' }, { label: 'WhatsApp', id: 'WhatsApp', color: '#25d366' }].map(s => (
                    <button key={s.id} style={{ padding: '0.4rem 0.85rem', background: C.vvdim, border: `1px solid ${C.border}`, borderRadius: '6px', color: C.muted, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <PIcon id={s.id} color={s.color} size={13} />{s.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setPage('landing'); setWaitlistDone(false); setWaitlistEmail('') }} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.6rem 1.5rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                Voltar ao início
              </button>
            </div>
          )}
        </div>
        {chatWidget}
      </div>
    )
  }

  // ── LOGIN PAGE ─────────────────────────────────────────────────────────────
  if (page === 'login') {
    const oauthPlatforms = [
      { id: 'Twitch',  color: '#9147ff', bg: 'rgba(145,71,255,0.1)',  label: 'Entrar com Twitch' },
      { id: 'YouTube', color: '#ff0000', bg: 'rgba(255,0,0,0.08)',    label: 'Entrar com YouTube' },
      { id: 'Kick',    color: '#53fc18', bg: 'rgba(83,252,24,0.08)',  label: 'Entrar com Kick' },
      { id: 'Discord', color: '#5865f2', bg: 'rgba(88,101,242,0.1)',  label: 'Entrar com Discord' },
      { id: 'Google',  color: '#4285f4', bg: 'rgba(66,133,244,0.08)', label: 'Entrar com Google' },
    ]
    return (
      <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
        <style>{makeCSS(C)}</style>
        {themeOverlay}
        <nav className="sk-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100 }}>
          {brandLogo(() => setPage('landing'))}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {themeBtn}
            <button onClick={() => setPage('landing')} style={{ background: 'transparent', border: `1px solid ${C.vvdim}`, color: C.muted, padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
              Voltar
            </button>
          </div>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem' }}>
          <div style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderTop: `3px solid ${C.primary}`, borderRadius: '16px', padding: '2.2rem', width: '100%', maxWidth: '410px', boxShadow: `0 8px 40px ${C.primaryBgLight}` }}>
            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '1px', color: C.text }}>
                Sheik<span style={{ color: C.accent }}>STREAM</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: C.muted, marginTop: '0.3rem' }}>Conecte sua plataforma e entre no hub</div>
            </div>
            {oauthPlatforms.map((p) => (
              <button key={p.id} onClick={() => handleOAuth(p.id)} className="sk-oauth-btn" style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.7rem 1rem', borderRadius: '8px', marginBottom: '0.6rem',
                border: `1px solid ${loading === p.id ? p.color : C.oauthBtnBorder}`,
                background: loading === p.id ? p.bg : C.oauthBtnBg,
                color: C.text, fontSize: '0.9rem', fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left',
              }}>
                <span style={{ width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PIcon id={p.id} color={p.color} size={20} />
                </span>
                <span style={{ flex: 1 }}>{loading === p.id ? 'Conectando...' : p.label}</span>
                <span style={{ color: C.vdim, fontSize: '13px' }}>›</span>
              </button>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', margin: '1rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: C.separatorBg }} />
              <span style={{ fontSize: '0.75rem', color: C.vdim }}>ou entre com e-mail</span>
              <div style={{ flex: 1, height: '1px', background: C.separatorBg }} />
            </div>
            <input type="email" placeholder="seu@email.com"
              style={{ width: '100%', padding: '0.7rem 1rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.9rem', outline: 'none', marginBottom: '0.6rem', boxSizing: 'border-box' }}
            />
            <button onClick={() => setPage('pending')} className="sk-btn-cta" style={{ width: '100%', padding: '0.72rem', background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: `0 4px 20px ${C.primaryBgMed}` }}>
              Entrar com e-mail
            </button>
            <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.78rem', color: C.vdim }}>
              Não tem conta?{' '}
              <span onClick={() => setPage('waitlist')} style={{ color: C.primary, cursor: 'pointer', fontWeight: 600 }}>Criar conta grátis</span>
            </div>
          </div>
        </div>
        {chatWidget}
      </div>
    )
  }

  // ── LANDING PAGE ────────────────────────────────────────────────────────────
  const heroPlatforms = [
    { id: 'Twitch',   color: '#9147ff' },
    { id: 'YouTube',  color: '#ff0000' },
    { id: 'Kick',     color: '#53fc18' },
    { id: 'TikTok',   color: isDark ? '#f0eefc' : '#0d0c1e' },
    { id: 'Facebook', color: '#1877f2' },
  ]
  const socialLinks = [
    { id: 'X',         name: 'Twitter / X', color: isDark ? '#e7e9ea' : '#1d1d1d' },
    { id: 'Discord',   name: 'Discord',     color: '#5865f2' },
    { id: 'Twitch',    name: 'Twitch',      color: '#9147ff' },
    { id: 'Instagram', name: 'Instagram',   color: '#e1306c' },
    { id: 'YouTube',   name: 'YouTube',     color: '#ff0000' },
    { id: 'TikTok',    name: 'TikTok',      color: isDark ? '#f0eefc' : '#0d0c1e' },
  ]
  const mockPlatforms = [
    { id: 'Twitch',   color: '#9147ff' },
    { id: 'YouTube',  color: '#ff0000' },
    { id: 'Kick',     color: '#53fc18' },
    { id: 'TikTok',   color: isDark ? '#f0eefc' : '#0d0c1e' },
    { id: 'Facebook', color: '#1877f2' },
  ]

  return (
    <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text, display: 'flex', flexDirection: 'column' }}>
      <style>{makeCSS(C)}</style>
      {themeOverlay}

      {/* ── Nav ── */}
      <nav className="sk-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 2.5rem', borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100 }}>
        {brandLogo()}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <span className="sk-nav-link" onClick={() => scrollToSection('produto')} style={{ color: C.muted, fontSize: '0.88rem', cursor: 'pointer', fontWeight: 500 }}>Produto</span>
          <span className="sk-nav-link" onClick={() => scrollToSection('precos')} style={{ color: C.muted, fontSize: '0.88rem', cursor: 'pointer', fontWeight: 500 }}>Preços</span>
          <a className="sk-nav-link" href="/roadmap" style={{ color: C.muted, fontSize: '0.88rem', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}>Roadmap</a>
          {themeBtn}
          {/* App button — replaces "Entrar" */}
          <button onClick={() => window.location.href = '/login'} className="sk-app-btn" style={{
            background: C.appBtn, color: C.primary,
            border: `1px solid ${C.appBtnBorder}`,
            padding: '0.48rem 1.2rem', borderRadius: '7px', cursor: 'pointer',
            fontSize: '0.87rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.85 }}>
              <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
            </svg>
            App
          </button>
          <button onClick={() => setPage('waitlist')} className="sk-btn-cta" style={{ background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', padding: '0.52rem 1.25rem', borderRadius: '7px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, boxShadow: `0 2px 16px ${C.primaryBgMed}` }}>
            Começar grátis
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '5.5rem 2rem 3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg,transparent 5%,${C.primary},${C.accent},${C.primary},transparent 95%)` }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${C.primary}18 1px, transparent 1px)`, backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '500px', background: `radial-gradient(ellipse at center, ${C.primary}18 0%, transparent 65%)`, pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: C.heroBadgeBg, border: `1px solid ${C.heroBadgeBorder}`, color: C.heroBadgeText, fontSize: '0.73rem', padding: '0.3rem 1rem', borderRadius: '999px', marginBottom: '1.6rem', letterSpacing: '0.5px', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
            Hub para streamers brasileiros — BETA fechado
          </div>
          <h1 style={{ fontSize: 'clamp(2.6rem, 6vw, 4.2rem)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-2px', marginBottom: '1.4rem', color: C.text }}>
            Gerencie tudo numa<br />
            <span className="sk-gradient-text" style={{ background: `linear-gradient(135deg,${C.primary} 20%,${C.accent} 80%)` }}>
              só plataforma
            </span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: C.muted, maxWidth: '520px', margin: '0 auto 2.6rem', lineHeight: 1.75, fontWeight: 400 }}>
            Conecte Twitch, YouTube, Kick, TikTok e Facebook. Automatize sorteios, acompanhe metas e engaje sua comunidade — de graça.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
            <button onClick={() => setPage('waitlist')} className="sk-btn-cta" style={{ background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', padding: '0.9rem 2.3rem', borderRadius: '8px', fontSize: '0.98rem', fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 24px ${C.primaryBgMed}` }}>
              Criar conta grátis →
            </button>
            <button onClick={() => scrollToSection('produto')} className="sk-btn-ghost" style={{ background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, padding: '0.9rem 1.9rem', borderRadius: '8px', fontSize: '0.92rem', cursor: 'pointer', fontWeight: 500 }}>
              Ver recursos
            </button>
          </div>

          {/* Dashboard mockup */}
          <div className="sk-mock-float" style={{ maxWidth: '820px', margin: '0 auto', position: 'relative' }}>
            <div className="sk-mock-glow" style={{ position: 'absolute', inset: '-40px', background: `radial-gradient(ellipse at 50% 30%, ${C.primary}22, transparent 65%)`, borderRadius: '40px', pointerEvents: 'none' }} />
            <div style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderRadius: '16px', overflow: 'hidden', boxShadow: `0 28px 90px rgba(0,0,0,0.45), 0 0 0 1px ${C.borderFaint}`, position: 'relative' }}>
              <div style={{ background: C.cardBgAlt, padding: '0.65rem 1rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
                </div>
                <div style={{ flex: 1, background: C.vvdim, borderRadius: '5px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '280px', margin: '0 auto', fontSize: '0.66rem', color: C.vdim }}>
                  🔒 sheikstream.vercel.app/dashboard
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '52px', background: C.cardBgAlt, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '14px 0' }}>
                  {mockPlatforms.map(p => (
                    <div key={p.id} style={{ width: '32px', height: '32px', borderRadius: '8px', background: C.vvdim, border: `1px solid ${C.borderFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PIcon id={p.id} color={p.color} size={14} />
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.6rem' }}>
                    {[
                      { label: 'Viewers ao vivo', value: '3.2K', platform: 'Twitch', color: '#9147ff', delta: '+12%' },
                      { label: 'Inscritos', value: '47.1K', platform: 'YouTube', color: '#ff0000', delta: '+8%' },
                      { label: 'Seguidores', value: '89K', platform: 'Kick', color: '#53fc18', delta: '+23%' },
                    ].map(s => (
                      <div key={s.label} style={{ background: C.cardBgAlt, border: `1px solid ${C.border}`, borderRadius: '9px', padding: '0.7rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.6rem', color: C.dim, fontWeight: 500 }}>{s.label}</span>
                          <PIcon id={s.platform} color={s.color} size={11} />
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: C.text, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: '0.58rem', color: C.accent, marginTop: '0.25rem', fontWeight: 600 }}>{s.delta} esta semana</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: C.cardBgAlt, border: `1px solid ${C.border}`, borderRadius: '9px', padding: '0.8rem' }}>
                    <div style={{ fontSize: '0.62rem', color: C.dim, marginBottom: '0.65rem', fontWeight: 600 }}>Audiência total — últimos 7 dias</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '52px' }}>
                      {[38, 54, 70, 48, 82, 65, 100].map((h, i) => (
                        <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 6 ? `linear-gradient(180deg,${C.primary},${C.primary}80)` : C.primaryBgLight, borderRadius: '3px 3px 0 0' }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', marginTop: '5px' }}>
                      {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map((d, i) => (
                        <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.55rem', color: C.vdim }}>{d}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0', padding: '3rem 2rem', flexWrap: 'wrap', maxWidth: '700px', margin: '0 auto', width: '100%' }}>
        {[
          { value: '5', label: 'plataformas integradas' },
          { value: 'R$0', label: 'para sempre no beta' },
          { value: '100%', label: 'focado em BR' },
        ].map((s, i) => (
          <div key={s.label} style={{ textAlign: 'center', flex: 1, minWidth: '130px', padding: '0 1.5rem', borderLeft: i > 0 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: C.statColor, lineHeight: 1, letterSpacing: '-1px' }}>{s.value}</div>
            <div style={{ fontSize: '0.73rem', color: C.dim, marginTop: '0.3rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Platform badges ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', padding: '0 2rem 3.5rem' }}>
        {heroPlatforms.map(p => (
          <div key={p.id} className="sk-platform" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.5rem 1.1rem', fontSize: '0.82rem', color: C.muted, fontWeight: 500 }}>
            <PIcon id={p.id} color={p.color} size={15} />
            {p.id}
          </div>
        ))}
      </div>

      <div style={{ height: '1px', background: C.border, margin: '0 2.5rem' }} />

      {/* ── Features ── */}
      <section id="produto" style={{ padding: '4rem 2.5rem', maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '0.7rem', letterSpacing: '2.5px', color: C.accent, textTransform: 'uppercase', marginBottom: '0.6rem', fontWeight: 700 }}>Produto</div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: C.text, marginBottom: '0.6rem', letterSpacing: '-1px' }}>Feito pra quem vive de stream</h2>
        <p style={{ fontSize: '0.9rem', color: C.dim, marginBottom: '2.5rem', maxWidth: '480px' }}>Tudo que você precisa para crescer nas plataformas, num só painel.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
          {[
            { icon: '◈', title: 'Painel Unificado', desc: 'Todas as métricas das suas plataformas em tempo real numa só tela.', green: true },
            { icon: '◎', title: 'Gerenciamento de Metas', desc: 'Defina e acompanhe metas de seguidores, subs e doações ao vivo.', green: false },
            { icon: '✦', title: 'Sorteios e Eventos', desc: 'Crie sorteios automáticos que deixam o chat em chamas.', green: true },
            { icon: '◉', title: 'Notificações em Tempo Real', desc: 'Avise sua comunidade no segundo exato que você entrar ao vivo.', green: false },
            { icon: '▲', title: 'Analytics Avançados', desc: 'Descubra o que retém seu público — e o que faz ele sair.', green: true },
            { icon: '⬡', title: 'Bot de Automação', desc: 'Automatize moderação, comandos e respostas do chat sem esforço.', green: false },
          ].map(f => (
            <div key={f.title} className="sk-feature-card" style={{ background: C.cardBg, padding: '1.6rem', borderRight: `1px solid ${C.featureSep}`, borderBottom: `1px solid ${C.featureSep}` }}>
              <div style={{ width: '38px', height: '38px', background: f.green ? C.iconGreenBg : C.iconPurpleBg, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '17px', color: f.green ? C.iconGreen : C.iconPurple, border: `1px solid ${f.green ? C.accentBorder : C.border}` }}>
                {f.icon}
              </div>
              <div style={{ fontSize: '0.93rem', fontWeight: 700, color: C.text, marginBottom: '0.4rem' }}>{f.title}</div>
              <div style={{ fontSize: '0.81rem', color: C.muted, lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="precos" style={{ padding: '0 2.5rem 5rem', maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ height: '1px', background: C.border, marginBottom: '4rem' }} />
        <div style={{ fontSize: '0.7rem', letterSpacing: '2.5px', color: C.accent, textTransform: 'uppercase', marginBottom: '0.6rem', fontWeight: 700 }}>Preços</div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: C.text, marginBottom: '0.5rem', letterSpacing: '-1px' }}>Comece de graça, sempre</h2>
        <p style={{ fontSize: '0.9rem', color: C.dim, marginBottom: '3rem' }}>Sem cartão de crédito. Sem surpresas. Sem pegadinha.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="sk-pricing-card" style={{ background: C.cardBg, border: `1px solid ${C.pricingFreeBorder}`, borderRadius: '16px', padding: '2.2rem', position: 'relative', boxShadow: `0 0 0 1px ${C.accentBorder}, 0 6px 32px ${C.accentBg}` }}>
            <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: C.accent, color: isDark ? '#000' : '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '0.2rem 0.9rem', borderRadius: '999px', whiteSpace: 'nowrap', letterSpacing: '0.8px' }}>
              MELHOR ESCOLHA
            </div>
            <div style={{ display: 'inline-block', background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: '0.65rem', padding: '0.2rem 0.75rem', borderRadius: '999px', fontWeight: 700, marginBottom: '1.4rem', letterSpacing: '0.5px' }}>
              DISPONÍVEL AGORA
            </div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1, marginBottom: '0.2rem', color: C.text }}>R$0</div>
            <div style={{ fontSize: '0.8rem', color: C.dim, marginBottom: '2rem' }}>/mês, para sempre</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Até 3 plataformas conectadas', 'Painel unificado em tempo real', 'Sorteios ilimitados', 'Metas de seguidores e subs', 'Notificações ao vivo', 'Suporte pela comunidade Discord'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.86rem', color: C.muted }}>
                  <span style={{ color: C.accent, fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => setPage('waitlist')} className="sk-btn-cta" style={{ width: '100%', padding: '0.85rem', background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', borderRadius: '9px', fontSize: '0.93rem', fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 20px ${C.primaryBgMed}` }}>
              Garantir acesso grátis →
            </button>
          </div>
          <div className="sk-pricing-card" style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderRadius: '16px', padding: '2.2rem', opacity: 0.6 }}>
            <div style={{ display: 'inline-block', background: C.primaryBg, border: `1px solid ${C.border}`, color: C.primary, fontSize: '0.65rem', padding: '0.2rem 0.75rem', borderRadius: '999px', fontWeight: 700, marginBottom: '1.4rem', letterSpacing: '0.5px' }}>
              EM BREVE
            </div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1, marginBottom: '0.2rem', color: C.dim }}>R$19</div>
            <div style={{ fontSize: '0.8rem', color: C.vdim, marginBottom: '2rem' }}>/mês</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Plataformas ilimitadas', 'Analytics com histórico completo', 'Bot de automação avançado', 'Integração com OBS e StreamElements', 'Acesso à API', 'Suporte prioritário'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.86rem', color: C.vdim }}>
                  <span style={{ color: C.dim, fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button disabled style={{ width: '100%', padding: '0.85rem', background: C.primaryBgLight, color: C.vdim, border: `1px solid ${C.border}`, borderRadius: '9px', fontSize: '0.93rem', fontWeight: 700, cursor: 'not-allowed' }}>
              Em breve
            </button>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{ padding: '0 2.5rem 5rem', maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ background: `linear-gradient(135deg,${C.primaryBg},${C.accentBg15})`, border: `1px solid ${C.borderStrong}`, borderRadius: '20px', padding: '4rem 3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '280px', background: `radial-gradient(ellipse, ${C.primary}20, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ display: 'inline-block', background: C.accentBg15, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: '0.62rem', padding: '0.22rem 0.85rem', borderRadius: '999px', fontWeight: 700, marginBottom: '1.2rem', letterSpacing: '1px', position: 'relative' }}>BETA ABERTO</div>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: C.text, marginBottom: '0.8rem', letterSpacing: '-1px', position: 'relative' }}>
            Pronto pra centralizar tudo?
          </h2>
          <p style={{ fontSize: '1rem', color: C.muted, marginBottom: '2.2rem', position: 'relative', maxWidth: '420px', margin: '0 auto 2.2rem', lineHeight: 1.7 }}>
            Conecte suas plataformas em menos de 2 minutos e comece a crescer de verdade.
          </p>
          <button onClick={() => setPage('waitlist')} className="sk-btn-cta" style={{ background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', padding: '1rem 2.8rem', borderRadius: '9px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 28px ${C.primaryBgMed}`, position: 'relative' }}>
            Criar conta grátis →
          </button>
          <div style={{ fontSize: '0.78rem', color: C.dim, marginTop: '1.1rem', position: 'relative' }}>Sem cartão de crédito. Acesso imediato ao beta.</div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, marginTop: 'auto', background: C.footerBg }}>
        <div style={{ borderBottom: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.8rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.97rem', fontWeight: 700, color: C.text, marginBottom: '0.2rem' }}>Fique por dentro</div>
              <div style={{ fontSize: '0.8rem', color: C.dim }}>Assine para saber as novidades sobre o produto</div>
            </div>
            {!newsletterDone ? (
              <form onSubmit={e => { e.preventDefault(); if (newsletterEmail.trim()) setNewsletterDone(true) }} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input type="email" required placeholder="seu@email.com" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)}
                  style={{ padding: '0.6rem 1rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.85rem', outline: 'none', width: '220px', boxSizing: 'border-box' }}
                />
                <button type="submit" style={{ padding: '0.6rem 1.3rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  Assinar
                </button>
              </form>
            ) : (
              <div style={{ color: C.accent, fontSize: '0.9rem', fontWeight: 700 }}>✓ Inscrito! Você será o primeiro a saber.</div>
            )}
          </div>
        </div>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2.5rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1.1fr', gap: '2.5rem', marginBottom: '3rem' }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.5px', marginBottom: '0.7rem', color: C.text }}>
                Sheik<span style={{ color: C.accent }}>STREAM</span>
              </div>
              <p style={{ fontSize: '0.81rem', color: C.dim, lineHeight: 1.75, margin: '0 0 1.3rem', maxWidth: '220px' }}>
                O hub definitivo para streamers brasileiros gerenciarem todas as suas plataformas.
              </p>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {socialLinks.slice(0, 4).map(s => (
                  <a key={s.id} href="#" title={s.name} className="sk-social-icon" style={{ width: '32px', height: '32px', background: C.vvdim, border: `1px solid ${C.border}`, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none' }}>
                    <PIcon id={s.id} color={s.color} size={14} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1.8px', color: C.vdim, textTransform: 'uppercase', marginBottom: '1.1rem' }}>Produto</div>
              {[
                { label: 'Recursos', action: () => scrollToSection('produto') },
                { label: 'Preços', action: () => scrollToSection('precos') },
                { label: 'Roadmap', href: '/roadmap' },
                { label: 'Changelog', href: '/changelog' },
              ].map(l => (
                l.href
                  ? <a key={l.label} href={l.href} className="sk-legal-link" style={{ display: 'block', fontSize: '0.83rem', color: C.dim, marginBottom: '0.6rem', textDecoration: 'none' }}>{l.label}</a>
                  : <div key={l.label} className="sk-legal-link" onClick={l.action} style={{ fontSize: '0.83rem', color: C.dim, marginBottom: '0.6rem' }}>{l.label}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1.8px', color: C.vdim, textTransform: 'uppercase', marginBottom: '1.1rem' }}>Empresa</div>
              {[
                { label: 'Sobre', href: '/sobre' },
                { label: 'Blog', href: '/blog' },
                { label: 'Contato', href: '/contato' },
              ].map(l => (
                <a key={l.label} href={l.href} className="sk-legal-link" style={{ display: 'block', fontSize: '0.83rem', color: C.dim, marginBottom: '0.6rem', textDecoration: 'none' }}>{l.label}</a>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1.8px', color: C.vdim, textTransform: 'uppercase', marginBottom: '1.1rem' }}>Links Rápidos</div>
              {[
                { label: 'Termos e Condições', href: '/termos-e-condicoes' },
                { label: 'Política de Privacidade', href: '/privacidade' },
                { label: 'Política de Cookies', href: '/cookies' },
              ].map(l => (
                <a key={l.label} href={l.href} className="sk-legal-link" style={{ display: 'block', fontSize: '0.83rem', color: C.dim, marginBottom: '0.6rem', textDecoration: 'none' }}>{l.label}</a>
              ))}
            </div>
          </div>
          <div style={{ height: '1px', background: C.border, marginBottom: '1.4rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.73rem', color: C.vdim }}>
              © 2025 Sheikstream. Feito com carinho para streamers brasileiros.
            </div>
            <div style={{ display: 'flex', gap: '1.4rem' }}>
              {[
                { label: 'Termos', href: '/termos-e-condicoes' },
                { label: 'Privacidade', href: '/privacidade' },
                { label: 'Cookies', href: '/cookies' },
              ].map(l => (
                <a key={l.label} href={l.href} className="sk-legal-link" style={{ fontSize: '0.73rem', color: C.vdim, textDecoration: 'none' }}>{l.label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {chatWidget}
    </div>
  )
}
