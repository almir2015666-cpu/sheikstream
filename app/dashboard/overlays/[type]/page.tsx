'use client'
import { use, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { notify } from '@/app/lib/notify'

const C = {
  page: '#08090d', card: '#111219', cardB: 'rgba(255,255,255,0.06)', inner: '#0d0e16',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.5)', dim: 'rgba(232,230,248,0.28)', vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)', primaryB: 'rgba(155,48,255,0.25)',
  green: '#39ff14', greenBg: 'rgba(57,255,20,0.1)', greenB: 'rgba(57,255,20,0.25)',
  orange: '#fb923c', orangeBg: 'rgba(251,146,60,0.08)', orangeB: 'rgba(251,146,60,0.2)',
}

type StyleCfg = {
  font: string; timerSize: number; titleSize: number; supportSize: number; width: number
  bgColor: string; bgOpacity: number; textColor: string; timerColor: string
  barColor: string; barBg: string; barThickness: number
  border: boolean; borderColor: string; borderThick: number; borderRadius: number
  textEffect: string; textEffectSpeed: number; textInterval: number; textPosition: string
  animIn: string; animOut: string; animSpeed: number; duration: number
  entryAnim: string; barAnim: string
  iconShape: 'circle' | 'square' | 'none'
  titleText: string; subtitleText: string; titleColor: string; subtitleColor: string
  ttsEnabled: boolean; ttsVoice: string; ttsRate: number; ttsPitch: number; ttsVol: number; ttsText: string
}
type VisCfg = Record<string, boolean>
type FontesCfg = Record<string, boolean>

const FONTS = ['Inter', 'Open Sans', 'Roboto', 'Montserrat', 'Poppins', 'Rajdhani', 'Exo 2', 'Nunito']

const DEF: StyleCfg = {
  font: 'Inter', timerSize: 120, titleSize: 14, supportSize: 11, width: 560,
  bgColor: '#0b0c17', bgOpacity: 0.92, textColor: '#ffffff', timerColor: '#9146FF',
  barColor: '#9146FF', barBg: '#222222', barThickness: 8,
  border: false, borderColor: '#9146FF', borderThick: 1, borderRadius: 16,
  textEffect: 'typewriter', textEffectSpeed: 60, textInterval: 5, textPosition: 'bottom',
  animIn: 'slide-right', animOut: 'fade', animSpeed: 5, duration: 6,
  entryAnim: 'fade', barAnim: 'ease',
  iconShape: 'circle',
  titleText: '', subtitleText: '', titleColor: '#9146FF', subtitleColor: '#ffffff',
  ttsEnabled: false, ttsVoice: '', ttsRate: 0.95, ttsPitch: 1, ttsVol: 1, ttsText: '',
}

const TEXT_EFFECTS = [
  { id: 'typewriter',  label: 'Typewriter',  icon: '✍' },
  { id: 'matrix',      label: 'Matrix',      icon: '⬛' },
  { id: 'slide-right', label: 'Slide →',     icon: '→' },
  { id: 'slide-left',  label: 'Slide ←',     icon: '←' },
  { id: 'fade-up',     label: 'Fade Up',     icon: '↑' },
  { id: 'fade-down',   label: 'Fade Down',   icon: '↓' },
  { id: 'bounce',      label: 'Bounce',      icon: '⇑' },
  { id: 'glitch',      label: 'Glitch',      icon: '⚡' },
  { id: 'neon-pulse',  label: 'Neon Pulse',  icon: '✦' },
  { id: 'wave',        label: 'Wave',        icon: '〜' },
  { id: 'zoom-in',     label: 'Zoom In',     icon: '⊕' },
  { id: 'flip-x',      label: 'Flip 3D',     icon: '⟲' },
  { id: 'scramble',    label: 'Scramble',    icon: '??' },
]

const ALERT_ANIMS = [
  { id: 'slide-right', label: 'Slide →',     icon: '→',  dur: '0.45s' },
  { id: 'slide-left',  label: 'Slide ←',     icon: '←',  dur: '0.45s' },
  { id: 'slide-up',    label: 'Slide ↑',     icon: '↑',  dur: '0.45s' },
  { id: 'slide-down',  label: 'Slide ↓',     icon: '↓',  dur: '0.45s' },
  { id: 'fade',        label: 'Fade',        icon: '◌',  dur: '0.45s' },
  { id: 'zoom-in',     label: 'Zoom In',     icon: '⊕',  dur: '0.4s'  },
  { id: 'zoom-out',    label: 'Zoom Out',    icon: '⊖',  dur: '0.4s'  },
  { id: 'bounce-in',   label: 'Bounce',      icon: '⇑',  dur: '0.55s' },
  { id: 'flip-x',      label: 'Flip X',      icon: '↕',  dur: '0.5s'  },
  { id: 'flip-y',      label: 'Flip Y',      icon: '↔',  dur: '0.5s'  },
  { id: 'rotate-in',   label: 'Girar',       icon: '↺',  dur: '0.5s'  },
  { id: 'elastic',     label: 'Elástico',    icon: '≈',  dur: '0.65s' },
  { id: 'shake',       label: 'Tremer',      icon: '〜', dur: '0.5s'  },
  { id: 'blur-in',     label: 'Blur',        icon: '◈',  dur: '0.4s'  },
  { id: 'drop-in',     label: 'Cair',        icon: '▽',  dur: '0.5s'  },
  { id: 'swing',       label: 'Balançar',    icon: '⬡',  dur: '0.6s'  },
]

const OV_EXIT_ANIMS = [
  { id: 'fade',        label: 'Fade',        icon: '◌',  dur: '0.45s' },
  { id: 'slide-right', label: 'Slide →',     icon: '→',  dur: '0.45s' },
  { id: 'slide-left',  label: 'Slide ←',     icon: '←',  dur: '0.45s' },
  { id: 'slide-up',    label: 'Sobe ↑',      icon: '↑',  dur: '0.45s' },
  { id: 'slide-down',  label: 'Desce ↓',     icon: '↓',  dur: '0.45s' },
  { id: 'zoom-out',    label: 'Zoom Out',    icon: '⊖',  dur: '0.4s'  },
  { id: 'zoom-in',     label: 'Zoom In',     icon: '⊕',  dur: '0.4s'  },
  { id: 'flip-x',      label: 'Flip X',      icon: '↕',  dur: '0.5s'  },
  { id: 'none',        label: 'Nenhum',      icon: '○',  dur: '—'     },
]

const ENTRY_ANIMS = [
  { id: 'none',        label: 'Nenhum',      icon: '○',  dur: '—'     },
  { id: 'fade',        label: 'Fade In',     icon: '◌',  dur: '0.45s' },
  { id: 'slide-up',    label: 'Slide ↑',     icon: '↑',  dur: '0.45s' },
  { id: 'slide-down',  label: 'Slide ↓',     icon: '↓',  dur: '0.45s' },
  { id: 'zoom-in',     label: 'Zoom In',     icon: '⊕',  dur: '0.4s'  },
  { id: 'blur-in',     label: 'Blur In',     icon: '◈',  dur: '0.4s'  },
  { id: 'bounce-in',   label: 'Bounce',      icon: '⇑',  dur: '0.55s' },
  { id: 'slide-right', label: 'Slide →',     icon: '→',  dur: '0.45s' },
]

const BAR_ANIMS = [
  { id: 'linear',      label: 'Linear',      icon: '━' },
  { id: 'ease',        label: 'Suave',       icon: '~' },
  { id: 'ease-in',     label: 'Acelerado',   icon: '▶' },
  { id: 'ease-out',    label: 'Desacelerado',icon: '◀' },
  { id: 'bounce',      label: 'Bounce',      icon: '⇑' },
  { id: 'elastic',     label: 'Elástico',    icon: '≈' },
]

const PRESETS = [
  { id: 'twitch-classic', label: 'Twitch Classic',  desc: 'Roxo escuro com barra violeta',      bg: '#0e0b18', bgOp: 1,    bar: '#9146ff', barBg: '#1a1a1a', text: '#ffffff', border: false, borderC: '#9146ff', timer: '#9146FF' },
  { id: 'streamelements', label: 'StreamElements',   desc: 'Fundo claro com texto escuro',       bg: '#ffffff', bgOp: 1,    bar: '#e84040', barBg: '#dddddd', text: '#111111', border: false, borderC: '#e84040', timer: '#e84040' },
  { id: 'nerd-or-die',    label: 'Nerd or Die',      desc: 'Preto com neon verde minimalista',   bg: '#111111', bgOp: 1,    bar: '#39ff14', barBg: '#1f1f1f', text: '#ffffff', border: false, borderC: '#39ff14', timer: '#39ff14' },
  { id: 'own3d-pro',      label: 'OWN3D Pro',        desc: 'Glassmorphism com borda sutil',      bg: '#101020', bgOp: 0.85, bar: '#4fa3ff', barBg: '#1a2040', text: '#ffffff', border: true,  borderC: '#4fa3ff', timer: '#4fa3ff' },
  { id: 'gaming-red',     label: 'Gaming Red',       desc: 'Preto com vermelho intenso',         bg: '#0a0a0a', bgOp: 1,    bar: '#ff2222', barBg: '#1a0000', text: '#ffffff', border: true,  borderC: '#ff3333', timer: '#ff2222' },
  { id: 'cyberpunk',      label: 'Cyberpunk',        desc: 'Preto com neon amarelo e ciano',     bg: '#0a0a0a', bgOp: 1,    bar: '#00ffff', barBg: '#111111', text: '#ffff00', border: false, borderC: '#00ffff', timer: '#ffff00' },
  { id: 'vaporwave',      label: 'Vaporwave',        desc: 'Roxo profundo com rosa e lilás',     bg: '#1a0a2e', bgOp: 1,    bar: '#ff6ec7', barBg: '#2d1050', text: '#e8b4ff', border: false, borderC: '#ff6ec7', timer: '#ff6ec7' },
  { id: 'glassmorphism',  label: 'Glassmorphism',    desc: 'Vidro fosco com borda branca',       bg: '#ffffff', bgOp: 0.08, bar: '#ffffff', barBg: '#ffffff22', text: '#ffffff', border: true, borderC: '#ffffff', timer: '#ffffff' },
  { id: 'military',       label: 'Military',         desc: 'Verde oliva escuro estilo tático',   bg: '#1a1f0e', bgOp: 1,    bar: '#6b8c21', barBg: '#0f1208', text: '#c8d8a0', border: false, borderC: '#6b8c21', timer: '#6b8c21' },
  { id: 'minimal',        label: 'Minimal',          desc: 'Ultra fino com transparência',       bg: '#000000', bgOp: 0,    bar: '#ffffff', barBg: '#ffffff15', text: '#ffffff', border: false, borderC: '#ffffff', timer: '#ffffff' },
  { id: 'ocean',          label: 'Ocean',            desc: 'Azul profundo com brilho aquático',  bg: '#0a1628', bgOp: 1,    bar: '#00d4ff', barBg: '#0f2040', text: '#7dd3fc', border: false, borderC: '#00d4ff', timer: '#00d4ff' },
  { id: 'sunset',         label: 'Sunset',           desc: 'Laranja quente ao pôr do sol',       bg: '#1a0a00', bgOp: 1,    bar: '#ff7020', barBg: '#200e00', text: '#ffd090', border: false, borderC: '#ff7020', timer: '#ff7020' },
]

const TYPE_META: Record<string, { label: string; overlayPath: string; defVis: VisCfg; defFon: FontesCfg }> = {
  alert:          { label: 'Alertas',          overlayPath: '/overlay/alert',    defVis: { sub: true, follow: true, bits: true, donation: true }, defFon: {} },
  patrocinadores: { label: 'Patrocinadores',   overlayPath: '/overlay/banners',  defVis: {}, defFon: {} },
  subathon:       { label: 'Subathon',         overlayPath: '/overlay/subathon', defVis: { title: true, tags: true, lastContrib: true }, defFon: {} },
  'meta-subs':    { label: 'Meta de Subs',     overlayPath: '/overlay/meta',     defVis: { title: true, desc: false, pct: true, values: true }, defFon: { subs: true, resubs: true, gifts: true, prime: false, ytMembers: false, ytGifts: false } },
  sorteio:        { label: 'Meta de Sorteio',  overlayPath: '/overlay/sorteio',  defVis: { values: true, recent: true, lines: false }, defFon: { livepix: true, twitch: true, youtube: true, paypal: false, kick: false, tiktok: false } },
  meta:           { label: 'Meta',             overlayPath: '/overlay/meta',     defVis: { title: true, desc: true, pct: true, values: true }, defFon: {} },
}

const EVENT_OVERLAY_META: Record<string, { label: string; icon: string; color: string }> = {
  'twitch-sub':         { label: 'Sub Twitch',          icon: '⭐', color: '#9146ff' },
  'twitch-giftsub':     { label: 'Gift Sub Twitch',     icon: '🎁', color: '#c084fc' },
  'twitch-resub':       { label: 'Resub Twitch',        icon: '🔁', color: '#9146ff' },
  'twitch-follow':      { label: 'Follow Twitch',       icon: '❤️', color: '#ff6eb6' },
  'twitch-bits':        { label: 'Bits Twitch',         icon: '💎', color: '#fbbf24' },
  'livepix':            { label: 'Doação Livepix',      icon: '💸', color: '#39ff14' },
  'paypal':             { label: 'Doação PayPal',       icon: '💳', color: '#1e9ef5' },
  'kick-sub':           { label: 'Sub Kick',            icon: '⭐', color: '#53fc18' },
  'kick-follow':        { label: 'Follow Kick',         icon: '❤️', color: '#53fc18' },
  'kick-giftsub':       { label: 'Gift Sub Kick',       icon: '🎁', color: '#53fc18' },
  'youtube-member':     { label: 'Membro YouTube',      icon: '🏅', color: '#ff4040' },
  'youtube-giftmember': { label: 'Gift Member YouTube', icon: '🎁', color: '#ff8080' },
}

// ─── UI Components ─────────────────────────────────────────────────────────────
function Card({ children, style: s }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: 12, padding: '1rem 1.1rem', marginBottom: '0.75rem', ...s }}>{children}</div>
}

function Label({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ fontSize: '0.67rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{children}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: C.vdim, marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  )
}

function Tog({ on, onChange, label, desc }: { on: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div onClick={() => onChange(!on)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.7rem', background: on ? C.primaryBg : 'rgba(255,255,255,0.02)', border: `1px solid ${on ? C.primaryB : C.cardB}`, borderRadius: 8, marginBottom: '0.35rem', cursor: 'pointer', userSelect: 'none' }}>
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: C.text }}>{label}</div>
        {desc && <div style={{ fontSize: '0.7rem', color: C.dim }}>{desc}</div>}
      </div>
      <div style={{ width: 34, height: 19, background: on ? C.primary : 'rgba(255,255,255,0.12)', borderRadius: 10, position: 'relative', flexShrink: 0, marginLeft: 10, transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 15, height: 15, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
      </div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: '0.25rem 0.65rem', background: active ? C.greenBg : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? C.greenB : C.cardB}`, borderRadius: 999, fontSize: '0.75rem', color: active ? C.green : C.dim, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
      {active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />}
      {children}
    </button>
  )
}

function RangeInput({ label, value, min, max, unit, step = 1, onChange }: { label: string; value: number; min: number; max: number; unit: string; step?: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.67rem', fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ fontSize: '0.67rem', fontWeight: 700, color: C.muted }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: C.primary, cursor: 'pointer' }} />
    </div>
  )
}

function ColorIn({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: '0.67rem', fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 8, padding: '0.4rem 0.75rem' }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 22, height: 22, border: 'none', background: 'none', padding: 0, cursor: 'pointer', borderRadius: 3 }} />
        <span style={{ fontSize: '0.78rem', color: C.text, fontFamily: 'monospace' }}>{value.toUpperCase()}</span>
      </div>
    </div>
  )
}

function EffectGrid({ effects, value, onChange }: { effects: { id: string; label: string; icon: string; dur?: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
      {effects.map(e => (
        <button key={e.id} onClick={() => onChange(e.id)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '0.15rem', padding: '0.5rem 0.25rem',
          background: value === e.id ? C.primaryBg : 'rgba(255,255,255,0.03)',
          border: `1px solid ${value === e.id ? C.primaryB : C.cardB}`,
          borderRadius: 8, color: value === e.id ? C.primary : C.dim,
          cursor: 'pointer', fontSize: '0.65rem', fontWeight: value === e.id ? 700 : 400,
          minHeight: e.dur ? 60 : 52,
        }}>
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>{e.icon}</span>
          <span style={{ lineHeight: 1.2, textAlign: 'center' }}>{e.label}</span>
          {e.dur && <span style={{ fontSize: '0.58rem', opacity: 0.55, lineHeight: 1, color: value === e.id ? C.primary : C.vdim, fontWeight: 400 }}>{e.dur}</span>}
        </button>
      ))}
    </div>
  )
}

// ─── Animation helpers (shared with overlay page) ──────────────────────────────
function getPreviewAnimStyle(animIn: string, visible: boolean): React.CSSProperties {
  if (visible) return { transform: 'none', opacity: 1, filter: 'none' }
  const transforms: Record<string, string> = {
    'slide-right': 'translateX(-120%)', 'slide-left': 'translateX(120%)',
    'slide-up': 'translateY(50px)', 'slide-down': 'translateY(-50px)',
    'fade': 'none', 'zoom-in': 'scale(0.4)', 'zoom-out': 'scale(1.5)',
    'bounce-in': 'translateY(-60px)', 'flip-x': 'rotateX(90deg)', 'flip-y': 'rotateY(90deg)',
    'rotate-in': 'rotate(-180deg) scale(0.5)', 'elastic': 'translateX(-120%)',
    'shake': 'translateX(-80%)', 'blur-in': 'none', 'drop-in': 'translateY(-100px)', 'swing': 'rotate(-25deg)',
  }
  return { transform: transforms[animIn] ?? 'translateX(-120%)', opacity: 0, filter: animIn === 'blur-in' ? 'blur(16px)' : 'none' }
}

function getPreviewTransition(animIn: string): string {
  const m: Record<string, string> = {
    'bounce-in': 'transform 0.55s cubic-bezier(.22,.68,0,1.8), opacity 0.3s',
    'elastic':   'transform 0.65s cubic-bezier(.22,.68,0,2), opacity 0.3s',
    'zoom-in':   'transform 0.4s cubic-bezier(.22,.68,0,1.2), opacity 0.35s',
    'zoom-out':  'transform 0.4s ease, opacity 0.35s',
    'flip-x':    'transform 0.5s ease, opacity 0.35s',
    'flip-y':    'transform 0.5s ease, opacity 0.35s',
    'rotate-in': 'transform 0.5s cubic-bezier(.22,.68,0,1.2), opacity 0.35s',
    'drop-in':   'transform 0.5s cubic-bezier(.22,.68,0,1.3), opacity 0.3s',
    'blur-in':   'filter 0.4s ease, opacity 0.4s',
  }
  return m[animIn] ?? 'transform 0.45s cubic-bezier(.22,.68,0,1.2), opacity 0.35s'
}

// ─── Preview renderers ─────────────────────────────────────────────────────────
function AlertPreview({ s, animKey }: { s: StyleCfg; animKey?: number }) {
  const [visible, setVisible] = useState(false)
  const bg = s.bgOpacity === 0 ? 'transparent' : s.bgColor
  const accent = s.timerColor
  const titleClr = s.titleColor || accent
  const subClr = s.subtitleColor || s.textColor

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [animKey, s.animIn])

  const animStyle = animKey !== undefined ? getPreviewAnimStyle(s.animIn, visible) : {}
  const transition = animKey !== undefined ? getPreviewTransition(s.animIn) : 'none'

  return (
    <div style={{ width: Math.min(s.width, 480), margin: '0 auto', fontFamily: s.font }}>
      <div style={{
        background: bg, border: s.border ? `${s.borderThick}px solid ${accent}` : `1px solid ${accent}44`,
        borderRadius: s.borderRadius, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: `0 0 24px ${accent}22`, position: 'relative', overflow: 'hidden',
        ...animStyle, transition,
      }}>
        {s.iconShape !== 'none' && (
          <div style={{ width: 40, height: 40, borderRadius: s.iconShape === 'circle' ? '50%' : 8, background: `${accent}22`, border: `1px solid ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>⭐</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: s.titleSize + 1, fontWeight: 800, color: titleClr }}>{s.titleText || 'Novo inscrito!'}</div>
          <div style={{ fontSize: s.supportSize + 1, color: subClr, opacity: 0.7, marginTop: 2 }}>{s.subtitleText || 'viewer123 se inscreveu!'}</div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `${accent}22` }}>
          <div style={{ width: visible ? '0%' : '100%', height: '100%', background: accent, transition: visible ? `width ${s.duration ?? 6}s linear` : 'none' }} />
        </div>
      </div>
    </div>
  )
}

function MetaPreview({ s, vis }: { s: StyleCfg; vis: VisCfg }) {
  const pct = 65
  const bg = s.bgOpacity === 0 ? 'transparent' : s.bgColor
  return (
    <div style={{ background: bg, padding: '12px 16px', borderRadius: s.borderRadius, maxWidth: s.width, margin: '0 auto', border: s.border ? `${s.borderThick}px solid ${s.borderColor}` : 'none', fontFamily: s.font }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        {vis.title && <div style={{ color: s.textColor, fontSize: s.titleSize, fontWeight: 700 }}>meta ativa</div>}
        {vis.pct && <div style={{ color: s.barColor, fontSize: s.titleSize, fontWeight: 700 }}>{pct}%</div>}
      </div>
      {vis.desc && <div style={{ color: s.textColor, opacity: 0.55, fontSize: s.supportSize, marginBottom: 8 }}>descrição da meta</div>}
      <div style={{ background: s.barBg, borderRadius: 99, height: s.barThickness, marginBottom: 6, overflow: 'hidden' }}>
        <div style={{ background: s.barColor, width: `${pct}%`, height: '100%', borderRadius: 99 }} />
      </div>
      {vis.values && <div style={{ display: 'flex', justifyContent: 'space-between', color: s.textColor, opacity: 0.45, fontSize: s.supportSize }}>
        <span>650 ARRECADADO</span><span>meta: 1.000</span>
      </div>}
    </div>
  )
}

function SubathonPreview({ s, vis }: { s: StyleCfg; vis: VisCfg }) {
  const bg = s.bgOpacity === 0 ? 'transparent' : s.bgColor
  const scale = Math.min(1, 480 / Math.max(s.width, 200))
  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: s.width, margin: '0 auto' }}>
      <div style={{ background: bg, padding: '20px 28px 16px', borderRadius: s.borderRadius, textAlign: 'center', border: s.border ? `${s.borderThick}px solid ${s.borderColor}` : 'none', fontFamily: s.font, boxShadow: `0 0 30px ${s.timerColor}22` }}>
        {vis.title && <div style={{ color: s.textColor, fontSize: s.titleSize, marginBottom: 6, opacity: 0.7, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>nome do subathon</div>}
        <div style={{ color: s.timerColor, fontSize: s.timerSize, fontWeight: 900, lineHeight: 1, marginBottom: 12, letterSpacing: '-2px', textShadow: `0 0 30px ${s.timerColor}66` }}>01:23:45</div>
        {vis.tags && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ padding: '3px 10px', background: `${s.timerColor}22`, color: s.timerColor, border: `1px solid ${s.timerColor}55`, borderRadius: 99, fontSize: s.supportSize + 1, fontWeight: 700 }}>+2m SUB</span>
            <span style={{ padding: '3px 10px', background: 'rgba(57,255,20,0.15)', color: '#39ff14', border: '1px solid rgba(57,255,20,0.4)', borderRadius: 99, fontSize: s.supportSize + 1, fontWeight: 700 }}>+1m LIVEPIX</span>
          </div>
        )}
        {vis.lastContrib && <div style={{ color: s.textColor, opacity: 0.4, fontSize: s.supportSize }}>viewer123 +2m</div>}
      </div>
    </div>
  )
}

function SorteioPreview({ s, vis, fontes }: { s: StyleCfg; vis: VisCfg; fontes: FontesCfg }) {
  const pct = 42
  const bg = s.bgOpacity === 0 ? 'transparent' : s.bgColor
  return (
    <div style={{ background: bg, padding: '12px 16px', borderRadius: s.borderRadius, maxWidth: s.width, margin: '0 auto', border: s.border ? `${s.borderThick}px solid ${s.borderColor}` : 'none', fontFamily: s.font }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <div style={{ color: s.textColor, fontSize: s.titleSize, fontWeight: 700 }}>🏆 sorteio ativo</div>
        {vis.values && <div style={{ color: s.barColor, fontSize: s.supportSize, fontWeight: 700 }}>{pct}%</div>}
      </div>
      <div style={{ background: s.barBg, borderRadius: 99, height: s.barThickness, marginBottom: 8, overflow: 'hidden' }}>
        <div style={{ background: s.barColor, width: `${pct}%`, height: '100%', borderRadius: 99 }} />
      </div>
      {vis.values && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          {fontes.livepix && <div style={{ textAlign: 'center' }}><div style={{ color: '#ff6eb6', fontSize: 8 }}>♥ LIVEPIX</div><div style={{ color: s.textColor, fontSize: 11, fontWeight: 700 }}>22</div></div>}
          {fontes.twitch  && <div style={{ textAlign: 'center' }}><div style={{ color: '#9b30ff', fontSize: 8 }}>■ TWITCH</div><div style={{ color: s.textColor, fontSize: 11, fontWeight: 700 }}>10</div></div>}
          {fontes.youtube && <div style={{ textAlign: 'center' }}><div style={{ color: '#ff4040', fontSize: 8 }}>▶ YOUTUBE</div><div style={{ color: s.textColor, fontSize: 11, fontWeight: 700 }}>7</div></div>}
        </div>
      )}
      {vis.recent && <div style={{ color: s.textColor, opacity: 0.35, fontSize: s.supportSize - 1 }}>Últimos: viewerAlpha, subbeta...</div>}
    </div>
  )
}

function PatroPreview({ s }: { s: StyleCfg }) {
  const bg = s.bgOpacity === 0 ? 'transparent' : s.bgColor
  return (
    <div style={{ background: bg, padding: '16px', borderRadius: s.borderRadius, maxWidth: s.width, margin: '0 auto', border: s.border ? `${s.borderThick}px solid ${s.borderColor}` : `1px dashed ${C.cardB}`, fontFamily: s.font, textAlign: 'center' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '24px 16px', marginBottom: 8 }}>
        <div style={{ color: C.dim, fontSize: 11 }}>[ imagem do patrocinador ]</div>
      </div>
      <div style={{ color: s.textColor, opacity: 0.5, fontSize: s.supportSize }}>patrocinador.com.br</div>
    </div>
  )
}

function PresetCard({ p, active, onClick }: { p: typeof PRESETS[0]; active: boolean; onClick: () => void }) {
  const previewBg = p.bgOp === 0 ? '#1a1a1a' : p.bg
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', border: active ? `2px solid ${C.primary}` : '2px solid transparent', borderRadius: 9, overflow: 'hidden', background: C.inner }}>
      <div style={{ background: previewBg, padding: '8px 10px', border: p.border ? `1px solid ${p.borderC}` : '1px solid transparent' }}>
        <div style={{ color: p.text, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>Preview</div>
        <div style={{ background: p.barBg, borderRadius: 3, height: 5, marginBottom: 3 }}>
          <div style={{ background: p.bar, width: '65%', height: '100%', borderRadius: 3 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: p.text, fontSize: 7, opacity: 0.5 }}>65 / 100</span>
        </div>
      </div>
      <div style={{ padding: '5px 8px' }}>
        <div style={{ color: C.text, fontSize: 9, fontWeight: 600 }}>{p.label}</div>
        <div style={{ color: C.dim, fontSize: 8, marginTop: 1 }}>{p.desc}</div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
type Ctx = { params: Promise<{ type: string }> }

export default function OverlayEditorPage({ params }: Ctx) {
  const { type } = use(params)
  const searchParams = useSearchParams()
  const eventSlug = searchParams.get('event')

  const meta = TYPE_META[type] ?? TYPE_META['meta']
  const cfgKey = eventSlug ? `alert-${eventSlug}` : type
  const evMeta = eventSlug ? EVENT_OVERLAY_META[eventSlug] : null
  const pageLabel = evMeta ? `Alerta: ${evMeta.label}` : meta.label

  const [tab, setTab] = useState<'config' | 'efeitos' | 'estilo'>('config')
  const [style, setStyle] = useState<StyleCfg>(DEF)
  const [vis, setVis] = useState<VisCfg>(meta.defVis)
  const [fontes, setFontes] = useState<FontesCfg>(meta.defFon)
  const [uid, setUid] = useState('')
  const [savedOk, setSavedOk] = useState(false)
  const [copiedOk, setCopiedOk] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const [bannerUrls, setBannerUrls] = useState(['', ''])
  const [waitSecs, setWaitSecs] = useState(5)
  const [dispSecs, setDispSecs] = useState(10)
  const [banLayout, setBanLayout] = useState<'single' | 'double'>('single')
  const [newBannerUrl, setNewBannerUrl] = useState('')
  const [subathonActive, setSubathonActive] = useState<boolean | null>(null)
  const [previewAnimKey, setPreviewAnimKey] = useState(0)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const voicesLoaded = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const load = () => {
      const v = window.speechSynthesis.getVoices()
      if (v.length > 0 && !voicesLoaded.current) { voicesLoaded.current = true; setVoices(v) }
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
  }, [])

  // Auto-loop preview animation when in Efeitos tab
  useEffect(() => {
    if (tab !== 'efeitos') return
    setPreviewAnimKey(k => k + 1)
    const iv = setInterval(() => setPreviewAnimKey(k => k + 1), 3500)
    return () => clearInterval(iv)
  }, [tab, style.animIn, style.textEffect])

  useEffect(() => {
    if (type === 'subathon') {
      fetch('/api/subathon').then(r => r.json()).then(d => setSubathonActive(!!d?.is_active)).catch(() => setSubathonActive(false))
    }
    // Apply localStorage immediately for instant render
    try {
      const raw = localStorage.getItem(`overlay-cfg-${cfgKey}`)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.style) setStyle(s => ({ ...DEF, ...s, ...saved.style }))
        if (saved.vis) setVis(v => ({ ...v, ...saved.vis }))
        if (saved.fontes) setFontes(f => ({ ...f, ...saved.fontes }))
        if (saved.bannerUrls) setBannerUrls(saved.bannerUrls)
        if (saved.activePreset) setActivePreset(saved.activePreset)
      }
    } catch {}
    // Fetch uid then load from DB (source of truth — overrides localStorage)
    fetch('/api/me').then(r => r.json()).then(d => {
      if (!d?.id) return
      setUid(d.id)
      fetch(`/api/overlay-config/${cfgKey}?uid=${d.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(cfg => {
          if (!cfg || Object.keys(cfg).length === 0) return
          if (cfg.style) setStyle(s => ({ ...DEF, ...s, ...cfg.style }))
          if (cfg.vis) setVis(v => ({ ...v, ...cfg.vis }))
          if (cfg.fontes) setFontes(f => ({ ...f, ...cfg.fontes }))
          if (cfg.bannerUrls) setBannerUrls(cfg.bannerUrls)
          if (cfg.activePreset) setActivePreset(cfg.activePreset)
          try { localStorage.setItem(`overlay-cfg-${cfgKey}`, JSON.stringify(cfg)) } catch {}
        })
        .catch(() => {})
    }).catch(() => {})
  }, [type, cfgKey])

  function upS<K extends keyof StyleCfg>(key: K, val: StyleCfg[K]) {
    setStyle(prev => ({ ...prev, [key]: val }))
    setActivePreset(null)
  }

  function applyPreset(p: typeof PRESETS[0]) {
    setStyle(prev => ({ ...prev, bgColor: p.bg, bgOpacity: p.bgOp, barColor: p.bar, barBg: p.barBg, textColor: p.text, border: p.border, borderColor: p.borderC, timerColor: p.timer }))
    setActivePreset(p.id)
  }

  function buildUrl() {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://sheikstream.com.br'
    const id = uid || 'SEU_ID'
    const u = `${base}${meta.overlayPath}?uid=${id}`
    return eventSlug ? `${u}&event=${eventSlug}` : u
  }

  async function save() {
    const localPayload = { style, vis, fontes, bannerUrls, activePreset }
    try { localStorage.setItem(`overlay-cfg-${cfgKey}`, JSON.stringify(localPayload)) } catch {}
    setSavedOk(true)
    setTimeout(() => setSavedOk(false), 2500)
    fetch(`/api/overlay-config/${cfgKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localPayload),
    }).then(r => {
      if (r.ok) notify('Overlay salvo! Mudanças no OBS em segundos.', 'success')
      else notify('Salvo localmente.', 'info')
    }).catch(() => notify('Salvo localmente.', 'info'))
  }

  function copyUrl() {
    navigator.clipboard.writeText(buildUrl()).catch(() => {})
    setCopiedOk(true)
    setTimeout(() => setCopiedOk(false), 2000)
    notify('URL copiada! Cole no OBS como Browser Source.', 'success')
  }

  const overlayUrl = buildUrl()
  const isBarType = type !== 'subathon' && type !== 'patrocinadores' && type !== 'alert'

  // ─── Config tab ──────────────────────────────────────────────────────────────
  function renderTtsCard() {
    return (
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: style.ttsEnabled ? '0.9rem' : 0 }}>
          <Label sub="Lê o alerta em voz alta no OBS">TTS — Leitura em voz</Label>
          <div onClick={() => upS('ttsEnabled', !style.ttsEnabled)} style={{ width: 34, height: 19, background: style.ttsEnabled ? C.primary : 'rgba(255,255,255,0.12)', borderRadius: 10, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 2, left: style.ttsEnabled ? 16 : 2, width: 15, height: 15, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
          </div>
        </div>
        {style.ttsEnabled && (
          <>
            <div style={{ marginBottom: '0.6rem' }}>
              <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.25rem' }}>Voz</div>
              <select
                value={style.ttsVoice}
                onChange={e => upS('ttsVoice', e.target.value)}
                style={{ width: '100%', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 7, padding: '0.45rem 0.7rem', color: C.text, fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' as const }}
              >
                <option value="">Padrão do sistema (pt-BR)</option>
                {voices.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
              {voices.length === 0 && <div style={{ fontSize: '0.65rem', color: C.dim, marginTop: '0.25rem' }}>Vozes carregando... se não aparecer, recarregue a página</div>}
            </div>
            <div style={{ marginBottom: '0.6rem' }}>
              <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.25rem' }}>Texto (deixe vazio para ler título + subtítulo do alerta)</div>
              <input value={style.ttsText} onChange={e => upS('ttsText', e.target.value)} placeholder="Ex: $user se inscreveu!" style={{ width: '100%', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 7, padding: '0.45rem 0.7rem', color: C.text, fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' as const }} />
              <div style={{ fontSize: '0.62rem', color: C.dim, marginTop: '0.2rem' }}>Variáveis: $user $valor $msg $months</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <RangeInput label="Velocidade" value={style.ttsRate} min={0.5} max={2} step={0.05} unit="x" onChange={v => upS('ttsRate', v)} />
              <RangeInput label="Tom" value={style.ttsPitch} min={0} max={2} step={0.1} unit="" onChange={v => upS('ttsPitch', v)} />
              <RangeInput label="Volume" value={style.ttsVol} min={0} max={1} step={0.05} unit="" onChange={v => upS('ttsVol', v)} />
            </div>
          </>
        )}
      </Card>
    )
  }

  function renderConfigTab() {
    if (type === 'alert') {
      if (eventSlug && evMeta) {
        return (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', background: `${evMeta.color}10`, border: `1px solid ${evMeta.color}33`, borderRadius: 10 }}>
              <span style={{ fontSize: '1.6rem' }}>{evMeta.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: evMeta.color, fontSize: '0.9rem' }}>{evMeta.label}</div>
                <div style={{ fontSize: '0.72rem', color: C.dim, marginTop: '0.1rem' }}>Overlay exclusivo para este evento</div>
              </div>
            </div>
            <Label>Posição no OBS</Label>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.73rem', color: C.dim, lineHeight: 1.5 }}>
              Cole a URL no OBS como Browser Source. Recomendado: 1920×200px na parte inferior da cena.
            </p>
            <div style={{ padding: '0.65rem 0.85rem', background: C.orangeBg, border: `1px solid ${C.orangeB}`, borderRadius: 8 }}>
              <p style={{ margin: 0, fontSize: '0.76rem', color: C.orange, lineHeight: 1.5 }}>
                Ative &quot;Permitir transparência&quot; nas configurações do Browser Source no OBS.
              </p>
            </div>
          </Card>
          {renderTtsCard()}
        )
      }
      return (
        <Card>
          <Label>Configuração do overlay</Label>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.76rem', color: C.dim, lineHeight: 1.5 }}>
            Cole a URL acima no OBS como <strong style={{ color: C.text }}>Browser Source</strong>. Ative <strong style={{ color: C.text }}>&quot;Permitir transparência&quot;</strong> nas configurações do Browser Source.
          </p>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.76rem', color: C.dim, lineHeight: 1.5 }}>
            Tamanho recomendado: <strong style={{ color: C.text }}>1920 × 200px</strong> na parte inferior da cena.
          </p>
          <div style={{ padding: '0.65rem 0.85rem', background: C.orangeBg, border: `1px solid ${C.orangeB}`, borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: '0.76rem', color: C.orange, lineHeight: 1.5 }}>
              Ative <strong>&quot;Permitir transparência&quot;</strong> nas configurações do Browser Source no OBS. Use as abas <strong>Efeitos</strong> e <strong>Estilo</strong> para personalizar.
            </p>
          </div>
        </Card>
        {renderTtsCard()}
      )
    }

    if (type === 'patrocinadores') {
      return (
        <>
          <Card>
            <Label>Configuração do carrossel</Label>
            <RangeInput label="Espera entre ciclos" value={waitSecs} min={1} max={60} unit="s" onChange={setWaitSecs} />
            <RangeInput label="Duração de exibição" value={dispSecs} min={1} max={60} unit="s" onChange={setDispSecs} />
            <div style={{ marginTop: '0.5rem' }}>
              <Label>Layout</Label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['single', 'double'] as const).map(l => (
                  <button key={l} onClick={() => setBanLayout(l)} style={{ flex: 1, padding: '0.5rem', background: banLayout === l ? C.primaryBg : 'rgba(255,255,255,0.03)', border: `1px solid ${banLayout === l ? C.primaryB : C.cardB}`, borderRadius: 7, color: banLayout === l ? C.primary : C.text, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                    {l === 'single' ? '▬ Único' : '▬▬ Duplo'}
                  </button>
                ))}
              </div>
            </div>
          </Card>
          <Card>
            <Label>URLs dos banners</Label>
            <p style={{ margin: '0 0 0.6rem', fontSize: '0.73rem', color: C.dim }}>Use Imgur, Google Drive (público), Discord ou similar.</p>
            {bannerUrls.filter(Boolean).map((url, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 7, padding: '0.4rem 0.7rem' }}>
                <span style={{ flex: 1, fontSize: '0.72rem', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                <button onClick={() => setBannerUrls(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 16, padding: '0 2px' }}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input value={newBannerUrl} onChange={e => setNewBannerUrl(e.target.value)} placeholder="https://i.imgur.com/exemplo.png" style={{ flex: 1, background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 7, padding: '0.45rem 0.7rem', color: C.text, fontSize: '0.78rem', outline: 'none' }} />
              <button onClick={() => { if (newBannerUrl.trim()) { setBannerUrls(prev => [...prev, newBannerUrl.trim()]); setNewBannerUrl('') } }} style={{ padding: '0.45rem 0.85rem', background: C.primaryBg, border: `1px solid ${C.primaryB}`, borderRadius: 7, color: C.primary, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                + Adicionar
              </button>
            </div>
          </Card>
        </>
      )
    }

    if (type === 'subathon') {
      return (
        <Card>
          <Label>Subathon</Label>
          {subathonActive === false && (
            <div style={{ background: C.inner, border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '0.65rem 0.85rem', marginBottom: '0.75rem' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#fbbf24' }}>
                Nenhum subathon ativo — crie em{' '}
                <Link href="/dashboard/subathon" style={{ color: '#fbbf24', textDecoration: 'underline' }}>Subathon</Link>.
              </p>
            </div>
          )}
          {subathonActive === true && (
            <div style={{ background: 'rgba(57,255,20,0.06)', border: '1px solid rgba(57,255,20,0.2)', borderRadius: 8, padding: '0.65rem 0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#39ff14', display: 'inline-block', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#39ff14' }}>Subathon ativo — sincronizado.</p>
            </div>
          )}
          <Label>Elementos visíveis</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {[['title','Título'],['tags','Tags'],['lastContrib','Última contribuição']].map(([k,l]) => (
              <Chip key={k} active={!!vis[k]} onClick={() => setVis(v => ({ ...v, [k]: !v[k] }))}>{l}</Chip>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <Label>Posição do texto animado</Label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {([['top','Acima do timer'],['bottom','Abaixo das tags']] as const).map(([pos, lbl]) => (
                <button key={pos} onClick={() => upS('textPosition', pos)} style={{ flex: 1, padding: '0.45rem', background: style.textPosition === pos ? C.primaryBg : 'rgba(255,255,255,0.03)', border: `1px solid ${style.textPosition === pos ? C.primaryB : C.cardB}`, borderRadius: 7, color: style.textPosition === pos ? C.primary : C.dim, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )
    }

    if (type === 'meta-subs') {
      return (
        <>
          <Card>
            <Label>Tipo de Meta</Label>
            <select style={{ width: '100%', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 8, padding: '0.45rem 0.75rem', color: C.text, fontSize: '0.83rem', outline: 'none', marginBottom: '0.75rem' }}>
              <option>Meta de inscritos</option><option>Meta de bits</option><option>Meta de seguidores</option>
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.73rem', color: C.dim, marginBottom: '0.3rem' }}>Meta Final</div>
                <input type="number" defaultValue={100} style={{ width: '100%', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 8, padding: '0.45rem 0.7rem', color: C.text, fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.73rem', color: C.dim, marginBottom: '0.3rem' }}>Valor Atual</div>
                <input type="number" defaultValue={0} style={{ width: '100%', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 8, padding: '0.45rem 0.7rem', color: C.text, fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <Label>Elementos</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {[['title','Título'],['desc','Descrição'],['pct','Porcentagem'],['values','Valores']].map(([k,l]) => (
                <Chip key={k} active={!!vis[k]} onClick={() => setVis(v => ({ ...v, [k]: !v[k] }))}>{l}</Chip>
              ))}
            </div>
          </Card>
          <Card>
            <Label sub="Twitch">Fontes de incremento</Label>
            {[['subs','⭐ Inscrições'],['resubs','🔁 Reinscriçōes'],['gifts','🎁 Gift Subs'],['prime','👑 Prime']].map(([k,l]) => (
              <Tog key={k} on={!!fontes[k]} onChange={v => setFontes(f => ({ ...f, [k]: v }))} label={l} />
            ))}
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ff4040', margin: '0.6rem 0 0.3rem' }}>YouTube</div>
            {[['ytMembers','🏅 Membros'],['ytGifts','🎁 Gift Members']].map(([k,l]) => (
              <Tog key={k} on={!!fontes[k]} onChange={v => setFontes(f => ({ ...f, [k]: v }))} label={l} />
            ))}
          </Card>
        </>
      )
    }

    if (type === 'sorteio') {
      return (
        <Card>
          <Label>Fontes de Tickets</Label>
          {[['livepix','♥ Livepix'],['twitch','■ Twitch'],['youtube','▶ YouTube'],['paypal','P PayPal'],['kick','K Kick'],['tiktok','♪ TikTok']].map(([k,l]) => (
            <Tog key={k} on={!!fontes[k]} onChange={v => setFontes(f => ({ ...f, [k]: v }))} label={l} />
          ))}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
            {[['lines','Linhas separadas'],['values','Valores'],['recent','Recentes']].map(([k,l]) => (
              <Chip key={k} active={!!vis[k]} onClick={() => setVis(v => ({ ...v, [k]: !v[k] }))}>{l}</Chip>
            ))}
          </div>
        </Card>
      )
    }

    return (
      <Card>
        <Label>Meta</Label>
        {[['title','Título'],['desc','Descrição'],['pct','Porcentagem'],['values','Valores']].map(([k,l]) => (
          <Tog key={k} on={!!vis[k]} onChange={v => setVis(vv => ({ ...vv, [k]: v }))} label={l} />
        ))}
        <div style={{ marginTop: '0.5rem' }}>
          <Link href="/dashboard/metas" style={{ fontSize: '0.75rem', color: C.primary, textDecoration: 'none' }}>
            Criar ou liberar uma meta →
          </Link>
        </div>
      </Card>
    )
  }

  // ─── Efeitos tab ─────────────────────────────────────────────────────────────
  function renderEfeitosTab() {
    if (type === 'alert') {
      return (
        <>
          <Card>
            <Label sub="Como o alerta aparece na tela">Animação de entrada</Label>
            <EffectGrid effects={ALERT_ANIMS} value={style.animIn} onChange={v => { upS('animIn', v); setPreviewAnimKey(k => k + 1) }} />
          </Card>
          <Card>
            <Label sub="Como o alerta desaparece da tela">Animação de saída</Label>
            <EffectGrid effects={OV_EXIT_ANIMS} value={style.animOut} onChange={v => upS('animOut', v)} />
          </Card>
          <Card>
            <Label>Velocidade e duração</Label>
            <RangeInput label="Velocidade do efeito" value={style.animSpeed} min={1} max={10} unit={style.animSpeed < 4 ? ' (lento)' : style.animSpeed < 7 ? ' (normal)' : ' (rápido)'} onChange={v => upS('animSpeed', v)} />
            <RangeInput label="Duração do alerta" value={style.duration} min={2} max={20} unit="s" onChange={v => upS('duration', v)} />
          </Card>
        </>
      )
    }

    if (type === 'subathon') {
      return (
        <>
          <Card>
            <Label sub="Efeito aplicado ao texto rotativo abaixo do timer">Efeito de texto</Label>
            <EffectGrid effects={TEXT_EFFECTS} value={style.textEffect} onChange={v => upS('textEffect', v)} />
          </Card>
          <Card>
            <Label>Velocidade e intervalo</Label>
            <RangeInput label="Velocidade do efeito" value={style.textEffectSpeed} min={20} max={200} unit="ms" onChange={v => upS('textEffectSpeed', v)} />
            <RangeInput label="Intervalo entre textos" value={style.textInterval} min={2} max={30} unit="s" onChange={v => upS('textInterval', v)} />
          </Card>
          <Card>
            <Label sub="Quando a cena é aberta no OBS">Animação de entrada do overlay</Label>
            <EffectGrid effects={ENTRY_ANIMS} value={style.entryAnim} onChange={v => upS('entryAnim', v)} />
          </Card>
        </>
      )
    }

    if (type === 'patrocinadores') {
      return (
        <Card>
          <Label sub="Quando a cena é aberta no OBS">Animação de entrada do overlay</Label>
          <EffectGrid effects={ENTRY_ANIMS} value={style.entryAnim} onChange={v => upS('entryAnim', v)} />
        </Card>
      )
    }

    return (
      <>
        <Card>
          <Label sub="Como a barra de progresso se move">Animação da barra</Label>
          <EffectGrid effects={BAR_ANIMS} value={style.barAnim} onChange={v => upS('barAnim', v)} />
        </Card>
        <Card>
          <Label sub="Quando a cena é aberta no OBS">Animação de entrada do overlay</Label>
          <EffectGrid effects={ENTRY_ANIMS} value={style.entryAnim} onChange={v => upS('entryAnim', v)} />
        </Card>
      </>
    )
  }

  // ─── Estilo tab ───────────────────────────────────────────────────────────────
  function renderEstiloTab() {
    return (
      <>
        <Card>
          <Label>Tipografia</Label>
          <div style={{ marginBottom: '0.8rem' }}>
            <div style={{ fontSize: '0.67rem', fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Fonte</div>
            <select value={style.font} onChange={e => upS('font', e.target.value)} style={{ width: '100%', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 8, padding: '0.45rem 0.75rem', color: C.text, fontSize: '0.83rem', outline: 'none' }}>
              {FONTS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {type === 'subathon'
              ? <RangeInput label="Cronômetro" value={style.timerSize} min={24} max={120} unit="px" onChange={v => upS('timerSize', v)} />
              : <RangeInput label="Título" value={style.titleSize} min={8} max={36} unit="px" onChange={v => upS('titleSize', v)} />}
            <RangeInput label="Apoio" value={style.supportSize} min={7} max={24} unit="px" onChange={v => upS('supportSize', v)} />
          </div>
          {type === 'subathon' && <RangeInput label="Título" value={style.titleSize} min={8} max={28} unit="px" onChange={v => upS('titleSize', v)} />}
        </Card>

        <Card>
          <Label>Cores</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <ColorIn label="Texto" value={style.textColor} onChange={v => upS('textColor', v)} />
            {type === 'subathon' || type === 'alert'
              ? <ColorIn label="Cor principal" value={style.timerColor} onChange={v => upS('timerColor', v)} />
              : <ColorIn label="Barra / Progresso" value={style.barColor} onChange={v => upS('barColor', v)} />}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <ColorIn label="Fundo" value={style.bgColor} onChange={v => upS('bgColor', v)} />
            {isBarType && <ColorIn label="Fundo da barra" value={style.barBg} onChange={v => upS('barBg', v)} />}
          </div>
          <RangeInput label="Opacidade do fundo" value={Math.round(style.bgOpacity * 100)} min={0} max={100} unit="%" onChange={v => upS('bgOpacity', v / 100)} />
        </Card>

        <Card>
          <Label>Dimensões</Label>
          <RangeInput label="Largura" value={style.width} min={100} max={1920} unit="px" onChange={v => upS('width', v)} />
          {isBarType && <RangeInput label="Espessura da barra" value={style.barThickness} min={2} max={24} unit="px" onChange={v => upS('barThickness', v)} />}
        </Card>

        {type === 'alert' && (
          <Card>
            <Label sub="Ícone à esquerda do alerta">Balão / ícone</Label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {([['circle', '○ Círculo'], ['square', '□ Quadrado'], ['none', '✕ Nenhum']] as const).map(([v, lbl]) => (
                <button key={v} onClick={() => upS('iconShape', v)} style={{ flex: 1, padding: '0.4rem 0.25rem', background: style.iconShape === v ? C.primaryBg : 'rgba(255,255,255,0.03)', border: `1px solid ${style.iconShape === v ? C.primaryB : C.cardB}`, borderRadius: 7, color: style.iconShape === v ? C.primary : C.dim, cursor: 'pointer', fontSize: '0.78rem', fontWeight: style.iconShape === v ? 700 : 400 }}>
                  {lbl}
                </button>
              ))}
            </div>
            <Label sub="Personalize os textos exibidos no alerta">Texto personalizado</Label>
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.25rem' }}>Título (deixe vazio para usar o padrão do evento)</div>
              <input value={style.titleText} onChange={e => upS('titleText', e.target.value)} placeholder="Ex: Novo inscrito!" style={{ width: '100%', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 7, padding: '0.45rem 0.7rem', color: C.text, fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.68rem', color: C.dim, marginBottom: '0.25rem' }}>Subtítulo (use $user, $valor, $msg)</div>
              <input value={style.subtitleText} onChange={e => upS('subtitleText', e.target.value)} placeholder="Ex: $user se inscreveu!" style={{ width: '100%', background: C.inner, border: `1px solid ${C.cardB}`, borderRadius: 7, padding: '0.45rem 0.7rem', color: C.text, fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <ColorIn label="Cor do título" value={style.titleColor} onChange={v => upS('titleColor', v)} />
              <ColorIn label="Cor do subtítulo" value={style.subtitleColor} onChange={v => upS('subtitleColor', v)} />
            </div>
          </Card>
        )}

        <Card>
          <Label>Borda</Label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: style.border ? '0.75rem' : 0 }}>
            <span style={{ fontSize: '0.82rem', color: C.text }}>Adicionar contorno</span>
            <div onClick={() => upS('border', !style.border)} style={{ width: 34, height: 19, background: style.border ? C.primary : 'rgba(255,255,255,0.12)', borderRadius: 10, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: style.border ? 16 : 2, width: 15, height: 15, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
            </div>
          </div>
          {style.border && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
              <ColorIn label="Cor" value={style.borderColor} onChange={v => upS('borderColor', v)} />
              <RangeInput label="Espessura" value={style.borderThick} min={1} max={10} unit="px" onChange={v => upS('borderThick', v)} />
              <RangeInput label="Raio" value={style.borderRadius} min={0} max={40} unit="px" onChange={v => upS('borderRadius', v)} />
            </div>
          )}
        </Card>
      </>
    )
  }

  // ─── Preview ─────────────────────────────────────────────────────────────────
  function renderPreview() {
    if (type === 'patrocinadores') return <PatroPreview s={style} />
    if (type === 'subathon')       return <SubathonPreview s={style} vis={vis} />
    if (type === 'sorteio')        return <SorteioPreview s={style} vis={vis} fontes={fontes} />
    if (type === 'alert')          return <AlertPreview s={style} animKey={tab === 'efeitos' ? previewAnimKey : undefined} />
    return <MetaPreview s={style} vis={vis} />
  }

  const TABS = [
    { id: 'config' as const,  label: 'Geral',    icon: '⚙' },
    { id: 'efeitos' as const, label: 'Efeitos',  icon: '✨' },
    { id: 'estilo' as const,  label: 'Estilo',   icon: '🎨' },
  ]

  return (
    <div style={{ background: C.page, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Roboto:wght@400;700&family=Montserrat:wght@400;700;800&family=Poppins:wght@400;600;700&family=Rajdhani:wght@400;600;700&family=Exo+2:wght@400;700&family=Nunito:wght@400;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link href="/dashboard/overlays" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: C.dim, textDecoration: 'none', fontSize: '0.82rem', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </Link>
        <span style={{ color: C.cardB }}>|</span>
        {evMeta && <span style={{ fontSize: '1rem' }}>{evMeta.icon}</span>}
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, flex: 1 }}>Editando: {pageLabel}</h2>
        {eventSlug && (
          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.55rem', background: C.primaryBg, color: C.primary, borderRadius: 999, border: `1px solid ${C.primaryB}`, flexShrink: 0 }}>
            OVERLAY INDIVIDUAL
          </span>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>
          <button onClick={save} style={{ padding: '0.4rem 1rem', background: savedOk ? C.greenBg : C.primaryBg, border: `1px solid ${savedOk ? C.greenB : C.primaryB}`, borderRadius: 7, color: savedOk ? C.green : C.primary, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
            {savedOk ? '✓ Salvo!' : 'Salvar'}
          </button>
          <button onClick={copyUrl} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardB}`, borderRadius: 7, color: copiedOk ? C.green : C.muted, fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            {copiedOk ? 'Copiado!' : 'Copiar URL'}
          </button>
          <a href={overlayUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardB}`, borderRadius: 7, color: C.muted, textDecoration: 'none', fontSize: '0.82rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Visualizar
          </a>
        </div>
      </div>

      {/* Main: left (tabs) + right (preview) */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Left panel */}
        <div>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.9rem', background: C.card, border: `1px solid ${C.cardB}`, borderRadius: 10, padding: '0.3rem' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '0.45rem 0.5rem',
                background: tab === t.id ? C.inner : 'transparent',
                border: tab === t.id ? `1px solid ${C.cardB}` : '1px solid transparent',
                borderRadius: 7, color: tab === t.id ? C.text : C.dim,
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: tab === t.id ? 700 : 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                transition: 'all 0.15s',
              }}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {tab === 'config'  && renderConfigTab()}
            {tab === 'efeitos' && renderEfeitosTab()}
            {tab === 'estilo'  && renderEstiloTab()}
          </div>
        </div>

        {/* Right: preview */}
        <div>
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: 12, overflow: 'hidden', position: 'sticky', top: '1rem' }}>
            {/* Preview header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', borderBottom: `1px solid ${C.cardB}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prévia ao vivo</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {tab === 'efeitos' ? (
                  <>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.primary, display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
                    <span style={{ fontSize: '0.7rem', color: C.primary, fontWeight: 600 }}>Animando preview...</span>
                  </>
                ) : (
                  <>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
                    <span style={{ fontSize: '0.7rem', color: C.dim }}>Visual em tempo real</span>
                  </>
                )}
              </div>
            </div>

            {/* URL bar */}
            <div style={{ padding: '0.5rem 1rem', borderBottom: `1px solid ${C.cardB}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: C.vdim, fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>{overlayUrl}</span>
              <button onClick={copyUrl} title="Copiar URL" style={{ flexShrink: 0, padding: '0.2rem 0.35rem', background: copiedOk ? C.greenBg : 'rgba(255,255,255,0.04)', border: `1px solid ${copiedOk ? C.greenB : C.cardB}`, borderRadius: 5, color: copiedOk ? C.green : C.vdim, cursor: 'pointer', fontSize: '0.68rem' }}>
                {copiedOk ? '✓' : '⧉'}
              </button>
            </div>

            {/* OBS tip */}
            <div style={{ padding: '0.4rem 1rem', borderBottom: `1px solid ${C.cardB}`, background: C.orangeBg }}>
              <span style={{ fontSize: '0.68rem', color: C.orange }}>
                💡 No OBS: Browser Source → marque &quot;Permitir transparência&quot;
              </span>
            </div>

            {/* Preview box */}
            <div style={{ padding: '1.5rem', background: '#0a0b11', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {renderPreview()}
            </div>

            <div style={{ padding: '0.45rem 1rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: C.vdim }}>Layout padrão — dados ao vivo via OBS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset catalog */}
      <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Catálogo de estilos</span>
          <span style={{ fontSize: '0.7rem', color: C.dim }}>— clique para aplicar ao overlay</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
          {PRESETS.map(p => (
            <PresetCard key={p.id} p={p} active={activePreset === p.id} onClick={() => applyPreset(p)} />
          ))}
        </div>
      </div>
    </div>
  )
}
