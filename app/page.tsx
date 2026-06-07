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
  appBtn: 'rgba(124,42,245,0.1)', appBtnBorder: 'rgba(124,42,245,0.35)',
}

function makeCSS(C: typeof DARK) {
  return `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  .sk-feature-card { transition: background 0.07s, transform 0.07s, border-color 0.07s; cursor: default; }
  .sk-feature-card:hover { background: ${C.primaryBgLight} !important; transform: translateY(-4px); border-color: ${C.borderGlow} !important; }
  .sk-platform { transition: all 0.05s; cursor: pointer; }
  .sk-platform:hover { border-color: ${C.borderStrong} !important; background: ${C.primaryBg} !important; transform: translateY(-2px); }
  .sk-nav-link { transition: color 0.05s; }
  .sk-nav-link:hover { color: ${C.text} !important; }
  .sk-legal-link { transition: color 0.05s; cursor: pointer; }
  .sk-legal-link:hover { color: ${C.primary} !important; }
  .sk-social-icon { transition: all 0.06s; }
  .sk-social-icon:hover { border-color: ${C.borderStrong} !important; background: ${C.primaryBg} !important; transform: translateY(-3px); }
  .sk-chat-toggle { transition: transform 0.07s, box-shadow 0.07s; }
  .sk-chat-toggle:hover { transform: scale(1.08); box-shadow: 0 4px 24px ${C.primaryBgMed}; }
  .sk-send-btn { transition: opacity 0.05s; }
  .sk-send-btn:hover:not(:disabled) { opacity: 0.82; }
  .sk-theme-btn { transition: transform 0.09s, opacity 0.05s; }
  .sk-theme-btn:hover { transform: rotate(18deg) scale(1.15); }
  .sk-nav { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
  .sk-btn-cta { transition: all 0.07s; }
  .sk-btn-cta:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 8px 32px ${C.primaryBg3} !important; }
  .sk-btn-ghost { transition: all 0.06s; }
  .sk-btn-ghost:hover { background: ${C.primaryBgLight} !important; border-color: ${C.borderStrong} !important; color: ${C.text} !important; }
  .sk-app-btn { transition: all 0.06s; }
  .sk-app-btn:hover { background: ${C.appBtn} !important; border-color: ${C.primary} !important; color: ${C.primary} !important; }
  .sk-oauth-btn { transition: all 0.06s; }
  .sk-oauth-btn:hover { border-color: rgba(155,48,255,0.3) !important; background: ${C.primaryBgLight} !important; }
  .sk-checkbox { width:18px; height:18px; border:2px solid ${C.border}; border-radius:4px; background:${C.inputBg}; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:border-color 0.05s, background 0.05s; }
  .sk-checkbox.checked { border-color:${C.primary}; background:${C.primary}; }
  .sk-streamer-card { transition: transform 0.08s, box-shadow 0.08s; cursor: default; }
  .sk-streamer-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px ${C.primaryBgMed}; }
  .sk-testimonial-card { transition: transform 0.08s, box-shadow 0.08s; }
  .sk-testimonial-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px ${C.primaryBgMed}; }
  .sk-faq-item { transition: background 0.06s; cursor: pointer; border-radius: 10px; }
  .sk-faq-item:hover { background: ${C.primaryBgLight} !important; }
  .sk-step-card { transition: transform 0.08s, box-shadow 0.08s; }
  .sk-step-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px ${C.primaryBgMed}; }
  .sk-metric-card { transition: transform 0.07s; }
  .sk-metric-card:hover { transform: translateY(-4px); }
  @keyframes sk-slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes sk-pop-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  @keyframes sk-dot { 0%,80%,100% { opacity: 0.2; } 40% { opacity: 1; } }
  @keyframes sk-diagonal-collapse { from { transform: translate(0,0); } to { transform: translate(100%,-100%); } }
  @keyframes sk-glow-pulse { 0%,100% { opacity: 0.28; } 50% { opacity: 0.52; } }
  @keyframes sk-float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
  @keyframes sk-pending-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.96); } }
  @keyframes sk-blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
  @keyframes sk-badge-pulse { 0%,100% { box-shadow: 0 0 0 0 ${C.primary}55; } 70% { box-shadow: 0 0 0 7px ${C.primary}00; } }
  @keyframes sk-bar { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
  .sk-mock-float { animation: sk-float 5s ease-in-out infinite; }
  .sk-chat-window { animation: sk-pop-in 0.07s ease; }
  .sk-chat-msg { animation: sk-slide-up 0.06s ease; }
  .sk-dot-1 { animation: sk-dot 1.4s infinite 0s; }
  .sk-dot-2 { animation: sk-dot 1.4s infinite 0.2s; }
  .sk-dot-3 { animation: sk-dot 1.4s infinite 0.4s; }
  .sk-theme-overlay { position:fixed; inset:0; z-index:9998; pointer-events:none; animation: sk-diagonal-collapse 0.5s cubic-bezier(0.65,0,0.35,1) forwards; }
  .sk-pending-pulse { animation: sk-pending-pulse 2s ease-in-out infinite; }
  .sk-cursor { display: inline-block; width: 2px; height: 0.85em; background: ${C.primary}; margin-left: 2px; vertical-align: text-bottom; animation: sk-blink 0.85s step-end infinite; border-radius: 1px; }
  .sk-novidade-pulse { animation: sk-badge-pulse 1.8s ease-out infinite; }
  .sk-top-bar { height: 3px; width: 100%; background: linear-gradient(90deg, ${C.primary}, ${C.accent}, ${C.primary}); background-size: 200% 100%; animation: sk-bar 3s linear infinite; flex-shrink: 0; }
  @media (max-width: 767px) {
    .sk-nav-desktop-links { display: none !important; }
    .sk-hero-buttons { flex-direction: column !important; align-items: stretch !important; }
    .sk-hero-buttons > button { width: 100% !important; }
    .sk-howit-grid { grid-template-columns: 1fr !important; }
    .sk-howit-arrow { display: none !important; }
    .sk-features-grid { grid-template-columns: 1fr !important; }
    .sk-stats-row > div:not(:first-child) { border-left: none !important; border-top: 1px solid ${C.border}; padding-left: 0 !important; padding-top: 1rem; }
    .sk-testimonials-grid { grid-template-columns: 1fr !important; }
    .sk-chat-window { width: calc(100vw - 2rem) !important; right: 0; }
    .sk-footer-grid { grid-template-columns: 1fr 1fr !important; }
    .sk-footer-brand { grid-column: 1 / -1 !important; }
  }
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
type Overlay = { active: boolean; newTheme: 'dark' | 'light' }
type TermsState = { termos: boolean; privacidade: boolean; news: boolean }

const PLATFORM_COLORS: Record<string, string> = {
  Twitch: '#9147ff', YouTube: '#ff0000', Kick: '#53fc18',
  Discord: '#5865f2', Google: '#4285f4',
}

const TW_WORDS = ['sorteios', 'comandos', 'analytics', 'metas', 'notificações', 'streams']

const STREAMERS = [
  { name: 'sheikfabio',  initials: 'SF', platform: 'Twitch', plColor: '#9147ff', url: 'https://twitch.tv/sheikfabio' },
  { name: 'thierry0800', initials: 'TH', platform: 'Twitch', plColor: '#9147ff', url: 'https://twitch.tv/thierry0800' },
]

const TESTIMONIALS = [
  { name: 'GabrielXD', platform: 'Twitch · 234K seguidores', initials: 'GX', color: '#9b30ff',
    text: 'O SheikSTREAM mudou como gerencio meu canal. Antes ficava alternando entre 4 abas, agora tudo num só lugar.' },
  { name: 'LunaStream', platform: 'TikTok · 1.2M seguidores', initials: 'LS', color: '#ff6bbd',
    text: 'Os sorteios automáticos deixaram meu chat muito mais engajado. Cresci 40% em 2 meses usando a plataforma.' },
  { name: 'NitroGamer', platform: 'Kick · 445K seguidores', initials: 'NG', color: '#39ff14',
    text: 'Finalmente uma ferramenta pensada no streamer brasileiro. Suporte rápido e funcionalidades que fazem diferença.' },
]

const FAQ_ITEMS = [
  { q: 'É realmente gratuito?', a: 'Sim, 100% gratuito durante o beta. Sem cartão de crédito, sem taxa de setup, sem surpresas.' },
  { q: 'Quais plataformas são suportadas?', a: 'Twitch, YouTube, Kick e TikTok. Facebook e Instagram estão no roadmap.' },
  { q: 'Preciso ter CNPJ ou empresa?', a: 'Não. Qualquer streamer pessoa física pode se cadastrar.' },
  { q: 'Como funciona o beta fechado?', a: 'Novos usuários entram por convite ou lista de espera, garantindo qualidade para todos.' },
  { q: 'Vou perder meu acesso quando sair do beta?', a: 'Não. Usuários do beta têm acesso garantido e quem entrar agora fica no plano gratuito para sempre.' },
]


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
  const [overlay, setOverlay] = useState<Overlay>({ active: false, newTheme: 'light' })
  const C = theme === 'dark' ? DARK : LIGHT
  const isDark = theme === 'dark'

  const [windowWidth, setWindowWidth] = useState(1200)
  const isMobile = windowWidth < 768

  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: 'Olá! Sou o assistente do Sheikstream. Pode me perguntar qualquer coisa sobre a plataforma!' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [logoOpacity, setLogoOpacity] = useState(1)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [twText, setTwText] = useState('')
  const [twIdx, setTwIdx] = useState(0)
  const [twPhase, setTwPhase] = useState<'typing' | 'deleting'>('typing')
  const [userCount, setUserCount] = useState(0)
  const [streamerImages, setStreamerImages] = useState<Record<string, string>>({})

  useEffect(() => {
    if (document.cookie.includes('sk-session')) {
      window.location.href = '/dashboard'
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('sk-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    setWindowWidth(window.innerWidth)
    const onResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  useEffect(() => {
    if (page !== 'landing') return
    const onScroll = () => setLogoOpacity(Math.max(0, 1 - (window.scrollY - 80) / 120))
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [page])

  useEffect(() => { if (page !== 'landing') setLogoOpacity(1) }, [page])

  useEffect(() => {
    if (page !== 'landing') return
    const word = TW_WORDS[twIdx]
    let timer: ReturnType<typeof setTimeout>
    if (twPhase === 'typing') {
      if (twText.length < word.length) timer = setTimeout(() => setTwText(word.slice(0, twText.length + 1)), 75)
      else timer = setTimeout(() => setTwPhase('deleting'), 2200)
    } else {
      if (twText.length > 0) timer = setTimeout(() => setTwText(twText.slice(0, -1)), 45)
      else { setTwPhase('typing'); setTwIdx(i => (i + 1) % TW_WORDS.length) }
    }
    return () => clearTimeout(timer)
  }, [twText, twPhase, twIdx, page])

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.count != null) setUserCount(d.count) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/twitch/profiles')
      .then(r => r.ok ? r.json() : [])
      .then((profiles: { username: string; image: string }[]) => {
        const map: Record<string, string> = {}
        profiles.forEach(p => { map[p.username] = p.image })
        setStreamerImages(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (page !== 'landing') return
    const ids = ['sk-howit','sk-features','sk-streamers','sk-testimonials','sk-faq','sk-cta']
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setRevealed(prev => new Set([...prev, e.target.id])) })
    }, { threshold: 0.07 })
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [page])


  function handleOAuth(platform: string) {
    if (platform === 'YouTube') { window.location.href = '/api/auth/youtube'; return }
    if (platform === 'Twitch') { window.location.href = '/api/auth/twitch'; return }
    setLoading(platform)
    setTimeout(() => { setLoading(''); setLoginPlatform(platform); setPage('pending') }, 1500)
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleThemeToggle() {
    if (overlay.active) return
    const newTheme = isDark ? 'light' : 'dark'
    setTheme(newTheme)
    setOverlay({ active: true, newTheme })
    localStorage.setItem('sk-theme', newTheme)
    setTimeout(() => setOverlay(o => ({ ...o, active: false })), 600)
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const userMsg: ChatMsg = { role: 'user', content: chatInput.trim() }
    const updated = [...chatMessages, userMsg]
    setChatMessages(updated)
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: updated.slice(1) }) })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Ops, tive um problema. Tente novamente.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const revealStyle = (id: string, delay = 0): React.CSSProperties => ({
    opacity: revealed.has(id) ? 1 : 0,
    transform: revealed.has(id) ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
  })

  const hp = isMobile ? '1.25rem' : '2.5rem'

  const themeBtn = (
    <button onClick={handleThemeToggle} className="sk-theme-btn" title={isDark ? 'Modo claro' : 'Modo escuro'}
      style={{ background: C.primaryBg, border: `1px solid ${C.border}`, color: C.primary, padding: '0.45rem 0.6rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '44px', minWidth: '44px' }}>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )

  const chatWidget = (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
      {chatOpen && (
        <div className="sk-chat-window" style={{ width: isMobile ? 'calc(100vw - 2rem)' : '340px', height: '480px', background: C.cardBgAlt, border: `1px solid ${C.borderStrong}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: `0 8px 40px ${C.primaryBgMed}` }}>
          <div style={{ padding: '0.9rem 1rem', background: C.primaryBg, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: C.chatBtnGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#fff', fontWeight: 900 }}>S</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: C.text }}>Assistente Sheikstream</div>
              <div style={{ fontSize: '0.7rem', color: C.accent, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.accent, display: 'inline-block' }} />Online
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0.2rem' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: C.cardBgAlt }}>
            {chatMessages.map((m, i) => (
              <div key={i} className="sk-chat-msg" style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '82%', padding: '0.6rem 0.85rem', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: m.role === 'user' ? C.chatUserBg : C.chatAiBg, border: m.role === 'user' ? 'none' : `1px solid ${C.chatAiBorder}`, color: m.role === 'user' ? '#fff' : C.text, fontSize: '0.82rem', lineHeight: 1.6 }}>{m.content}</div>
              </div>
            ))}
            {chatLoading && (
              <div className="sk-chat-msg" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '0.6rem 1rem', borderRadius: '12px 12px 12px 4px', background: C.chatAiBg, border: `1px solid ${C.chatAiBorder}`, display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[1,2,3].map(n => <span key={n} className={`sk-dot-${n}`} style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.dim, display: 'inline-block' }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: '0.75rem', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '0.5rem', background: C.cardBgAlt }}>
            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }} placeholder="Pergunte qualquer coisa..." disabled={chatLoading}
              style={{ flex: 1, padding: '0.55rem 0.8rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.82rem', outline: 'none', opacity: chatLoading ? 0.6 : 1, minHeight: '44px' }} />
            <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="sk-send-btn"
              style={{ padding: '0.55rem 0.9rem', background: C.primary, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', cursor: chatLoading ? 'not-allowed' : 'pointer', opacity: !chatInput.trim() ? 0.45 : 1, minHeight: '44px', minWidth: '44px' }}>→</button>
          </div>
        </div>
      )}
      <button onClick={() => setChatOpen(v => !v)} className="sk-chat-toggle"
        style={{ width: '52px', height: '52px', borderRadius: '50%', background: C.chatBtnGrad, border: `2px solid ${C.primaryBg3}`, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px ${C.primaryBgMed}`, fontSize: chatOpen ? '1.1rem' : '1.3rem' }}>
        {chatOpen ? '✕' : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>}
      </button>
    </div>
  )

  const themeOverlay = overlay.active ? (
    <div className="sk-theme-overlay" style={{ background: overlay.newTheme === 'dark' ? LIGHT.bg : DARK.bg }} />
  ) : null

  const brandLogo = (extraStyle?: React.CSSProperties) => (
    <a href="/" style={{ fontSize: isMobile ? '1.2rem' : '1.55rem', fontWeight: 900, letterSpacing: '0.5px', color: C.text, textDecoration: 'none', ...extraStyle }}>
      Sheik<span style={{ color: C.accent }}>STREAM</span>
    </a>
  )

  // ── PENDING ────────────────────────────────────────────────────────────────
  if (page === 'pending') {
    const platColor = PLATFORM_COLORS[loginPlatform] || C.primary
    return (
      <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
        <style>{makeCSS(C)}</style>{themeOverlay}
        <nav className="sk-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `1rem ${hp}`, borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100 }}>
          {brandLogo()}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {themeBtn}
            <button onClick={() => setPage('landing')} style={{ background: 'transparent', border: `1px solid ${C.vvdim}`, color: C.muted, padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', minHeight: '44px' }}>Voltar</button>
          </div>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem 1rem' }}>
          <div style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderTop: `3px solid ${C.primary}`, borderRadius: '18px', padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem', width: '100%', maxWidth: '460px', textAlign: 'center', boxShadow: `0 12px 50px ${C.primaryBgLight}` }}>
            <div className="sk-pending-pulse" style={{ width: '72px', height: '72px', borderRadius: '50%', background: C.primaryBg, border: `2px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>⏳</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: '0.68rem', padding: '0.22rem 0.85rem', borderRadius: '999px', marginBottom: '1.4rem', fontWeight: 700, letterSpacing: '1px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.accent, display: 'inline-block' }} />AGUARDANDO APROVAÇÃO
            </div>
            <h1 style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 900, marginBottom: '0.6rem', color: C.text }}>Quase lá!</h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <PIcon id={loginPlatform} color={platColor} size={18} />
              <span style={{ fontSize: '0.88rem', color: C.muted }}>Conectado via <strong style={{ color: C.text }}>{loginPlatform}</strong></span>
            </div>
            <p style={{ fontSize: '0.87rem', color: C.muted, lineHeight: 1.75, maxWidth: '360px', margin: '0 auto 2rem' }}>
              Você está na fila de espera. O administrador irá revisar seu acesso em breve e você será notificado assim que for aprovado.
            </p>
            <div style={{ background: C.accentBg15, border: `1px dashed ${C.accentBorder}`, borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.6rem' }}>DEMONSTRAÇÃO</div>
              <button onClick={() => setPage('terms')} style={{ background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', width: '100%', minHeight: '44px' }}>
                Simular aprovação do admin →
              </button>
            </div>
            <button onClick={() => setPage('landing')} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.6rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', minHeight: '44px' }}>Voltar ao início</button>
          </div>
        </div>
        {chatWidget}
      </div>
    )
  }

  // ── TERMS ────────────────────────────────────────────────────────────────
  if (page === 'terms') {
    const canContinue = termsState.termos && termsState.privacidade
    const toggleTerm = (key: keyof TermsState) => setTermsState(prev => ({ ...prev, [key]: !prev[key] }))
    const checkboxItems = [
      { key: 'termos' as const, label: 'Li e concordo com os', link: 'Termos de Uso', required: true, slug: '/termos-e-condicoes' },
      { key: 'privacidade' as const, label: 'Li e concordo com a', link: 'Política de Privacidade', required: true, slug: '/privacidade' },
      { key: 'news' as const, label: 'Aceito receber novidades e promoções da Sheikstream', link: '', required: false, slug: '' },
    ]
    return (
      <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <style>{makeCSS(C)}</style>{themeOverlay}
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: C.text }}>Sheik<span style={{ color: C.accent }}>STREAM</span></div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.6rem', background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, fontSize: '0.72rem', padding: '0.22rem 0.85rem', borderRadius: '999px', fontWeight: 700 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.accent, display: 'inline-block' }} />Acesso aprovado!
            </div>
          </div>
          <div style={{ background: isDark ? '#1a1b2e' : '#ffffff', border: `1px solid ${C.borderStrong}`, borderRadius: '16px', overflow: 'hidden', boxShadow: `0 8px 40px ${C.primaryBgLight}` }}>
            <div style={{ padding: '1.5rem', borderBottom: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: C.text, margin: 0, marginBottom: '0.4rem' }}>Antes de continuar</h2>
              <p style={{ fontSize: '0.85rem', color: C.muted, margin: 0, lineHeight: 1.6 }}>Para usar a plataforma, você precisa aceitar os termos abaixo.</p>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {checkboxItems.map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', minHeight: '44px' }} onClick={() => toggleTerm(item.key)}>
                  <div className={`sk-checkbox${termsState[item.key] ? ' checked' : ''}`} style={{ marginTop: '2px' }}>
                    {termsState[item.key] && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span style={{ fontSize: '0.88rem', color: C.text, lineHeight: 1.55, userSelect: 'none' }}>
                    {item.link ? <>{item.label}{' '}<a href={item.slug} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: C.primary, fontWeight: 600, textDecoration: 'underline' }}>{item.link}</a>{item.required ? <span style={{ color: '#e55' }}> *</span> : ''}</> : item.label}
                  </span>
                </div>
              ))}
              <p style={{ fontSize: '0.75rem', color: C.vdim, margin: '0' }}>* obrigatórios</p>
            </div>
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              <button disabled={!canContinue} onClick={() => { if (canContinue) { alert('Bem-vindo!'); setPage('landing'); setTermsState({ termos: false, privacidade: false, news: false }) } }}
                style={{ width: '100%', padding: '0.85rem', background: canContinue ? `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})` : C.vvdim, color: canContinue ? '#fff' : C.vdim, border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: canContinue ? 'pointer' : 'not-allowed', minHeight: '44px' }}>
                Continuar
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
            <button onClick={() => setPage('pending')} style={{ background: 'transparent', border: 'none', color: C.vdim, fontSize: '0.8rem', cursor: 'pointer', minHeight: '44px' }}>← Voltar</button>
          </div>
        </div>
      </div>
    )
  }

  // ── WAITLIST ────────────────────────────────────────────────────────────────
  if (page === 'waitlist') {
    return (
      <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
        <style>{makeCSS(C)}</style>{themeOverlay}
        <nav className="sk-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `1rem ${hp}`, borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100 }}>
          {brandLogo()}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {themeBtn}
            <button onClick={() => { setPage('landing'); setWaitlistDone(false); setWaitlistEmail('') }} style={{ background: 'transparent', border: `1px solid ${C.vvdim}`, color: C.muted, padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', minHeight: '44px' }}>Voltar</button>
          </div>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem 1rem' }}>
          {!waitlistDone ? (
            <div style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderTop: `3px solid ${C.primary}`, borderRadius: '16px', padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem', width: '100%', maxWidth: '440px', textAlign: 'center' }}>
              <div style={{ width: '58px', height: '58px', borderRadius: '14px', background: C.primaryBg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.7rem' }}>⏳</div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, marginBottom: '0.5rem', color: C.text }}>Lista de espera</h1>
              <p style={{ fontSize: '0.88rem', color: C.muted, lineHeight: 1.7, maxWidth: '320px', margin: '0 auto 2rem' }}>O SheikSTREAM está em beta fechado. Cadastre seu e-mail e avisamos quando sua vaga abrir.</p>
              <form onSubmit={e => { e.preventDefault(); if (waitlistEmail.trim()) setWaitlistDone(true) }}>
                <input type="email" required placeholder="seu@email.com" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.9rem', outline: 'none', marginBottom: '0.75rem', boxSizing: 'border-box', minHeight: '44px' }} />
                <button type="submit" className="sk-btn-cta" style={{ width: '100%', padding: '0.82rem', background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', minHeight: '44px' }}>
                  Garantir minha vaga grátis
                </button>
              </form>
              <p style={{ marginTop: '1.2rem', fontSize: '0.75rem', color: C.vdim }}>Sem spam. Apenas um aviso quando sua vaga abrir.</p>
            </div>
          ) : (
            <div style={{ background: C.cardBg, border: `1px solid ${C.accentBorder}`, borderTop: `3px solid ${C.accent}`, borderRadius: '16px', padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem', width: '100%', maxWidth: '440px', textAlign: 'center' }}>
              <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: C.accentBg, border: `1px solid ${C.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem', fontSize: '1.7rem', color: C.accent }}>✓</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: C.text }}>Cadastro confirmado!</h2>
              <p style={{ fontSize: '0.85rem', color: C.muted, lineHeight: 1.7, marginBottom: '2rem' }}>Avisamos em <strong style={{ color: C.text }}>{waitlistEmail}</strong> assim que abrir.</p>
              <button onClick={() => { setPage('landing'); setWaitlistDone(false); setWaitlistEmail('') }} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.6rem 1.5rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', minHeight: '44px' }}>Voltar ao início</button>
            </div>
          )}
        </div>
        {chatWidget}
      </div>
    )
  }

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if (page === 'login') {
    const oauthPlatforms = [
      { id: 'Twitch', color: '#9147ff', bg: 'rgba(145,71,255,0.1)', label: 'Entrar com Twitch' },
    ]
    return (
      <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
        <style>{makeCSS(C)}</style>{themeOverlay}
        <nav className="sk-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `1rem ${hp}`, borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100 }}>
          {brandLogo()}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {themeBtn}
            <button onClick={() => setPage('landing')} style={{ background: 'transparent', border: `1px solid ${C.vvdim}`, color: C.muted, padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', minHeight: '44px' }}>Voltar</button>
          </div>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem 1rem' }}>
          <div style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderTop: `3px solid ${C.primary}`, borderRadius: '16px', padding: isMobile ? '1.5rem' : '2.2rem', width: '100%', maxWidth: '410px', boxShadow: `0 8px 40px ${C.primaryBgLight}` }}>
            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '1.9rem', fontWeight: 900, letterSpacing: '1px', color: C.text }}>Sheik<span style={{ color: C.accent }}>STREAM</span></div>
              <div style={{ fontSize: '0.85rem', color: C.muted, marginTop: '0.3rem' }}>Conecte sua plataforma e entre no hub</div>
            </div>
            {oauthPlatforms.map(p => (
              <button key={p.id} onClick={() => handleOAuth(p.id)} className="sk-oauth-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.7rem 1rem', borderRadius: '8px', marginBottom: '0.6rem', border: `1px solid ${loading === p.id ? p.color : C.oauthBtnBorder}`, background: loading === p.id ? p.bg : C.oauthBtnBg, color: C.text, fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left', minHeight: '44px' }}>
                <span style={{ width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PIcon id={p.id} color={p.color} size={20} /></span>
                <span style={{ flex: 1 }}>{loading === p.id ? 'Conectando...' : p.label}</span>
                <span style={{ color: C.vdim, fontSize: '13px' }}>›</span>
              </button>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', margin: '1rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: C.separatorBg }} />
              <span style={{ fontSize: '0.75rem', color: C.vdim }}>ou entre com e-mail</span>
              <div style={{ flex: 1, height: '1px', background: C.separatorBg }} />
            </div>
            <input type="email" placeholder="seu@email.com" style={{ width: '100%', padding: '0.7rem 1rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.9rem', outline: 'none', marginBottom: '0.6rem', boxSizing: 'border-box', minHeight: '44px' }} />
            <button onClick={() => setPage('pending')} className="sk-btn-cta" style={{ width: '100%', padding: '0.72rem', background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', minHeight: '44px' }}>
              Entrar com e-mail
            </button>
            <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.78rem', color: C.vdim }}>
              Não tem conta?{' '}<span onClick={() => setPage('waitlist')} style={{ color: C.primary, cursor: 'pointer', fontWeight: 600 }}>Criar conta grátis</span>
            </div>
          </div>
        </div>
        {chatWidget}
      </div>
    )
  }

  // ── LANDING ────────────────────────────────────────────────────────────────
  const heroPlatforms = [
    { id: 'Twitch', color: '#9147ff' }, { id: 'YouTube', color: '#ff0000' },
    { id: 'Kick', color: '#53fc18' }, { id: 'TikTok', color: isDark ? '#f0eefc' : '#0d0c1e' }, { id: 'Facebook', color: '#1877f2' },
  ]
  const socialLinks = [
    { id: 'X', color: isDark ? '#e7e9ea' : '#1d1d1d' }, { id: 'Discord', color: '#5865f2' },
    { id: 'Twitch', color: '#9147ff' }, { id: 'Instagram', color: '#e1306c' },
  ]
  const mockPlatforms = [
    { id: 'Twitch', color: '#9147ff' }, { id: 'YouTube', color: '#ff0000' },
    { id: 'Kick', color: '#53fc18' }, { id: 'TikTok', color: isDark ? '#f0eefc' : '#0d0c1e' }, { id: 'Facebook', color: '#1877f2' },
  ]

  return (
    <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text, display: 'flex', flexDirection: 'column' }}>
      <style>{makeCSS(C)}</style>
      {themeOverlay}

      {/* Nav */}
      <nav className="sk-nav" style={{ display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, zIndex: 100, background: C.navBg, borderBottom: `1px solid ${C.border}` }}>
        <div className="sk-top-bar" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0.9rem ${hp}` }}>
          {brandLogo({ opacity: logoOpacity, transition: 'opacity 0.1s' })}
          <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '1.5rem', alignItems: 'center' }}>
            <span className="sk-nav-link sk-nav-desktop-links" onClick={() => scrollToSection('sk-features')} style={{ color: C.muted, fontSize: '0.88rem', cursor: 'pointer', fontWeight: 500 }}>Produto</span>
            <a className="sk-nav-link sk-nav-desktop-links" href="/roadmap" style={{ color: C.muted, fontSize: '0.88rem', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}>Roadmap</a>
            {themeBtn}
            <button onClick={() => window.location.href = '/login'} className="sk-btn-cta" style={{ background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', padding: isMobile ? '0.5rem 1rem' : '0.55rem 1.3rem', borderRadius: '8px', cursor: 'pointer', fontSize: isMobile ? '0.8rem' : '0.88rem', fontWeight: 700, boxShadow: `0 4px 16px ${C.primaryBgMed}`, minHeight: '44px' }}>
              App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: `${isMobile ? '3.5rem' : '5.5rem'} ${hp} 3rem`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, ${C.primary}22 1px, transparent 1px)`, backgroundSize: '28px 28px', opacity: isDark ? 0.5 : 0.3, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '320px', background: `radial-gradient(ellipse, ${C.primary}18, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div className="sk-novidade-pulse" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: C.heroBadgeBg, border: `1px solid ${C.heroBadgeBorder}`, color: C.heroBadgeText, fontSize: '0.72rem', padding: '0.3rem 1rem', borderRadius: '999px', marginBottom: '1.6rem', letterSpacing: '0.5px', fontWeight: 700 }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
            🎉 NOVIDADE — Hub para streamers brasileiros · BETA fechado
          </div>
          <h1 style={{ fontSize: `clamp(1.9rem, 6vw, 4.2rem)`, fontWeight: 900, lineHeight: 1.06, letterSpacing: '-2px', marginBottom: '1rem', color: C.text }}>
            Gerencie tudo numa<br /><span style={{ color: C.primary }}>só plataforma</span>
          </h1>
          <div style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', color: C.muted, marginBottom: '0.9rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <span>Automatize seus</span>
            <span style={{ color: C.primary, fontWeight: 700, minWidth: '130px', textAlign: 'left' }}>{twText}<span className="sk-cursor" /></span>
          </div>
          <p style={{ fontSize: isMobile ? '0.9rem' : '1rem', color: C.muted, maxWidth: '500px', margin: '0 auto 1.6rem', lineHeight: 1.75 }}>
            Conecte Twitch, YouTube, Kick, TikTok e Facebook. Sorteios, metas e engajamento — de graça.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex' }}>
              {['#9b30ff','#ff6bbd','#39ff14','#00d4ff'].map((c, i) => (
                <div key={i} style={{ width: '26px', height: '26px', borderRadius: '50%', background: c, border: `2px solid ${C.bg}`, marginLeft: i > 0 ? '-9px' : '0' }} />
              ))}
            </div>
            <span style={{ fontSize: '0.85rem', color: C.muted }}><strong style={{ color: C.text }}>{userCount.toLocaleString('pt-BR')}+</strong> streamers cadastrados</span>
          </div>
          <div className="sk-hero-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem', padding: isMobile ? `0 ${hp}` : '0' }}>
            <button onClick={() => window.location.href = '/login'} className="sk-btn-cta" style={{ background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', padding: '0.9rem 2.3rem', borderRadius: '8px', fontSize: '0.98rem', fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 24px ${C.primaryBgMed}`, minHeight: '44px' }}>
              Entrar grátis →
            </button>
            <button onClick={() => scrollToSection('sk-howit')} className="sk-btn-ghost" style={{ background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, padding: '0.9rem 1.9rem', borderRadius: '8px', fontSize: '0.92rem', cursor: 'pointer', fontWeight: 500, minHeight: '44px' }}>
              Como funciona
            </button>
          </div>
          {!isMobile && (
            <div className="sk-mock-float" style={{ maxWidth: '820px', margin: '0 auto' }}>
              <div style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderRadius: '16px', overflow: 'hidden', boxShadow: `0 28px 90px rgba(0,0,0,0.45), 0 0 0 1px ${C.borderFaint}` }}>
                <div style={{ background: C.cardBgAlt, padding: '0.65rem 1rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>{['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}</div>
                  <div style={{ flex: 1, background: C.vvdim, borderRadius: '5px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '280px', margin: '0 auto', fontSize: '0.66rem', color: C.vdim }}>🔒 sheikstream.vercel.app/dashboard</div>
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '52px', background: C.cardBgAlt, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '14px 0' }}>
                    {mockPlatforms.map(p => (<div key={p.id} style={{ width: '32px', height: '32px', borderRadius: '8px', background: C.vvdim, border: `1px solid ${C.borderFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PIcon id={p.id} color={p.color} size={14} /></div>))}
                  </div>
                  <div style={{ flex: 1, padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.6rem' }}>
                      {[{ label:'Viewers',value:'3.2K',platform:'Twitch',color:'#9147ff',delta:'+12%'},{ label:'Inscritos',value:'47.1K',platform:'YouTube',color:'#ff0000',delta:'+8%'},{ label:'Seguidores',value:'89K',platform:'Kick',color:'#53fc18',delta:'+23%'}].map(s => (
                        <div key={s.label} style={{ background: C.cardBgAlt, border: `1px solid ${C.border}`, borderRadius: '9px', padding: '0.7rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}><span style={{ fontSize: '0.6rem', color: C.dim }}>{s.label}</span><PIcon id={s.platform} color={s.color} size={11} /></div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: C.text }}>{s.value}</div>
                          <div style={{ fontSize: '0.58rem', color: C.accent, fontWeight: 600 }}>{s.delta}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: C.cardBgAlt, border: `1px solid ${C.border}`, borderRadius: '9px', padding: '0.8rem' }}>
                      <div style={{ fontSize: '0.62rem', color: C.dim, marginBottom: '0.65rem', fontWeight: 600 }}>Audiência — últimos 7 dias</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '52px' }}>
                        {[38,54,70,48,82,65,100].map((h, i) => (<div key={i} style={{ flex: 1, height: `${h}%`, background: i===6 ? `linear-gradient(180deg,${C.primary},${C.primary}80)` : C.primaryBgLight, borderRadius: '3px 3px 0 0' }} />))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="sk-stats-row" style={{ display: 'flex', justifyContent: 'center', padding: `2.5rem ${hp}`, maxWidth: '700px', margin: '0 auto', width: '100%', flexWrap: 'wrap', gap: isMobile ? '0' : '0' }}>
        {[{ value:'5',label:'plataformas integradas'},{ value:'R$0',label:'para sempre no beta'},{ value:'100%',label:'focado em BR'}].map((s,i) => (
          <div key={s.label} style={{ textAlign:'center',flex:1,minWidth:'130px',padding:'0 1.5rem',borderLeft:i>0 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ fontSize:'2rem',fontWeight:900,color:C.statColor,lineHeight:1,letterSpacing:'-1px' }}>{s.value}</div>
            <div style={{ fontSize:'0.73rem',color:C.dim,marginTop:'0.3rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Platform badges */}
      <div style={{ display:'flex',justifyContent:'center',gap:'0.6rem',flexWrap:'wrap',padding:`0 ${hp} 3.5rem` }}>
        {heroPlatforms.map(p => (
          <div key={p.id} className="sk-platform" style={{ display:'flex',alignItems:'center',gap:'0.5rem',background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:'8px',padding:'0.5rem 1.1rem',fontSize:'0.82rem',color:C.muted,fontWeight:500,minHeight:'44px' }}>
            <PIcon id={p.id} color={p.color} size={15} />{p.id}
          </div>
        ))}
      </div>

      <div style={{ height:'1px',background:C.border,margin:`0 ${hp}` }} />

      {/* Como Funciona */}
      <section id="sk-howit" style={{ padding:`5rem ${hp}`,maxWidth:'1000px',margin:'0 auto',width:'100%',boxSizing:'border-box',...revealStyle('sk-howit') }}>
        <div style={{ textAlign:'center',marginBottom:'3.5rem' }}>
          <div style={{ fontSize:'0.7rem',letterSpacing:'2.5px',color:C.accent,textTransform:'uppercase',fontWeight:700,marginBottom:'0.6rem' }}>Como funciona</div>
          <h2 style={{ fontSize:isMobile?'1.7rem':'2.2rem',fontWeight:900,color:C.text,letterSpacing:'-1px',marginBottom:'0.5rem' }}>3 passos simples</h2>
        </div>
        <div className="sk-howit-grid" style={{ display:'grid',gridTemplateColumns:'1fr auto 1fr auto 1fr',alignItems:'center',gap:'0.5rem' }}>
          {[
            { icon:'🔗',title:'Conecte suas plataformas',desc:'Vincule Twitch, YouTube, Kick e TikTok com um clique.' },
            { icon:'⚙️',title:'Configure em minutos',desc:'Defina comandos, sorteios e metas automaticamente.' },
            { icon:'📊',title:'Gerencie num só lugar',desc:'Painel unificado com métricas em tempo real.' },
          ].map((step,i) => (
            <>
              <div key={step.icon} className="sk-step-card" style={{ background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:'16px',padding:isMobile?'1.5rem 1rem':'2rem 1.5rem',textAlign:'center' }}>
                <div style={{ width:'60px',height:'60px',borderRadius:'16px',background:C.primaryBg,border:`1px solid ${C.borderStrong}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.2rem',fontSize:'1.8rem' }}>{step.icon}</div>
                <div style={{ display:'inline-block',background:C.primaryBg,border:`1px solid ${C.border}`,color:C.primary,fontSize:'0.65rem',fontWeight:800,padding:'0.15rem 0.7rem',borderRadius:'999px',marginBottom:'0.8rem' }}>PASSO {i+1}</div>
                <h3 style={{ fontSize:'0.95rem',fontWeight:700,color:C.text,marginBottom:'0.6rem' }}>{step.title}</h3>
                <p style={{ fontSize:'0.82rem',color:C.muted,lineHeight:1.65,margin:0 }}>{step.desc}</p>
              </div>
              {i<2 && <div key={`a${i}`} className="sk-howit-arrow" style={{ textAlign:'center',fontSize:'1.6rem',color:C.primary,opacity:0.6 }}>→</div>}
            </>
          ))}
        </div>
      </section>

      <div style={{ height:'1px',background:C.border,margin:`0 ${hp}` }} />

      {/* Features */}
      <section id="sk-features" style={{ padding:`5rem ${hp}`,maxWidth:'1000px',margin:'0 auto',width:'100%',boxSizing:'border-box',...revealStyle('sk-features') }}>
        <div style={{ fontSize:'0.7rem',letterSpacing:'2.5px',color:C.accent,textTransform:'uppercase',marginBottom:'0.6rem',fontWeight:700 }}>Produto</div>
        <h2 style={{ fontSize:isMobile?'1.7rem':'2.2rem',fontWeight:900,color:C.text,marginBottom:'0.6rem',letterSpacing:'-1px' }}>Feito pra quem vive de stream</h2>
        <p style={{ fontSize:'0.9rem',color:C.dim,marginBottom:'2.5rem',maxWidth:'480px' }}>Tudo que você precisa para crescer, num só painel.</p>
        <div className="sk-features-grid" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',border:`1px solid ${C.border}`,borderRadius:'14px',overflow:'hidden' }}>
          {[
            { icon:'◈',title:'Painel Unificado',desc:'Métricas de todas as plataformas em tempo real.',green:true },
            { icon:'◎',title:'Gerenciamento de Metas',desc:'Defina e acompanhe metas de seguidores e subs.',green:false },
            { icon:'✦',title:'Sorteios e Eventos',desc:'Sorteios automáticos que deixam o chat em chamas.',green:true },
            { icon:'◉',title:'Notificações ao Vivo',desc:'Avise sua comunidade no segundo exato da live.',green:false },
            { icon:'▲',title:'Analytics Avançados',desc:'Descubra o que retém — e o que faz sair.',green:true },
            { icon:'⬡',title:'Bot de Automação',desc:'Moderação, comandos e respostas automáticas.',green:false },
          ].map(f => (
            <div key={f.title} className="sk-feature-card" style={{ background:C.cardBg,padding:isMobile?'1.3rem':'1.6rem',borderRight:`1px solid ${C.featureSep}`,borderBottom:`1px solid ${C.featureSep}` }}>
              <div style={{ width:'38px',height:'38px',background:f.green?C.iconGreenBg:C.iconPurpleBg,borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1rem',fontSize:'17px',color:f.green?C.iconGreen:C.iconPurple,border:`1px solid ${f.green?C.accentBorder:C.border}` }}>{f.icon}</div>
              <div style={{ fontSize:'0.93rem',fontWeight:700,color:C.text,marginBottom:'0.4rem' }}>{f.title}</div>
              <div style={{ fontSize:'0.81rem',color:C.muted,lineHeight:1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height:'1px',background:C.border,margin:`0 ${hp}` }} />

      {/* Criadores */}
      <section id="sk-streamers" style={{ padding:`5rem ${hp}`,maxWidth:'1000px',margin:'0 auto',width:'100%',boxSizing:'border-box',...revealStyle('sk-streamers') }}>
        <div style={{ textAlign:'center',marginBottom:'3rem' }}>
          <div style={{ fontSize:'0.7rem',letterSpacing:'2.5px',color:C.accent,textTransform:'uppercase',fontWeight:700,marginBottom:'0.6rem' }}>Comunidade</div>
          <h2 style={{ fontSize:isMobile?'1.7rem':'2.2rem',fontWeight:900,color:C.text,letterSpacing:'-1px',marginBottom:'0.5rem' }}>Criadores que usam</h2>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'1rem' }}>
          {STREAMERS.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="sk-streamer-card" style={{ background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:'14px',padding:'1.5rem 1rem',textAlign:'center',textDecoration:'none',display:'block',cursor:'pointer' }}>
              <div style={{ width:'54px',height:'54px',borderRadius:'50%',border:`2px solid ${C.borderStrong}`,margin:'0 auto 0.85rem',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:C.primaryBg }}>
                {streamerImages[s.name]
                  ? <img src={streamerImages[s.name]} alt={s.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                  : <span style={{ fontSize:'1.1rem',fontWeight:900,color:C.primary }}>{s.initials}</span>
                }
              </div>
              <div style={{ fontSize:'0.9rem',fontWeight:700,color:C.text,marginBottom:'0.3rem' }}>{s.name}</div>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'0.3rem' }}><PIcon id={s.platform} color={s.plColor} size={12} /><span style={{ fontSize:'0.72rem',color:C.muted }}>{s.platform}</span></div>
            </a>
          ))}
        </div>
      </section>

      <div style={{ height:'1px',background:C.border,margin:`0 ${hp}` }} />

      {/* Depoimentos */}
      <section id="sk-testimonials" style={{ padding:`5rem ${hp}`,maxWidth:'1000px',margin:'0 auto',width:'100%',boxSizing:'border-box',...revealStyle('sk-testimonials') }}>
        <div style={{ textAlign:'center',marginBottom:'3rem' }}>
          <div style={{ fontSize:'0.7rem',letterSpacing:'2.5px',color:C.accent,textTransform:'uppercase',fontWeight:700,marginBottom:'0.6rem' }}>Depoimentos</div>
          <h2 style={{ fontSize:isMobile?'1.7rem':'2.2rem',fontWeight:900,color:C.text,letterSpacing:'-1px' }}>O que nossos usuários falam</h2>
        </div>
        <div className="sk-testimonials-grid" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'1.25rem' }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="sk-testimonial-card" style={{ background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:'16px',padding:'1.8rem' }}>
              <div style={{ color:'#fbbf24',fontSize:'1rem',letterSpacing:'2px',marginBottom:'1rem' }}>★★★★★</div>
              <p style={{ fontSize:'0.88rem',color:C.muted,lineHeight:1.75,marginBottom:'1.4rem',fontStyle:'italic' }}>"{t.text}"</p>
              <div style={{ display:'flex',alignItems:'center',gap:'0.75rem' }}>
                <div style={{ width:'40px',height:'40px',borderRadius:'50%',background:t.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',fontWeight:900,color:'#fff',flexShrink:0,boxShadow:`0 3px 12px ${t.color}44` }}>{t.initials}</div>
                <div><div style={{ fontSize:'0.88rem',fontWeight:700,color:C.text }}>{t.name}</div><div style={{ fontSize:'0.72rem',color:C.muted }}>{t.platform}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height:'1px',background:C.border,margin:`0 ${hp}` }} />

      {/* FAQ */}
      <section id="sk-faq" style={{ padding:`5rem ${hp}`,maxWidth:'780px',margin:'0 auto',width:'100%',boxSizing:'border-box',...revealStyle('sk-faq') }}>
        <div style={{ textAlign:'center',marginBottom:'3rem' }}>
          <div style={{ fontSize:'0.7rem',letterSpacing:'2.5px',color:C.accent,textTransform:'uppercase',fontWeight:700,marginBottom:'0.6rem' }}>FAQ</div>
          <h2 style={{ fontSize:isMobile?'1.7rem':'2.2rem',fontWeight:900,color:C.text,letterSpacing:'-1px' }}>Dúvidas frequentes</h2>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:'0.5rem' }}>
          {FAQ_ITEMS.map((item,i) => (
            <div key={i} className="sk-faq-item" onClick={() => setFaqOpen(faqOpen===i?null:i)}
              style={{ background:faqOpen===i?C.primaryBgLight:C.cardBg,border:`1px solid ${faqOpen===i?C.borderStrong:C.border}`,borderRadius:'10px',overflow:'hidden' }}>
              <div style={{ padding:'1.1rem 1.4rem',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem',minHeight:'44px' }}>
                <span style={{ fontSize:isMobile?'0.88rem':'0.93rem',fontWeight:600,color:C.text }}>{item.q}</span>
                <span style={{ color:C.primary,fontSize:'1.1rem',fontWeight:700,flexShrink:0,transition:'transform 0.15s',transform:faqOpen===i?'rotate(45deg)':'rotate(0deg)' }}>+</span>
              </div>
              {faqOpen===i && <div style={{ padding:'0 1.4rem 1.1rem',fontSize:'0.87rem',color:C.muted,lineHeight:1.75,borderTop:`1px solid ${C.border}`,paddingTop:'1rem' }}>{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      <div style={{ height:'1px',background:C.border,margin:`0 ${hp}` }} />

      {/* CTA */}
      <section id="sk-cta" style={{ padding:`5rem ${hp}`,maxWidth:'1000px',margin:'0 auto',width:'100%',boxSizing:'border-box',...revealStyle('sk-cta') }}>
        <div style={{ background:`linear-gradient(135deg,${C.primaryBg},${C.accentBg15})`,border:`1px solid ${C.borderStrong}`,borderRadius:'20px',padding:isMobile?'2.5rem 1.5rem':'4rem 3rem',textAlign:'center',position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',top:'-60px',left:'50%',transform:'translateX(-50%)',width:'500px',height:'280px',background:`radial-gradient(ellipse, ${C.primary}20, transparent 70%)`,pointerEvents:'none' }} />
          <div style={{ display:'inline-block',background:C.accentBg15,border:`1px solid ${C.accentBorder}`,color:C.accent,fontSize:'0.62rem',padding:'0.22rem 0.85rem',borderRadius:'999px',fontWeight:700,marginBottom:'1.2rem',letterSpacing:'1px',position:'relative' }}>BETA ABERTO</div>
          <h2 style={{ fontSize:isMobile?'1.6rem':'2.4rem',fontWeight:900,color:C.text,marginBottom:'0.8rem',letterSpacing:'-1px',position:'relative' }}>Pronto pra centralizar tudo?</h2>
          <p style={{ fontSize:isMobile?'0.9rem':'1rem',color:C.muted,marginBottom:'2.2rem',position:'relative',maxWidth:'420px',margin:'0 auto 2.2rem',lineHeight:1.7 }}>Conecte suas plataformas em menos de 2 minutos e comece a crescer de verdade.</p>
          <button onClick={() => window.location.href='/login'} className="sk-btn-cta" style={{ background:`linear-gradient(135deg,${C.primary},${isDark?'#7b5cff':'#5a15d0'})`,color:'#fff',border:'none',padding:'1rem 2.8rem',borderRadius:'9px',fontSize:'1rem',fontWeight:700,cursor:'pointer',boxShadow:`0 6px 28px ${C.primaryBgMed}`,position:'relative',minHeight:'44px' }}>Começar agora →</button>
          <div style={{ fontSize:'0.78rem',color:C.dim,marginTop:'1.1rem',position:'relative' }}>Sem cartão de crédito. Acesso imediato ao beta.</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:`1px solid ${C.border}`,marginTop:'auto',background:C.footerBg }}>
        <div style={{ borderBottom:`1px solid ${C.border}` }}>
          <div style={{ maxWidth:'1000px',margin:'0 auto',padding:`1.8rem ${hp}`,display:'flex',alignItems:isMobile?'flex-start':'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1.5rem',flexDirection:isMobile?'column':'row' }}>
            <div>
              <div style={{ fontSize:'0.97rem',fontWeight:700,color:C.text,marginBottom:'0.2rem' }}>Fique por dentro</div>
              <div style={{ fontSize:'0.8rem',color:C.dim }}>Assine para saber as novidades</div>
            </div>
            {!newsletterDone ? (
              <form onSubmit={e=>{ e.preventDefault(); if(newsletterEmail.trim()) setNewsletterDone(true) }} style={{ display:'flex',gap:'0.5rem',flexWrap:'wrap',width:isMobile?'100%':'auto' }}>
                <input type="email" required placeholder="seu@email.com" value={newsletterEmail} onChange={e=>setNewsletterEmail(e.target.value)}
                  style={{ padding:'0.6rem 1rem',background:C.inputBg,border:`1px solid ${C.inputBorder}`,borderRadius:'8px',color:C.text,fontSize:'0.85rem',outline:'none',width:isMobile?'100%':'220px',boxSizing:'border-box',minHeight:'44px' }} />
                <button type="submit" style={{ padding:'0.6rem 1.3rem',background:C.primary,color:'#fff',border:'none',borderRadius:'8px',fontSize:'0.85rem',fontWeight:600,cursor:'pointer',minHeight:'44px',width:isMobile?'100%':'auto' }}>Assinar</button>
              </form>
            ) : (
              <div style={{ color:C.accent,fontSize:'0.9rem',fontWeight:700 }}>✓ Inscrito!</div>
            )}
          </div>
        </div>
        <div style={{ maxWidth:'1000px',margin:'0 auto',padding:`3rem ${hp} 2rem` }}>
          <div className="sk-footer-grid" style={{ display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'1.8fr 1fr 1fr 1fr 1.1fr',gap:'2rem',marginBottom:'3rem' }}>
            <div className="sk-footer-brand" style={{ gridColumn:isMobile?'1 / -1':undefined }}>
              <div style={{ fontSize:'1.4rem',fontWeight:900,letterSpacing:'0.5px',marginBottom:'0.7rem',color:C.text }}>Sheik<span style={{ color:C.accent }}>STREAM</span></div>
              <p style={{ fontSize:'0.81rem',color:C.dim,lineHeight:1.75,margin:'0 0 1rem',maxWidth:'220px' }}>O hub definitivo para streamers brasileiros.</p>
              <div style={{ display:'flex',gap:'0.45rem',flexWrap:'wrap',marginBottom:'1rem' }}>
                {socialLinks.map(s => (<a key={s.id} href="#" className="sk-social-icon" style={{ width:'32px',height:'32px',background:C.vvdim,border:`1px solid ${C.border}`,borderRadius:'7px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',textDecoration:'none' }}><PIcon id={s.id} color={s.color} size={14} /></a>))}
              </div>
              <div style={{ display:'flex',gap:'0.4rem',flexWrap:'wrap' }}>
                {['🔒 SSL','🛡️ LGPD','🇧🇷 Brasil'].map(seal => (<span key={seal} style={{ fontSize:'0.62rem',color:C.vdim,background:C.vvdim,border:`1px solid ${C.border}`,borderRadius:'4px',padding:'0.15rem 0.5rem',fontWeight:600 }}>{seal}</span>))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:'0.65rem',fontWeight:700,letterSpacing:'1.8px',color:C.vdim,textTransform:'uppercase',marginBottom:'1.1rem' }}>Produto</div>
              {[{ label:'Recursos',action:()=>scrollToSection('sk-features') },{ label:'Roadmap',href:'/roadmap' },{ label:'Changelog',href:'/changelog' }].map(l => l.href
                ? <a key={l.label} href={l.href} className="sk-legal-link" style={{ display:'block',fontSize:'0.83rem',color:C.dim,marginBottom:'0.6rem',textDecoration:'none' }}>{l.label}</a>
                : <div key={l.label} className="sk-legal-link" onClick={l.action} style={{ fontSize:'0.83rem',color:C.dim,marginBottom:'0.6rem' }}>{l.label}</div>
              )}
            </div>
            <div>
              <div style={{ fontSize:'0.65rem',fontWeight:700,letterSpacing:'1.8px',color:C.vdim,textTransform:'uppercase',marginBottom:'1.1rem' }}>Streamers</div>
              {['Twitch','YouTube','Kick','TikTok'].map(p => (<div key={p} className="sk-legal-link" style={{ fontSize:'0.83rem',color:C.dim,marginBottom:'0.6rem' }}>{p}</div>))}
            </div>
            <div>
              <div style={{ fontSize:'0.65rem',fontWeight:700,letterSpacing:'1.8px',color:C.vdim,textTransform:'uppercase',marginBottom:'1.1rem' }}>Empresa</div>
              {[{ label:'Sobre',href:'/sobre' },{ label:'Blog',href:'/blog' },{ label:'Contato',href:'/contato' }].map(l => (<a key={l.label} href={l.href} className="sk-legal-link" style={{ display:'block',fontSize:'0.83rem',color:C.dim,marginBottom:'0.6rem',textDecoration:'none' }}>{l.label}</a>))}
            </div>
            <div>
              <div style={{ fontSize:'0.65rem',fontWeight:700,letterSpacing:'1.8px',color:C.vdim,textTransform:'uppercase',marginBottom:'1.1rem' }}>Legal</div>
              {[{ label:'Termos',href:'/termos-e-condicoes' },{ label:'Privacidade',href:'/privacidade' },{ label:'Cookies',href:'/cookies' }].map(l => (<a key={l.label} href={l.href} className="sk-legal-link" style={{ display:'block',fontSize:'0.83rem',color:C.dim,marginBottom:'0.6rem',textDecoration:'none' }}>{l.label}</a>))}
            </div>
          </div>
          <div style={{ height:'1px',background:C.border,marginBottom:'1.4rem' }} />
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem',flexDirection:isMobile?'column':'row',textAlign:isMobile?'center':'left' }}>
            <div style={{ fontSize:'0.73rem',color:C.vdim }}>🇧🇷 Feito no Brasil · © 2025 Sheikstream.</div>
            <div style={{ display:'flex',gap:'1.4rem',alignItems:'center',flexWrap:'wrap',justifyContent:'center' }}>
              {[{ label:'Termos',href:'/termos-e-condicoes' },{ label:'Privacidade',href:'/privacidade' }].map(l => (<a key={l.label} href={l.href} className="sk-legal-link" style={{ fontSize:'0.73rem',color:C.vdim,textDecoration:'none' }}>{l.label}</a>))}
              <a href="/admin" style={{ fontSize:'0.68rem',color:'#ff4444',textDecoration:'none',background:'rgba(255,68,68,0.1)',border:'1px solid rgba(255,68,68,0.3)',padding:'0.18rem 0.65rem',borderRadius:'999px',fontWeight:700,opacity:0.7 }}
                onMouseOver={e=>(e.currentTarget.style.opacity='1')} onMouseOut={e=>(e.currentTarget.style.opacity='0.7')}>ADMIN</a>
            </div>
          </div>
        </div>
      </footer>

      {chatWidget}
    </div>
  )
}
