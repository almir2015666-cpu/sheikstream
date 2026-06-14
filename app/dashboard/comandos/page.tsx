'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { notify } from '@/app/lib/notify'
import { playAlertSound } from '@/app/lib/sound'
import Link from 'next/link'

const C_DARK = {
  page: '#08090d', card: '#0d0f18', border: 'rgba(255,255,255,0.07)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.55)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)', primary: '#9b30ff',
  blue: '#3b82f6', blueBg: 'rgba(59,130,246,0.12)',
  cyan: '#22d3ee', green: '#22c55e',
  rowBorder: 'rgba(255,255,255,0.04)', rowHover: 'rgba(255,255,255,0.015)',
  toggleOff: 'rgba(255,255,255,0.12)', toggleBorder: 'none',
  editIcon: 'rgba(232,230,248,0.28)', deleteIcon: 'rgba(255,100,100,0.45)',
}
const C_LIGHT = {
  page: '#f0effe', card: '#ffffff', border: 'rgba(0,0,0,0.18)',
  text: '#0a0918', muted: '#2a2840', dim: '#3a3860',
  vdim: 'rgba(15,14,36,0.55)', primary: '#7b2eff',
  blue: '#2563eb', blueBg: 'rgba(37,99,235,0.08)', cyan: '#0891b2', green: '#059669',
  rowBorder: 'rgba(0,0,0,0.16)', rowHover: 'rgba(0,0,0,0.05)',
  toggleOff: '#c8c5e8', toggleBorder: '2px solid rgba(0,0,0,0.3)',
  editIcon: '#3a3860', deleteIcon: 'rgba(180,20,20,0.75)',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem', background: '#08090d',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
  color: '#e8e6f8', fontSize: '0.875rem', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

function Toggle({ on, onChange, size = 'md', isDark: dark = true }: { on: boolean; onChange: (v: boolean) => void; size?: 'sm' | 'md'; isDark?: boolean }) {
  const [w, h, b, bOff, bOn] = size === 'sm' ? [34, 18, 12, 3, 19] : [44, 24, 18, 3, 23]
  const tc = dark ? C_DARK : C_LIGHT
  return (
    <button type="button" onClick={() => onChange(!on)} style={{
      width: w, height: h, borderRadius: h / 2,
      background: on ? tc.green : tc.toggleOff,
      border: on ? 'none' : tc.toggleBorder,
      cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{ position: 'absolute', top: bOff, left: on ? bOn : bOff, width: b, height: b, borderRadius: '50%', background: dark || on ? '#fff' : '#5a587a', transition: 'left 0.2s', display: 'block' }} />
    </button>
  )
}

// All known automatic event triggers (NOT user-typed commands)
const KNOWN_EVENT_TRIGGERS = new Set([
  'event:twitch:sub', 'event:twitch:giftsub', 'event:twitch:resub', 'event:twitch:prime',
  'event:twitch:follow', 'event:twitch:bits', 'donation:livepix', 'donation:paypal',
  'event:kick:follow', 'event:kick:giftsub', 'event:kick:sub',
  'event:youtube:member', 'event:youtube:giftmember',
])

const isEventTrigger = (t: string) => KNOWN_EVENT_TRIGGERS.has(t)
const isUUID = (id: string | null): boolean =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

type Cmd = {
  id: string; label: string; trigger: string; resposta: string; cooldown: number
  habilitado: boolean; isEvento: boolean; origem: string; platform: string; notifOverlay?: boolean; db?: boolean
}

type FormState = {
  trigger: string; isEvento: boolean; eventoLabel: string
  resposta: string; cooldown: number; cooldownUser: number
  custoBase: number; custoInscritos: number
  ativo: boolean; permissao: string; responderComo: 'canal' | 'bot'
  notifOverlay: boolean; template: string | null; extraVars: string[]; platforms: string[]
}

const emptyForm: FormState = {
  trigger: '', isEvento: false, eventoLabel: '',
  resposta: '', cooldown: 5, cooldownUser: 0, custoBase: 0, custoInscritos: 0,
  ativo: true, permissao: 'todos', responderComo: 'canal',
  notifOverlay: false, template: null, extraVars: [], platforms: ['Twitch'],
}

const PERMS = [
  { id: 'todos',       label: 'Todos',       desc: 'Qualquer pessoa no chat',  color: '#22c55e' },
  { id: 'inscritos',   label: 'Inscritos',   desc: 'Apenas inscritos/membros', color: '#3b82f6' },
  { id: 'vip',         label: 'VIP',         desc: 'VIPs e acima',             color: '#8b5cf6' },
  { id: 'moderadores', label: 'Moderadores', desc: 'Apenas mods e streamer',   color: '#3b82f6' },
  { id: 'streamer',    label: 'Streamer',    desc: 'Apenas o streamer',        color: '#3b82f6' },
]

function TplIcon({ id, color }: { id: string; color: string }) {
  const s = { width: 18, height: 18 }
  if (id === 'discord')   return <svg {...s} viewBox="0 0 24 24" fill={color}><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.112 18.1.132 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
  if (id === 'instagram') return <svg {...s} viewBox="0 0 24 24" fill={color}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
  if (id === 'youtube')   return <svg {...s} viewBox="0 0 24 24" fill={color}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  if (id === 'kick')      return <svg {...s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill={color}/><path d="M9 8l6 4-6 4V8z" fill="#000"/></svg>
  if (id === 'so')        return <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
  if (id === 'musica')    return <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
  if (id === 'sorteio')   return <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
  return <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}

type Tpl = { id: string; label: string; trigger: string; resposta: string; permissao: string; cooldown: number; extraVars?: string[]; color: string }
const TEMPLATES: Tpl[] = [
  { id: 'discord',   label: '!discord',   trigger: 'discord',   resposta: '💬 Venha participar da nossa comunidade no Discord: discord.gg/LINK_AQUI',       permissao: 'todos',       cooldown: 5,  color: '#7289da' },
  { id: 'instagram', label: '!instagram', trigger: 'instagram', resposta: '📷 Me siga no Instagram: instagram.com/SEU_USER',                                  permissao: 'todos',       cooldown: 5,  color: '#e1306c' },
  { id: 'youtube',   label: '!youtube',   trigger: 'youtube',   resposta: '▶ Inscreva-se no YouTube: youtube.com/@SEU_CANAL',                                  permissao: 'todos',       cooldown: 5,  color: '#3b82f6' },
  { id: 'kick',      label: '!kick',      trigger: 'kick',      resposta: '🟢 Me siga no Kick: kick.com/SEU_USER',                                             permissao: 'todos',       cooldown: 5,  color: '#53fc18' },
  { id: 'so',        label: '!so',        trigger: 'so',        resposta: '📢 Shoutout para @$(1)! Vai lá conferir: twitch.tv/$(1) — dá aquele follow! PogChamp', permissao: 'moderadores', cooldown: 10, color: '#f97316' },
  { id: 'musica',    label: '!musica',    trigger: 'musica',    resposta: '🎵 Para sugerir uma música use: !sr [link do YouTube]',                             permissao: 'todos',       cooldown: 10, extraVars: ['$musica', '$artista', '$url'], color: '#a855f7' },
  { id: 'sorteio',   label: '!sorteio',   trigger: 'sorteio',   resposta: '🎰 Participe do sorteio! Doe via Livepix e ganhe tickets. Veja o link no perfil!',   permissao: 'todos',       cooldown: 15, color: '#6b7280' },
  { id: 'blank',     label: 'Em branco',  trigger: '',          resposta: '',                                                                                    permissao: 'todos',       cooldown: 5,  color: '#eab308' },
]

const BASE_VARS   = ['$(user)', '$(channel)', '$(touser)', '$(1)', '$(count)', '$(uptime)', '$(game)']
const EVENT_VARS  = ['$user', '$valor', '$tickets', '$nums', '$msg', '$tier', '$months', '$count', '$gifter', '$platform']

// Default automatic event commands (predefined, stored/overridden in DB)
// All start as disabled — user must activate each one individually
const DEFAULTS: Cmd[] = [
  { id: 'evt-twitch-sub',         label: 'Sub Twitch',          trigger: 'event:twitch:sub',          resposta: 'Obrigado pelo sub, $user! Voce ganhou $tickets ticket(s).',                    cooldown: 0, habilitado: false, isEvento: true, origem: 'Automatico', platform: 'Twitch' },
  { id: 'evt-twitch-giftsub',     label: 'Gift sub Twitch',     trigger: 'event:twitch:giftsub',      resposta: 'Obrigado $user por presentear $count gift sub(s)!',                            cooldown: 0, habilitado: false, isEvento: true, origem: 'Automatico', platform: 'Twitch' },
  { id: 'evt-twitch-resub',       label: 'Resub Twitch',        trigger: 'event:twitch:resub',        resposta: 'Obrigado pelo resub, $user! $months mes(es) de apoio. $msg',                   cooldown: 0, habilitado: false, isEvento: true, origem: 'Automatico', platform: 'Twitch' },
  { id: 'evt-twitch-prime',       label: 'Prime Twitch',        trigger: 'event:twitch:prime',        resposta: 'Obrigado pelo Prime, $user! Esse Prime fortalece demais a live.',               cooldown: 0, habilitado: false, isEvento: true, origem: 'Automatico', platform: 'Twitch' },
  { id: 'evt-twitch-follow',      label: 'Follow Twitch',       trigger: 'event:twitch:follow',       resposta: 'Valeu pelo follow, $user! Seja bem-vindo(a).',                                  cooldown: 0, habilitado: false, isEvento: true, origem: 'Automatico', platform: 'Twitch' },
  { id: 'evt-livepix',            label: 'Doacao Livepix',      trigger: 'donation:livepix',          resposta: 'Obrigado $user pela doacao de $valor! Voce ganhou $tickets ticket(s). $msg',   cooldown: 0, habilitado: false, isEvento: true, origem: 'Automatico', platform: 'Twitch' },
  { id: 'evt-paypal',             label: 'Doacao PayPal',       trigger: 'donation:paypal',           resposta: 'PayPal: $user doou $valor e ganhou $tickets ticket(s)! $msg',                  cooldown: 0, habilitado: false, isEvento: true, origem: 'Automatico', platform: 'Twitch' },
  { id: 'evt-kick-follow',        label: 'Follow Kick',         trigger: 'event:kick:follow',         resposta: 'Valeu pelo follow na Kick, $user! Seja bem-vindo(a).',                          cooldown: 0, habilitado: false, isEvento: true, origem: 'Automatico', platform: 'Kick' },
  { id: 'evt-kick-giftsub',       label: 'Gift sub Kick',       trigger: 'event:kick:giftsub',        resposta: 'Obrigado $user por presentear $count sub(s) na Kick!',                          cooldown: 0, habilitado: false, isEvento: true, origem: 'Automatico', platform: 'Kick' },
  { id: 'evt-kick-sub',           label: 'Sub Kick',            trigger: 'event:kick:sub',            resposta: 'Obrigado pelo sub na Kick, $user! Voce ganhou $tickets ticket(s).',             cooldown: 0, habilitado: false, isEvento: true, origem: 'Automatico', platform: 'Kick' },
  { id: 'evt-youtube-member',     label: 'Membro YouTube',      trigger: 'event:youtube:member',      resposta: 'Obrigado por virar membro, $user! Voce ganhou $tickets ticket(s).',             cooldown: 0, habilitado: false, isEvento: true, origem: 'Automatico', platform: 'Youtube' },
  { id: 'evt-youtube-giftmember', label: 'Gift member YouTube', trigger: 'event:youtube:giftmember',  resposta: 'Obrigado $user por presentear $count membro(s) no YouTube!',                   cooldown: 0, habilitado: false, isEvento: true, origem: 'Automatico', platform: 'Youtube' },
  { id: 'evt-twitch-bits',        label: 'Bits Twitch',         trigger: 'event:twitch:bits',         resposta: 'Valeu pelos $valor bits, $user! $msg',                                          cooldown: 0, habilitado: false, isEvento: true, origem: 'Automatico', platform: 'Twitch' },
]

// ─── Platform / event helpers ─────────────────────────────────────────────────
const PLAT_COLOR: Record<string, string> = {
  Twitch: '#9146FF', Kick: '#53FC18', Youtube: '#FF4040', PayPal: '#0070BA',
}
const EVT_ICON: Record<string, string> = {
  'event:twitch:sub': '⭐', 'event:twitch:resub': '🔁', 'event:twitch:giftsub': '🎁',
  'event:twitch:prime': '👑', 'event:twitch:follow': '❤️', 'event:twitch:bits': '💎',
  'donation:livepix': '💸', 'donation:paypal': '💳',
  'event:kick:sub': '⭐', 'event:kick:follow': '❤️', 'event:kick:giftsub': '🎁',
  'event:youtube:member': '🏅', 'event:youtube:giftmember': '🎁',
}

// ─── Overlay quick-edit ────────────────────────────────────────────────────────
const TRIGGER_TO_SLUG: Record<string, string> = {
  'event:twitch:sub': 'twitch-sub', 'event:twitch:giftsub': 'twitch-giftsub',
  'event:twitch:resub': 'twitch-resub', 'event:twitch:prime': 'twitch-sub',
  'event:twitch:follow': 'twitch-follow', 'event:twitch:bits': 'twitch-bits',
  'donation:livepix': 'livepix', 'donation:paypal': 'paypal',
  'event:kick:follow': 'kick-follow', 'event:kick:giftsub': 'kick-giftsub',
  'event:kick:sub': 'kick-sub', 'event:youtube:member': 'youtube-member',
  'event:youtube:giftmember': 'youtube-giftmember',
}
type OvCfg = {
  animIn: string; animOut: string; animSpeed: number; duration: number; font: string
  timerColor: string; textColor: string; bgColor: string; bgOpacity: number
  borderRadius: number; border: boolean; borderColor: string; borderThick: number
  titleSize: number; supportSize: number; width: number
  titleText: string; subtitleText: string; titleColor: string; subtitleColor: string
  iconShape: 'circle' | 'square' | 'none'
  iconAnim: 'none' | 'pulse' | 'spin' | 'bounce' | 'shake'
  cardEffect: 'none' | 'glow' | 'pulse'
  icon: string
  customArt: string
  soundEnabled: boolean; soundDataUrl: string; soundVolume: number
}
const OV_DEF: OvCfg = {
  animIn: 'slide-right', animOut: 'fade', animSpeed: 5, duration: 6, font: 'Inter',
  timerColor: '#9146FF', textColor: '#ffffff', bgColor: '#0b0c17', bgOpacity: 0.92,
  borderRadius: 14, border: true, borderColor: '#9146FF', borderThick: 1,
  titleSize: 20, supportSize: 16, width: 480,
  titleText: '', subtitleText: '', titleColor: '#9146FF', subtitleColor: '#ffffff',
  iconShape: 'circle', iconAnim: 'none', cardEffect: 'none',
  icon: '', customArt: '',
  soundEnabled: true, soundDataUrl: '', soundVolume: 70,
}
const OV_ANIMS = [
  { id: 'slide-right', label: 'Slide →',   dur: '0.45s' }, { id: 'slide-left',  label: 'Slide ←',  dur: '0.45s' },
  { id: 'slide-up',    label: 'Slide ↑',   dur: '0.45s' }, { id: 'slide-down',  label: 'Slide ↓',  dur: '0.45s' },
  { id: 'fade',        label: 'Fade',       dur: '0.45s' }, { id: 'zoom-in',     label: 'Zoom In',  dur: '0.4s'  },
  { id: 'zoom-out',    label: 'Zoom Out',   dur: '0.4s'  }, { id: 'bounce-in',   label: 'Bounce',   dur: '0.55s' },
  { id: 'flip-x',      label: 'Flip X',    dur: '0.5s'  }, { id: 'flip-y',      label: 'Flip Y',   dur: '0.5s'  },
  { id: 'rotate-in',   label: 'Girar',     dur: '0.5s'  }, { id: 'elastic',     label: 'Elástico', dur: '0.65s' },
  { id: 'shake',       label: 'Tremer',    dur: '0.5s'  }, { id: 'blur-in',     label: 'Blur',     dur: '0.4s'  },
  { id: 'drop-in',     label: 'Cair',      dur: '0.5s'  }, { id: 'swing',       label: 'Balançar', dur: '0.6s'  },
  { id: 'rubberband',  label: 'Elástica²', dur: '0.7s'  }, { id: 'heartbeat',   label: 'Coração',  dur: '0.6s'  },
  { id: 'roll-in',     label: 'Rolar →',   dur: '0.6s'  }, { id: 'tada',        label: 'Tada!',    dur: '0.6s'  },
  { id: 'wobble',      label: 'Trepidar',  dur: '0.65s' }, { id: 'flash',       label: 'Flash',    dur: '0.5s'  },
  { id: 'skew',        label: 'Torcer',    dur: '0.5s'  }, { id: 'jack-in',     label: 'Pop!',     dur: '0.55s' },
]
const OV_EXIT_ANIMS = [
  { id: 'fade',         label: 'Fade' },
  { id: 'slide-right',  label: 'Slide →' },
  { id: 'slide-left',   label: 'Slide ←' },
  { id: 'slide-up',     label: 'Sobe ↑' },
  { id: 'slide-down',   label: 'Desce ↓' },
  { id: 'zoom-out',     label: 'Encolher' },
  { id: 'zoom-in',      label: 'Crescer' },
  { id: 'flip-x',       label: 'Flip X' },
  { id: 'none',         label: 'Instantâneo' },
]
const OV_FONTS = ['Inter','Open Sans','Roboto','Montserrat','Poppins','Rajdhani']

const OV_PRESETS: { id: string; label: string; color: string; cfg: Partial<OvCfg> }[] = [
  { id: 'classico', label: 'Clássico', color: '#9146FF',
    cfg: { bgColor:'#0b0c17',bgOpacity:0.92,timerColor:'#9146FF',titleColor:'#9146FF',subtitleColor:'#ffffff',textColor:'#ffffff',borderColor:'#9146FF',border:true,borderThick:1,borderRadius:14,font:'Inter',iconShape:'circle',iconAnim:'none',cardEffect:'none',titleSize:20,supportSize:16 } },
  { id: 'neon', label: '⚡ Neon', color: '#22d3ee',
    cfg: { bgColor:'#020c12',bgOpacity:0.96,timerColor:'#22d3ee',titleColor:'#22d3ee',subtitleColor:'#a0e7ff',textColor:'#a0e7ff',borderColor:'#22d3ee',border:true,borderThick:2,borderRadius:4,font:'Rajdhani',iconShape:'square',iconAnim:'pulse',cardEffect:'glow',titleSize:22,supportSize:17 } },
  { id: 'minimal', label: 'Minimal', color: '#e8e6f8',
    cfg: { bgColor:'#0b0c17',bgOpacity:0.55,timerColor:'#ffffff',titleColor:'#ffffff',subtitleColor:'rgba(232,230,248,0.55)',textColor:'#ffffff',borderColor:'#ffffff',border:false,borderThick:1,borderRadius:8,font:'Inter',iconShape:'none',iconAnim:'none',cardEffect:'none',titleSize:18,supportSize:14 } },
  { id: 'gaming', label: '🔥 Gaming', color: '#f97316',
    cfg: { bgColor:'#100800',bgOpacity:0.94,timerColor:'#f97316',titleColor:'#f97316',subtitleColor:'#fcd34d',textColor:'#fcd34d',borderColor:'#f97316',border:true,borderThick:2,borderRadius:6,font:'Montserrat',iconShape:'square',iconAnim:'bounce',cardEffect:'pulse',titleSize:22,supportSize:17 } },
  { id: 'matrix', label: '💚 Matrix', color: '#22c55e',
    cfg: { bgColor:'#010d01',bgOpacity:0.97,timerColor:'#22c55e',titleColor:'#22c55e',subtitleColor:'#86efac',textColor:'#86efac',borderColor:'#22c55e',border:true,borderThick:1,borderRadius:2,font:'Roboto',iconShape:'circle',iconAnim:'spin',cardEffect:'glow',titleSize:20,supportSize:16 } },
]

// Per-event default text + accent color — applied when no saved config exists
const SLUG_PRESETS: Partial<Record<string, Partial<OvCfg>>> = {
  'twitch-sub':         { titleText: 'Novo inscrito!',       subtitleText: '$user se inscreveu!',              timerColor: '#9146FF', titleColor: '#9146FF', borderColor: '#9146FF' },
  'twitch-giftsub':     { titleText: 'Gift Sub!',            subtitleText: '$user presenteou $valor inscrito(s)!', timerColor: '#c084fc', titleColor: '#c084fc', borderColor: '#c084fc' },
  'twitch-resub':       { titleText: 'Reinscrição!',         subtitleText: '$user inscrito há $valor meses!',  timerColor: '#9146FF', titleColor: '#9146FF', borderColor: '#9146FF' },
  'twitch-follow':      { titleText: 'Novo seguidor!',       subtitleText: '$user começou a seguir!',          timerColor: '#ff6eb6', titleColor: '#ff6eb6', borderColor: '#ff6eb6' },
  'twitch-bits':        { titleText: 'Bits recebidos!',      subtitleText: '$user enviou $valor bits!',        timerColor: '#fbbf24', titleColor: '#fbbf24', borderColor: '#fbbf24' },
  'livepix':            { titleText: 'Doação recebida!',     subtitleText: '$user doou R$$valor!',             timerColor: '#39ff14', titleColor: '#39ff14', borderColor: '#39ff14' },
  'paypal':             { titleText: 'Doação PayPal!',       subtitleText: '$user doou R$$valor!',             timerColor: '#0070ba', titleColor: '#0070ba', borderColor: '#0070ba' },
  'kick-sub':           { titleText: 'Novo inscrito!',       subtitleText: '$user se inscreveu no Kick!',      timerColor: '#53fc18', titleColor: '#53fc18', borderColor: '#53fc18' },
  'kick-follow':        { titleText: 'Novo seguidor!',       subtitleText: '$user seguiu no Kick!',            timerColor: '#53fc18', titleColor: '#53fc18', borderColor: '#53fc18' },
  'kick-giftsub':       { titleText: 'Gift Sub Kick!',       subtitleText: '$user presenteou no Kick!',        timerColor: '#53fc18', titleColor: '#53fc18', borderColor: '#53fc18' },
  'youtube-member':     { titleText: 'Novo membro!',         subtitleText: '$user virou membro!',              timerColor: '#ff0000', titleColor: '#ff0000', borderColor: '#ff0000' },
  'youtube-giftmember': { titleText: 'Gift de Membros!',     subtitleText: '$user presenteou membros!',        timerColor: '#ff4040', titleColor: '#ff4040', borderColor: '#ff4040' },
}

const KEYFRAME_ANIMS_SET = new Set(['shake','swing','rubberband','heartbeat','roll-in','tada','wobble','flash'])

function ovHidden(animIn: string): React.CSSProperties {
  if (KEYFRAME_ANIMS_SET.has(animIn)) return { opacity: 0 }
  const t: Record<string,string> = {
    'slide-right':'translateX(-120%)','slide-left':'translateX(120%)','slide-up':'translateY(50px)',
    'slide-down':'translateY(-50px)','zoom-in':'scale(0.4)','zoom-out':'scale(1.5)',
    'bounce-in':'translateY(-60px)','flip-x':'rotateX(90deg)','flip-y':'rotateY(90deg)',
    'rotate-in':'rotate(-180deg) scale(0.5)','elastic':'translateX(-120%)',
    'drop-in':'translateY(-100px)',
    'skew':'skewX(30deg) translateX(-60%)',
    'jack-in':'scale(0.05) rotate(-200deg)',
  }
  return { transform: t[animIn] ?? 'translateX(-120%)', opacity: 0, filter: animIn==='blur-in'?'blur(16px)':'none' }
}
function ovTrans(animIn: string, animSpeed = 5): string {
  const d = ((11 - animSpeed) * 0.2).toFixed(2)
  const d6 = ((11 - animSpeed) * 0.12).toFixed(2)
  const m: Record<string,string> = {
    'bounce-in': `transform ${d}s cubic-bezier(.22,.68,0,1.8),opacity ${d6}s`,
    'elastic':   `transform ${d}s cubic-bezier(.22,.68,0,2),opacity ${d6}s`,
    'zoom-in':   `transform ${d}s cubic-bezier(.22,.68,0,1.2),opacity ${d6}s`,
    'zoom-out':  `transform ${d}s cubic-bezier(.22,.68,0,1.1),opacity ${d6}s`,
    'flip-x':    `transform ${d}s cubic-bezier(.25,.46,.45,.94),opacity ${d6}s`,
    'flip-y':    `transform ${d}s cubic-bezier(.25,.46,.45,.94),opacity ${d6}s`,
    'rotate-in': `transform ${d}s cubic-bezier(.22,.68,0,1.2),opacity ${d6}s`,
    'drop-in':   `transform ${d}s cubic-bezier(.22,.68,0,1.3),opacity ${d6}s`,
    'blur-in':   `filter ${d}s ease,opacity ${d}s`,
    'skew':      `transform ${d}s cubic-bezier(.22,.68,0,1.1),opacity ${d6}s`,
    'jack-in':   `transform ${d}s cubic-bezier(.22,.68,0,1.6),opacity ${d6}s`,
  }
  return m[animIn] ?? `transform ${d}s cubic-bezier(.22,.68,0,1.2),opacity ${d6}s`
}

const SLUG_PREVIEW: Record<string, { icon: string; title: string; sub: string }> = {
  'twitch-sub':         { icon: '⭐', title: 'Novo inscrito!',    sub: 'viewer123 se inscreveu!' },
  'twitch-giftsub':     { icon: '🎁', title: 'Gift Sub!',         sub: 'viewer123 presenteou 5 inscritos!' },
  'twitch-resub':       { icon: '🔁', title: 'Reinscrição!',      sub: 'viewer123 inscrito há 3 meses!' },
  'twitch-follow':      { icon: '❤️',  title: 'Novo seguidor!',   sub: 'viewer123 começou a seguir!' },
  'twitch-bits':        { icon: '💎', title: 'Bits recebidos!',   sub: 'viewer123 enviou 100 bits!' },
  'livepix':            { icon: '💸', title: 'Doação recebida!',  sub: 'viewer123 doou R$10,00!' },
  'paypal':             { icon: '💸', title: 'Doação PayPal!',    sub: 'viewer123 doou R$10,00!' },
  'kick-sub':           { icon: '⭐', title: 'Novo inscrito!',    sub: 'viewer123 se inscreveu no Kick!' },
  'kick-follow':        { icon: '❤️',  title: 'Novo seguidor!',   sub: 'viewer123 seguiu no Kick!' },
  'kick-giftsub':       { icon: '🎁', title: 'Gift Sub Kick!',    sub: 'viewer123 presenteou no Kick!' },
  'youtube-member':     { icon: '▶️', title: 'Novo membro!',      sub: 'viewer123 virou membro!' },
  'youtube-giftmember': { icon: '🎁', title: 'Gift de Membros!',  sub: 'viewer123 presenteou membros!' },
}
const SLUG_PREVIEW_DEFAULT = { icon: '🔔', title: 'Novo alerta!', sub: 'viewer123 ativou o alerta!' }

function OvPreview({ cfg, animKey, slug, showAnim = true }: { cfg: OvCfg; animKey: number; slug: string; showAnim?: boolean }) {
  const [phase, setPhase] = useState<'hidden'|'enter'|'show'|'exit'>('hidden')
  useEffect(() => {
    if (!showAnim) { setPhase('show'); return }
    setPhase('hidden')
    const t1 = setTimeout(() => setPhase('enter'), 80)
    const t2 = setTimeout(() => setPhase('show'), 900)
    const t3 = setTimeout(() => setPhase('exit'), 2200)
    const t4 = setTimeout(() => setPhase('hidden'), 2900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [animKey, cfg.animIn, cfg.animOut, cfg.animSpeed, showAnim])
  const vis = phase === 'enter' || phase === 'show'
  const isExiting = phase === 'exit'
  const bg = cfg.bgColor === 'transparent' || cfg.bgOpacity === 0 ? 'transparent' : cfg.bgColor
  const acc = cfg.timerColor
  const titleClr = cfg.titleColor || acc
  const subClr = cfg.subtitleColor || cfg.textColor
  const preview = SLUG_PREVIEW[slug] ?? SLUG_PREVIEW_DEFAULT
  const titleLabel = cfg.titleText || preview.title
  const rawSub = cfg.subtitleText || preview.sub
  const subLabel = rawSub
    .replace(/\$user/g, 'viewer123').replace(/\$valor/g, '5,00').replace(/\$tickets/g, '10')
    .replace(/\$months/g, '3').replace(/\$tier/g, 'Tier 1').replace(/\$count/g, '5')
    .replace(/\$msg/g, '...').replace(/\$gifter/g, 'viewer123').replace(/\$platform/g, 'Twitch')
  const iconEmoji = cfg.icon || preview.icon
  const iconIsImage = iconEmoji.startsWith('data:') || iconEmoji.startsWith('http')
  if (cfg.customArt) return (
    <div style={{ width:'100%', fontFamily: cfg.font }}>
      <img src={cfg.customArt} alt="Arte completa" style={{ width:'100%',maxHeight:120,objectFit:'contain',borderRadius:cfg.borderRadius,border:cfg.border?`${cfg.borderThick}px solid ${cfg.timerColor}`:'none' }} />
    </div>
  )
  const checkers = 'repeating-conic-gradient(#333 0% 25%,#1a1a1a 0% 50%) 0 0/12px 12px'
  const iconAnimStyle: React.CSSProperties = cfg.iconAnim === 'none' ? {} : {
    animation: `ovqe-icon-${cfg.iconAnim} ${cfg.iconAnim === 'spin' ? '2s linear' : '1.5s ease-in-out'} infinite`,
  }
  const isKeyframeAnim = KEYFRAME_ANIMS_SET.has(cfg.animIn)
  const entranceDur = `${((11-cfg.animSpeed)*0.085).toFixed(2)}s`
  const exitDur = `${((11-cfg.animSpeed)*0.06).toFixed(2)}s`
  const entranceAnim = (phase === 'enter') && isKeyframeAnim ? `ovqe-e-${cfg.animIn} ${entranceDur} ease forwards` : undefined
  const exitAnim = isExiting && (cfg.animOut ?? 'fade') !== 'none' ? `ovqe-out-${cfg.animOut ?? 'fade'} ${exitDur} ease forwards` : undefined
  return (
    <div style={{ width:'100%', fontFamily: cfg.font, position:'relative' }}>
      <style>{`
        @keyframes ovqe-icon-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.28)}}
        @keyframes ovqe-icon-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes ovqe-icon-bounce{0%,100%{transform:translateY(0)}45%{transform:translateY(-9px)}}
        @keyframes ovqe-icon-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
        @keyframes ovqe-card-glow{0%,100%{box-shadow:0 0 18px ${acc}66}50%{box-shadow:0 0 65px ${acc}dd,0 0 28px ${acc}99}}
        @keyframes ovqe-card-pulse{0%,100%{box-shadow:0 0 12px ${acc}55}50%{box-shadow:0 0 42px ${acc}99}}
        @keyframes ovqe-e-shake{0%{transform:translateX(-70px);opacity:0}25%{opacity:1}38%{transform:translateX(14px)}54%{transform:translateX(-9px)}68%{transform:translateX(5px)}80%{transform:translateX(-2px)}100%{transform:translateX(0)}}
        @keyframes ovqe-e-swing{0%{transform:rotate(-22deg);opacity:0}20%{opacity:1}42%{transform:rotate(11deg)}62%{transform:rotate(-6deg)}76%{transform:rotate(3deg)}88%{transform:rotate(-1deg)}100%{transform:rotate(0deg)}}
        @keyframes ovqe-e-rubberband{0%{opacity:0;transform:scale(0.1)}35%{opacity:1;transform:scale(1.28,.72)}50%{transform:scale(.78,1.22)}65%{transform:scale(1.12,.88)}80%{transform:scale(.96,1.04)}100%{transform:scale(1)}}
        @keyframes ovqe-e-heartbeat{0%{opacity:0;transform:scale(.6)}14%{opacity:1;transform:scale(1.1)}28%{transform:scale(.96)}42%{transform:scale(1.14)}70%{transform:scale(.98)}100%{opacity:1;transform:scale(1)}}
        @keyframes ovqe-e-roll-in{0%{opacity:0;transform:translateX(-120%) rotate(-360deg)}100%{opacity:1;transform:translateX(0) rotate(0deg)}}
        @keyframes ovqe-e-tada{0%{opacity:0;transform:scale(.8)}10%{opacity:1;transform:scale(.8) rotate(-3deg)}20%,40%,60%{transform:scale(1.08) rotate(3deg)}30%,50%{transform:scale(1.08) rotate(-3deg)}70%{transform:scale(1.04)}100%{opacity:1;transform:scale(1) rotate(0deg)}}
        @keyframes ovqe-e-wobble{0%{opacity:0;transform:translateX(-28px)}15%{opacity:1;transform:translateX(18px) rotate(2deg)}30%{transform:translateX(-12px) rotate(-2deg)}45%{transform:translateX(8px) rotate(1deg)}60%{transform:translateX(-4px) rotate(-.5deg)}75%{transform:translateX(2px)}100%{opacity:1;transform:translateX(0)}}
        @keyframes ovqe-e-flash{0%,50%{opacity:0}25%,75%{opacity:1}100%{opacity:1}}
        @keyframes ovqe-out-fade{to{opacity:0}}
        @keyframes ovqe-out-slide-right{to{transform:translateX(110%);opacity:0}}
        @keyframes ovqe-out-slide-left{to{transform:translateX(-110%);opacity:0}}
        @keyframes ovqe-out-slide-up{to{transform:translateY(-70px);opacity:0}}
        @keyframes ovqe-out-slide-down{to{transform:translateY(70px);opacity:0}}
        @keyframes ovqe-out-zoom-out{to{transform:scale(0.05);opacity:0}}
        @keyframes ovqe-out-zoom-in{to{transform:scale(2);opacity:0}}
        @keyframes ovqe-out-flip-x{to{transform:rotateX(90deg);opacity:0}}
      `}</style>
      {bg === 'transparent' && (
        <div style={{ position:'absolute',inset:0,borderRadius:cfg.borderRadius,background:checkers,opacity:0.35,pointerEvents:'none' }} />
      )}
      {/* Card effect rendered in separate div to avoid interfering with entrance animation */}
      {cfg.cardEffect !== 'none' && (
        <div style={{ position:'absolute',inset:0,borderRadius:cfg.borderRadius,pointerEvents:'none',animation:`ovqe-card-${cfg.cardEffect} 2s ease-in-out 0s infinite` }} />
      )}
      <div style={{
        background: bg, borderRadius: cfg.borderRadius, padding:'14px 18px',
        display:'flex', alignItems:'center', gap:14,
        border: cfg.border ? `${cfg.borderThick}px solid ${acc}` : `1px solid ${acc}44`,
        boxShadow: cfg.cardEffect === 'none' ? `0 0 20px ${acc}22` : undefined,
        position:'relative', overflow:'hidden',
        animation: exitAnim ?? entranceAnim,
        ...(!isKeyframeAnim && !isExiting
          ? (vis ? { transform:'none',opacity:1,filter:'none' } : ovHidden(cfg.animIn))
          : (!isExiting ? (vis ? {} : { opacity: 0 }) : {})),
        transition: (isKeyframeAnim || isExiting) ? 'none' : (vis ? ovTrans(cfg.animIn, cfg.animSpeed) : 'none'),
      }}>
        {cfg.iconShape !== 'none' && (
          <div style={{ width:46,height:46,borderRadius:cfg.iconShape==='circle'?'50%':10,background:`${acc}22`,border:`1px solid ${acc}55`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:22,overflow:'hidden',...iconAnimStyle }}>
            {iconIsImage
              ? <img src={iconEmoji} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',borderRadius:'inherit' }} />
              : iconEmoji}
          </div>
        )}
        <div style={{ flex:1 }}>
          <div style={{ fontSize:cfg.titleSize,fontWeight:800,color:titleClr,lineHeight:1.2 }}>{titleLabel}</div>
          <div style={{ fontSize:cfg.supportSize,color:subClr,opacity:0.8,marginTop:6 }}>{subLabel}</div>
        </div>
        <div style={{ position:'absolute',bottom:0,left:0,right:0,height:3,background:`${acc}22` }}>
          <div style={{ width:vis?'0%':'100%',height:'100%',background:acc,transition:vis?`width ${cfg.duration}s linear`:'none' }} />
        </div>
      </div>
    </div>
  )
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const BD = 'rgba(255,255,255,0.07)', DIM = 'rgba(232,230,248,0.28)', TXT = '#e8e6f8'
  const isTransparent = value === 'transparent'
  const checkers = 'repeating-conic-gradient(#555 0% 25%,#222 0% 50%) 0 0/10px 10px'
  return (
    <div>
      <div style={{ fontSize:'0.68rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.22rem' }}>{label}</div>
      <div style={{ display:'flex',alignItems:'center',gap:'0.3rem',background:'#08090d',border:`1px solid ${BD}`,borderRadius:6,padding:'0.3rem 0.5rem' }}>
        {isTransparent
          ? <div style={{ width:18,height:18,borderRadius:3,background:checkers,border:'1px solid rgba(255,255,255,0.2)',flexShrink:0 }} />
          : <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width:18,height:18,border:'none',background:'none',padding:0,cursor:'pointer',borderRadius:3,flexShrink:0 }} />
        }
        <span style={{ flex:1,fontSize:'0.66rem',color:TXT,fontFamily:'monospace' }}>{isTransparent ? 'Transparente' : value.toUpperCase()}</span>
        <button type="button" onClick={() => onChange(isTransparent ? '#0b0c17' : 'transparent')}
          style={{ padding:'0.12rem 0.4rem',background:isTransparent?'rgba(155,48,255,0.15)':'rgba(255,255,255,0.04)',border:`1px solid ${isTransparent?'rgba(155,48,255,0.4)':BD}`,borderRadius:4,color:isTransparent?'#9b30ff':DIM,fontSize:'0.6rem',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap' }}>
          {isTransparent ? '↩ Cor' : '⬜ T'}
        </button>
      </div>
    </div>
  )
}

function OverlayQuickEdit({ trigger, resposta }: { trigger: string; resposta: string }) {
  const slug = TRIGGER_TO_SLUG[trigger] ?? ''
  const cfgKey = slug ? `alert-${slug}` : 'alert'
  const slugDefault = React.useMemo(
    () => ({ ...OV_DEF, ...(SLUG_PRESETS[slug] ?? {}) }),
    [slug],
  )

  const [uid, setUid] = useState('')
  const [cfg, setCfg] = useState<OvCfg>(() => slugDefault)
  const [tab, setTab] = useState<'efeitos'|'estilo'|'texto'>('efeitos')
  const [animKey, setAnimKey] = useState(0)
  const [savedOk, setSavedOk] = useState(false)
  const [testOk, setTestOk] = useState(false)
  const [testing, setTesting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [iconUploading, setIconUploading] = useState(false)
  const [artUploading, setArtUploading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const lastSavedRef = useRef<string>('')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function uploadAsset(file: File, assetType: 'icon' | 'art'): Promise<string | null> {
    try {
      const reader = new FileReader()
      const b64 = await new Promise<string>(res => { reader.onload = () => res(reader.result as string); reader.readAsDataURL(file) })
      const r = await fetch('/api/overlay-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: b64, mimeType: file.type, assetType }),
      })
      if (!r.ok) {
        let msg = 'Erro ao enviar imagem'
        try { const d = await r.json(); msg = d.error ?? msg } catch {}
        notify(msg, 'error'); return null
      }
      const d = await r.json()
      return d.url ?? null
    } catch {
      notify('Erro ao enviar imagem', 'error'); return null
    }
  }

  async function deleteAsset(url: string) {
    if (!url || url.startsWith('data:') || !url.includes('overlay-assets')) return
    await fetch('/api/overlay-asset', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }).catch(() => {})
  }

  useEffect(() => {
    setLoaded(false)
    fetch('/api/me').then(r => r.json()).then(d => {
      if (!d?.id) { setLoaded(true); return }
      setUid(d.id)
      fetch(`/api/overlay-config/${cfgKey}?uid=${d.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(c => {
          const resolved = c?.style ? { ...slugDefault, ...c.style } : slugDefault
          setCfg(resolved)
          lastSavedRef.current = JSON.stringify(resolved)
        })
        .catch(() => {})
        .finally(() => setLoaded(true))
    }).catch(() => setLoaded(true))
  }, [cfgKey, slugDefault])

  useEffect(() => {
    if (!loaded || !uid) return
    const json = JSON.stringify(cfg)
    if (json === lastSavedRef.current) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setAutoSaving(true)
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/overlay-config/${cfgKey}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ style: cfg }),
        })
        lastSavedRef.current = JSON.stringify(cfg)
      } catch {}
      setAutoSaving(false)
    }, 1500)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [cfg, loaded, uid, cfgKey])

  useEffect(() => {
    if (tab !== 'efeitos') return
    setAnimKey(k => k + 1)
    const iv = setInterval(() => setAnimKey(k => k + 1), 3500)
    return () => clearInterval(iv)
  }, [tab, cfg.animIn, cfg.animSpeed])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const overlayUrl = uid ? `${origin}/overlay/alert?uid=${uid}${slug ? `&event=${slug}` : ''}` : '...'
  const unifiedUrl = uid ? `${origin}/overlay/alert?uid=${uid}` : '...'
  function up<K extends keyof OvCfg>(k: K, v: OvCfg[K]) { setCfg(p => ({ ...p, [k]: v })) }

  async function saveCfg() {
    if (autoSaveTimer.current) { clearTimeout(autoSaveTimer.current); autoSaveTimer.current = null }
    try {
      const r = await fetch(`/api/overlay-config/${cfgKey}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: cfg }),
      })
      if (!r.ok) { notify('Erro ao salvar overlay', 'error'); return }
      lastSavedRef.current = JSON.stringify(cfg)
      setAutoSaving(false)
    } catch { notify('Erro ao salvar overlay', 'error'); return }
    setSavedOk(true); notify('Overlay salvo!', 'success')
    setTimeout(() => setSavedOk(false), 2500)
  }

  async function testOverlay() {
    if (testing) return
    setTesting(true)
    setAnimKey(k => k + 1)
    try {
      const r = await fetch('/api/comandos/testar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resposta, eventSlug: slug }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) { notify(data?.error ?? 'Erro ao testar', 'error'); setTesting(false); return }
      const errs: string[] = data.errors ?? []
      const overlayErr = errs.find(e => e.startsWith('overlay_failed'))
      if (errs.includes('no_token')) {
        notify('Token Twitch não encontrado — reconecte em Plataformas', 'error')
      } else if (errs.includes('token_expired')) {
        notify('Token expirado — acesse Plataformas para reconectar', 'error')
      } else if (overlayErr) {
        notify('Chat enviado! Overlay: ' + overlayErr.replace('overlay_failed: ', ''), 'error')
      } else {
        setTestOk(true)
        notify('Teste enviado! Chat + overlay disparados.', 'success')
        setTimeout(() => setTestOk(false), 5000)
      }
    } catch { notify('Erro de conexão ao testar', 'error') }
    setTesting(false)
  }

  function copyUrl() {
    navigator.clipboard.writeText(overlayUrl).catch(() => {})
    setCopied(true); notify('URL copiada!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const P = '#9b30ff', PBg = 'rgba(155,48,255,0.1)', PB = 'rgba(155,48,255,0.25)'
  const BD = 'rgba(255,255,255,0.07)', DIM = 'rgba(232,230,248,0.28)', MUT = 'rgba(232,230,248,0.55)'
  const GR = '#22c55e', TXT = '#e8e6f8'

  const TABS = [
    { id: 'efeitos', label: '✨ Efeitos' },
    { id: 'estilo',  label: '🎨 Estilo'  },
    { id: 'texto',   label: '✏️ Texto'   },
  ] as const

  return (
    <div style={{ marginTop: '1rem' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&family=Roboto:wght@400;700&family=Montserrat:wght@400;800&family=Poppins:wght@400;700&family=Rajdhani:wght@600;700&display=swap');`}</style>

      {/* URL bar — unified (recommended for OBS) */}
      <div style={{ marginBottom:'0.5rem' }}>
        <div style={{ fontSize:'0.65rem',color:GR,fontWeight:700,marginBottom:'0.2rem',textTransform:'uppercase',letterSpacing:'0.5px' }}>
          ✅ URL para o OBS (todos os eventos)
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:'0.5rem',background:'#08090d',border:`1px solid rgba(34,197,94,0.35)`,borderRadius:8,padding:'0.45rem 0.7rem' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          <span style={{ flex:1,fontSize:'0.7rem',color:'rgba(34,197,94,0.9)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'monospace' }}>{unifiedUrl}</span>
          <button type="button" onClick={() => { navigator.clipboard.writeText(unifiedUrl).catch(()=>{}); setCopied(true); notify('URL copiada!','success'); setTimeout(()=>setCopied(false),2000) }} style={{ flexShrink:0,padding:'0.22rem 0.6rem',background:copied?'rgba(34,197,94,0.15)':'rgba(34,197,94,0.08)',border:`1px solid rgba(34,197,94,0.3)`,borderRadius:5,color:GR,fontSize:'0.7rem',fontWeight:700,cursor:'pointer' }}>
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
        <div style={{ fontSize:'0.62rem',color:DIM,marginTop:'0.2rem' }}>Use esta URL no OBS — mostra alertas de todos os eventos em uma única fonte.</div>
      </div>

      {/* URL bar — this event only */}
      <div style={{ marginBottom:'0.85rem' }}>
        <div style={{ fontSize:'0.65rem',color:DIM,fontWeight:600,marginBottom:'0.2rem',textTransform:'uppercase',letterSpacing:'0.5px' }}>
          Somente este evento
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:'0.5rem',background:'#08090d',border:`1px solid ${PB}`,borderRadius:8,padding:'0.45rem 0.7rem' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          <span style={{ flex:1,fontSize:'0.7rem',color:MUT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'monospace' }}>{overlayUrl}</span>
        </div>
      </div>

      {/* Grid: config | preview */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem' }}>
        {/* Config */}
        <div>
          <div style={{ display:'flex',gap:'0.2rem',background:'#08090d',border:`1px solid ${BD}`,borderRadius:7,padding:'0.18rem',marginBottom:'0.6rem' }}>
            {TABS.map(t => (
              <button type="button" key={t.id} onClick={() => setTab(t.id)} style={{ flex:1,padding:'0.32rem 0.15rem',background:tab===t.id?C_DARK.card:'transparent',border:`1px solid ${tab===t.id?BD:'transparent'}`,borderRadius:5,color:tab===t.id?TXT:DIM,cursor:'pointer',fontSize:'0.68rem',fontWeight:tab===t.id?700:400,transition:'all 0.12s',whiteSpace:'nowrap' }}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'efeitos' && (
            <div>
              <div style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'0.4rem' }}>Animação de entrada</div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.22rem',marginBottom:'0.65rem' }}>
                {OV_ANIMS.map(a => (
                  <button type="button" key={a.id} onClick={() => { up('animIn',a.id); setAnimKey(k=>k+1) }} style={{
                    display:'flex',flexDirection:'column',alignItems:'center',gap:'0.1rem',
                    padding:'0.3rem 0.08rem',
                    background:cfg.animIn===a.id?PBg:'rgba(255,255,255,0.02)',
                    border:`1px solid ${cfg.animIn===a.id?PB:BD}`,
                    borderRadius:5,color:cfg.animIn===a.id?P:DIM,
                    cursor:'pointer',fontSize:'0.72rem',fontWeight:cfg.animIn===a.id?700:400,
                  }}>
                    <span style={{ lineHeight:1.2,textAlign:'center' }}>{a.label}</span>
                    <span style={{ fontSize:'0.6rem',opacity:0.5 }}>{a.dur}</span>
                  </button>
                ))}
              </div>
              <div style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'0.4rem' }}>Animação de saída</div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.22rem',marginBottom:'0.65rem' }}>
                {OV_EXIT_ANIMS.map(a => (
                  <button type="button" key={a.id} onClick={() => { up('animOut',a.id); setAnimKey(k=>k+1) }} style={{
                    padding:'0.3rem 0.08rem',
                    background:(cfg.animOut??'fade')===a.id?PBg:'rgba(255,255,255,0.02)',
                    border:`1px solid ${(cfg.animOut??'fade')===a.id?PB:BD}`,
                    borderRadius:5,color:(cfg.animOut??'fade')===a.id?P:DIM,
                    cursor:'pointer',fontSize:'0.72rem',fontWeight:(cfg.animOut??'fade')===a.id?700:400,
                  }}>
                    {a.label}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:'0.45rem' }}>
                <div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'0.2rem' }}>
                    <span style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em' }}>Velocidade do efeito</span>
                    <span style={{ fontSize:'0.65rem',color:MUT,fontWeight:700 }}>{cfg.animSpeed < 4 ? 'Lento' : cfg.animSpeed < 7 ? 'Normal' : 'Rápido'} ({cfg.animSpeed})</span>
                  </div>
                  <input type="range" min={1} max={10} value={cfg.animSpeed} onChange={e => { up('animSpeed',Number(e.target.value)); setAnimKey(k=>k+1) }} style={{ width:'100%',accentColor:P,cursor:'pointer' }} />
                  <div style={{ display:'flex',justifyContent:'space-between',marginTop:'0.12rem' }}>
                    <span style={{ fontSize:'0.58rem',color:DIM }}>Mais lento</span>
                    <span style={{ fontSize:'0.58rem',color:DIM }}>Mais rápido</span>
                  </div>
                </div>
                <div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'0.2rem' }}>
                    <span style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em' }}>Duração exibição</span>
                    <span style={{ fontSize:'0.65rem',color:MUT,fontWeight:700 }}>{cfg.duration}s</span>
                  </div>
                  <input type="range" min={2} max={20} value={cfg.duration} onChange={e => up('duration',Number(e.target.value))} style={{ width:'100%',accentColor:P,cursor:'pointer' }} />
                </div>
              </div>
              {/* Sound */}
              <div style={{ borderTop:`1px solid ${BD}`,paddingTop:'0.55rem' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.4rem' }}>
                  <span style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em' }}>🔔 Som do alerta</span>
                  <Toggle on={cfg.soundEnabled} onChange={v => up('soundEnabled',v)} size="sm" />
                </div>
                {cfg.soundEnabled && (
                  <div style={{ display:'flex',flexDirection:'column',gap:'0.45rem' }}>
                    {/* Volume */}
                    <div>
                      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'0.15rem' }}>
                        <span style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em' }}>Volume</span>
                        <span style={{ fontSize:'0.65rem',color:MUT,fontWeight:700 }}>{cfg.soundVolume}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={cfg.soundVolume} onChange={e => up('soundVolume',Number(e.target.value))} style={{ width:'100%',accentColor:P,cursor:'pointer' }} />
                    </div>
                    {/* File upload */}
                    <div>
                      <div style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.22rem' }}>Arquivo de som (MP3/WAV/OGG)</div>
                      <div style={{ display:'flex',alignItems:'center',gap:'0.4rem' }}>
                        <label style={{ flexShrink:0,padding:'0.38rem 0.7rem',background:cfg.soundDataUrl?'rgba(34,197,94,0.1)':PBg,border:`1px solid ${cfg.soundDataUrl?'rgba(34,197,94,0.3)':PB}`,borderRadius:6,color:cfg.soundDataUrl?'#22c55e':P,cursor:'pointer',fontSize:'0.7rem',fontWeight:700 }}>
                          {cfg.soundDataUrl ? '✓ Arquivo carregado' : '📂 Escolher arquivo'}
                          <input type="file" accept="audio/*" style={{ display:'none' }} onChange={e => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (file.size > 3 * 1024 * 1024) { notify('Arquivo muito grande (máx 3 MB)', 'error'); return }
                            const reader = new FileReader()
                            reader.onload = () => { up('soundDataUrl', reader.result as string) }
                            reader.readAsDataURL(file)
                          }} />
                        </label>
                        {cfg.soundDataUrl && (
                          <button type="button" onClick={() => up('soundDataUrl','')} style={{ padding:'0.38rem 0.55rem',background:'rgba(255,255,255,0.04)',border:`1px solid ${BD}`,borderRadius:6,color:DIM,cursor:'pointer',fontSize:'0.7rem' }}>✕ Remover</button>
                        )}
                        <button type="button" onClick={() => {
                          playAlertSound(slug || null, { soundEnabled:true, soundDataUrl:cfg.soundDataUrl, soundVolume:cfg.soundVolume })
                        }} style={{ flexShrink:0,padding:'0.38rem 0.7rem',background:PBg,border:`1px solid ${PB}`,borderRadius:6,color:P,cursor:'pointer',fontSize:'0.7rem',fontWeight:700 }}>
                          🔊 Testar
                        </button>
                      </div>
                      <div style={{ fontSize:'0.6rem',color:DIM,marginTop:'0.18rem' }}>Máx 3 MB. Fica armazenado junto com o overlay.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'estilo' && (
            <div style={{ display:'flex',flexDirection:'column',gap:'0.55rem' }}>
              {/* Predefined presets */}
              <div>
                <div style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.28rem' }}>Estilo pré-definido</div>
                <div style={{ display:'flex',gap:'0.3rem',overflowX:'auto',paddingBottom:'0.1rem' }}>
                  {OV_PRESETS.map(pr => (
                    <button type="button" key={pr.id}
                      onClick={() => { setCfg(prev => ({ ...prev, ...pr.cfg })); setAnimKey(k => k + 1) }}
                      style={{ flexShrink:0,padding:'0.32rem 0.65rem',background:`${pr.color}15`,border:`1px solid ${pr.color}40`,borderRadius:6,color:pr.color,cursor:'pointer',fontSize:'0.7rem',fontWeight:700,whiteSpace:'nowrap',transition:'border-color 0.12s' }}>
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Icon shape */}
              <div>
                <div style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.28rem' }}>Ícone lateral</div>
                <div style={{ display:'flex',gap:'0.3rem' }}>
                  {([['circle','○ Círculo'],['square','□ Quadrado'],['none','✕ Sem ícone']] as [OvCfg['iconShape'],string][]).map(([v,lbl]) => (
                    <button type="button" key={v} onClick={() => up('iconShape',v)} style={{ flex:1,padding:'0.32rem 0.1rem',background:cfg.iconShape===v?PBg:'rgba(255,255,255,0.02)',border:`1px solid ${cfg.iconShape===v?PB:BD}`,borderRadius:5,color:cfg.iconShape===v?P:DIM,cursor:'pointer',fontSize:'0.67rem',fontWeight:cfg.iconShape===v?700:400 }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              {/* Icon emoji / image picker */}
              {cfg.iconShape !== 'none' && (
                <div>
                  <div style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.28rem' }}>Emoji / Imagem do ícone</div>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:'0.2rem',marginBottom:'0.35rem' }}>
                    {/* Default option */}
                    <button type="button" onClick={() => up('icon','')}
                      style={{ width:34,height:34,borderRadius:6,border:`2px solid ${!cfg.icon?PB:BD}`,background:!cfg.icon?PBg:'rgba(255,255,255,0.02)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',color:!cfg.icon?P:DIM,fontWeight:700 }}>
                      padrão
                    </button>
                    {['⭐','🌟','💫','✨','❤️','🧡','💛','💚','💙','💜','🤍','🔥','⚡','💎','💰','💸','🎁','🏆','🎯','🎮','🕹️','👾','🎉','🎊','👑','🦁','🐉','🦊','🐺','🦋','🌊','💥','🚀','🎵','🎸','🥳','🔔','📢'].map(e => (
                      <button type="button" key={e} onClick={() => up('icon', e)}
                        style={{ width:34,height:34,borderRadius:6,border:`2px solid ${cfg.icon===e?PB:BD}`,background:cfg.icon===e?PBg:'rgba(255,255,255,0.02)',cursor:'pointer',fontSize:'1.1rem',display:'flex',alignItems:'center',justifyContent:'center',transition:'border-color 0.08s' }}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:'flex',gap:'0.4rem',alignItems:'center' }}>
                    {/* Custom emoji input — only when no image uploaded */}
                    {!cfg.icon?.startsWith('http') && (
                      <input
                        value={cfg.icon && !cfg.icon.startsWith('http') ? cfg.icon : ''}
                        onChange={e => up('icon', e.target.value.slice(0,8))}
                        placeholder="Emoji"
                        style={{ ...inp, width:80, fontSize:'1rem', padding:'0.32rem 0.5rem', textAlign:'center' }}
                      />
                    )}
                    {cfg.icon?.startsWith('http') && (
                      <img src={cfg.icon} alt="" style={{ width:34,height:34,borderRadius:6,objectFit:'cover',border:`1px solid ${P}` }} />
                    )}
                    {/* Image/GIF upload via Storage */}
                    <label style={{ flexShrink:0,padding:'0.35rem 0.65rem',background:cfg.icon?.startsWith('http')?'rgba(34,197,94,0.1)':PBg,border:`1px solid ${cfg.icon?.startsWith('http')?'rgba(34,197,94,0.3)':PB}`,borderRadius:6,color:cfg.icon?.startsWith('http')?'#22c55e':P,cursor:iconUploading?'wait':'pointer',fontSize:'0.7rem',fontWeight:700,whiteSpace:'nowrap' }}>
                      {iconUploading ? 'Enviando...' : cfg.icon?.startsWith('http') ? '✓ Imagem' : '🖼 Imagem/GIF'}
                      <input type="file" accept="image/*" style={{ display:'none' }} disabled={iconUploading} onChange={async e => {
                        const file = e.target.files?.[0]; e.target.value = ''
                        if (!file) return
                        if (file.size > 4 * 1024 * 1024) { notify('Imagem muito grande (máx 4 MB)', 'error'); return }
                        setIconUploading(true)
                        const oldUrl = cfg.icon
                        const url = await uploadAsset(file, 'icon')
                        if (url) { up('icon', url); if (oldUrl) deleteAsset(oldUrl) }
                        setIconUploading(false)
                      }} />
                    </label>
                    {cfg.icon && (
                      <button type="button" onClick={() => { deleteAsset(cfg.icon); up('icon','') }}
                        style={{ padding:'0.35rem 0.55rem',background:'rgba(255,255,255,0.03)',border:`1px solid ${BD}`,borderRadius:6,color:DIM,cursor:'pointer',fontSize:'0.7rem' }}>
                        ✕
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize:'0.6rem',color:DIM,marginTop:'0.18rem' }}>PNG/JPG/GIF até 4 MB. GIFs animados funcionam no OBS.</div>
                </div>
              )}
              {/* Icon animation */}
              {cfg.iconShape !== 'none' && (
                <div>
                  <div style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.28rem' }}>Animação do ícone</div>
                  <div style={{ display:'flex',gap:'0.3rem' }}>
                    {([['none','Estático'],['pulse','Pulso'],['spin','Girar'],['bounce','Saltar'],['shake','Tremer']] as [OvCfg['iconAnim'],string][]).map(([v,lbl]) => (
                      <button type="button" key={v} onClick={() => up('iconAnim',v)} style={{ flex:1,padding:'0.3rem 0.05rem',background:cfg.iconAnim===v?PBg:'rgba(255,255,255,0.02)',border:`1px solid ${cfg.iconAnim===v?PB:BD}`,borderRadius:5,color:cfg.iconAnim===v?P:DIM,cursor:'pointer',fontSize:'0.63rem',fontWeight:cfg.iconAnim===v?700:400,whiteSpace:'nowrap' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Card effect */}
              <div>
                <div style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.28rem' }}>Efeito do balão</div>
                <div style={{ display:'flex',gap:'0.3rem' }}>
                  {([['none','Nenhum'],['glow','✦ Brilho'],['pulse','◉ Pulso']] as [OvCfg['cardEffect'],string][]).map(([v,lbl]) => (
                    <button type="button" key={v} onClick={() => up('cardEffect',v)} style={{ flex:1,padding:'0.32rem 0.1rem',background:cfg.cardEffect===v?PBg:'rgba(255,255,255,0.02)',border:`1px solid ${cfg.cardEffect===v?PB:BD}`,borderRadius:5,color:cfg.cardEffect===v?P:DIM,cursor:'pointer',fontSize:'0.68rem',fontWeight:cfg.cardEffect===v?700:400 }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              {/* Custom art — replaces entire card */}
              <div style={{ borderTop:`1px solid ${BD}`,paddingTop:'0.6rem' }}>
                <div style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.18rem' }}>Arte completa (substitui o balão)</div>
                <div style={{ fontSize:'0.6rem',color:DIM,marginBottom:'0.35rem' }}>Use uma imagem/GIF personalizada que substitui todo o visual do alerta no OBS.</div>
                {cfg.customArt && (
                  <img src={cfg.customArt} alt="Arte" style={{ width:'100%',maxHeight:80,objectFit:'contain',borderRadius:6,border:`1px solid ${P}`,marginBottom:'0.35rem',background:'#000' }} />
                )}
                <div style={{ display:'flex',gap:'0.4rem' }}>
                  <label style={{ flex:1,padding:'0.38rem',background:cfg.customArt?'rgba(34,197,94,0.1)':PBg,border:`1px solid ${cfg.customArt?'rgba(34,197,94,0.3)':PB}`,borderRadius:6,color:cfg.customArt?'#22c55e':P,cursor:artUploading?'wait':'pointer',fontSize:'0.7rem',fontWeight:700,textAlign:'center' }}>
                    {artUploading ? 'Enviando...' : cfg.customArt ? '✓ Arte carregada — trocar' : '🖼 Enviar arte (PNG/GIF)'}
                    <input type="file" accept="image/*" style={{ display:'none' }} disabled={artUploading} onChange={async e => {
                      const file = e.target.files?.[0]; e.target.value = ''
                      if (!file) return
                      if (file.size > 4 * 1024 * 1024) { notify('Imagem muito grande (máx 4 MB)', 'error'); return }
                      setArtUploading(true)
                      const oldUrl = cfg.customArt
                      const url = await uploadAsset(file, 'art')
                      if (url) { up('customArt', url); if (oldUrl) deleteAsset(oldUrl) }
                      setArtUploading(false)
                    }} />
                  </label>
                  {cfg.customArt && (
                    <button type="button" onClick={() => { deleteAsset(cfg.customArt); up('customArt','') }}
                      style={{ padding:'0.38rem 0.65rem',background:'rgba(255,255,255,0.03)',border:`1px solid ${BD}`,borderRadius:6,color:DIM,cursor:'pointer',fontSize:'0.7rem' }}>
                      ✕ Remover
                    </button>
                  )}
                </div>
              </div>
              {/* Colors */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.45rem' }}>
                <ColorPicker label="Cor principal" value={cfg.timerColor} onChange={v => up('timerColor',v)} />
                <ColorPicker label="Texto"         value={cfg.textColor}  onChange={v => up('textColor',v)} />
                <ColorPicker label="Fundo"         value={cfg.bgColor}    onChange={v => up('bgColor',v)} />
                <ColorPicker label="Borda"         value={cfg.borderColor} onChange={v => up('borderColor',v)} />
              </div>
              {/* Opacity */}
              <div>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'0.18rem' }}>
                  <span style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em' }}>Opacidade fundo</span>
                  <span style={{ fontSize:'0.65rem',color:MUT,fontWeight:700 }}>{Math.round(cfg.bgOpacity*100)}%</span>
                </div>
                <input type="range" min={0} max={100} value={Math.round(cfg.bgOpacity*100)} onChange={e => up('bgOpacity',Number(e.target.value)/100)} style={{ width:'100%',accentColor:P,cursor:'pointer' }} />
              </div>
              {/* Font + border radius */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.45rem' }}>
                <div>
                  <div style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.18rem' }}>Fonte</div>
                  <select value={cfg.font} onChange={e => up('font',e.target.value)} style={{ width:'100%',background:'#08090d',border:`1px solid ${BD}`,borderRadius:5,padding:'0.3rem 0.45rem',color:TXT,fontSize:'0.75rem',outline:'none' }}>
                    {OV_FONTS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'0.18rem' }}>
                    <span style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em' }}>Raio</span>
                    <span style={{ fontSize:'0.65rem',color:MUT }}>{cfg.borderRadius}px</span>
                  </div>
                  <input type="range" min={0} max={30} value={cfg.borderRadius} onChange={e => up('borderRadius',Number(e.target.value))} style={{ width:'100%',accentColor:P,cursor:'pointer',marginTop:'0.28rem' }} />
                </div>
              </div>
              {/* Text sizes */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.45rem' }}>
                <div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'0.18rem' }}>
                    <span style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em' }}>Tam. título</span>
                    <span style={{ fontSize:'0.65rem',color:MUT }}>{cfg.titleSize}px</span>
                  </div>
                  <input type="range" min={8} max={36} value={cfg.titleSize} onChange={e => up('titleSize',Number(e.target.value))} style={{ width:'100%',accentColor:P,cursor:'pointer' }} />
                </div>
                <div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'0.18rem' }}>
                    <span style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em' }}>Tam. subtítulo</span>
                    <span style={{ fontSize:'0.65rem',color:MUT }}>{cfg.supportSize}px</span>
                  </div>
                  <input type="range" min={7} max={30} value={cfg.supportSize} onChange={e => up('supportSize',Number(e.target.value))} style={{ width:'100%',accentColor:P,cursor:'pointer' }} />
                </div>
              </div>
              {/* Border toggle + thickness */}
              <div style={{ display:'grid',gridTemplateColumns:'auto 1fr',gap:'0.45rem',alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.28rem' }}>Borda</div>
                  <div style={{ display:'flex',gap:'0.25rem' }}>
                    <button type="button" onClick={() => up('border',true)}  style={{ padding:'0.28rem 0.6rem',background:cfg.border?PBg:'rgba(255,255,255,0.02)',border:`1px solid ${cfg.border?PB:BD}`,borderRadius:5,color:cfg.border?P:DIM,cursor:'pointer',fontSize:'0.68rem',fontWeight:cfg.border?700:400 }}>Ligado</button>
                    <button type="button" onClick={() => up('border',false)} style={{ padding:'0.28rem 0.6rem',background:!cfg.border?PBg:'rgba(255,255,255,0.02)',border:`1px solid ${!cfg.border?PB:BD}`,borderRadius:5,color:!cfg.border?P:DIM,cursor:'pointer',fontSize:'0.68rem',fontWeight:!cfg.border?700:400 }}>Desligado</button>
                  </div>
                </div>
                {cfg.border && (
                  <div>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'0.18rem' }}>
                      <span style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em' }}>Espessura</span>
                      <span style={{ fontSize:'0.65rem',color:MUT }}>{cfg.borderThick}px</span>
                    </div>
                    <input type="range" min={1} max={6} value={cfg.borderThick} onChange={e => up('borderThick',Number(e.target.value))} style={{ width:'100%',accentColor:P,cursor:'pointer',marginTop:'0.28rem' }} />
                  </div>
                )}
              </div>
              {/* Width */}
              <div>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'0.18rem' }}>
                  <span style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em' }}>Largura do alerta</span>
                  <span style={{ fontSize:'0.65rem',color:MUT }}>{cfg.width}px</span>
                </div>
                <input type="range" min={260} max={700} step={10} value={cfg.width} onChange={e => up('width',Number(e.target.value))} style={{ width:'100%',accentColor:P,cursor:'pointer' }} />
              </div>
            </div>
          )}

          {tab === 'texto' && (
            <div style={{ display:'flex',flexDirection:'column',gap:'0.5rem' }}>
              <div>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.22rem' }}>
                  <span style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em' }}>Título</span>
                  {cfg.titleText && <button type="button" onClick={() => up('titleText','')} style={{ fontSize:'0.6rem',color:DIM,background:'none',border:'none',cursor:'pointer',padding:0 }}>↺ limpar</button>}
                </div>
                <input value={cfg.titleText} onChange={e => up('titleText', e.target.value)} placeholder="Ex: Novo inscrito!" style={{ ...inp, fontSize:'0.8rem', padding:'0.5rem 0.75rem' }} />
              </div>
              <div>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.22rem' }}>
                  <span style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.06em' }}>Subtítulo</span>
                  {cfg.subtitleText && <button type="button" onClick={() => up('subtitleText','')} style={{ fontSize:'0.6rem',color:DIM,background:'none',border:'none',cursor:'pointer',padding:0 }}>↺ limpar</button>}
                </div>
                <input value={cfg.subtitleText} onChange={e => up('subtitleText', e.target.value)} placeholder="Ex: $user se inscreveu!" style={{ ...inp, fontSize:'0.8rem', padding:'0.5rem 0.75rem' }} />
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.45rem' }}>
                <ColorPicker label="Cor do título"    value={cfg.titleColor}    onChange={v => up('titleColor',v)} />
                <ColorPicker label="Cor do subtítulo" value={cfg.subtitleColor} onChange={v => up('subtitleColor',v)} />
              </div>
              <button type="button" onClick={() => setCfg(p => ({ ...p, titleText: slugDefault.titleText, subtitleText: slugDefault.subtitleText, titleColor: slugDefault.titleColor, subtitleColor: slugDefault.subtitleColor }))} style={{ padding:'0.35rem',background:'rgba(255,255,255,0.03)',border:`1px solid ${BD}`,borderRadius:6,color:DIM,fontSize:'0.7rem',cursor:'pointer' }}>
                ↺ Restaurar padrão
              </button>
              <div style={{ fontSize:'0.66rem',color:DIM,background:'rgba(155,48,255,0.06)',border:'1px solid rgba(155,48,255,0.15)',borderRadius:6,padding:'0.4rem 0.6rem',lineHeight:1.5 }}>
                Deixe em branco para usar o texto padrão do evento. Use <span style={{ color:MUT,fontFamily:'monospace' }}>$user</span>, <span style={{ color:MUT,fontFamily:'monospace' }}>$valor</span> etc.
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div style={{ display:'flex',flexDirection:'column',gap:'0.5rem' }}>
          <div style={{ fontSize:'0.65rem',fontWeight:700,color:DIM,textTransform:'uppercase',letterSpacing:'0.07em' }}>Prévia ao vivo</div>
          <div style={{ flex:1,background:'#08090d',border:`1px solid ${BD}`,borderRadius:7,padding:'0.85rem',display:'flex',alignItems:'center',justifyContent:'center',minHeight:80 }}>
            <OvPreview cfg={cfg} animKey={animKey} slug={slug} showAnim={tab === 'efeitos'} />
          </div>
          <div style={{ fontSize:'0.65rem',color:'rgba(251,146,60,0.75)',background:'rgba(251,146,60,0.06)',border:'1px solid rgba(251,146,60,0.18)',borderRadius:5,padding:'0.38rem 0.55rem',lineHeight:1.4 }}>
            Ative &quot;Permitir transparência&quot; no Browser Source do OBS.
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display:'flex',gap:'0.55rem',marginTop:'0.85rem' }}>
        <button type="button" onClick={testOverlay} disabled={testing} style={{
          flex:1,padding:'0.5rem',
          background:testOk?'rgba(34,197,94,0.1)':'rgba(255,255,255,0.04)',
          border:`1px solid ${testOk?'rgba(34,197,94,0.3)':BD}`,
          borderRadius:7,color:testOk?GR:MUT,fontSize:'0.78rem',fontWeight:700,cursor:testing?'default':'pointer',
        }}>
          {testing ? 'Enviando...' : testOk ? '✓ Enviado! Veja o chat e o OBS' : '🧪 Testar (chat + OBS)'}
        </button>
        <button type="button" onClick={saveCfg} style={{
          flex:1,padding:'0.5rem',
          background:savedOk?'rgba(34,197,94,0.1)':PBg,
          border:`1px solid ${savedOk?'rgba(34,197,94,0.3)':PB}`,
          borderRadius:7,color:savedOk?GR:P,fontSize:'0.78rem',fontWeight:700,cursor:'pointer',
        }}>
          {savedOk ? '✓ Salvo!' : '💾 Salvar agora'}
        </button>
      </div>
      <div style={{ fontSize:'0.62rem',color:DIM,marginTop:'0.35rem',lineHeight:1.4,textAlign:'center' }}>
        {autoSaving ? '⏳ Salvando automaticamente...' : '✓ Salvo — OBS atualiza em até 15s'}
      </div>
    </div>
  )
}

export default function ComandosPage() {
  const [isDark, setIsDark] = useState(true)
  useEffect(() => { try { setIsDark(localStorage.getItem('sk-theme') !== 'light') } catch {} }, [])
  const C = isDark ? C_DARK : C_LIGHT

  const [cmds, setCmds]           = useState<Cmd[]>(DEFAULTS)
  const [creating, setCreating]   = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [botOn, setBotOn]         = useState(false)
  const [search, setSearch]       = useState('')
  const [form, setForm]           = useState<FormState>(emptyForm)
  const [advOpen, setAdvOpen]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saveErr, setSaveErr]     = useState('')
  const [saveOk, setSaveOk]       = useState(false)
  const [userId, setUserId]       = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [overlayModal, setOverlayModal] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [cmdOrder, setCmdOrder]   = useState<string[]>([])
  const [orderDirty, setOrderDirty] = useState(false)
  const [orderSaving, setOrderSaving] = useState(false)

  type DbRow = { id: string; trigger: string; resposta: string; cooldown_s: number; habilitado: boolean; permissao: string; platform: string; notif_overlay: boolean }

  // Merge DB rows into cmds state (called on load and after every save)
  const applyDbRows = useCallback((rows: DbRow[], dbByTrigger: Map<string, DbRow>) => {
    const dbRegular = rows.filter(r => !isEventTrigger(r.trigger))
    const mergedDefaults = DEFAULTS.map(def => {
      const db = dbByTrigger.get(def.trigger)
      if (db) return { ...def, id: db.id, resposta: db.resposta, cooldown: db.cooldown_s, habilitado: db.habilitado, notifOverlay: db.notif_overlay ?? false, db: true }
      return def
    })
    const regularCmds: Cmd[] = dbRegular.map(r => ({
      id: r.id, label: '!' + r.trigger, trigger: '!' + r.trigger, resposta: r.resposta,
      cooldown: r.cooldown_s, habilitado: r.habilitado, notifOverlay: r.notif_overlay ?? false,
      isEvento: false, origem: r.permissao ?? 'todos', platform: r.platform ?? 'Twitch', db: true,
    }))
    setCmds([...mergedDefaults, ...regularCmds])
  }, [])

  // Reload commands from server (no seeding) — called after save to sync state with DB
  const reloadFromDB = useCallback(async () => {
    const rows: DbRow[] = await fetch('/api/comandos').then(r => r.ok ? r.json() : []).catch(() => [])
    const dbEvents = rows.filter(r => isEventTrigger(r.trigger))
    const dbByTrigger = new Map<string, DbRow>(dbEvents.map(r => [r.trigger, r]))
    applyDbRows(rows, dbByTrigger)
  }, [applyDbRows])

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(u => { if (u?.id) setUserId(u.id) }).catch(() => {})
    fetch('/api/comandos/order').then(r => r.ok ? r.json() : null).then(d => { if (d?.order?.length) setCmdOrder(d.order) }).catch(() => {})
    // One-time migration: disable all commands for existing users
    try {
      if (!localStorage.getItem('sk-cmds-disabled-v1')) {
        fetch('/api/comandos/reset', { method: 'POST' }).then(r => {
          if (r.ok) localStorage.setItem('sk-cmds-disabled-v1', '1')
        }).catch(() => {})
      }
    } catch {}
  }, [])

  useEffect(() => {
    async function loadAndSeed() {
      const rows: DbRow[] = await fetch('/api/comandos').then(r => r.ok ? r.json() : []).catch(() => [])
      const dbEvents  = rows.filter(r => isEventTrigger(r.trigger))
      const dbByTrigger = new Map<string, DbRow>(dbEvents.map(r => [r.trigger, r]))

      // Seed any default events not yet in DB so fireEventCommand can find them
      const missing = DEFAULTS.filter(d => !dbByTrigger.has(d.trigger))
      const seeded = await Promise.all(missing.map(def =>
        fetch('/api/comandos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trigger: def.trigger, resposta: def.resposta, cooldown_s: def.cooldown, habilitado: true, permissao: 'todos', platform: def.platform, notif_overlay: true }),
        }).then(r => r.ok ? r.json() as Promise<DbRow> : null).catch(() => null)
      ))

      // One-time migration: enable notif_overlay AND habilitado for all existing event rows
      try {
        if (!localStorage.getItem('sk-notif-overlay-v1')) {
          await Promise.all(dbEvents.map(r =>
            fetch(`/api/comandos?id=${r.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notif_overlay: true, habilitado: true }),
            }).catch(() => {})
          ))
          dbEvents.forEach(r => { r.notif_overlay = true; r.habilitado = true })
          localStorage.setItem('sk-notif-overlay-v1', '1')
        }
      } catch {}

      // One-time migration: copy Sub Twitch overlay config to all other events that have no config yet
      try {
        if (!localStorage.getItem('sk-overlay-cfg-copy-v1')) {
          const meRes = await fetch('/api/me')
          const me = meRes.ok ? await meRes.json() : null
          if (me?.id) {
            const subCfgRes = await fetch(`/api/overlay-config/alert-twitch-sub?uid=${me.id}`)
            const subCfg = subCfgRes.ok ? await subCfgRes.json() : null
            if (subCfg?.style) {
              const base = subCfg.style
              const uniqueSlugs = [...new Set(Object.values(TRIGGER_TO_SLUG))].filter(s => s !== 'twitch-sub')
              await Promise.all(uniqueSlugs.map(async slug => {
                const existRes = await fetch(`/api/overlay-config/alert-${slug}?uid=${me.id}`)
                const existCfg = existRes.ok ? await existRes.json() : null
                if (!existCfg?.style) {
                  const preset = SLUG_PRESETS[slug] ?? {}
                  await fetch(`/api/overlay-config/alert-${slug}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ style: { ...base, ...preset } }),
                  }).catch(() => {})
                }
              }))
            }
          }
          localStorage.setItem('sk-overlay-cfg-copy-v1', '1')
        }
      } catch {}

      for (const s of seeded) { if (s) dbByTrigger.set(s.trigger, s) }
      applyDbRows(rows.concat(seeded.filter((s): s is DbRow => s !== null && !dbEvents.some(e => e.trigger === s.trigger))), dbByTrigger)
    }

    loadAndSeed()
  }, [applyDbRows])

  function insertVar(v: string) {
    const ta = taRef.current
    if (!ta) { setForm(p => ({ ...p, resposta: p.resposta + v })); return }
    const s = ta.selectionStart, e = ta.selectionEnd
    const next = form.resposta.slice(0, s) + v + form.resposta.slice(e)
    setForm(p => ({ ...p, resposta: next }))
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = s + v.length }, 0)
  }

  function selectTemplate(tpl: Tpl) {
    setAdvOpen(false)
    setForm({ trigger: tpl.trigger, isEvento: false, eventoLabel: '', resposta: tpl.resposta, cooldown: tpl.cooldown, cooldownUser: 0, custoBase: 0, custoInscritos: 0, ativo: true, permissao: tpl.permissao, responderComo: 'canal', notifOverlay: false, template: tpl.id, extraVars: tpl.extraVars ?? [], platforms: ['Twitch'] })
  }

  function startEdit(cmd: Cmd) {
    setEditingId(cmd.id)
    const trigger = cmd.isEvento ? cmd.trigger : cmd.trigger.replace(/^!/, '')
    setForm({
      trigger, isEvento: cmd.isEvento, eventoLabel: cmd.label,
      resposta: cmd.resposta, cooldown: cmd.cooldown, cooldownUser: 0, custoBase: 0, custoInscritos: 0,
      ativo: cmd.habilitado, permissao: cmd.origem.toLowerCase() === 'automatico' ? 'todos' : cmd.origem.toLowerCase(),
      responderComo: 'canal', notifOverlay: cmd.notifOverlay ?? false, template: null, extraVars: [], platforms: [cmd.platform],
    })
    setCreating(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaveErr(''); setSaveOk(false)

    if (!form.trigger) { setSaveErr('O trigger não pode estar vazio'); return }
    if (!form.resposta.trim()) { setSaveErr('A resposta do bot não pode estar vazia'); return }

    setSaving(true)
    const platform = form.platforms[0] ?? 'Twitch'
    const body = {
      id:           isUUID(editingId) ? editingId : undefined,
      trigger:      form.trigger,
      resposta:     form.resposta,
      cooldown_s:   form.cooldown,
      habilitado:   form.ativo,
      permissao:    form.permissao,
      platform,
      notif_overlay: form.notifOverlay,
    }
    try {
      const res = await fetch('/api/comandos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        let msg = 'Erro ao salvar'
        try { const d = await res.json(); msg = d.error ?? msg } catch { /* ignore */ }
        setSaveErr(`Erro ${res.status}: ${msg}`)
        setSaving(false)
        return
      }
      const saved = await res.json()
      const isEvt = isEventTrigger(saved.trigger)
      const defaultMatch = DEFAULTS.find(d => d.trigger === saved.trigger)
      const dbCmd: Cmd = {
        id: saved.id,
        label: isEvt ? (defaultMatch?.label ?? saved.trigger) : '!' + saved.trigger,
        trigger: isEvt ? saved.trigger : '!' + saved.trigger,
        resposta: saved.resposta, cooldown: saved.cooldown_s, habilitado: saved.habilitado,
        isEvento: isEvt, origem: saved.permissao ?? 'todos', platform: saved.platform ?? 'Twitch', db: true,
      }
      setCmds(p => {
        const updated = p.map(c =>
          // match by id OR by trigger for events (handles race with seed)
          c.id === editingId || (isEvt && c.isEvento && c.trigger === dbCmd.trigger) ? dbCmd : c
        )
        return editingId ? updated : [...p, dbCmd]
      })
      setSaveOk(true)
      setSaving(false)
      // Wait for reload before closing so the list reflects the actual DB state
      await reloadFromDB().catch(() => {})
      setTimeout(() => { setForm(emptyForm); setCreating(false); setEditingId(null); setSaveOk(false) }, 900)
    } catch (err) {
      setSaveErr('Erro de conexão: ' + String(err))
      setSaving(false)
    }
  }

  const orderedCmds = cmdOrder.length > 0
    ? [...cmds].sort((a, b) => {
        const ai = cmdOrder.indexOf(a.id), bi = cmdOrder.indexOf(b.id)
        if (ai === -1 && bi === -1) return 0
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      })
    : cmds

  const moveCmd = (id: string, dir: 'up' | 'down', sectionIds: string[]) => {
    const sIdx = sectionIds.indexOf(id)
    if (dir === 'up' && sIdx === 0) return
    if (dir === 'down' && sIdx === sectionIds.length - 1) return
    const swapId = sectionIds[dir === 'up' ? sIdx - 1 : sIdx + 1]
    const base = cmdOrder.length > 0 ? [...cmdOrder] : orderedCmds.map(c => c.id)
    const ai = base.indexOf(id), bi = base.indexOf(swapId)
    if (ai !== -1 && bi !== -1) {
      ;[base[ai], base[bi]] = [base[bi], base[ai]]
      setCmdOrder(base)
    } else {
      const rebuilt = orderedCmds.map(c => c.id)
      const ri = rebuilt.indexOf(id), rj = rebuilt.indexOf(swapId)
      ;[rebuilt[ri], rebuilt[rj]] = [rebuilt[rj], rebuilt[ri]]
      setCmdOrder(rebuilt)
    }
    setOrderDirty(true)
  }

  const saveOrder = async () => {
    setOrderSaving(true)
    const order = orderedCmds.map(c => c.id)
    await fetch('/api/comandos/order', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order }) }).catch(() => {})
    setCmdOrder(order)
    setOrderDirty(false)
    setOrderSaving(false)
  }

  const filtered   = orderedCmds.filter(c => (c.label + c.trigger + c.resposta).toLowerCase().includes(search.toLowerCase()))
  const ativos     = cmds.filter(c => c.habilitado).length
  const inativos   = cmds.filter(c => !c.habilitado).length
  const allVars    = form.isEvento ? EVENT_VARS : [...BASE_VARS, ...form.extraVars]
  const activePerm = PERMS.find(p => p.id === form.permissao) ?? PERMS[0]

  /* ──────────────────────── LIST VIEW ──────────────────────── */
  if (!creating) return (
    <div style={{ background: C.page, minHeight: '100vh', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 2rem' }}>

      {/* Overlay modal */}
      {overlayModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(8,9,13,0.75)' }} onClick={() => setOverlayModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0d0f18', border: '1px solid rgba(155,48,255,0.35)', borderRadius: 16, padding: '2rem 2.25rem', maxWidth: 420, width: '90%', textAlign: 'center', boxShadow: '0 0 60px rgba(155,48,255,0.15)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(155,48,255,0.12)', border: '1px solid rgba(155,48,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9b30ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: C.text, marginBottom: '0.55rem' }}>Overlay criado!</div>
            <div style={{ fontSize: '0.84rem', color: C.dim, lineHeight: 1.6, marginBottom: '1.5rem' }}>
              O overlay deste evento está disponível na seção <strong style={{ color: C.text }}>Overlays</strong>.<br/>
              Configure o visual e copie a URL para adicionar como <strong style={{ color: C.text }}>Browser Source</strong> no OBS.
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
              <button onClick={() => setOverlayModal(false)} style={{ padding: '0.55rem 1.1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: C.dim, fontSize: '0.84rem', cursor: 'pointer', fontWeight: 600 }}>
                Fechar
              </button>
              <Link href="/dashboard/overlays" onClick={() => setOverlayModal(false)} style={{ padding: '0.55rem 1.25rem', background: 'rgba(155,48,255,0.15)', border: '1px solid rgba(155,48,255,0.4)', borderRadius: 8, color: '#9b30ff', fontSize: '0.84rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                Ir para Overlays
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Comandos do bot</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setCreating(true) }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: C.blue, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>
            + Novo comando
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[{ label: 'Total', value: cmds.length, color: C.text }, { label: 'Ativos', value: ativos, color: C.cyan }, { label: 'Inativos', value: inativos, color: C.dim }].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0.9rem 1.2rem' }}>
            <div style={{ fontSize: '0.72rem', color: C.dim, marginBottom: '0.3rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>

        {/* Table header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1.25rem', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Comandos</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {orderDirty && (
              <button onClick={saveOrder} disabled={orderSaving}
                style={{ padding: '0.35rem 0.8rem', background: 'rgba(155,48,255,0.12)', border: '1px solid rgba(155,48,255,0.35)', color: '#9b30ff', borderRadius: '7px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', opacity: orderSaving ? 0.6 : 1 }}>
                {orderSaving ? '...' : '✓ Salvar ordem'}
              </button>
            )}
            <div style={{ position: 'relative' }}>
              <svg style={{ position:'absolute',left:'0.6rem',top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar comando..." style={{ ...inp, width: '210px', padding: '0.38rem 0.75rem 0.38rem 2rem', fontSize: '0.8rem' }} />
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '36px 2.5fr 3fr 100px', padding: '0.45rem 1.25rem', borderBottom: `1px solid ${C.rowBorder}`, fontSize: '0.66rem', fontWeight: 700, color: C.dim, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          <span></span><span>Comando / Evento</span><span>Resposta</span><span style={{ textAlign: 'right' }}>Ações</span>
        </div>

        {/* Eventos automáticos section */}
        {filtered.filter(c => c.isEvento).length > 0 && (
          <>
            <div style={{ padding: '0.5rem 1.25rem 0.3rem', display: 'flex', alignItems: 'center', gap: '0.45rem', borderTop: `1px solid ${C.rowBorder}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: '0.63rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Eventos automáticos</span>
            </div>
            {filtered.filter(c => c.isEvento).map((cmd, i, arr) => {
              const platColor = PLAT_COLOR[cmd.platform] ?? C.primary
              const sectionIds = arr.map(c => c.id)
              return (
                <div key={cmd.id}
                  style={{ display: 'grid', gridTemplateColumns: '36px 2.5fr 3fr 100px', padding: '0.65rem 1.25rem', borderBottom: `1px solid ${C.rowBorder}`, alignItems: 'center', transition: 'background 0.1s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.rowHover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                    <button onClick={() => moveCmd(cmd.id, 'up', sectionIds)} disabled={i === 0} style={{ background: 'none', border: 'none', color: i === 0 ? C.dim : C.text, cursor: i === 0 ? 'default' : 'pointer', padding: '1px', lineHeight: 1, opacity: i === 0 ? 0.25 : 0.7 }}>▲</button>
                    <button onClick={() => moveCmd(cmd.id, 'down', sectionIds)} disabled={i === arr.length - 1} style={{ background: 'none', border: 'none', color: i === arr.length - 1 ? C.dim : C.text, cursor: i === arr.length - 1 ? 'default' : 'pointer', padding: '1px', lineHeight: 1, opacity: i === arr.length - 1 ? 0.25 : 0.7 }}>▼</button>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: platColor }}>{cmd.label}</span>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.05rem 0.4rem', background: `${platColor}18`, border: `1px solid ${platColor}35`, color: platColor, borderRadius: '4px', letterSpacing: '0.03em' }}>{cmd.platform}</span>
                    </div>
                    <div style={{ fontSize: '0.71rem', color: C.dim }}>Automatico · {cmd.platform}</div>
                  </div>
                  <span style={{ fontSize: '0.79rem', color: C.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.75rem' }}>{cmd.resposta}</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                    <Toggle on={cmd.habilitado} isDark={isDark} onChange={async v => {
                      setCmds(p => p.map(c => c.id === cmd.id ? { ...c, habilitado: v } : c))
                      if (v) {
                        if (cmd.db) { await fetch(`/api/comandos?id=${cmd.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ habilitado: true }) }) }
                        else {
                          const res = await fetch('/api/comandos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trigger: cmd.trigger, resposta: cmd.resposta, cooldown_s: cmd.cooldown, habilitado: true, permissao: 'todos', platform: cmd.platform }) })
                          if (res.ok) { const s = await res.json(); setCmds(p => p.map(c => c.id === cmd.id ? { ...c, id: s.id, db: true } : c)) }
                        }
                      } else {
                        if (cmd.db) { await fetch(`/api/comandos?id=${cmd.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ habilitado: false }) }) }
                        else {
                          const res = await fetch('/api/comandos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trigger: cmd.trigger, resposta: cmd.resposta, cooldown_s: cmd.cooldown, habilitado: false, permissao: 'todos', platform: cmd.platform }) })
                          if (res.ok) { const s = await res.json(); setCmds(p => p.map(c => c.id === cmd.id ? { ...c, id: s.id, db: true } : c)) }
                        }
                      }
                    }} size="sm" />
                    <button onClick={() => startEdit(cmd)} style={{ background: 'none', border: 'none', color: C.editIcon, cursor: 'pointer', padding: '0.15rem', display: 'flex' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* Meus comandos section */}
        {filtered.filter(c => !c.isEvento).length > 0 && (
          <>
            <div style={{ padding: '0.5rem 1.25rem 0.3rem', display: 'flex', alignItems: 'center', gap: '0.45rem', borderTop: `1px solid ${C.rowBorder}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.blue, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: '0.63rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Meus comandos</span>
            </div>
            {filtered.filter(c => !c.isEvento).map((cmd, i, arr) => {
              const platColor = PLAT_COLOR[cmd.platform] ?? C.blue
              const sectionIds = arr.map(c => c.id)
              return (
                <div key={cmd.id}
                  style={{ display: 'grid', gridTemplateColumns: '36px 2.5fr 3fr 100px', padding: '0.65rem 1.25rem', borderBottom: `1px solid ${C.rowBorder}`, alignItems: 'center', transition: 'background 0.1s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.rowHover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                    <button onClick={() => moveCmd(cmd.id, 'up', sectionIds)} disabled={i === 0} style={{ background: 'none', border: 'none', color: i === 0 ? C.dim : C.text, cursor: i === 0 ? 'default' : 'pointer', padding: '1px', lineHeight: 1, opacity: i === 0 ? 0.25 : 0.7 }}>▲</button>
                    <button onClick={() => moveCmd(cmd.id, 'down', sectionIds)} disabled={i === arr.length - 1} style={{ background: 'none', border: 'none', color: i === arr.length - 1 ? C.dim : C.text, cursor: i === arr.length - 1 ? 'default' : 'pointer', padding: '1px', lineHeight: 1, opacity: i === arr.length - 1 ? 0.25 : 0.7 }}>▼</button>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: C.blue, fontFamily: 'monospace' }}>{cmd.trigger}</span>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.05rem 0.4rem', background: `${platColor}18`, border: `1px solid ${platColor}35`, color: platColor, borderRadius: '4px', letterSpacing: '0.03em' }}>{cmd.platform}</span>
                    </div>
                    <div style={{ fontSize: '0.71rem', color: C.dim }}>{cmd.origem} · {cmd.cooldown}s cooldown</div>
                  </div>
                  <span style={{ fontSize: '0.79rem', color: C.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.75rem' }}>{cmd.resposta}</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                    <Toggle on={cmd.habilitado} isDark={isDark} onChange={async v => {
                      setCmds(p => p.map(c => c.id === cmd.id ? { ...c, habilitado: v } : c))
                      if (cmd.db) { await fetch(`/api/comandos?id=${cmd.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ habilitado: v }) }) }
                    }} size="sm" />
                    <button onClick={() => startEdit(cmd)} style={{ background: 'none', border: 'none', color: C.editIcon, cursor: 'pointer', padding: '0.15rem', display: 'flex' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={async () => { await fetch(`/api/comandos?id=${cmd.id}`, { method: 'DELETE' }); setCmds(p => p.filter(c => c.id !== cmd.id)) }} style={{ background: 'none', border: 'none', color: C.deleteIcon, cursor: 'pointer', padding: '0.15rem', display: 'flex' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {filtered.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', fontSize: '0.84rem', color: C.dim }}>Nenhum comando encontrado</div>
        )}
      </div>
      </div>
    </div>
  )

  /* ──────────────────────── CREATE / EDIT VIEW ──────────────────────── */
  return (
    <div style={{ background: C.page, minHeight: '100vh', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Overlay modal — aparece quando um comando é ativado */}
      {overlayModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(8,9,13,0.75)' }} onClick={() => setOverlayModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0d0f18', border: '1px solid rgba(155,48,255,0.35)', borderRadius: 16, padding: '2rem 2.25rem', maxWidth: 420, width: '90%', textAlign: 'center', boxShadow: '0 0 60px rgba(155,48,255,0.15)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(155,48,255,0.12)', border: '1px solid rgba(155,48,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9b30ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: C.text, marginBottom: '0.55rem' }}>Overlay criado!</div>
            <div style={{ fontSize: '0.84rem', color: C.dim, lineHeight: 1.6, marginBottom: '1.5rem' }}>
              O overlay deste evento está disponível na seção <strong style={{ color: C.text }}>Overlays</strong>.<br/>
              Configure o visual e copie a URL para adicionar como <strong style={{ color: C.text }}>Browser Source</strong> no OBS.
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
              <button onClick={() => setOverlayModal(false)} style={{ padding: '0.55rem 1.1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: C.dim, fontSize: '0.84rem', cursor: 'pointer', fontWeight: 600 }}>
                Fechar
              </button>
              <Link href="/dashboard/overlays" onClick={() => setOverlayModal(false)} style={{ padding: '0.55rem 1.25rem', background: 'rgba(155,48,255,0.15)', border: '1px solid rgba(155,48,255,0.4)', borderRadius: 8, color: '#9b30ff', fontSize: '0.84rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                Ir para Overlays
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ padding: '0.9rem 2rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        <button onClick={() => { setCreating(false); setEditingId(null) }} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '0.84rem', padding: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Voltar
        </button>
        <span style={{ color: C.vdim, fontSize: '0.9rem' }}>|</span>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', flex: 1 }}>
          {form.isEvento ? `Configurando: ${form.eventoLabel}` : (editingId ? 'Editar comando' : 'Novo comando')}
        </span>
      </div>

      <div style={{ padding: '1.5rem 2rem', maxWidth: '860px', margin: '0 auto' }}>

        {/* Global error banner */}
        {saveErr && (
          <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', fontSize: '0.84rem', color: '#f87171', fontWeight: 600 }}>
            ⚠ {saveErr}
          </div>
        )}

        {/* Templates — only for new regular commands */}
        {!form.isEvento && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Modelos Prontos</div>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {TEMPLATES.map(tpl => {
                const sel = form.template === tpl.id
                return (
                  <button key={tpl.id} type="button" onClick={() => selectTemplate(tpl)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 0.8rem', background: sel ? `${tpl.color}18` : C.card, border: `1px solid ${sel ? tpl.color + '55' : C.border}`, borderRadius: '10px', cursor: 'pointer', minWidth: '68px', transition: 'all 0.15s' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: `${tpl.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TplIcon id={tpl.id} color={tpl.color} />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: sel ? C.text : C.muted, whiteSpace: 'nowrap' }}>{tpl.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

          {/* 1 · Evento automático OR Comando */}
          {form.isEvento ? (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.2rem', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem' }}>
                  Evento automático
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: form.ativo ? C.green : C.muted }}>
                  {form.ativo ? 'Ativo' : 'Inativo'} <Toggle on={form.ativo} onChange={v => setForm(p => ({ ...p, ativo: v }))} size="sm" />
                </div>
              </div>
              <div style={{ padding: '1rem 1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#08090d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden', opacity: 0.65 }}>
                  <span style={{ padding: '0.6rem 0.75rem 0.6rem 0.9rem', color: C.dim, fontFamily: 'monospace', borderRight: '1px solid rgba(255,255,255,0.08)' }}>!</span>
                  <span style={{ flex: 1, padding: '0.6rem 0.75rem', color: C.muted, fontSize: '0.875rem', fontFamily: 'monospace' }}>{form.trigger}</span>
                </div>
                <div style={{ marginTop: '0.45rem', fontSize: '0.73rem', color: C.dim }}>
                  Gatilho automático — disparado pelo sistema quando o evento ocorre
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.2rem', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem' }}>
                  Comando
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: C.muted }}>
                  Ativo <Toggle on={form.ativo} onChange={v => setForm(p => ({ ...p, ativo: v }))} size="sm" />
                </div>
              </div>
              <div style={{ padding: '1rem 1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#08090d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                  <span style={{ padding: '0.6rem 0.75rem 0.6rem 0.9rem', color: C.dim, fontFamily: 'monospace', borderRight: '1px solid rgba(255,255,255,0.08)' }}>!</span>
                  <input value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value.replace(/\s+/g, '').replace(/[^a-zA-Z0-9_]/g, '') }))} placeholder="meucomando" style={{ flex: 1, padding: '0.6rem 0.75rem', background: 'none', border: 'none', color: '#e8e6f8', fontSize: '0.875rem', outline: 'none', fontFamily: 'monospace' }} />
                </div>
                <div style={{ marginTop: '0.45rem', fontSize: '0.73rem', color: C.dim }}>
                  Sem espaços ou caracteres especiais. Ex: <code style={{ color: C.cyan, fontFamily: 'monospace' }}>!discord</code>, <code style={{ color: C.cyan, fontFamily: 'monospace' }}>!sorteio</code>
                </div>
              </div>
            </div>
          )}

          {/* 2 · Resposta do bot */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.85rem 1.2rem', borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: '0.9rem' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Resposta do bot
            </div>
            <div style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {allVars.map(v => (
                  <button key={v} type="button" onClick={() => insertVar(v)} style={{ padding: '0.2rem 0.5rem', background: '#08090d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: C.muted, fontSize: '0.72rem', fontFamily: 'monospace', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                  >{v}</button>
                ))}
              </div>
              <textarea ref={taRef} value={form.resposta} onChange={e => setForm(p => ({ ...p, resposta: e.target.value }))} rows={3} placeholder="O que o bot responde..." style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.84rem', lineHeight: 1.65 }} />
              {form.resposta && (
                <div style={{ background: '#08090d', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.6rem 0.85rem' }}>
                  <div style={{ fontSize: '0.67rem', color: C.dim, marginBottom: '0.28rem' }}>Preview:</div>
                  <div style={{ fontSize: '0.83rem', fontFamily: 'monospace', color: C.muted, lineHeight: 1.55 }}>{form.resposta}</div>
                </div>
              )}
            </div>
          </div>

          {/* 3 · Permissões */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1rem 1.2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.8rem' }}>Permissões</div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
              {PERMS.map(p => {
                const sel = form.permissao === p.id
                return (
                  <button key={p.id} type="button" onClick={() => setForm(f => ({ ...f, permissao: p.id }))} style={{ flex: 1, minWidth: '75px', padding: '0.5rem 0.25rem', background: sel ? `${p.color}15` : 'transparent', border: `1px solid ${sel ? p.color + '55' : 'rgba(255,255,255,0.08)'}`, color: sel ? p.color : C.dim, borderRadius: '8px', fontSize: '0.79rem', fontWeight: sel ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>{p.label}</button>
                )
              })}
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              <span style={{ color: activePerm.color, fontWeight: 600 }}>{activePerm.label}</span>
              <span style={{ color: C.dim }}> — {activePerm.desc}</span>
            </div>
          </div>

          {/* 4 · Plataformas */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1rem 1.2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Plataforma</div>
            {form.isEvento ? (
              // For event commands the platform is determined by the trigger — show as static badge
              <div style={{ display:'flex',alignItems:'center',gap:'0.6rem',padding:'0.55rem 0.9rem',background:'rgba(145,71,255,0.08)',border:'1px solid rgba(145,71,255,0.25)',borderRadius:'8px' }}>
                <svg width="13" height="13" viewBox="0 0 24 28" fill="#9147ff"><path d="M2.149 0L0 5.573V23.33h5.996V28l4.998-4.67H14.8L24 14.497V0H2.149zm19.851 13.63l-3.996 3.734h-4.998L9.008 21.1v-3.736H4.01V2.8h18v10.83zm-3.996-6.994H16v6.23h2.004v-6.23zm-5.998 0H10v6.23h2.006v-6.23z"/></svg>
                <span style={{ fontSize:'0.82rem',fontWeight:700,color:'#9147ff' }}>{PLAT_COLOR[form.platforms[0]] ? form.platforms[0] : 'Twitch'}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft:'auto' }}><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            ) : (
              // For custom commands: show Twitch connected + links to connect others via OAuth
              <div style={{ display:'flex',flexDirection:'column',gap:'0.4rem' }}>
                <div style={{ display:'flex',alignItems:'center',gap:'0.6rem',padding:'0.55rem 0.9rem',background:'rgba(145,71,255,0.08)',border:'1px solid rgba(145,71,255,0.25)',borderRadius:'8px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 28" fill="#9147ff"><path d="M2.149 0L0 5.573V23.33h5.996V28l4.998-4.67H14.8L24 14.497V0H2.149zm19.851 13.63l-3.996 3.734h-4.998L9.008 21.1v-3.736H4.01V2.8h18v10.83zm-3.996-6.994H16v6.23h2.004v-6.23zm-5.998 0H10v6.23h2.006v-6.23z"/></svg>
                  <span style={{ fontSize:'0.82rem',fontWeight:700,color:'#9147ff' }}>Twitch</span>
                  <span style={{ marginLeft:'auto',fontSize:'0.7rem',color:'#22c55e',fontWeight:600 }}>✓ Conectado</span>
                </div>
                {[
                  { id: 'YouTube', color: '#ff4444', href: '/api/auth/youtube' },
                  { id: 'Kick',    color: '#53FC18', href: '/dashboard/plataformas/kick' },
                ].map(pl => (
                  <a key={pl.id} href={pl.href} style={{ display:'flex',alignItems:'center',gap:'0.6rem',padding:'0.5rem 0.9rem',background:'transparent',border:'1px dashed rgba(255,255,255,0.1)',borderRadius:'8px',textDecoration:'none',cursor:'pointer' }}>
                    <span style={{ fontSize:'0.82rem',color:C.dim }}>{pl.id}</span>
                    <span style={{ marginLeft:'auto',fontSize:'0.72rem',fontWeight:600,color:C.primary }}>Conectar →</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* 5 · Responder como */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1rem 1.2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.8rem' }}>Responder como</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                { id: 'canal' as const, label: 'Conta do canal',  desc: 'Responde como o dono da live' },
                { id: 'bot'   as const, label: 'SheikSTREAM',     desc: 'Responde pela conta bot da plataforma' },
              ].map(opt => {
                const sel = form.responderComo === opt.id
                return (
                  <button key={opt.id} type="button" onClick={() => setForm(p => ({ ...p, responderComo: opt.id }))} style={{ padding: '0.75rem 1rem', background: sel ? C.blueBg : 'transparent', border: `1px solid ${sel ? C.blue + '55' : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: sel ? C.blue : C.text }}>{opt.label}</div>
                    <div style={{ fontSize: '0.73rem', color: C.dim, marginTop: '0.18rem' }}>{opt.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 6 · Notificação no overlay */}
          <div style={{ background: C.card, border: `1px solid ${form.notifOverlay ? C.green + '40' : C.border}`, borderRadius: '12px', padding: '1rem 1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={form.notifOverlay ? C.green : C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notificação no overlay (OBS)</span>
                <span style={{ fontSize: '0.74rem', color: form.notifOverlay ? C.green : C.dim }}>{form.notifOverlay ? 'Ativo' : 'Inativo'}</span>
              </div>
              <Toggle on={form.notifOverlay} onChange={v => setForm(p => ({ ...p, notifOverlay: v }))} size="sm" />
            </div>
            <div style={{ fontSize: '0.74rem', color: C.dim, lineHeight: 1.5, marginBottom: form.notifOverlay ? '0.75rem' : 0 }}>
              Quando ativado, exibe um alerta visual em tempo real na transmissão quando este evento ocorrer.
            </div>
            {form.notifOverlay && form.isEvento && <OverlayQuickEdit trigger={form.trigger} resposta={form.resposta} />}
          </div>

          {/* 7 · Configurações avançadas */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            <button type="button" onClick={() => setAdvOpen(p => !p)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.2rem', background: 'none', border: 'none', cursor: 'pointer', color: C.text }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Configurações avançadas</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.78rem', color: C.dim }}>{form.cooldown}s cooldown</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: advOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </button>
            {advOpen && (
              <div style={{ padding: '1rem 1.2rem', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span style={{ fontSize: '0.67rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cooldowns</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Global (segundos)</div>
                      <input type="number" value={form.cooldown} onChange={e => setForm(p => ({ ...p, cooldown: Math.max(0, Number(e.target.value)) }))} min={0} style={{ ...inp, padding: '0.55rem 0.8rem' }} />
                      <div style={{ fontSize: '0.68rem', color: C.vdim, marginTop: '0.3rem' }}>Intervalo entre usos para todos</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Por usuário (segundos)</div>
                      <input type="number" value={form.cooldownUser} onChange={e => setForm(p => ({ ...p, cooldownUser: Math.max(0, Number(e.target.value)) }))} min={0} style={{ ...inp, padding: '0.55rem 0.8rem' }} />
                      <div style={{ fontSize: '0.68rem', color: C.vdim, marginTop: '0.3rem' }}>Intervalo por pessoa específica</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.67rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Custo em tickets</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Custo base</div>
                      <input type="number" value={form.custoBase} onChange={e => setForm(p => ({ ...p, custoBase: Math.max(0, Number(e.target.value)) }))} min={0} style={{ ...inp, padding: '0.55rem 0.8rem' }} />
                      <div style={{ fontSize: '0.68rem', color: C.vdim, marginTop: '0.3rem' }}>0 = gratuito</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Custo para inscritos</div>
                      <input type="number" value={form.custoInscritos} onChange={e => setForm(p => ({ ...p, custoInscritos: Math.max(0, Number(e.target.value)) }))} min={0} style={{ ...inp, padding: '0.55rem 0.8rem' }} />
                      <div style={{ fontSize: '0.68rem', color: C.vdim, marginTop: '0.3rem' }}>Valor diferenciado para subs/membros</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          {saveErr && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', fontSize: '0.84rem', color: '#f87171', fontWeight: 600 }}>
              ⚠ {saveErr}
            </div>
          )}
          <button type="submit" disabled={saving || saveOk} style={{ width: '100%', padding: '0.85rem', background: saveOk ? '#22c55e' : saving ? 'rgba(59,130,246,0.5)' : C.blue, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: saving || saveOk ? 'default' : 'pointer', transition: 'background 0.2s' }}>
            {saveOk ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}
