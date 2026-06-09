'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type AlertEvent = {
  id: string
  type: 'sub' | 'resub' | 'giftsub' | 'follow' | 'bits' | 'donation' | 'member' | 'command'
  user: string
  extra?: string
  amount?: number
  createdAt: number
}

type Cfg = {
  bgColor: string; bgOpacity: number; textColor: string; accentColor: string
  borderRadius: number; border: boolean; borderColor: string; borderThick: number
  font: string; titleSize: number; supportSize: number; width: number
  animIn: string; animSpeed: number; duration: number; timerColor: string
  titleText: string; subtitleText: string; titleColor: string; subtitleColor: string
  iconShape: 'circle' | 'square' | 'none'
}

const DEF: Cfg = {
  bgColor: '#0b0c17', bgOpacity: 0.92, textColor: '#ffffff', accentColor: '#9146FF',
  borderRadius: 14, border: true, borderColor: '#9146FF', borderThick: 1,
  font: 'Inter', titleSize: 15, supportSize: 12, width: 480,
  animIn: 'slide-right', animSpeed: 5, duration: 6, timerColor: '#9146FF',
  titleText: '', subtitleText: '', titleColor: '#9146FF', subtitleColor: '#ffffff',
  iconShape: 'circle',
}

const EVENT_META: Record<string, { icon: string; label: string; color: string }> = {
  sub:      { icon: '⭐', label: 'Novo inscrito!',      color: '#9146FF' },
  resub:    { icon: '🔁', label: 'Reinscrição!',        color: '#9146FF' },
  giftsub:  { icon: '🎁', label: 'Gift Sub!',           color: '#c084fc' },
  follow:   { icon: '❤️',  label: 'Novo seguidor!',     color: '#ff6eb6' },
  bits:     { icon: '💎', label: 'Bits enviados!',      color: '#fbbf24' },
  donation: { icon: '💸', label: 'Doação recebida!',    color: '#39ff14' },
  member:   { icon: '🏅', label: 'Novo membro!',        color: '#ff4040' },
  command:  { icon: '⚡', label: 'Evento!',             color: '#22d3ee' },
}

function hexToRgb(hex: string): string {
  if (!hex || hex === 'transparent' || !hex.startsWith('#')) return '0,0,0'
  const r = parseInt(hex.slice(1, 3), 16) || 0
  const g = parseInt(hex.slice(3, 5), 16) || 0
  const b = parseInt(hex.slice(5, 7), 16) || 0
  return `${r},${g},${b}`
}

function getAnimStyle(animIn: string): React.CSSProperties {
  const transforms: Record<string, string> = {
    'slide-right': 'translateX(-120%)',
    'slide-left':  'translateX(120%)',
    'slide-up':    'translateY(60px)',
    'slide-down':  'translateY(-60px)',
    'fade':        'none',
    'zoom-in':     'scale(0.4)',
    'zoom-out':    'scale(1.5)',
    'bounce-in':   'translateY(-80px)',
    'flip-x':      'rotateX(90deg)',
    'flip-y':      'rotateY(90deg)',
    'rotate-in':   'rotate(-180deg) scale(0.5)',
    'elastic':     'translateX(-120%)',
    'shake':       'translateX(-120%)',
    'blur-in':     'none',
    'drop-in':     'translateY(-120px)',
    'swing':       'rotate(-30deg)',
  }
  return {
    transform: transforms[animIn] ?? 'translateX(-120%)',
    opacity: 0,
    filter: animIn === 'blur-in' ? 'blur(20px)' : 'none',
  }
}

function getAnimTransition(animIn: string, animSpeed = 5): string {
  const d = ((11 - animSpeed) * 0.2).toFixed(2)
  const d6 = ((11 - animSpeed) * 0.12).toFixed(2)
  const transitions: Record<string, string> = {
    'bounce-in':  `transform ${d}s cubic-bezier(.22,.68,0,1.8), opacity ${d6}s ease`,
    'elastic':    `transform ${d}s cubic-bezier(.22,.68,0,2), opacity ${d6}s ease`,
    'shake':      `transform ${d}s cubic-bezier(.22,.68,0,1.2), opacity ${d6}s ease`,
    'zoom-out':   `transform ${d}s cubic-bezier(.22,.68,0,1), opacity ${d6}s ease`,
    'flip-x':     `transform ${d}s ease, opacity ${d6}s ease`,
    'flip-y':     `transform ${d}s ease, opacity ${d6}s ease`,
    'rotate-in':  `transform ${d}s cubic-bezier(.22,.68,0,1.2), opacity ${d6}s ease`,
    'drop-in':    `transform ${d}s cubic-bezier(.22,.68,0,1.3), opacity ${d6}s ease`,
    'swing':      `transform ${d}s cubic-bezier(.22,.68,0,1.2), opacity ${d6}s ease`,
    'blur-in':    `filter ${d}s ease, opacity ${d}s ease`,
  }
  return transitions[animIn] ?? `transform ${d}s cubic-bezier(.22,.68,0,1.2), opacity ${d6}s ease`
}

function AlertCard({ ev, cfg }: { ev: AlertEvent; cfg: Cfg }) {
  const [visible, setVisible] = useState(false)
  const meta = EVENT_META[ev.type] ?? EVENT_META.command
  const accent = cfg.timerColor !== '#9146FF' ? cfg.timerColor : (cfg.accentColor !== '#9146FF' ? cfg.accentColor : meta.color)
  const titleClr = cfg.titleColor || accent
  const subClr = cfg.subtitleColor || cfg.textColor

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const hiddenStyle = getAnimStyle(cfg.animIn)
  const transition = getAnimTransition(cfg.animIn, cfg.animSpeed)

  const isTransparent = cfg.bgColor === 'transparent' || cfg.bgOpacity === 0
  const bg = isTransparent ? 'transparent' : `rgba(${hexToRgb(cfg.bgColor)},${cfg.bgOpacity})`

  const titleLabel = cfg.titleText || meta.label
  const iconShape = cfg.iconShape ?? 'circle'

  return (
    <div style={{
      width: cfg.width,
      background: bg,
      border: cfg.border ? `${cfg.borderThick}px solid ${accent}66` : 'none',
      borderRadius: cfg.borderRadius,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      fontFamily: `'${cfg.font}', -apple-system, system-ui, sans-serif`,
      boxShadow: `0 0 30px ${accent}33`,
      position: 'relative',
      overflow: 'hidden',
      ...(visible ? { transform: 'none', opacity: 1, filter: 'none' } : hiddenStyle),
      transition: visible ? transition : 'none',
    }}>
      {iconShape !== 'none' && (
        <div style={{
          width: 44, height: 44,
          borderRadius: iconShape === 'circle' ? '50%' : 10,
          background: `${accent}22`, border: `1px solid ${accent}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {meta.icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: cfg.titleSize, fontWeight: 800, color: titleClr, lineHeight: 1.2 }}>
          {titleLabel}
        </div>
        <div style={{ fontSize: cfg.supportSize + 1, color: subClr, opacity: 0.85, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {cfg.subtitleText ? cfg.subtitleText.replace('$user', ev.user).replace('$valor', String(ev.amount ?? '')) : (
            <>
              <strong>{ev.user}</strong>
              {ev.amount ? ` · ${ev.amount}${ev.type === 'bits' ? ' bits' : ev.type === 'donation' ? ' R$' : '×'}` : ''}
              {ev.extra ? ` · ${ev.extra}` : ''}
            </>
          )}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `${accent}22`, borderRadius: `0 0 ${cfg.borderRadius}px ${cfg.borderRadius}px`, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: accent,
          animation: `sk-alert-bar ${cfg.duration}s linear forwards`,
        }} />
      </div>
    </div>
  )
}

function AlertOverlayContent() {
  const sp = useSearchParams()
  const uid = sp.get('uid') ?? ''
  const eventSlug = sp.get('event') ?? ''
  const cfgType = eventSlug ? `alert-${eventSlug}` : 'alert'

  const [cfg, setCfg] = useState<Cfg>(DEF)
  const [queue, setQueue] = useState<AlertEvent[]>([])
  const [current, setCurrent] = useState<AlertEvent | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seenIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    document.body.style.background = 'transparent'
    document.body.style.backgroundColor = 'transparent'
    document.documentElement.style.background = 'transparent'
    document.documentElement.style.backgroundColor = 'transparent'
  }, [])

  useEffect(() => {
    if (!uid) return
    const loadCfg = () =>
      fetch(`/api/overlay-config/${cfgType}?uid=${uid}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.style) setCfg(prev => ({ ...DEF, ...prev, ...d.style })) })
        .catch(() => {})
    loadCfg()
    const iv = setInterval(loadCfg, 15000)
    return () => clearInterval(iv)
  }, [uid, cfgType])

  useEffect(() => {
    if (!uid) return
    const apiUrl = eventSlug
      ? `/api/overlay/alert?uid=${uid}&event=${eventSlug}`
      : `/api/overlay/alert?uid=${uid}`
    const poll = () =>
      fetch(apiUrl)
        .then(r => r.ok ? r.json() : null)
        .then((data: AlertEvent[] | null) => {
          if (data && data.length > 0) {
            setQueue(prev => {
              const newEvents = data.filter(e => !seenIds.current.has(e.id))
              newEvents.forEach(e => seenIds.current.add(e.id))
              return [...prev, ...newEvents]
            })
          }
        })
        .catch(() => {})
    poll()
    const iv = setInterval(poll, 2000)
    return () => clearInterval(iv)
  }, [uid, eventSlug])

  useEffect(() => {
    if (current) return
    if (queue.length === 0) return
    const [next, ...rest] = queue
    setCurrent(next)
    setQueue(rest)
    timerRef.current = setTimeout(() => setCurrent(null), (cfg.duration + 0.5) * 1000)
  }, [queue, current, cfg.duration])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  if (!current) return null

  return <AlertCard key={current.id} ev={current} cfg={cfg} />
}

export default function AlertOverlayPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body {
          background: transparent !important;
          background-color: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        body > * {
          background: transparent !important;
        }
        @keyframes sk-alert-bar {
          from { width: 100% }
          to   { width: 0% }
        }
      `}</style>
      <div style={{ padding: '12px', display: 'inline-block', position: 'relative' }}>
        <Suspense fallback={null}>
          <AlertOverlayContent />
        </Suspense>
      </div>
    </>
  )
}
