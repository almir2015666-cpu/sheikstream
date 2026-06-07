'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

const SW = 192

const S = {
  bg: '#08090d',
  bar: '#0c0d18',
  card: '#111219',
  text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.5)',
  dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.15)',
  primary: '#9b30ff',
  primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
  border: 'rgba(255,255,255,0.05)',
  borderP: 'rgba(155,48,255,0.12)',
}

/* ── SVG icons ── */
const I = {
  dash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  plat: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  sort: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  ban:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></svg>,
  meta: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  cmd:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  time: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  suba: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 17 12"/></svg>,
  over: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  prof: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  inv:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.68h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/></svg>,
  out:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chev: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  arr:  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
}

type Badge = 'NOVO' | 'ATUALIZADO'
type Child = { id: string; label: string; href: string; badge?: 'NOVO' }
type Item  = { id: string; label: string; href: string; icon: React.ReactNode; badge?: Badge; children?: Child[] }

const NAV: Item[] = [
  { id: 'dashboard',  label: 'Dashboard',   href: '/dashboard',              icon: I.dash },
  { id: 'plataformas',label: 'Plataformas', href: '/dashboard/plataformas', icon: I.plat, badge: 'NOVO' },
  { id: 'sorteios',   label: 'Sorteios',    href: '/dashboard/sorteios',    icon: I.sort,
    children: [
      { id: 's-criar',   label: 'Criar / Editar', href: '/dashboard/sorteios' },
      { id: 's-tickets', label: 'Tickets',         href: '/dashboard/sorteios/tickets', badge: 'NOVO' },
    ]
  },
  { id: 'banners',    label: 'Banners',     href: '/dashboard/banners',     icon: I.ban,  badge: 'NOVO' },
  { id: 'metas',      label: 'Metas',       href: '/dashboard/metas',       icon: I.meta, badge: 'NOVO' },
  { id: 'comandos',   label: 'Comandos',    href: '/dashboard/comandos',    icon: I.cmd  },
  { id: 'timers',     label: 'Timers',      href: '/dashboard/timers',      icon: I.time },
  { id: 'subathon',   label: 'Subathon',    href: '/dashboard/subathon',    icon: I.suba, badge: 'NOVO' },
  { id: 'overlays',   label: 'Overlays',    href: '/dashboard/overlays',    icon: I.over },
  { id: 'conexoes',   label: 'Conexões',    href: '/dashboard/conexoes',    icon: I.link, badge: 'ATUALIZADO' },
  { id: 'perfil',     label: 'Meu perfil',  href: '/dashboard/perfil',      icon: I.prof },
  { id: 'convites',   label: 'Convites',    href: '/dashboard/convites',    icon: I.inv,  badge: 'NOVO' },
]

function Chip({ type }: { type: Badge }) {
  return type === 'NOVO'
    ? <span style={{ fontSize: '0.53rem', fontWeight: 700, padding: '0.1rem 0.42rem', background: 'rgba(59,130,246,0.16)', color: '#60a5fa', borderRadius: '999px', letterSpacing: '0.3px', flexShrink: 0 }}>NOVO</span>
    : <span style={{ fontSize: '0.53rem', fontWeight: 700, padding: '0.1rem 0.42rem', background: 'rgba(57,255,20,0.12)', color: '#39ff14', borderRadius: '999px', letterSpacing: '0.3px', flexShrink: 0 }}>ATUAL.</span>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { data: session, status } = useSession()
  const [open, setOpen] = useState<Set<string>>(new Set(['sorteios']))

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  if (status === 'loading') return <div style={{ background: S.bg, minHeight: '100vh' }} />
  if (!session) return null

  function active(item: Item) {
    if (item.href === '/dashboard') return pathname === '/dashboard'
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  function toggle(id: string, e: React.MouseEvent) {
    e.preventDefault()
    setOpen(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const css = `
    *{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
    .sk-nl{transition:background 0.1s,color 0.1s,border-color 0.1s;}
    .sk-nl:hover{background:rgba(155,48,255,0.07)!important;color:#e8e6f8!important;}
    .sk-signout{transition:opacity 0.1s;}
    .sk-signout:hover{opacity:1!important;}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-thumb{background:rgba(155,48,255,0.18);border-radius:2px;}
  `

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: S.bg, fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: S.text }}>
      <style>{css}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width: SW, flexShrink: 0, background: S.bar, borderRight: `1px solid ${S.borderP}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, overflowX: 'hidden' }}>

        {/* Brand */}
        <div style={{ padding: '1rem 0.95rem 0.9rem', borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '29px', height: '29px', borderRadius: '7px', background: 'linear-gradient(135deg,#9b30ff,#6b1fc2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </div>
            <div>
              <Link href="/" style={{ fontSize: '0.88rem', fontWeight: 900, color: S.text, letterSpacing: '0.2px', lineHeight: 1.15, textDecoration: 'none' }}>Sheik<span style={{ color: S.accent }}>STREAM</span></Link>
              <div style={{ fontSize: '0.58rem', color: S.dim }}>Painel Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.3rem 0' }}>
          {NAV.map(item => {
            const isAct = active(item)
            const isExp = open.has(item.id)
            const hasCh = !!item.children

            return (
              <div key={item.id}>
                <Link
                  href={hasCh ? '#' : item.href}
                  onClick={hasCh ? (e) => toggle(item.id, e) : undefined}
                  className="sk-nl"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.58rem', padding: '0.46rem 0.95rem', color: isAct ? S.text : S.muted, textDecoration: 'none', fontSize: '0.82rem', fontWeight: isAct ? 600 : 400, background: isAct ? S.primaryBg : 'transparent', borderLeft: `2px solid ${isAct ? S.primary : 'transparent'}`, cursor: 'pointer' }}
                >
                  <span style={{ color: isAct ? S.primary : S.dim, flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                  {item.badge && <Chip type={item.badge} />}
                  {hasCh && <span style={{ color: S.dim, flexShrink: 0, display: 'flex', transform: isExp ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>{I.chev}</span>}
                </Link>

                {hasCh && isExp && item.children?.map(ch => {
                  const ca = pathname === ch.href
                  return (
                    <Link key={ch.id} href={ch.href} className="sk-nl" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.36rem 0.95rem 0.36rem 2.4rem', color: ca ? S.text : S.muted, textDecoration: 'none', fontSize: '0.8rem', fontWeight: ca ? 600 : 400, background: ca ? S.primaryBg : 'transparent', borderLeft: `2px solid ${ca ? S.primary : 'transparent'}` }}>
                      <span style={{ flex: 1 }}>{ch.label}</span>
                      {ch.badge && <Chip type={ch.badge} />}
                      {ca && <span style={{ color: S.primary, display: 'flex' }}>{I.arr}</span>}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '0.75rem 0.95rem', borderTop: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: '0.52rem', flexShrink: 0 }}>
          {session.user?.image
            ? <img src={session.user.image} alt="" style={{ width: '29px', height: '29px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: '29px', height: '29px', borderRadius: '50%', background: S.primaryBg, border: `1px solid ${S.borderP}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.primary, fontSize: '0.82rem', fontWeight: 700, flexShrink: 0 }}>
                {(session.user?.name || 'U')[0].toUpperCase()}
              </div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 600, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user?.name || 'Usuário'}</div>
            <div style={{ fontSize: '0.6rem', color: S.dim }}>Streamer Beta</div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })} title="Sair" className="sk-signout" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: S.dim, display: 'flex', alignItems: 'center', padding: '0.2rem', flexShrink: 0, opacity: 0.6 }}>{I.out}</button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main style={{ flex: 1, marginLeft: SW, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  )
}
