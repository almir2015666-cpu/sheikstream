'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ToastProvider } from '@/app/components/Toast'
import { useLang } from '@/lib/i18n'
import type { TKey } from '@/lib/i18n/translations'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'

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
  bg: '#f0effe', bar: '#ffffff', card: '#ffffff', text: '#0a0918',
  muted: '#2a2840', dim: '#3a3860',
  vdim: 'rgba(15,14,36,0.55)', primary: '#7b2eff',
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
  agen: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  mod:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  alrt: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
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
type Child = { id: string; label: string; href: string; badge?: 'NOVO'; icon?: React.ReactNode }
type Item  = { id: string; label: string; href: string; icon: React.ReactNode; badge?: Badge; children?: Child[] }
type Group = { label: string; items: Item[] }

const NAV_GROUPS: Group[] = [
  { label: '', items: [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: I.dash },
  ]},
  { label: 'AO VIVO', items: [
    { id: 'subathon',  label: 'Subathon',        href: '/dashboard/subathon',  icon: I.suba, badge: 'NOVO' },
    { id: 'timers',    label: 'Timers',           href: '/dashboard/timers',    icon: I.time },
    { id: 'agenda',    label: 'Agenda',           href: '/dashboard/agenda',    icon: I.agen, badge: 'NOVO' as Badge },
    { id: 'alertas',   label: 'Alertas',          href: '/dashboard/alertas',   icon: I.alrt, badge: 'NOVO' as Badge },
    { id: 'comandos',  label: 'Eventos/Comandos', href: '/dashboard/comandos',  icon: I.cmd  },
    { id: 'voice-fx',  label: 'Voice FX',         href: '/dashboard/voice-fx',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, badge: 'NOVO' as Badge },
    { id: 'ia', label: 'IA', href: '/dashboard/ia-chat', badge: 'NOVO' as Badge,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>,
      children: [
        { id: 'ia-chat',    label: 'IA de Chat',    href: '/dashboard/ia-chat',       badge: 'NOVO',
          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
        { id: 'ia-voz',     label: 'IA por Voz',    href: '/dashboard/ia-chat/voz',   badge: 'NOVO',
          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> },
        { id: 'ia-imagens', label: 'IA de Imagens', href: '/dashboard/ia-imagens',    badge: 'NOVO',
          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
      ]
    },
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
        { id: 'p-twitch',  label: 'Twitch',  href: '/dashboard/plataformas/twitch',  icon: <svg width="13" height="13" viewBox="0 0 24 28" fill="currentColor"><path d="M2.149 0L0 5.573V23.33h5.996V28l4.998-4.67H14.8L24 14.497V0H2.149zm19.851 13.63l-3.996 3.734h-4.998L9.008 21.1v-3.736H4.01V2.8h18v10.83zm-3.996-6.994H16v6.23h2.004v-6.23zm-5.998 0H10v6.23h2.006v-6.23z"/></svg> },
        { id: 'p-kick',    label: 'Kick',    href: '/dashboard/plataformas/kick',    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M2 2h4v8l6-8h5l-7 9 7 11h-5l-6-9v9H2z"/></svg> },
        { id: 'p-livepix', label: 'Livepix', href: '/dashboard/plataformas/livepix', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg> },
      ]
    },
    { id: 'metas', label: 'Metas', href: '/dashboard/metas', icon: I.meta },
  ]},
  { label: 'OVERLAYS', items: [
    { id: 'overlays',   label: 'Overlays',  href: '/dashboard/overlays',  icon: I.over },
    { id: 'banners',    label: 'Banners',   href: '/dashboard/banners',   icon: I.ban, badge: 'NOVO' as Badge },
  ]},
  { label: 'COMUNIDADE', items: [
    { id: 'collab', label: 'Fila de Collab', href: '/dashboard/collab', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, badge: 'NOVO' as Badge },
    { id: 'raids',  label: 'Raids',         href: '/dashboard/raids',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, badge: 'NOVO' as Badge },
    { id: 'analytics', label: 'Analytics',  href: '/dashboard/analytics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, badge: 'NOVO' as Badge },
    { id: 'fidelidade', label: 'Fidelidade', href: '/dashboard/fidelidade', badge: 'NOVO' as Badge,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
    { id: 'pedidos-musica', label: 'Pedidos de Música', href: '/dashboard/pedidos-musica', badge: 'NOVO' as Badge,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
  ]},
  { label: 'CONTA', items: [
    { id: 'notas',    label: 'Notas',      href: '/dashboard/notas',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
    { id: 'conexoes', label: 'Conexões',  href: '/dashboard/conexoes', icon: I.link, badge: 'ATUALIZADO' },
    { id: 'convites', label: 'Convites',  href: '/dashboard/convites', icon: I.inv,  badge: 'NOVO' },
    { id: 'perfil',   label: 'Meu perfil', href: '/dashboard/perfil', icon: I.prof },
  ]},
]
const NAV_ALL: Item[] = NAV_GROUPS.flatMap(g => g.items)
const NAV_ALL_FLAT = new Map<string, Item | Child>(
  NAV_ALL.flatMap(item => [[item.id, item] as [string, Item], ...(item.children ?? []).map(ch => [ch.id, ch] as [string, Child])])
)

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
  '/dashboard/comandos': 'Eventos/Comandos',
  '/dashboard/timers': 'Timers',
  '/dashboard/overlays': 'Overlays',
  '/dashboard/conexoes': 'Conexões',
  '/dashboard/perfil': 'Meu Perfil',
  '/dashboard/convites': 'Convites',
  '/dashboard/ia-imagens': 'IA de Imagens',
  '/dashboard/ia-chat': 'IA de Chat',
  '/dashboard/ia-chat/voz': 'IA por Voz',
  '/dashboard/voice-fx': 'Voice FX',
  '/dashboard/agenda': 'Agenda de Lives',
  '/dashboard/alertas': 'Fila de Alertas',
  '/dashboard/countdown': 'Countdown para OBS',
  '/dashboard/polling': 'Enquete ao vivo',
  '/dashboard/overlays/chat': 'Chat Overlay',
  '/dashboard/overlays/goal': 'Meta / Goal Overlay',
  '/dashboard/collab': 'Fila de Collab',
  '/dashboard/raids': 'Histórico de Raids',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/fidelidade': 'Sistema de Fidelidade',
  '/dashboard/pedidos-musica': 'Pedidos de Música',
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
  const [isAdmin, setIsAdmin] = useState(false)
  const [navOrder, setNavOrder] = useState<string[]>([])
  const [navItemStatus, setNavItemStatus] = useState<Record<string, 'maintenance' | 'soon'>>({})
  const [navChildrenDB, setNavChildrenDB] = useState<Record<string, string[]> | null>(null)
  const [navRemovedHardChildren, setNavRemovedHardChildren] = useState<string[]>([])
  const [catalogTypes, setCatalogTypes] = useState<Set<string>>(new Set())
  const [catalogShowInNav, setCatalogShowInNav] = useState<Set<string>>(new Set())
  const [catalogNavItems, setCatalogNavItems] = useState<Item[]>([])
  // Suggestion/bug form (global — all pages)
  const [showSugg, setShowSugg] = useState(false)
  const [suggType, setSuggType] = useState<'suggestion' | 'bug'>('suggestion')
  const [suggMsg, setSuggMsg] = useState('')
  const [suggSending, setSuggSending] = useState(false)
  const [suggSent, setSuggSent] = useState(false)
  // Admin notifications (global — all pages)
  type AdminNotif = { id: string; title: string | null; message: string; icon: string; color: string; created_at: string; max_views: number | null }
  const [notifications, setNotifications] = useState<AdminNotif[]>([])
  const [dismissedNotifs, setDismissedNotifs] = useState<Set<string>>(new Set())
  const [notifViewCounts, setNotifViewCounts] = useState<Record<string, number>>({})
  const [activeNotif, setActiveNotif] = useState<AdminNotif | null>(null)
  const notifLoadedRef = useRef<boolean>(false)
  // Session inactivity timeout (30 min)
  const lastActivityRef = useRef<number>(Date.now())

  const S = theme === 'dark' ? DARK_S : LIGHT_S
  const isDark = theme === 'dark'
  const { t } = useLang()

  const ITEM_KEY: Partial<Record<string, TKey>> = {
    dashboard: 'nav_dashboard', subathon: 'nav_subathon', timers: 'nav_timers',
    agenda: 'nav_agenda', alertas: 'nav_alertas',
    comandos: 'nav_commands', ia: 'nav_ia', 'ia-chat': 'nav_ia_chat', 'ia-voz': 'nav_ia_voice',
    sorteios: 'nav_raffles', 's-criar': 'nav_raffle_create', 's-tickets': 'nav_raffle_tickets',
    plataformas: 'nav_platforms', metas: 'nav_goals', overlays: 'nav_overlays_item',
    banners: 'nav_banners', 'ia-imagens': 'nav_ia_images', notas: 'nav_notes',
    conexoes: 'nav_connections', convites: 'nav_invites', perfil: 'nav_profile',
  }
  const PAGE_TITLE_KEYS: Record<string, TKey> = {
    '/dashboard': 'pt_dashboard', '/dashboard/plataformas': 'pt_platforms',
    '/dashboard/sorteios': 'pt_raffles', '/dashboard/sorteios/novo': 'pt_raffle_new',
    '/dashboard/sorteios/tickets': 'pt_raffle_tickets', '/dashboard/subathon': 'pt_subathon',
    '/dashboard/banners': 'pt_banners', '/dashboard/banners/novo': 'pt_banner_new',
    '/dashboard/metas': 'pt_goals', '/dashboard/comandos': 'pt_commands',
    '/dashboard/timers': 'pt_timers', '/dashboard/overlays': 'pt_overlays',
    '/dashboard/conexoes': 'pt_connections', '/dashboard/perfil': 'pt_profile',
    '/dashboard/convites': 'pt_invites', '/dashboard/ia-imagens': 'pt_ia_images',
    '/dashboard/ia-chat': 'pt_ia_chat', '/dashboard/ia-chat/voz': 'pt_ia_voice',
    '/dashboard/agenda': 'pt_agenda', '/dashboard/alertas': 'pt_alertas',
  }
  const tItem = (id: string, fallback: string) => { const k = ITEM_KEY[id]; return k ? t(k) : fallback }
  const pageTitle = PAGE_TITLE_KEYS[pathname] ? t(PAGE_TITLE_KEYS[pathname]) : (PAGE_TITLES[pathname] ?? 'Dashboard')

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sk-seen-badges') || '[]')
      setSeenBadges(new Set(saved))
    } catch { /* ignore */ }
    try {
      const t = localStorage.getItem('sk-theme') as 'dark' | 'light' | null
      if (t) setTheme(t)
    } catch { /* ignore */ }
    try {
      if (localStorage.getItem('sk-admin-authed') === '1') setIsAdmin(true)
    } catch { /* ignore */ }
    // Load nav order from DB — DB is source of truth, polls every 60s for live updates
    const fetchNavOrder = () =>
      fetch('/api/admin/nav-order')
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.order && Array.isArray(d.order) && d.order.length > 0) {
            setNavOrder(d.order)
            try { localStorage.setItem('sk-nav-order', JSON.stringify(d.order)) } catch {}
          } else {
            try { localStorage.removeItem('sk-nav-order') } catch {}
          }
          if (d?.itemStatus && typeof d.itemStatus === 'object') {
            setNavItemStatus(d.itemStatus)
          }
          if (d?.children && typeof d.children === 'object' && Object.keys(d.children).length > 0) {
            setNavChildrenDB(d.children as Record<string, string[]>)
          } else {
            setNavChildrenDB(null)
          }
          if (Array.isArray(d?.removedHardChildren)) {
            setNavRemovedHardChildren(d.removedHardChildren as string[])
          }
        })
        .catch(() => {/* network error — keep current order */})
    const fetchCatalog = () =>
      fetch('/api/admin/overlays-catalog')
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          const allItems = (d?.items ?? []) as { type: string; label: string; href: string; showInNav?: boolean; removed?: boolean; hidden?: boolean }[]
          setCatalogTypes(new Set(allItems.map(i => i.type)))
          const navOnes = allItems.filter(i => !i.hidden && (i.showInNav || i.removed))
          setCatalogShowInNav(new Set(navOnes.map(i => i.type)))
          const overlayIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          setCatalogNavItems(navOnes.map(i => ({
            id: i.type,
            label: i.label,
            href: i.href || `/dashboard/overlays/${i.type}`,
            icon: overlayIcon,
          })))
        })
        .catch(() => {})
    fetchNavOrder()
    fetchCatalog()
    const navIv = setInterval(() => { fetchNavOrder(); fetchCatalog() }, 15_000)
    const fetchBanner = () => fetch('/api/dev-banner').then(r => r.json()).then(d => setBanner(d?.active ? d : null)).catch(() => {})
    fetchBanner()
    const iv = setInterval(fetchBanner, 30000)
    return () => { clearInterval(navIv); clearInterval(iv) }
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

  // Inactivity logout — 30 minutes
  useEffect(() => {
    if (!user) return
    const reset = () => { lastActivityRef.current = Date.now() }
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    const check = setInterval(() => {
      if (Date.now() - lastActivityRef.current > 30 * 60 * 1000) {
        clearInterval(check)
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
        router.replace('/login?reason=inactivity')
      }
    }, 60_000)
    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      clearInterval(check)
    }
  }, [user])


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

  useEffect(() => {
    if (!user) return
    const ping = () => fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'dashboard', event: 'heartbeat', details: 'alive' }),
    }).catch(() => {})
    const iv = setInterval(ping, 60000)
    return () => clearInterval(iv)
  }, [user])

  // Load notifications once per session after user is confirmed
  useEffect(() => {
    if (!user) return
    try {
      const seen = JSON.parse(sessionStorage.getItem('sk-dismissed-notifs') || '[]')
      setDismissedNotifs(new Set(seen))
    } catch {}
    try {
      const counts = JSON.parse(localStorage.getItem('sk-notif-views') || '{}')
      setNotifViewCounts(counts)
    } catch {}
    if (!notifLoadedRef.current) {
      notifLoadedRef.current = true
      fetch('/api/me/notifications')
        .then(r => r.ok ? r.json() : [])
        .then((d: AdminNotif[]) => { if (Array.isArray(d)) setNotifications(d) })
        .catch(() => {})
    }
  }, [user])

  // Show next pending notification — only on the main dashboard page (first entry)
  useEffect(() => {
    if (activeNotif) return
    if (pathname !== '/dashboard') return
    const pending = notifications.filter(n => {
      if (dismissedNotifs.has(n.id)) return false
      // Check if user has seen it max_views times already
      if (n.max_views && n.max_views > 0) {
        const seen = notifViewCounts[n.id] ?? 0
        if (seen >= n.max_views) return false
      }
      return true
    })
    if (!pending.length) return
    setActiveNotif(pending[0])
  }, [notifications, dismissedNotifs, notifViewCounts, activeNotif, pathname])

  function dismissNotif(id: string) {
    setActiveNotif(null)
    // Increment view count in localStorage
    setNotifViewCounts(prev => {
      const next = { ...prev, [id]: (prev[id] ?? 0) + 1 }
      try { localStorage.setItem('sk-notif-views', JSON.stringify(next)) } catch {}
      return next
    })
    // Mark dismissed for this session
    setDismissedNotifs(prev => {
      const next = new Set(prev); next.add(id)
      try { sessionStorage.setItem('sk-dismissed-notifs', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const orderedItems = (() => {
    if (navOrder.length === 0) return NAV_ALL
    const orderMap  = new Map(navOrder.map((id, i) => [id, i] as [string, number]))
    const naturalPos = new Map(NAV_ALL.map((item, i) => [item.id, i]))
    // Items in navOrder sort by their saved index (×10000).
    // Items NOT in navOrder find the nearest preceding saved item in NAV_ALL
    // and slot in right after it, preserving natural relative order.
    const getScore = (item: Item) => {
      if (orderMap.has(item.id)) return orderMap.get(item.id)! * 10000
      const nat = naturalPos.get(item.id) ?? 0
      let prevScore = -10000
      for (const [id, idx] of orderMap.entries()) {
        const nidx = naturalPos.get(id) ?? 0
        if (nidx < nat) prevScore = Math.max(prevScore, idx * 10000)
      }
      return prevScore + nat + 1
    }
    return [...NAV_ALL].sort((a, b) => getScore(a) - getScore(b))
  })()

  const effectiveNavItems = (() => {
    const inCatalog = (item: Item) =>
      item.id !== 'overlays' && !item.children?.length && catalogTypes.size > 0 && catalogTypes.has(item.id)

    const removedHardSet = new Set(navRemovedHardChildren)
    const promotedItems: Array<Item & { parentId: string }> = []

    const orderMap = new Map(navOrder.map((id, i) => [id, i]))

    let baseItems = orderedItems
      .filter(item => !inCatalog(item))
      .map(item => {
        if (!item.children || !item.children.some(ch => removedHardSet.has(ch.id))) return item
        const keptKids = item.children.filter(ch => !removedHardSet.has(ch.id))
        item.children.filter(ch => removedHardSet.has(ch.id)).forEach(ch => {
          promotedItems.push({ id: ch.id, label: ch.label, href: ch.href, icon: ch.icon ?? I.arr, badge: ch.badge, parentId: item.id })
        })
        return { ...item, children: keptKids.length > 0 ? keptKids : undefined }
      })

    // Insert promoted hard children right after their parent
    if (promotedItems.length > 0) {
      const getScore = (p: typeof promotedItems[0]) =>
        orderMap.has(p.id) ? orderMap.get(p.id)! : (orderMap.get(p.parentId) ?? 9999) + 0.5
      const sorted = [...promotedItems].sort((a, b) => getScore(a) - getScore(b))
      const result: Item[] = []
      let pi = 0
      for (const item of baseItems) {
        while (pi < sorted.length && getScore(sorted[pi]) <= (orderMap.get(item.id) ?? 9999)) {
          result.push(sorted[pi++])
        }
        result.push(item)
      }
      while (pi < sorted.length) result.push(sorted[pi++])
      baseItems = result
    }

    // Inject catalog showInNav items right after 'overlays' (or at their saved navOrder position)
    if (catalogNavItems.length > 0) {
      const overlaysPos = orderMap.get('overlays') ?? 9999
      const catalogIds = new Set(catalogNavItems.map(i => i.id))
      const existingIds = new Set(baseItems.map(i => i.id))
      const toInject = catalogNavItems.filter(i => !existingIds.has(i.id))
      if (toInject.length > 0) {
        const getCatalogScore = (id: string) =>
          orderMap.has(id) ? orderMap.get(id)! : overlaysPos + 0.5
        const merged = [...baseItems, ...toInject]
        merged.sort((a, b) => {
          const sa = catalogIds.has(a.id) ? getCatalogScore(a.id) : (orderMap.get(a.id) ?? 9999)
          const sb = catalogIds.has(b.id) ? getCatalogScore(b.id) : (orderMap.get(b.id) ?? 9999)
          return sa - sb
        })
        baseItems = merged
      }
    }

    if (!navChildrenDB || Object.keys(navChildrenDB).length === 0) return baseItems
    const dbChildSet = new Set(Object.values(navChildrenDB).flat())
    return baseItems
      .filter(item => !dbChildSet.has(item.id))
      .map(item => {
        const dbKids = navChildrenDB[item.id]
        if (!dbKids || dbKids.length === 0) return item
        const newKids = dbKids.map(id => NAV_ALL_FLAT.get(id)).filter(Boolean) as Child[]
        const existingIds = new Set((item.children ?? []).map(c => c.id))
        const extra = newKids.filter(c => !existingIds.has(c.id))
        return { ...item, children: [...(item.children ?? []), ...extra] }
      })
  })()

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
    @media(max-width:767px){
      main>div[style]{padding:1rem!important;}
      main [style*="padding: 1.5rem 2rem"]{padding:1rem!important;}
      main [style*="padding:1.5rem 2rem"]{padding:1rem!important;}
      main [style*="grid-template-columns: 340px"]{grid-template-columns:1fr!important;}
      main [style*="grid-template-columns:340px"]{grid-template-columns:1fr!important;}
      main [style*="grid-template-columns: repeat(3"]{grid-template-columns:1fr!important;}
      main [style*="grid-template-columns:repeat(3"]{grid-template-columns:1fr!important;}
      main [style*="grid-template-columns: repeat(4"]{grid-template-columns:1fr 1fr!important;}
      main [style*="grid-template-columns:repeat(4"]{grid-template-columns:1fr 1fr!important;}
      main [style*="grid-template-columns: 1fr 1fr 1fr"]{grid-template-columns:1fr!important;}
      main [style*="font-size: 120px"]{font-size:72px!important;}
      main [style*="font-size:120px"]{font-size:72px!important;}
      main [style*="width: 560px"]{width:100%!important;max-width:100%!important;}
    }
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
    main [style*="rgba(255, 255, 255, 0.02)"]{background:rgba(0,0,0,0.04)!important;}
    main [style*="rgba(255, 255, 255, 0.03)"]{background:rgba(0,0,0,0.04)!important;}
    main [style*="rgba(255, 255, 255, 0.04)"]{background:rgba(0,0,0,0.05)!important;}
    main [style*="rgba(255, 255, 255, 0.05)"]{background:rgba(0,0,0,0.06)!important;}
    main [style*="rgba(255, 255, 255, 0.08)"]{background:rgba(0,0,0,0.05)!important;}
    main [style*="rgba(255, 255, 255, 0.12)"]:not([style*="color"]){background:rgba(0,0,0,0.08)!important;}
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
            <div style={{ fontSize: '0.72rem', color: S.muted, marginTop: '1px' }}>{t('sidebar_tagline')}</div>
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
            placeholder={t('search_placeholder')}
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
              <div style={{ padding: '1.5rem 0.75rem', textAlign: 'center', color: S.vdim, fontSize: '0.78rem' }}>{t('search_no_results')}</div>
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
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tItem(id, label)}</span>
                  {badge && !seenBadges.has(id) && <Chip type={badge} />}
                </Link>
              )
            })
          })()
        ) : (
          /* Flat nav — orderable by admin */
          effectiveNavItems.map((item, idx) => {
            const isAct = active(item)
            const isExp = open.has(item.id)
            const hasCh = !!item.children
            const itemSt = navItemStatus[item.id]
            if (itemSt) {
              const isMaint = itemSt === 'maintenance'
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0.75rem', borderRadius: '9px', marginBottom: '2px', color: S.vdim, fontSize: '0.9rem', fontWeight: 400, opacity: 0.5, cursor: 'not-allowed', letterSpacing: '-0.1px', userSelect: 'none' }}>
                  <span style={{ color: S.vdim, flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tItem(item.id, item.label)}</span>
                  {isMaint
                    ? <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.1rem 0.4rem', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: '99px', letterSpacing: '0.4px', flexShrink: 0, border: '1px solid rgba(245,158,11,0.3)', whiteSpace: 'nowrap' }}>MANUTENÇÃO</span>
                    : <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.1rem 0.4rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: '99px', letterSpacing: '0.4px', flexShrink: 0, border: '1px solid rgba(99,102,241,0.3)', whiteSpace: 'nowrap' }}>EM BREVE</span>
                  }
                </div>
              )
            }
            return (
              <div key={item.id} style={{ position: 'relative' }}>
                <Link
                  href={hasCh ? '#' : item.href}
                  onClick={hasCh ? (e) => { toggle(item.id, e); if (item.badge) dismissBadge(item.id) } : () => { setMobileOpen(false); if (item.badge) dismissBadge(item.id) }}
                  className={isAct ? 'sk-nl-act' : 'sk-nl'}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: `0.6rem 0.75rem`, borderRadius: '9px', marginBottom: '2px', color: isAct ? '#fff' : S.muted, textDecoration: 'none', fontSize: '0.9rem', fontWeight: isAct ? 600 : 400, background: isAct ? `linear-gradient(135deg,${isDark ? 'rgba(155,48,255,0.35),rgba(109,40,217,0.3)' : 'rgba(123,46,255,0.15),rgba(90,30,200,0.1)'})` : 'transparent', border: isAct ? `1px solid ${isDark ? 'rgba(155,48,255,0.3)' : 'rgba(123,46,255,0.25)'}` : '1px solid transparent', cursor: 'pointer', letterSpacing: '-0.1px' }}
                >
                  <span style={{ color: isAct ? S.iconActive : S.dim, flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tItem(item.id, item.label)}</span>
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
                      {ch.icon && <span style={{ display: 'flex', flexShrink: 0, color: ca ? S.iconActive : S.dim }}>{ch.icon}</span>}
                      <span style={{ flex: 1 }}>{tItem(ch.id, ch.label)}</span>
                      {ch.badge && !seenBadges.has(ch.id) && <Chip type={ch.badge} />}
                      {ca && <span style={{ color: S.iconActive, display: 'flex' }}>{I.arr}</span>}
                    </Link>
                  )
                })}
              </div>
            )
          })
        )}
      </nav>

      {/* Admin link + Feedback */}
      <div style={{ padding: '0.3rem 0.5rem', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <button onClick={() => { setShowSugg(true); setSuggSent(false); setMobileOpen(false) }}
          className="sk-nl"
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.45rem 0.75rem', borderRadius: '9px', background: 'transparent', border: `1px solid ${S.border}`, color: S.muted, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', letterSpacing: '0.1px', textAlign: 'left' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          {t('suggestion_bug')}
        </button>
        <Link href="/admin" onClick={() => setMobileOpen(false)}
          className="sk-nl"
          style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.45rem 0.75rem', borderRadius: '9px', background: 'rgba(255,68,68,0.07)', border: '1px solid rgba(255,68,68,0.18)', textDecoration: 'none', color: '#ff6b6b', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          {t('admin_panel')}
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
          <div style={{ fontSize: '0.68rem', color: S.muted }}>{t('streamer_beta')}</div>
        </div>
        <button onClick={() => { window.location.href = '/api/logout' }} title={t('logout')} className="sk-signout" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: S.dim, display: 'flex', alignItems: 'center', padding: '0.25rem', flexShrink: 0, opacity: 0.7 }}>{I.out}</button>
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
              {!isMobile && t('beta_closed')}
            </div>
            <LanguageSwitcher color={S.dim} hoverBg={S.primaryBg} activeBg={isDark ? 'rgba(155,48,255,0.2)' : 'rgba(123,46,255,0.1)'} activeColor={S.iconActive} />
            <button onClick={toggleTheme} className="sk-theme-btn" title={isDark ? t('theme_light') : t('theme_dark')}>
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

      {/* Admin notifications — visible on ALL dashboard pages, blur backdrop */}
      {activeNotif && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: isDark ? '#111219' : '#ffffff', border: `1px solid ${activeNotif.color}45`, borderRadius: '20px', padding: '2rem 2rem 1.75rem', maxWidth: '480px', width: '100%', boxShadow: `0 0 60px ${activeNotif.color}25, 0 24px 48px rgba(0,0,0,0.8)`, textAlign: 'center', position: 'relative' }}>
            <button onClick={() => dismissNotif(activeNotif.id)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0.3rem 0.55rem' }}>
              ✕
            </button>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem', lineHeight: 1 }}>{activeNotif.icon}</div>
            {activeNotif.title && (
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: activeNotif.color, marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>{activeNotif.title}</div>
            )}
            <div style={{ fontSize: '0.92rem', color: S.muted, lineHeight: 1.7, marginBottom: '1.75rem', whiteSpace: 'pre-wrap' }}>{activeNotif.message}</div>
            <button onClick={() => dismissNotif(activeNotif.id)}
              style={{ padding: '0.72rem 2.5rem', background: `${activeNotif.color}18`, border: `1px solid ${activeNotif.color}50`, borderRadius: '12px', color: activeNotif.color, fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer' }}>
              {t('got_it')}
            </button>
          </div>
        </div>
      )}

      {/* Suggestion / bug report modal */}
      {user && (
        <>
          {showSugg && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
              onClick={e => { if (e.target === e.currentTarget) setShowSugg(false) }}>
              <div style={{ background: isDark ? '#111219' : '#ffffff', border: `1px solid ${S.borderP}`, borderRadius: '20px', padding: '2rem', maxWidth: '460px', width: '100%', boxShadow: '0 0 60px rgba(155,48,255,0.15), 0 20px 40px rgba(0,0,0,0.7)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: S.text }}>{t('send_feedback')}</div>
                    <div style={{ fontSize: '0.74rem', color: S.muted, marginTop: '0.15rem' }}>{t('feedback_goes_admin')}</div>
                  </div>
                  <button onClick={() => setShowSugg(false)} style={{ background: 'transparent', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '1.1rem', padding: '0.2rem', lineHeight: 1 }}>✕</button>
                </div>

                {suggSent ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: S.text, marginBottom: '0.4rem' }}>{t('thank_you')}</div>
                    <div style={{ fontSize: '0.78rem', color: S.muted, marginBottom: '1.5rem' }}>{t('feedback_goes_admin')}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={() => setSuggSent(false)} style={{ padding: '0.6rem 1.2rem', background: 'rgba(155,48,255,0.1)', border: '1px solid rgba(155,48,255,0.3)', borderRadius: '10px', color: S.primary, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>{t('send_another')}</button>
                      <button onClick={() => setShowSugg(false)} style={{ padding: '0.6rem 1.2rem', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${S.border}`, borderRadius: '10px', color: S.muted, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>{t('close')}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      {(['suggestion', 'bug'] as const).map(type => (
                        <button key={type} onClick={() => setSuggType(type)}
                          style={{ flex: 1, padding: '0.55rem', borderRadius: '10px', border: `1px solid ${suggType === type ? `${S.primary}70` : S.border}`, background: suggType === type ? S.primaryBg : 'transparent', color: suggType === type ? S.primary : S.muted, fontWeight: suggType === type ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer' }}>
                          {type === 'suggestion' ? t('suggestion_emoji') : t('bug_emoji')}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={suggMsg}
                      onChange={e => setSuggMsg(e.target.value)}
                      placeholder={t('feedback_placeholder')}
                      rows={5}
                      style={{ width: '100%', padding: '0.75rem', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${S.borderP}`, borderRadius: '10px', color: S.text, fontSize: '0.85rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6 }}
                    />
                    <button
                      disabled={suggSending || !suggMsg.trim()}
                      onClick={async () => {
                        if (!suggMsg.trim()) return
                        setSuggSending(true)
                        try {
                          const res = await fetch('/api/suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: suggType, message: suggMsg.trim() }) })
                          if (res.ok) { setSuggSent(true); setSuggMsg('') }
                        } catch { /* ignore */ } finally { setSuggSending(false) }
                      }}
                      style={{ marginTop: '0.75rem', width: '100%', padding: '0.75rem', background: suggMsg.trim() ? 'linear-gradient(135deg,#9b30ff,#6b1fc2)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${suggMsg.trim() ? 'rgba(155,48,255,0.5)' : S.border}`, borderRadius: '10px', color: suggMsg.trim() ? '#fff' : S.vdim, fontWeight: 700, fontSize: '0.9rem', cursor: suggMsg.trim() ? 'pointer' : 'not-allowed' }}>
                      {suggSending ? t('sending') : `➤ ${t('send')}`}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  )
}
