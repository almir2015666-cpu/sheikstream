'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ToastProvider } from '@/app/components/Toast'

const SW = 240

const DARK_S = {
  bg: '#08090d', bar: '#0b0c17', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.45)',
  vdim: 'rgba(232,230,248,0.25)', primary: '#9b30ff',
  primaryBg: 'rgba(155,48,255,0.1)', accent: '#39ff14',
  border: 'rgba(255,255,255,0.05)', borderP: 'rgba(155,48,255,0.15)',
  topbar: '#0d0e1c', iconActive: '#c084fc',
}
const LIGHT_S = {
  bg: '#f0effe', bar: '#ffffff', card: '#ffffff', text: '#0f0e24',
  muted: 'rgba(15,14,36,0.65)', dim: 'rgba(15,14,36,0.45)',
  vdim: 'rgba(15,14,36,0.25)', primary: '#7b2eff',
  primaryBg: 'rgba(123,46,255,0.08)', accent: '#059669',
  border: 'rgba(0,0,0,0.07)', borderP: 'rgba(123,46,255,0.18)',
  topbar: '#ffffff', iconActive: '#9b30ff',
}

const I = {
  dash: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>,
  plat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  sort: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  ban:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></svg>,
  meta: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  cmd:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  time: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  over: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  suba: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  link: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  prof: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  inv:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.68h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/></svg>,
  out:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chev: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  arr:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  sun:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
}

type Badge = 'NOVO' | 'ATUALIZADO'
type Child = { id: string; label: string; href: string; badge?: 'NOVO' }
type Item  = { id: string; label: string; href: string; icon: React.ReactNode; badge?: Badge; children?: Child[] }
type Group = { label: string; items: Item[] }

const NAV_GROUPS: Group[] = [
  { label: '', items: [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: I.dash },
  ]},
  { label: 'AO VIVO', items: [
    { id: 'subathon', label: 'Subathon', href: '/dashboard/subathon', icon: I.suba, badge: 'NOVO' },
    { id: 'timers',   label: 'Timers',   href: '/dashboard/timers',   icon: I.time },
    { id: 'comandos', label: 'Comandos', href: '/dashboard/comandos', icon: I.cmd  },
  ]},
  { label: 'SORTEIO', items: [
    { id: 'sorteios', label: 'Sorteios', href: '/dashboard/sorteios', icon: I.sort,
      children: [
        { id: 's-criar',   label: 'Criar / Editar', href: '/dashboard/sorteios' },
        { id: 's-tickets', label: 'Tickets',         href: '/dashboard/sorteios/tickets', badge: 'NOVO' },
      ]
    },
  ]},
  { label: 'FINANCEIRO', items: [
    { id: 'plataformas', label: 'Plataformas', href: '/dashboard/plataformas', icon: I.plat, badge: 'NOVO',
      children: [
        { id: 'p-twitch',  label: 'Twitch',  href: '/dashboard/plataformas/twitch' },
        { id: 'p-livepix', label: 'Livepix', href: '/dashboard/plataformas/livepix' },
      ]
    },
    { id: 'metas', label: 'Metas', href: '/dashboard/metas', icon: I.meta },
  ]},
  { label: 'OVERLAYS', items: [
    { id: 'overlays', label: 'Overlays', href: '/dashboard/overlays', icon: I.over },
    { id: 'banners',  label: 'Banners',  href: '/dashboard/banners',  icon: I.ban, badge: 'NOVO' },
  ]},
  { label: 'CONTA', items: [
    { id: 'conexoes', label: 'Conexões',  href: '/dashboard/conexoes', icon: I.link, badge: 'ATUALIZADO' },
    { id: 'convites', label: 'Convites',  href: '/dashboard/convites', icon: I.inv,  badge: 'NOVO' },
    { id: 'perfil',   label: 'Meu perfil', href: '/dashboard/perfil', icon: I.prof },
  ]},
]
const NAV_ALL: Item[] = NAV_GROUPS.flatMap(g => g.items)

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/plataformas': 'Plataformas',
  '/dashboard/sorteios': 'Sorteios',
  '/dashboard/sorteios/novo': 'Novo Sorteio',
  '/dashboard/sorteios/tickets': 'Tickets',
  '/dashboard/subathon': 'Subathon',
  '/dashboard/banners': 'Banners',
  '/dashboard/banners/novo': 'Novo Banner',
  '/dashboard/metas': 'Metas',
  '/dashboard/comandos': 'Comandos',
  '/dashboard/timers': 'Timers',
  '/dashboard/overlays': 'Overlays',
  '/dashboard/conexoes': 'Conexões',
  '/dashboard/perfil': 'Meu Perfil',
  '/dashboard/convites': 'Convites',
}

function Chip({ type }: { type: Badge }) {
  return type === 'NOVO'
    ? <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.45rem', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', borderRadius: '999px', letterSpacing: '0.4px', flexShrink: 0, border: '1px solid rgba(59,130,246,0.3)' }}>NOVO</span>
    : <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.45rem', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', borderRadius: '999px', letterSpacing: '0.4px', flexShrink: 0, border: '1px solid rgba(251,191,36,0.3)' }}>ATUALIZADO</span>
}

type BannerCfg = {
  active: boolean; icon: string; text_main: string; text_sub: string; text_note: string
  action_label: string; action_url: string; color: string
  text_main_color: string; text_sub_color: string; text_note_color: string
  glow: boolean
  amount_current: number; amount_goal: number; supporter_count: number
  position: 'top' | 'bottom'
}

function BannerBar({ banner, S, isDark, onDismiss }: { banner: BannerCfg; S: typeof DARK_S; isDark: boolean; onDismiss: () => void }) {
  const isTop = banner.position === 'top' || !banner.position
  const mainColor = banner.text_main_color || banner.color
  const subColor = banner.text_sub_color || S.muted
  const noteColor = banner.text_note_color || S.dim
  const glowStyle = banner.glow ? { textShadow: `0 0 8px ${mainColor}cc, 0 0 20px ${mainColor}66` } : {}
  return (
    <div style={{ background: isDark ? `${banner.color}18` : `${banner.color}12`, [isTop ? 'borderBottom' : 'borderTop']: `2px solid ${banner.color}55`, padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{banner.icon || '☕'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: mainColor, ...glowStyle }}>{banner.text_main}</span>
          {banner.text_sub && <span style={{ fontSize: '0.76rem', color: subColor }}>{banner.text_sub}</span>}
        </div>
        {banner.text_note && <div style={{ fontSize: '0.68rem', color: noteColor, marginTop: '0.1rem' }}>{banner.text_note}</div>}
        {banner.amount_goal > 0 && (
          <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, maxWidth: 200, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
              <div style={{ background: banner.color, width: `${Math.min(100, (banner.amount_current / banner.amount_goal) * 100)}%`, height: '100%', borderRadius: 99, transition: 'width 0.5s' }} />
            </div>
            <span style={{ fontSize: '0.68rem', color: banner.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
              R$ {Number(banner.amount_current).toLocaleString('pt-BR', {minimumFractionDigits: 2})} de R$ {Number(banner.amount_goal).toLocaleString('pt-BR', {minimumFractionDigits: 2})} ({Math.round((banner.amount_current / banner.amount_goal) * 100)}%)
            </span>
            {banner.supporter_count > 0 && (
              <span style={{ fontSize: '0.68rem', color: S.muted, whiteSpace: 'nowrap' }}>
                👥 {banner.supporter_count} apoiador{banner.supporter_count !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        )}
      </div>
      {banner.action_url && (
        <a href={banner.action_url} target="_blank" rel="noopener noreferrer"
          style={{ padding: '0.45rem 1rem', background: `${banner.color}22`, border: `1px solid ${banner.color}55`, color: banner.color, borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {banner.action_label || 'Apoiar'}
        </a>
      )}
      <button onClick={onDismiss} style={{ background: 'transparent', border: 'none', color: S.dim, cursor: 'pointer', fontSize: '1rem', padding: '0.2rem', lineHeight: 1, flexShrink: 0 }}>✕</button>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [user, setUser] = useState<{ id: string; name: string; email: string; image: string } | null>(null)
  const [status, setStatus] = useState<'loading' | 'done'>('loading')
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [navSearch, setNavSearch] = useState('')
  const lastTrackedPath = useRef<string | null>(null)
  const [seenBadges, setSeenBadges] = useState<Set<string>>(new Set())
  const [banner, setBanner] = useState<BannerCfg | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const S = theme === 'dark' ? DARK_S : LIGHT_S
  const isDark = theme === 'dark'

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sk-seen-badges') || '[]')
      setSeenBadges(new Set(saved))
    } catch { /* ignore */ }
    try {
      const t = localStorage.getItem('sk-theme') as 'dark' | 'light' | null
      if (t) setTheme(t)
    } catch { /* ignore */ }
    const fetchBanner = () => fetch('/api/dev-banner').then(r => r.json()).then(d => setBanner(d?.active ? d : null)).catch(() => {})
    fetchBanner()
    const iv = setInterval(fetchBanner, 30000)
    return () => clearInterval(iv)
  }, [])

  // Auto-dismiss badge when navigating to that page
  useEffect(() => {
    const toAdd: string[] = []
    NAV_ALL.forEach(item => {
      if (item.badge) {
        const isHere = item.href === '/dashboard' ? pathname === '/dashboard' : pathname === item.href || pathname.startsWith(item.href + '/')
        if (isHere) toAdd.push(item.id)
      }
      item.children?.forEach(ch => {
        if (ch.badge && pathname === ch.href) toAdd.push(ch.id)
      })
    })
    if (toAdd.length > 0) {
      setSeenBadges(prev => {
        const filtered = toAdd.filter(id => !prev.has(id))
        if (filtered.length === 0) return prev
        const next = new Set(prev)
        filtered.forEach(id => next.add(id))
        try { localStorage.setItem('sk-seen-badges', JSON.stringify([...next])) } catch {}
        return next
      })
    }
  }, [pathname])

  function dismissBadge(id: string) {
    setSeenBadges(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      try { localStorage.setItem('sk-seen-badges', JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }

  function toggleTheme() {
    const t = isDark ? 'light' : 'dark'
    setTheme(t)
    try { localStorage.setItem('sk-theme', t) } catch {}
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetch('/api/me')
      .then(async r => {
        if (r.status === 403) {
          const body = await r.json().catch(() => ({}))
          if (body?.error === 'banned') router.replace('/login?error=banned')
          else router.replace('/pending')
          return undefined
        }
        return r.ok ? r.json() : null
      })
      .then(data => { if (data !== undefined) { setUser(data); setStatus('done') } })
      .catch(() => setStatus('done'))
  }, [])

  useEffect(() => {
    if (status === 'done' && !user) router.replace('/login')
  }, [status, user, router])

  useEffect(() => {
    if (!user) return
    if (lastTrackedPath.current === pathname) return
    lastTrackedPath.current = pathname
    const label = PAGE_TITLES[pathname] ?? pathname
    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'dashboard', event: 'page_view', details: label }),
    }).catch(() => {})
  }, [pathname, user])

  if (status === 'loading') return <div style={{ background: DARK_S.bg, minHeight: '100vh' }} />
  if (!user) return null

  function active(item: Item) {
    if (item.href === '/dashboard') return pathname === '/dashboard'
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  function matchSearch(q: string) {
    const lq = q.toLowerCase()
    const hits: { item: Item; child?: Child; groupLabel: string }[] = []
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (item.label.toLowerCase().includes(lq)) {
          hits.push({ item, groupLabel: group.label })
        }
        for (const ch of item.children ?? []) {
          if (ch.label.toLowerCase().includes(lq)) {
            hits.push({ item, child: ch, groupLabel: group.label })
          }
        }
      }
    }
    return hits
  }

  function toggle(id: string, e: React.MouseEvent) {
    e.preventDefault()
    setOpen(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard'

  const css = `
    *{box-sizing:border-box;-webkit-font-smoothing:antialiased;transition:background-color 0.25s ease,color 0.22s ease,border-color 0.22s ease,box-shadow 0.22s ease;}
    a,button,svg,img,input,select,textarea,span[style*="border-radius"],div[style*="animation"]{transition:none!important;}
    .sk-nl{transition:background 0.12s,color 0.12s!important;}
    .sk-nl:hover{background:${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}!important;color:${S.text}!important;}
    .sk-nl-act{transition:background 0.12s,color 0.12s!important;}
    .sk-nl-act:hover{filter:brightness(${isDark ? '1.08' : '0.95'});}
    .sk-signout{transition:opacity 0.1s,color 0.1s!important;}
    .sk-signout:hover{opacity:1!important;color:#ff4444!important;}
    .sk-theme-btn{background:transparent;border:none;cursor:pointer;padding:0.3rem;display:flex;align-items:center;color:${S.dim};transition:transform 0.2s ease!important;}
    .sk-theme-btn:hover{transform:rotate(15deg) scale(1.15);color:${S.primary};}
    .sk-hamburger{transition:opacity 0.08s!important;}
    .sk-hamburger:hover{opacity:0.75!important;}
    .sk-mobile-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:199;backdrop-filter:blur(2px);}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-thumb{background:rgba(155,48,255,0.2);border-radius:2px;}
    @keyframes sk-slide-in{from{transform:translateX(-100%);}to{transform:translateX(0);}}
    .sk-sidebar-mobile{animation:sk-slide-in 0.22s cubic-bezier(0.4,0,0.2,1) forwards;}
    @keyframes sk-pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
    main{background:${S.bg};transition:background 0.25s ease!important;}
    ${!isDark ? `
    main>div{background:${S.bg}!important;color:${S.text}!important;}
    main [style*="rgb(8, 9, 13)"]{background:${S.bg}!important;color:${S.text}!important;}
    main [style*="rgb(17, 18, 25)"]{background:${S.card}!important;color:${S.text}!important;}
    main [style*="rgb(11, 12, 23)"]{background:${S.bg}!important;}
    main [style*="rgb(13, 14, 22)"]{background:rgba(0,0,0,0.04)!important;}
    main [style*="rgb(11, 13, 26)"]{background:rgba(0,0,0,0.04)!important;}
    main [style*="rgb(15, 16, 24)"]{background:${S.card}!important;}
    main [style*="rgb(13, 15, 24)"]{background:${S.card}!important;}
    main [style*="rgb(17, 20, 32)"]{background:rgba(0,0,0,0.04)!important;}
    main [style*="#08090d"]{background:${S.bg}!important;color:${S.text}!important;}
    main [style*="#111219"]{background:${S.card}!important;color:${S.text}!important;}
    main [style*="#0b0c17"]{background:${S.bg}!important;}
    main [style*="#0d0e16"]{background:rgba(0,0,0,0.04)!important;}
    main [style*="#0b0d1a"]{background:rgba(0,0,0,0.04)!important;}
    main [style*="#0f1018"]{background:${S.card}!important;}
    main [style*="#0f1120"]{background:${S.card}!important;}
    main [style*="#1a1b24"]{background:${S.card}!important;}
    main [style*="#0d0f18"]{background:${S.card}!important;color:${S.text}!important;}
    main [style*="#0d0f1e"]{background:${S.card}!important;}
    main [style*="#111420"]{background:rgba(0,0,0,0.04)!important;}
    main [style*="#0f1028"]{background:${S.card}!important;}
    main [style*="#131623"]{background:${S.card}!important;}
    main [style*="#080a14"]{background:${S.bg}!important;}
    main [style*="#0e0f17"]{background:rgba(0,0,0,0.04)!important;}
    main [style*="color:#e8e6f8"],main [style*="color: #e8e6f8"]{color:${S.text}!important;}
    main [style*="color: rgb(232, 230, 248)"]{color:${S.text}!important;}
    main [style*="rgba(232,230,248, 0.55)"],main [style*="rgba(232,230,248,0.55)"]{color:${S.muted}!important;}
    main [style*="rgba(232,230,248, 0.3)"],main [style*="rgba(232,230,248,0.3)"]{color:${S.dim}!important;}
    main [style*="rgba(232,230,248, 0.28)"],main [style*="rgba(232,230,248,0.28)"]{color:${S.dim}!important;}
    main [style*="rgba(232,230,248, 0.12)"],main [style*="rgba(232,230,248,0.12)"]{color:${S.vdim}!important;}
    main [style*="rgba(232, 230, 248, 0.55)"]{color:${S.muted}!important;}
    main [style*="rgba(232, 230, 248, 0.3)"]{color:${S.dim}!important;}
    main [style*="rgba(232, 230, 248, 0.28)"]{color:${S.dim}!important;}
    main [style*="rgba(232, 230, 248, 0.12)"]{color:${S.vdim}!important;}
    main [style*="rgba(232,230,248"]:not([style*="background"]){color:${S.muted}!important;}
    main [style*="rgba(232, 230, 248"]:not([style*="background"]){color:${S.muted}!important;}
    main [style*="color:#0f0e24"],main [style*="color: #0f0e24"]{color:${S.text}!important;}
    main [style*="color: rgb(15, 14, 36)"]{color:${S.text}!important;}
    main [style*="border-color: rgba(255,255,255"]{border-color:rgba(0,0,0,0.12)!important;}
    main [style*="border: 1px solid rgba(255,255,255"]{border-color:rgba(0,0,0,0.12)!important;}
    main input,main select,main textarea{background:rgba(0,0,0,0.05)!important;color:${S.text}!important;border-color:rgba(0,0,0,0.15)!important;}
    ` : ''}
  `

  const sidebarContent = (
    <>
      {/* Brand */}
      <div style={{ padding: '1.1rem 1rem 1rem', borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#9b30ff,#6b1fc2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(155,48,255,0.35)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: S.text, letterSpacing: '-0.2px', lineHeight: 1.2 }}>Sheik<span style={{ color: S.accent }}>STREAM</span></div>
            <div style={{ fontSize: '0.72rem', color: S.muted, marginTop: '1px' }}>Painel do Streamer</div>
          </div>
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} style={{ background: 'transparent', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '1.1rem', padding: '0.2rem', lineHeight: 1 }}>✕</button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0.4rem 0.6rem 0.2rem', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: S.dim, flexShrink: 0, pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={navSearch}
            onChange={e => setNavSearch(e.target.value)}
            placeholder="Pesquisar..."
            style={{ width: '100%', padding: '0.45rem 0.6rem 0.45rem 2rem', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: `1px solid ${S.border}`, borderRadius: '8px', color: S.text, fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
          />
          {navSearch && (
            <button onClick={() => setNavSearch('')} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: S.dim, fontSize: '0.85rem', lineHeight: 1, padding: 0 }}>✕</button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.35rem 0.5rem' }}>
        {navSearch ? (
          /* Search results — flat list */
          (() => {
            const hits = matchSearch(navSearch)
            if (!hits.length) return (
              <div style={{ padding: '1.5rem 0.75rem', textAlign: 'center', color: S.vdim, fontSize: '0.78rem' }}>Nenhum resultado</div>
            )
            return hits.map(({ item, child }) => {
              const href = child ? child.href : item.href
              const label = child ? `${item.label} › ${child.label}` : item.label
              const id = child ? child.id : item.id
              const badge = child ? child.badge : item.badge
              const isAct = pathname === href || (!child && active(item))
              return (
                <Link key={id} href={href}
                  onClick={() => { setMobileOpen(false); setNavSearch(''); if (badge) dismissBadge(id) }}
                  className={isAct ? 'sk-nl-act' : 'sk-nl'}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.75rem', borderRadius: '9px', marginBottom: '2px', color: isAct ? '#fff' : S.muted, textDecoration: 'none', fontSize: '0.85rem', fontWeight: isAct ? 600 : 400, background: isAct ? `linear-gradient(135deg,${isDark ? 'rgba(155,48,255,0.35),rgba(109,40,217,0.3)' : 'rgba(123,46,255,0.15),rgba(90,30,200,0.1)'})` : 'transparent', border: isAct ? `1px solid ${isDark ? 'rgba(155,48,255,0.3)' : 'rgba(123,46,255,0.25)'}` : '1px solid transparent' }}>
                  {!child && <span style={{ color: isAct ? S.iconActive : S.dim, flexShrink: 0, display: 'flex' }}>{item.icon}</span>}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                  {badge && !seenBadges.has(id) && <Chip type={badge} />}
                </Link>
              )
            })
          })()
        ) : (
          /* Flat nav — no group labels */
          NAV_GROUPS.map(group => (
            <div key={group.label || '__root'}>
              {false && group.label && (
                <div style={{ padding: '0.65rem 0.75rem 0.25rem', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: S.vdim, textTransform: 'uppercase' }}>
                  {group.label}
                </div>
              )}
              {group.items.map(item => {
                const isAct = active(item)
                const isExp = open.has(item.id)
                const hasCh = !!item.children
                return (
                  <div key={item.id}>
                    <Link
                      href={hasCh ? '#' : item.href}
                      onClick={hasCh ? (e) => { toggle(item.id, e); if (item.badge) dismissBadge(item.id) } : () => { setMobileOpen(false); if (item.badge) dismissBadge(item.id) }}
                      className={isAct ? 'sk-nl-act' : 'sk-nl'}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0.75rem', borderRadius: '9px', marginBottom: '2px', color: isAct ? '#fff' : S.muted, textDecoration: 'none', fontSize: '0.9rem', fontWeight: isAct ? 600 : 400, background: isAct ? `linear-gradient(135deg,${isDark ? 'rgba(155,48,255,0.35),rgba(109,40,217,0.3)' : 'rgba(123,46,255,0.15),rgba(90,30,200,0.1)'})` : 'transparent', border: isAct ? `1px solid ${isDark ? 'rgba(155,48,255,0.3)' : 'rgba(123,46,255,0.25)'}` : '1px solid transparent', cursor: 'pointer', letterSpacing: '-0.1px' }}
                    >
                      <span style={{ color: isAct ? S.iconActive : S.dim, flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                      {item.badge && !seenBadges.has(item.id) && <Chip type={item.badge} />}
                      {hasCh && !isAct && <span style={{ color: S.dim, flexShrink: 0, display: 'flex', transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>{I.chev}</span>}
                      {isAct && <span style={{ color: S.iconActive, flexShrink: 0, display: 'flex' }}>{I.arr}</span>}
                    </Link>
                    {hasCh && isExp && item.children?.map(ch => {
                      const ca = pathname === ch.href
                      return (
                        <Link key={ch.id} href={ch.href}
                          onClick={() => { setMobileOpen(false); if (ch.badge) dismissBadge(ch.id) }}
                          className={ca ? 'sk-nl-act' : 'sk-nl'}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.48rem 0.75rem 0.48rem 2.8rem', borderRadius: '9px', marginBottom: '2px', color: ca ? '#fff' : S.muted, textDecoration: 'none', fontSize: '0.84rem', fontWeight: ca ? 600 : 400, background: ca ? `linear-gradient(135deg,${isDark ? 'rgba(155,48,255,0.28),rgba(109,40,217,0.22)' : 'rgba(123,46,255,0.12),rgba(90,30,200,0.08)'})` : 'transparent', border: ca ? `1px solid ${isDark ? 'rgba(155,48,255,0.25)' : 'rgba(123,46,255,0.2)'}` : '1px solid transparent' }}>
                          <span style={{ flex: 1 }}>{ch.label}</span>
                          {ch.badge && !seenBadges.has(ch.id) && <Chip type={ch.badge} />}
                          {ca && <span style={{ color: S.iconActive, display: 'flex' }}>{I.arr}</span>}
                        </Link>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </nav>

      {/* Admin link */}
      <div style={{ padding: '0.3rem 0.5rem', flexShrink: 0 }}>
        <Link href="/admin" onClick={() => setMobileOpen(false)}
          className="sk-nl"
          style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.45rem 0.75rem', borderRadius: '9px', background: 'rgba(255,68,68,0.07)', border: '1px solid rgba(255,68,68,0.18)', textDecoration: 'none', color: '#ff6b6b', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Painel Admin
        </Link>
      </div>

      {/* User */}
      <div style={{ padding: '0.7rem 1rem', borderTop: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        {user.image
          ? <img src={user.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(155,48,255,0.3)' }} />
          : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: S.primaryBg, border: `2px solid ${S.borderP}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.primary, fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
              {(user.name || 'U')[0].toUpperCase()}
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'Usuário'}</div>
          <div style={{ fontSize: '0.68rem', color: S.muted }}>Streamer Beta</div>
        </div>
        <button onClick={() => { window.location.href = '/api/logout' }} title="Sair" className="sk-signout" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: S.dim, display: 'flex', alignItems: 'center', padding: '0.25rem', flexShrink: 0, opacity: 0.7 }}>{I.out}</button>
      </div>
    </>
  )

  return (
    <div data-theme={theme} style={{ display: 'flex', minHeight: '100vh', background: S.bg, fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: S.text }}>
      <style>{css}</style>

      {isMobile && mobileOpen && (
        <div className="sk-mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {!isMobile && (
        <aside style={{ width: SW, flexShrink: 0, background: S.bar, borderRight: `1px solid ${S.borderP}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, overflowX: 'hidden' }}>
          {sidebarContent}
        </aside>
      )}

      {isMobile && mobileOpen && (
        <aside className="sk-sidebar-mobile" style={{ width: SW, background: S.bar, borderRight: `1px solid ${S.borderP}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200, overflowX: 'hidden' }}>
          {sidebarContent}
        </aside>
      )}

      <div style={{ flex: 1, marginLeft: isMobile ? 0 : SW, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Dev banner — TOP position */}
        {banner && banner.active && !bannerDismissed && (banner.position === 'top' || !banner.position) && (
          <BannerBar banner={banner} S={S} isDark={isDark} onDismiss={() => setBannerDismissed(true)} />
        )}

        {/* Topbar */}
        <div style={{ background: S.topbar, borderBottom: `1px solid ${S.borderP}`, padding: isMobile ? '0.7rem 1rem' : '0.7rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isMobile && (
              <button onClick={() => setMobileOpen(true)} className="sk-hamburger" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: S.text, fontSize: '1.2rem', padding: '0.2rem 0.4rem', lineHeight: 1, minHeight: '44px', display: 'flex', alignItems: 'center' }}>☰</button>
            )}
            <h1 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: S.text }}>{pageTitle}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', color: S.muted, display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: S.accent, display: 'inline-block', animation: 'sk-pulse 2s ease-in-out infinite', flexShrink: 0 }} />
              {!isMobile && 'Beta fechado'}
            </div>
            <button onClick={toggleTheme} className="sk-theme-btn" title={isDark ? 'Modo claro' : 'Modo escuro'}>
              {isDark ? I.sun : I.moon}
            </button>
          </div>
        </div>

        <main style={{ flex: 1 }}>
          <ToastProvider>{children}</ToastProvider>
        </main>

        {/* Dev banner — BOTTOM position */}
        {banner && banner.active && !bannerDismissed && banner.position === 'bottom' && (
          <BannerBar banner={banner} S={S} isDark={isDark} onDismiss={() => setBannerDismissed(true)} />
        )}
      </div>
    </div>
  )
}
