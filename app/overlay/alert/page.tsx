'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type AlertEvent = {
  id: string
  createdAt?: string
  type: 'sub' | 'resub' | 'giftsub' | 'follow' | 'bits' | 'donation' | 'member' | 'command'
  user: string
  extra?: string
  amount?: number
}

type Cfg = {
  bgColor: string; bgOpacity: number; textColor: string; accentColor: string
  borderRadius: number; border: boolean; borderColor: string; borderThick: number
  font: string; titleSize: number; supportSize: number; width: number
  animIn: string; animSpeed: number; duration: number; timerColor: string
  titleText: string; subtitleText: string; titleColor: string; subtitleColor: string
  iconShape: 'circle' | 'square' | 'none'
  iconAnim: 'none' | 'pulse' | 'spin' | 'bounce' | 'shake'
  cardEffect: 'none' | 'glow' | 'pulse'
  soundEnabled: boolean; soundUrl: string; soundVolume: number
}

const DEF: Cfg = {
  bgColor: '#0b0c17', bgOpacity: 0.92, textColor: '#ffffff', accentColor: '#9146FF',
  borderRadius: 14, border: true, borderColor: '#9146FF', borderThick: 1,
  font: 'Inter', titleSize: 15, supportSize: 12, width: 480,
  animIn: 'slide-right', animSpeed: 5, duration: 6, timerColor: '#9146FF',
  titleText: '', subtitleText: '', titleColor: '#9146FF', subtitleColor: '#ffffff',
  iconShape: 'circle', iconAnim: 'none', cardEffect: 'none',
  soundEnabled: true, soundUrl: '', soundVolume: 70,
}

function playAlertSound(soundUrl: string, soundVolume: number) {
  const vol = soundVolume / 100
  if (soundUrl) {
    const a = new Audio(soundUrl)
    a.volume = vol
    a.play().catch(() => {})
    return
  }
  try {
    const ctx = new AudioContext()
    const tone = (f: number, t: number, d: number) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination); o.type = 'sine'
      o.frequency.setValueAtTime(f, ctx.currentTime + t)
      g.gain.setValueAtTime(0, ctx.currentTime + t)
      g.gain.linearRampToValueAtTime(vol * 0.4, ctx.currentTime + t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d)
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d + 0.01)
    }
    tone(880, 0, 0.15)
    tone(1108, 0.18, 0.25)
  } catch {}
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

  useEffect(() => {
    if (!visible) return
    if (cfg.soundEnabled !== false) {
      playAlertSound(cfg.soundUrl ?? '', cfg.soundVolume ?? 70)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const hiddenStyle = getAnimStyle(cfg.animIn)
  const transition = getAnimTransition(cfg.animIn, cfg.animSpeed)

  const isTransparent = cfg.bgColor === 'transparent' || cfg.bgOpacity === 0
  const bg = isTransparent ? 'transparent' : `rgba(${hexToRgb(cfg.bgColor)},${cfg.bgOpacity})`

  const titleLabel = cfg.titleText || meta.label
  const iconShape = cfg.iconShape ?? 'circle'
  const iconAnim = cfg.iconAnim ?? 'none'
  const cardEffect = cfg.cardEffect ?? 'none'

  const iconAnimStyle: React.CSSProperties = iconAnim === 'none' ? {} : {
    animation: `sk-icon-${iconAnim} ${iconAnim === 'spin' ? '2s linear' : '1.5s ease-in-out'} infinite`,
  }

  // Multiple CSS animations on same element: entrance (shake/swing) + card effect (box-shadow).
  // animation and transition coexist because they animate different CSS properties.
  const isShakeSwing = cfg.animIn === 'shake' || cfg.animIn === 'swing'
  const entranceDur = `${((11-(cfg.animSpeed??5))*0.065).toFixed(2)}s`
  const animParts: string[] = []
  if (visible && isShakeSwing) animParts.push(`sk-e-${cfg.animIn} ${entranceDur} ease forwards`)
  if (visible && cardEffect !== 'none') {
    animParts.push(`sk-card-${cardEffect} 2s ease-in-out ${isShakeSwing ? entranceDur : '0s'} infinite backwards`)
  }
  const animStr = animParts.length > 0 ? animParts.join(', ') : undefined

  return (
    <>
      <style>{`
        @keyframes sk-icon-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}
        @keyframes sk-icon-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes sk-icon-bounce{0%,100%{transform:translateY(0)}45%{transform:translateY(-10px)}}
        @keyframes sk-icon-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        @keyframes sk-card-glow{0%,100%{box-shadow:0 0 20px ${accent}55}50%{box-shadow:0 0 65px ${accent}cc,0 0 25px ${accent}88}}
        @keyframes sk-card-pulse{0%,100%{box-shadow:0 0 20px ${accent}44}50%{box-shadow:0 0 40px ${accent}88}}
        @keyframes sk-e-shake{0%{transform:translateX(-90px);opacity:0}25%{opacity:1}38%{transform:translateX(18px)}54%{transform:translateX(-11px)}68%{transform:translateX(6px)}82%{transform:translateX(-2px)}100%{transform:translateX(0)}}
        @keyframes sk-e-swing{0%{transform:rotate(-25deg);opacity:0}20%{opacity:1}42%{transform:rotate(12deg)}62%{transform:rotate(-7deg)}76%{transform:rotate(4deg)}88%{transform:rotate(-1deg)}100%{transform:rotate(0deg)}}
      `}</style>
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
        boxShadow: cardEffect === 'none' ? `0 0 30px ${accent}33` : undefined,
        position: 'relative',
        overflow: 'hidden',
        animation: animStr,
        ...(isShakeSwing
          ? (visible ? {} : { opacity: 0 })
          : (visible ? { transform: 'none', opacity: 1, filter: 'none' } : hiddenStyle)),
        transition: isShakeSwing ? 'none' : (visible ? transition : 'none'),
      }}>
        {iconShape !== 'none' && (
          <div style={{
            width: 44, height: 44,
            borderRadius: iconShape === 'circle' ? '50%' : 10,
            background: `${accent}22`, border: `1px solid ${accent}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0, ...iconAnimStyle,
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
            width: visible ? '0%' : '100%',
            height: '100%',
            background: accent,
            transition: visible ? `width ${cfg.duration}s linear` : 'none',
          }} />
        </div>
      </div>
    </>
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
  const isInitialized = useRef(false)

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
    const baseUrl = `/api/overlay/alert?uid=${uid}${eventSlug ? '&event=' + eventSlug : ''}`
    let stopped = false
    let iv: ReturnType<typeof setInterval> | null = null

    // lastSeenTs advances as events are seen (used for ?after= filtering with created_at)
    let lastSeenTs = ''
    // watermarked: true after the first poll primes seenIds so old events are never shown
    let watermarked = false

    const poll = () => {
      if (stopped) return
      const url = lastSeenTs ? `${baseUrl}&after=${encodeURIComponent(lastSeenTs)}` : baseUrl
      fetch(url, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then((data: AlertEvent[] | null) => {
          if (!data || stopped) return
          setQueue(prev => {
            if (!watermarked) {
              // First response: silently prime seenIds (watermark) — don't show anything yet
              watermarked = true
              data.forEach(e => {
                seenIds.current.add(e.id)
                if (e.createdAt && e.createdAt > lastSeenTs) lastSeenTs = e.createdAt
              })
              return prev
            }
            const newEvents = data.filter(e => !seenIds.current.has(e.id))
            newEvents.forEach(e => {
              seenIds.current.add(e.id)
              if (e.createdAt && e.createdAt > lastSeenTs) lastSeenTs = e.createdAt
            })
            return newEvents.length > 0 ? [...prev, ...newEvents] : prev
          })
        })
        .catch(() => { if (!watermarked) watermarked = true })
    }

    isInitialized.current = true
    poll()
    iv = setInterval(poll, 1000)

    return () => { stopped = true; if (iv) clearInterval(iv) }
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
