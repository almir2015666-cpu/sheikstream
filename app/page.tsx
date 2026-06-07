'use client'
import { useState, useRef, useEffect } from 'react'
import {
  SiTwitch, SiYoutube, SiKick, SiTiktok, SiFacebook,
  SiDiscord, SiInstagram, SiGoogle, SiX, SiWhatsapp,
} from 'react-icons/si'
import type { IconType } from 'react-icons'

// ── Platform icons ────────────────────────────────────────────────────────────
const PLATFORM_ICONS: Record<string, IconType> = {
  Twitch: SiTwitch, YouTube: SiYoutube, Kick: SiKick,
  TikTok: SiTiktok, Facebook: SiFacebook, Discord: SiDiscord,
  Instagram: SiInstagram, Google: SiGoogle, X: SiX, WhatsApp: SiWhatsapp,
}
function PIcon({ id, color, size = 18 }: { id: string; color: string; size?: number }) {
  const Icon = PLATFORM_ICONS[id]
  return Icon ? <Icon size={size} color={color} /> : null
}

// ── Theme palettes ────────────────────────────────────────────────────────────
const DARK = {
  bg: '#08090d', navBg: 'rgba(8,9,13,0.97)', footerBg: 'rgba(6,7,11,0.98)',
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
  pricingFreeBorder: 'rgba(57,255,20,0.35)',
  shadowPricing: 'rgba(155,48,255,0.15)',
  overlayBg: '#f6f5ff', // next theme bg for the overlay
}
const LIGHT = {
  bg: '#f6f5ff', navBg: 'rgba(246,245,255,0.97)', footerBg: 'rgba(240,238,255,0.98)',
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
  pricingFreeBorder: 'rgba(10,140,0,0.3)',
  shadowPricing: 'rgba(124,42,245,0.1)',
  overlayBg: '#08090d', // next theme bg for the overlay
}

function makeCSS(C: typeof DARK) {
  return `
  * { box-sizing: border-box; }
  .sk-feature-card { transition: background 0.2s, transform 0.2s, border-color 0.2s; cursor: default; }
  .sk-feature-card:hover { background: ${C.primaryBgLight} !important; transform: translateY(-3px); border-color: ${C.borderGlow} !important; }
  .sk-platform { transition: all 0.15s; cursor: pointer; }
  .sk-platform:hover { border-color: ${C.borderStrong} !important; background: ${C.primaryBg} !important; }
  .sk-nav-link { transition: color 0.15s; }
  .sk-nav-link:hover { color: ${C.text} !important; }
  .sk-footer-link { transition: color 0.15s; }
  .sk-footer-link:hover { color: ${C.muted} !important; }
  .sk-social-icon { transition: all 0.18s; }
  .sk-social-icon:hover { border-color: ${C.borderStrong} !important; background: ${C.primaryBg} !important; transform: translateY(-3px); }
  .sk-pricing-card { transition: transform 0.2s, box-shadow 0.2s; }
  .sk-pricing-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px ${C.shadowPricing}; }
  .sk-chat-toggle { transition: transform 0.2s, box-shadow 0.2s; }
  .sk-chat-toggle:hover { transform: scale(1.08); box-shadow: 0 4px 24px ${C.primaryBgMed}; }
  .sk-send-btn { transition: opacity 0.15s; }
  .sk-send-btn:hover:not(:disabled) { opacity: 0.82; }
  .sk-theme-btn { transition: transform 0.25s, opacity 0.15s; }
  .sk-theme-btn:hover { transform: rotate(18deg) scale(1.15); }
  @keyframes sk-slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes sk-pop-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  @keyframes sk-dot { 0%,80%,100% { opacity: 0.2; } 40% { opacity: 1; } }
  @keyframes sk-circle-expand { from { clip-path: circle(0px at var(--tx) var(--ty)); } to { clip-path: circle(200vmax at var(--tx) var(--ty)); } }
  .sk-chat-window { animation: sk-pop-in 0.22s ease; }
  .sk-chat-msg { animation: sk-slide-up 0.18s ease; }
  .sk-dot-1 { animation: sk-dot 1.4s infinite 0s; }
  .sk-dot-2 { animation: sk-dot 1.4s infinite 0.2s; }
  .sk-dot-3 { animation: sk-dot 1.4s infinite 0.4s; }
  .sk-theme-overlay { animation: sk-circle-expand 0.62s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  `
}

// ── Sun / Moon icons ──────────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
export default function Home() {
  const [page, setPage] = useState('landing')
  const [loading, setLoading] = useState('')
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistDone, setWaitlistDone] = useState(false)

  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [overlay, setOverlay] = useState<Overlay>({ active: false, x: '0px', y: '0px', newTheme: 'light' })
  const C = theme === 'dark' ? DARK : LIGHT
  const isDark = theme === 'dark'

  // Chat
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: 'Olá! Sou o assistente do Sheikstream. Pode me perguntar qualquer coisa sobre a plataforma!' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  function handleOAuth(platform: string) {
    setLoading(platform)
    setTimeout(() => setLoading(''), 2000)
  }

  function handleWaitlistSubmit(e: React.SubmitEvent<HTMLFormElement>) {
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
    setOverlay({ active: true, x, y, newTheme })
    setTimeout(() => {
      setTheme(newTheme)
      setOverlay(o => ({ ...o, active: false }))
    }, 580)
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

  // ── Theme toggle button (reused in all pages' navs) ───────────────────────
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

  // ── Chat widget ────────────────────────────────────────────────────────────
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

  // ── Theme transition overlay ───────────────────────────────────────────────
  const themeOverlay = overlay.active ? (
    <div className="sk-theme-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
      background: overlay.newTheme === 'dark' ? DARK.bg : LIGHT.bg,
      '--tx': overlay.x, '--ty': overlay.y,
    } as React.CSSProperties} />
  ) : null

  // ── WAITLIST PAGE ──────────────────────────────────────────────────────────
  if (page === 'waitlist') {
    return (
      <div style={{ fontFamily: 'sans-serif', background: C.bg, minHeight: '100vh', color: C.text }}>
        <style>{makeCSS(C)}</style>
        {themeOverlay}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: `1px solid ${C.border}`, background: C.navBg }}>
          <div onClick={() => { setPage('landing'); setWaitlistDone(false); setWaitlistEmail('') }} style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '1px', cursor: 'pointer', color: C.text }}>
            Sheik<span style={{ color: C.accent }}>stream</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {themeBtn}
            <button onClick={() => { setPage('landing'); setWaitlistDone(false); setWaitlistEmail('') }} style={{ background: 'transparent', border: `1px solid ${C.vvdim}`, color: C.muted, padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
              Voltar
            </button>
          </div>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem' }}>
          {!waitlistDone ? (
            <div style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderTop: `2px solid ${C.primary}`, borderRadius: '14px', padding: '2.5rem 2rem', width: '100%', maxWidth: '440px', textAlign: 'center', boxShadow: `0 4px 24px ${C.primaryBgLight}` }}>
              <div style={{ width: '58px', height: '58px', borderRadius: '12px', background: C.primaryBg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.7rem' }}>⏳</div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, marginBottom: '0.5rem', color: C.text }}>Lista de espera</h1>
              <p style={{ fontSize: '0.88rem', color: C.muted, lineHeight: 1.7, maxWidth: '320px', margin: '0 auto 2rem' }}>
                O Sheikstream está em beta fechado. Cadastre seu e-mail e avisamos quando sua vaga abrir.
              </p>
              <form onSubmit={handleWaitlistSubmit}>
                <input type="email" required placeholder="seu@email.com" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.9rem', outline: 'none', marginBottom: '0.75rem', boxSizing: 'border-box' }}
                />
                <button type="submit" style={{ width: '100%', padding: '0.8rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}>
                  Garantir minha vaga grátis
                </button>
              </form>
              <p style={{ marginTop: '1.2rem', fontSize: '0.75rem', color: C.vdim }}>Sem spam. Apenas um aviso quando sua vaga abrir.</p>
            </div>
          ) : (
            <div style={{ background: C.cardBg, border: `1px solid ${C.accentBorder}`, borderTop: `2px solid ${C.accent}`, borderRadius: '14px', padding: '2.5rem 2rem', width: '100%', maxWidth: '440px', textAlign: 'center', boxShadow: `0 4px 24px ${C.accentBg}` }}>
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
      <div style={{ fontFamily: 'sans-serif', background: C.bg, minHeight: '100vh', color: C.text }}>
        <style>{makeCSS(C)}</style>
        {themeOverlay}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: `1px solid ${C.border}`, background: C.navBg }}>
          <div onClick={() => setPage('landing')} style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '1px', cursor: 'pointer', color: C.text }}>
            Sheik<span style={{ color: C.accent }}>stream</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {themeBtn}
            <button onClick={() => setPage('landing')} style={{ background: 'transparent', border: `1px solid ${C.vvdim}`, color: C.muted, padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
              Voltar
            </button>
          </div>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem' }}>
          <div style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderTop: `2px solid ${C.primary}`, borderRadius: '14px', padding: '2.2rem', width: '100%', maxWidth: '410px', boxShadow: `0 4px 24px ${C.primaryBgLight}` }}>
            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '1px', color: C.text }}>
                Sheik<span style={{ color: C.accent }}>stream</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: C.muted, marginTop: '0.3rem' }}>Conecte sua plataforma e entre no hub</div>
            </div>

            {oauthPlatforms.map((p) => (
              <button key={p.id} onClick={() => handleOAuth(p.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.7rem 1rem', borderRadius: '8px', marginBottom: '0.6rem',
                border: `1px solid ${loading === p.id ? p.color : C.oauthBtnBorder}`,
                background: loading === p.id ? p.bg : C.oauthBtnBg,
                color: C.text, fontSize: '0.9rem', fontWeight: 500,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
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
            <button style={{ width: '100%', padding: '0.72rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
              Entrar com e-mail
            </button>
            <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.78rem', color: C.vdim }}>
              Não tem conta?{' '}
              <span onClick={() => setPage('waitlist')} style={{ color: C.primary, cursor: 'pointer' }}>Criar conta grátis</span>
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

  return (
    <div style={{ fontFamily: 'sans-serif', background: C.bg, minHeight: '100vh', color: C.text, display: 'flex', flexDirection: 'column' }}>
      <style>{makeCSS(C)}</style>
      {themeOverlay}

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '1px', color: C.text }}>
          Sheik<span style={{ color: C.accent }}>stream</span>
        </div>
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          <span className="sk-nav-link" onClick={() => scrollToSection('produto')} style={{ color: C.dim, fontSize: '0.9rem', cursor: 'pointer' }}>Produto</span>
          <span className="sk-nav-link" onClick={() => scrollToSection('precos')} style={{ color: C.dim, fontSize: '0.9rem', cursor: 'pointer' }}>Preços</span>
          {themeBtn}
          <button onClick={() => setPage('login')} style={{ background: C.primary, color: '#fff', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
            Entrar
          </button>
          <button onClick={() => setPage('waitlist')} style={{ background: C.accent, color: isDark ? '#000' : '#fff', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
            Começar grátis
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '5rem 2rem 2.5rem', borderTop: '3px solid', borderImage: `linear-gradient(90deg,${C.primary},${C.accent},${C.primary}) 1` }}>
        <div style={{ display: 'inline-block', background: C.heroBadgeBg, border: `1px solid ${C.heroBadgeBorder}`, color: C.heroBadgeText, fontSize: '0.75rem', padding: '0.28rem 0.9rem', borderRadius: '999px', marginBottom: '1.4rem', letterSpacing: '0.5px' }}>
          ● Hub para streamers brasileiros — BETA
        </div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-1px', marginBottom: '1rem', color: C.text }}>
          Gerencie <span style={{ color: C.accent }}>Twitch</span>,{' '}
          <span style={{ color: C.primary }}>Kick</span><br />e muito mais
        </h1>
        <p style={{ fontSize: '1rem', color: C.muted, maxWidth: '500px', margin: '0 auto 2.2rem', lineHeight: 1.7, fontWeight: 300 }}>
          Conecte todas as suas plataformas, automatize sorteios, acompanhe metas e engaje sua comunidade — tudo num só lugar.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setPage('waitlist')} style={{ background: C.accent, color: isDark ? '#000' : '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '6px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}>
            Criar conta grátis
          </button>
          <button onClick={() => scrollToSection('produto')} style={{ background: 'transparent', color: C.muted, border: `1px solid ${C.vvdim}`, padding: '0.75rem 1.6rem', borderRadius: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
            Ver recursos
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', padding: '1.5rem 2rem 2.5rem', flexWrap: 'wrap' }}>
        {[
          { value: '5', label: 'plataformas integradas' },
          { value: 'R$0', label: 'para sempre no beta' },
          { value: '100%', label: 'focado em streamers BR' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: C.statColor, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: C.dim, marginTop: '0.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Platform badges */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.7rem', flexWrap: 'wrap', padding: '0 2rem 3rem' }}>
        {heroPlatforms.map(p => (
          <div key={p.id} className="sk-platform" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.82rem', color: C.muted }}>
            <PIcon id={p.id} color={p.color} size={14} />
            {p.id}
          </div>
        ))}
      </div>

      <div style={{ height: '1px', background: C.border, margin: '0 2rem' }} />

      {/* Features */}
      <section id="produto" style={{ padding: '3.5rem 2rem', maxWidth: '860px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '0.72rem', letterSpacing: '2px', color: C.accent, textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>Produto</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: C.text, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Feito pra quem vive de stream</h2>
        <p style={{ fontSize: '0.88rem', color: C.dim, marginBottom: '2rem' }}>Tudo que você precisa para crescer nas plataformas, num só painel.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          {[
            { icon: '◈', title: 'Painel Unificado', desc: 'Todas as métricas das suas plataformas em tempo real numa só tela.', green: true },
            { icon: '◎', title: 'Gerenciamento de Metas', desc: 'Defina e acompanhe metas de seguidores, subs e doações ao vivo.', green: false },
            { icon: '✦', title: 'Sorteios e Eventos', desc: 'Crie sorteios automáticos que deixam o chat em chamas.', green: true },
            { icon: '◉', title: 'Notificações em Tempo Real', desc: 'Avise sua comunidade no segundo exato que você entrar ao vivo.', green: false },
            { icon: '▲', title: 'Analytics Avançados', desc: 'Descubra o que retém seu público — e o que faz ele sair.', green: true },
            { icon: '⬡', title: 'Bot de Automação', desc: 'Automatize moderação, comandos e respostas do chat sem esforço.', green: false },
          ].map(f => (
            <div key={f.title} className="sk-feature-card" style={{ background: C.cardBg, padding: '1.4rem', borderRight: `1px solid ${C.featureSep}`, borderBottom: `1px solid ${C.featureSep}` }}>
              <div style={{ width: '34px', height: '34px', background: f.green ? C.iconGreenBg : C.iconPurpleBg, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.9rem', fontSize: '16px', color: f.green ? C.iconGreen : C.iconPurple }}>
                {f.icon}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: C.text, marginBottom: '0.35rem' }}>{f.title}</div>
              <div style={{ fontSize: '0.8rem', color: C.muted, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" style={{ padding: '1rem 2rem 4rem', maxWidth: '860px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ height: '1px', background: C.border, marginBottom: '3.5rem' }} />
        <div style={{ fontSize: '0.72rem', letterSpacing: '2px', color: C.accent, textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>Preços</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: C.text, marginBottom: '0.4rem', letterSpacing: '-0.5px' }}>Comece de graça, sempre</h2>
        <p style={{ fontSize: '0.88rem', color: C.dim, marginBottom: '2.5rem' }}>Sem cartão de crédito. Sem surpresas.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div className="sk-pricing-card" style={{ background: C.cardBg, border: `1px solid ${C.pricingFreeBorder}`, borderRadius: '14px', padding: '2rem' }}>
            <div style={{ display: 'inline-block', background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: '0.67rem', padding: '0.2rem 0.75rem', borderRadius: '999px', fontWeight: 700, marginBottom: '1.2rem', letterSpacing: '0.5px' }}>
              DISPONÍVEL AGORA
            </div>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, lineHeight: 1, marginBottom: '0.2rem', color: C.text }}>R$0</div>
            <div style={{ fontSize: '0.8rem', color: C.dim, marginBottom: '1.8rem' }}>/mês, para sempre</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {['Até 3 plataformas conectadas', 'Painel unificado em tempo real', 'Sorteios ilimitados', 'Metas de seguidores e subs', 'Notificações ao vivo', 'Suporte pela comunidade Discord'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.85rem', color: C.muted }}>
                  <span style={{ color: C.accent, fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => setPage('waitlist')} style={{ width: '100%', padding: '0.8rem', background: C.accent, color: isDark ? '#000' : '#fff', border: 'none', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer' }}>
              Garantir acesso grátis →
            </button>
          </div>

          <div className="sk-pricing-card" style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderRadius: '14px', padding: '2rem', opacity: 0.65 }}>
            <div style={{ display: 'inline-block', background: C.primaryBg, border: `1px solid ${C.border}`, color: C.primary, fontSize: '0.67rem', padding: '0.2rem 0.75rem', borderRadius: '999px', fontWeight: 700, marginBottom: '1.2rem', letterSpacing: '0.5px' }}>
              EM BREVE
            </div>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, lineHeight: 1, marginBottom: '0.2rem', color: C.dim }}>R$19</div>
            <div style={{ fontSize: '0.8rem', color: C.vdim, marginBottom: '1.8rem' }}>/mês</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {['Plataformas ilimitadas', 'Analytics com histórico completo', 'Bot de automação avançado', 'Integração com OBS e StreamElements', 'Acesso à API', 'Suporte prioritário'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.85rem', color: C.vdim }}>
                  <span style={{ color: C.dim, fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button disabled style={{ width: '100%', padding: '0.8rem', background: C.primaryBgLight, color: C.vdim, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '0.92rem', fontWeight: 700, cursor: 'not-allowed' }}>
              Em breve
            </button>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <div style={{ margin: '0 2rem 4rem', background: C.cardBg, borderLeft: `3px solid ${C.primary}`, borderRadius: '0 12px 12px 0', border: `1px solid ${C.borderStrong}`, borderLeftWidth: '3px', padding: '2.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', boxShadow: `0 4px 24px ${C.primaryBgLight}` }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: C.text, marginBottom: '0.3rem' }}>
            Pronto pra centralizar tudo?{' '}
            <span style={{ background: C.accentBg15, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: '0.7rem', padding: '0.18rem 0.65rem', borderRadius: '999px', fontWeight: 700, marginLeft: '0.4rem', verticalAlign: 'middle' }}>BETA</span>
          </h2>
          <p style={{ fontSize: '0.88rem', color: C.muted }}>Conecte suas plataformas em menos de 2 minutos e comece a crescer.</p>
        </div>
        <button onClick={() => setPage('waitlist')} style={{ background: C.accent, color: isDark ? '#000' : '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Criar conta grátis →
        </button>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, marginTop: 'auto', padding: '3rem 2rem 2rem', background: C.footerBg }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2.5rem', marginBottom: '2.5rem' }}>
            <div style={{ maxWidth: '220px' }}>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '0.6rem', color: C.text }}>
                Sheik<span style={{ color: C.accent }}>stream</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: C.dim, lineHeight: 1.7, margin: 0 }}>
                O hub definitivo para streamers brasileiros gerenciarem todas as suas plataformas.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', color: C.vdim, textTransform: 'uppercase', marginBottom: '0.85rem' }}>Produto</div>
                {[{ label: 'Recursos', action: () => scrollToSection('produto') }, { label: 'Preços', action: () => scrollToSection('precos') }, { label: 'Roadmap', action: () => {} }, { label: 'Changelog', action: () => {} }].map(l => (
                  <div key={l.label} className="sk-footer-link" onClick={l.action} style={{ fontSize: '0.82rem', color: C.dim, marginBottom: '0.5rem', cursor: 'pointer' }}>{l.label}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', color: C.vdim, textTransform: 'uppercase', marginBottom: '0.85rem' }}>Empresa</div>
                {['Sobre', 'Blog', 'Contato', 'Termos'].map(l => (
                  <div key={l} className="sk-footer-link" style={{ fontSize: '0.82rem', color: C.dim, marginBottom: '0.5rem', cursor: 'pointer' }}>{l}</div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ height: '1px', background: C.border, marginBottom: '1.5rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: C.vdim }}>
              © 2025 Sheikstream. Feito com carinho para streamers brasileiros.
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {socialLinks.map(s => (
                <a key={s.id} href="#" title={s.name} className="sk-social-icon" style={{ width: '36px', height: '36px', background: C.vvdim, border: `1px solid ${C.border}`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none' }}>
                  <PIcon id={s.id} color={s.color} size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {chatWidget}
    </div>
  )
}
