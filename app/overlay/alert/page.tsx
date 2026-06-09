'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { playAlertSound } from '@/app/lib/sound'

type AlertEvent = {
  id: string
  createdAt?: string
  slug?: string | null
  type: 'sub' | 'resub' | 'giftsub' | 'follow' | 'bits' | 'donation' | 'member' | 'command'
  user: string
  extra?: string
  amount?: number
}

const ALL_EVENT_SLUGS = [
  'twitch-sub','twitch-giftsub','twitch-resub','twitch-follow','twitch-bits',
  'livepix','paypal','kick-sub','kick-follow','kick-giftsub',
  'youtube-member','youtube-giftmember',
]

type Cfg = {
  bgColor: string; bgOpacity: number; textColor: string; accentColor: string
  borderRadius: number; border: boolean; borderColor: string; borderThick: number
  font: string; titleSize: number; supportSize: number; width: number
  animIn: string; animOut: string; animSpeed: number; duration: number; timerColor: string
  titleText: string; subtitleText: string; titleColor: string; subtitleColor: string
  iconShape: 'circle' | 'square' | 'none'
  iconAnim: 'none' | 'pulse' | 'spin' | 'bounce' | 'shake'
  cardEffect: 'none' | 'glow' | 'pulse'
  icon: string
  customArt: string
  soundEnabled: boolean; soundDataUrl: string; soundVolume: number
}

const DEF: Cfg = {
  bgColor: '#0b0c17', bgOpacity: 0.92, textColor: '#ffffff', accentColor: '#9146FF',
  borderRadius: 14, border: true, borderColor: '#9146FF', borderThick: 1,
  font: 'Inter', titleSize: 20, supportSize: 16, width: 480,
  animIn: 'slide-right', animOut: 'fade', animSpeed: 5, duration: 6, timerColor: '#9146FF',
  titleText: '', subtitleText: '', titleColor: '#9146FF', subtitleColor: '#ffffff',
  iconShape: 'circle', iconAnim: 'none', cardEffect: 'none',
  icon: '', customArt: '',
  soundEnabled: true, soundDataUrl: '', soundVolume: 70,
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

const SK_KEYFRAME_ANIMS = new Set(['shake','swing','rubberband','heartbeat','roll-in','tada','wobble','flash'])

function getAnimStyle(animIn: string): React.CSSProperties {
  if (SK_KEYFRAME_ANIMS.has(animIn)) return { opacity: 0 }
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
    'blur-in':     'none',
    'drop-in':     'translateY(-120px)',
    'skew':        'skewX(30deg) translateX(-60%)',
    'jack-in':     'scale(0.05) rotate(-200deg)',
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
    'zoom-out':   `transform ${d}s cubic-bezier(.22,.68,0,1.1), opacity ${d6}s ease`,
    'zoom-in':    `transform ${d}s cubic-bezier(.22,.68,0,1.2), opacity ${d6}s ease`,
    'flip-x':     `transform ${d}s cubic-bezier(.25,.46,.45,.94), opacity ${d6}s ease`,
    'flip-y':     `transform ${d}s cubic-bezier(.25,.46,.45,.94), opacity ${d6}s ease`,
    'rotate-in':  `transform ${d}s cubic-bezier(.22,.68,0,1.2), opacity ${d6}s ease`,
    'drop-in':    `transform ${d}s cubic-bezier(.22,.68,0,1.3), opacity ${d6}s ease`,
    'blur-in':    `filter ${d}s ease, opacity ${d}s ease`,
    'skew':       `transform ${d}s cubic-bezier(.22,.68,0,1.1), opacity ${d6}s ease`,
    'jack-in':    `transform ${d}s cubic-bezier(.22,.68,0,1.6), opacity ${d6}s ease`,
  }
  return transitions[animIn] ?? `transform ${d}s cubic-bezier(.22,.68,0,1.2), opacity ${d6}s ease`
}

function AlertCard({ ev, cfg, onDone }: { ev: AlertEvent; cfg: Cfg; onDone: () => void }) {
  const [visible, setVisible] = useState(false)
  // outerRef: exit animation layer — React only sets display+position here, NEVER opacity/transform/transition
  // So direct DOM writes to opacity/transform survive React re-renders from the polling loop
  const outerRef = useRef<HTMLDivElement>(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const meta = EVENT_META[ev.type] ?? EVENT_META.command
  const accent = cfg.timerColor !== '#9146FF' ? cfg.timerColor : (cfg.accentColor !== '#9146FF' ? cfg.accentColor : meta.color)
  const titleClr = cfg.titleColor || accent
  const subClr = cfg.subtitleColor || cfg.textColor

  const animOut = cfg.animOut ?? 'fade'
  const exitDurS = ((11 - (cfg.animSpeed ?? 5)) * 0.2).toFixed(2)
  const exitDurMs = parseFloat(exitDurS) * 1000

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50)
    let t2: ReturnType<typeof setTimeout>
    let t3: ReturnType<typeof setTimeout>
    let animEndHandler: ((e: AnimationEvent) => void) | null = null

    t2 = setTimeout(() => {
      const el = outerRef.current
      if (!el || animOut === 'none') {
        t3 = setTimeout(() => onDoneRef.current(), 50)
        return
      }
      // Use CSS @keyframes sk-out-* directly — same engine as entrance keyframe animations.
      // Setting el.style.animation directly bypasses React (outerRef only has display+position in its React style prop).
      const validAnims = new Set(['fade','slide-right','slide-left','slide-up','slide-down','zoom-out','zoom-in','flip-x'])
      const kfName = validAnims.has(animOut) ? `sk-out-${animOut}` : 'sk-out-fade'
      el.style.animation = `${kfName} ${exitDurS}s ease-out forwards`
      animEndHandler = (e: AnimationEvent) => {
        if (e.target !== el) return
        el.removeEventListener('animationend', animEndHandler as EventListener)
        animEndHandler = null
        onDoneRef.current()
      }
      el.addEventListener('animationend', animEndHandler as EventListener)
      // Fallback: unmount even if animationend doesn't fire (e.g. old OBS CEF)
      t3 = setTimeout(() => {
        if (animEndHandler && outerRef.current) {
          outerRef.current.removeEventListener('animationend', animEndHandler as EventListener)
          animEndHandler = null
        }
        onDoneRef.current()
      }, exitDurMs + 500)
    }, cfg.duration * 1000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      const el = outerRef.current
      if (el) {
        if (animEndHandler) el.removeEventListener('animationend', animEndHandler as EventListener)
        el.style.animation = ''
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!visible) return
    playAlertSound(ev.slug, {
      soundEnabled: cfg.soundEnabled !== false,
      soundDataUrl: cfg.soundDataUrl ?? '',
      soundVolume: cfg.soundVolume ?? 70,
    })
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

  const isKeyframeAnim = SK_KEYFRAME_ANIMS.has(cfg.animIn)
  const entranceDur = `${((11-(cfg.animSpeed??5))*0.085).toFixed(2)}s`

  const entranceAnim = visible && isKeyframeAnim
    ? `sk-e-${cfg.animIn} ${entranceDur} ease forwards`
    : undefined

  // wrapperStyle: entrance only — outerRef handles exit via direct DOM (immune to React re-renders)
  const wrapperStyle: React.CSSProperties = {
    animation: entranceAnim,
    ...(!isKeyframeAnim
      ? (visible ? { transform: 'none', opacity: 1, filter: 'none' } : hiddenStyle)
      : (visible ? {} : { opacity: 0 })),
    transition: !isKeyframeAnim ? (visible ? transition : 'none') : undefined,
  }

  const ANIM_CSS = `
    @keyframes sk-icon-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}
    @keyframes sk-icon-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes sk-icon-bounce{0%,100%{transform:translateY(0)}45%{transform:translateY(-10px)}}
    @keyframes sk-icon-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
    @keyframes sk-card-glow{0%,100%{box-shadow:0 0 22px ${accent}66}50%{box-shadow:0 0 70px ${accent}dd,0 0 30px ${accent}99}}
    @keyframes sk-card-pulse{0%,100%{box-shadow:0 0 18px ${accent}55}50%{box-shadow:0 0 48px ${accent}99}}
    @keyframes sk-e-shake{0%{transform:translateX(-90px);opacity:0}25%{opacity:1}38%{transform:translateX(18px)}54%{transform:translateX(-11px)}68%{transform:translateX(6px)}82%{transform:translateX(-2px)}100%{transform:translateX(0)}}
    @keyframes sk-e-swing{0%{transform:rotate(-25deg);opacity:0}20%{opacity:1}42%{transform:rotate(12deg)}62%{transform:rotate(-7deg)}76%{transform:rotate(4deg)}88%{transform:rotate(-1deg)}100%{transform:rotate(0deg)}}
    @keyframes sk-e-rubberband{0%{opacity:0;transform:scale(0.1)}35%{opacity:1;transform:scale(1.28,.72)}50%{transform:scale(.78,1.22)}65%{transform:scale(1.12,.88)}80%{transform:scale(.96,1.04)}100%{transform:scale(1)}}
    @keyframes sk-e-heartbeat{0%{opacity:0;transform:scale(.6)}14%{opacity:1;transform:scale(1.1)}28%{transform:scale(.96)}42%{transform:scale(1.14)}70%{transform:scale(.98)}100%{opacity:1;transform:scale(1)}}
    @keyframes sk-e-roll-in{0%{opacity:0;transform:translateX(-120%) rotate(-360deg)}100%{opacity:1;transform:translateX(0) rotate(0deg)}}
    @keyframes sk-e-tada{0%{opacity:0;transform:scale(.8)}10%{opacity:1;transform:scale(.8) rotate(-3deg)}20%,40%,60%{transform:scale(1.08) rotate(3deg)}30%,50%{transform:scale(1.08) rotate(-3deg)}70%{transform:scale(1.04)}100%{opacity:1;transform:scale(1) rotate(0deg)}}
    @keyframes sk-e-wobble{0%{opacity:0;transform:translateX(-28px)}15%{opacity:1;transform:translateX(18px) rotate(2deg)}30%{transform:translateX(-12px) rotate(-2deg)}45%{transform:translateX(8px) rotate(1deg)}60%{transform:translateX(-4px) rotate(-.5deg)}75%{transform:translateX(2px)}100%{opacity:1;transform:translateX(0)}}
    @keyframes sk-e-flash{0%,50%{opacity:0}25%,75%{opacity:1}100%{opacity:1}}
    @keyframes sk-out-fade{from{opacity:1}to{opacity:0}}
    @keyframes sk-out-slide-right{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(110%)}}
    @keyframes sk-out-slide-left{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-110%)}}
    @keyframes sk-out-slide-up{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-80px)}}
    @keyframes sk-out-slide-down{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(80px)}}
    @keyframes sk-out-zoom-out{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(0.05)}}
    @keyframes sk-out-zoom-in{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(2.2)}}
    @keyframes sk-out-flip-x{from{opacity:1;transform:rotateX(0deg)}to{opacity:0;transform:rotateX(90deg)}}
  `

  // Custom art: replace entire card with image
  if (cfg.customArt) return (
    <>
      <style>{ANIM_CSS}</style>
      {/* outerRef: exit layer — React only sets display here, never opacity/transform/transition */}
      <div ref={outerRef} style={{ display: 'inline-block' }}>
        <img
          src={cfg.customArt}
          alt=""
          style={{
            width: cfg.width,
            maxHeight: 200,
            objectFit: 'contain',
            borderRadius: cfg.borderRadius,
            ...wrapperStyle,
          }}
        />
      </div>
    </>
  )

  return (
    <>
      <style>{ANIM_CSS}</style>
      {/* outerRef: exit animation layer — React only sets display+position here */}
      <div ref={outerRef} style={{ display: 'inline-block', position: 'relative' }}>
      {/* inner: entrance animation — React fully controls wrapperStyle */}
      <div style={{ position: 'relative', display: 'inline-block', ...wrapperStyle }}>
      {/* Card effect in its own div — isolated so entrance animation uses transition freely */}
      {cardEffect !== 'none' && (
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: cfg.borderRadius,
          pointerEvents: 'none',
          animation: `sk-card-${cardEffect} 2s ease-in-out 0s infinite`,
        }} />
      )}
      <div style={{
        width: cfg.width,
        background: bg,
        border: cfg.border ? `${cfg.borderThick}px solid ${accent}66` : 'none',
        borderRadius: cfg.borderRadius,
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        fontFamily: `'${cfg.font}', -apple-system, system-ui, sans-serif`,
        boxShadow: cardEffect === 'none' ? `0 0 30px ${accent}33` : undefined,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {iconShape !== 'none' && (
          <div style={{
            width: 52, height: 52,
            borderRadius: iconShape === 'circle' ? '50%' : 12,
            background: `${accent}22`, border: `1px solid ${accent}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, flexShrink: 0, overflow: 'hidden',
            fontFamily: "'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji','Android Emoji',sans-serif",
            ...iconAnimStyle,
          }}>
            {(cfg.icon || meta.icon).startsWith('data:') || (cfg.icon || '').startsWith('http')
              ? <img src={cfg.icon || meta.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
              : (cfg.icon || meta.icon)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: cfg.titleSize, fontWeight: 800, color: titleClr, lineHeight: 1.2 }}>
            {titleLabel}
          </div>
          <div style={{ fontSize: cfg.supportSize, color: subClr, opacity: 0.88, marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cfg.subtitleText ? cfg.subtitleText
              .replace(/\$user/g, ev.user || 'Anônimo')
              .replace(/\$valor/g, String(ev.amount ?? ''))
              .replace(/\$months/g, ev.extra ? ev.extra.replace(' meses','') : '')
              .replace(/\$count/g, String(ev.amount ?? ''))
              .replace(/\$msg/g, ev.extra ?? '') : (
              <>
                <strong>{ev.user}</strong>
                {ev.amount ? ` · ${ev.amount}${ev.type === 'bits' ? ' bits' : ev.type === 'donation' ? ' R$' : '×'}` : ''}
                {ev.extra ? ` · ${ev.extra}` : ''}
              </>
            )}
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: `${accent}22`, borderRadius: `0 0 ${cfg.borderRadius}px ${cfg.borderRadius}px`, overflow: 'hidden' }}>
          <div style={{
            width: visible ? '0%' : '100%',
            height: '100%',
            background: accent,
            transition: visible ? `width ${cfg.duration}s linear` : 'none',
          }} />
        </div>
      </div>
      </div>
      </div>
    </>
  )
}

function AlertOverlayContent() {
  const sp = useSearchParams()
  const uid = sp.get('uid') ?? ''
  const eventSlug = sp.get('event') ?? ''

  // cfgMap holds one config per event slug (+ '' for the generic fallback)
  const cfgMapRef = useRef<Record<string, Cfg>>({})
  const [, forceUpdate] = useState(0)

  const [queue, setQueue] = useState<AlertEvent[]>([])
  const [current, setCurrent] = useState<AlertEvent | null>(null)
  const seenIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    document.body.style.background = 'transparent'
    document.body.style.backgroundColor = 'transparent'
    document.documentElement.style.background = 'transparent'
    document.documentElement.style.backgroundColor = 'transparent'
  }, [])

  // Load configs for all event types (and the generic fallback).
  // This lets each event type use its own sound, color, and animation.
  useEffect(() => {
    if (!uid) return
    const load = (key: string) =>
      fetch(`/api/overlay-config/${key}?uid=${uid}`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(d => d?.style ? { ...DEF, ...d.style } as Cfg : null)
        .catch(() => null)

    const loadAll = () => {
      const slugsToLoad = eventSlug ? [eventSlug] : ALL_EVENT_SLUGS
      Promise.all([
        load('alert'),
        ...slugsToLoad.map(s => load(`alert-${s}`)),
      ]).then(([generic, ...eventCfgs]) => {
        const map: Record<string, Cfg> = { '': generic ?? DEF }
        slugsToLoad.forEach((s, i) => { map[s] = eventCfgs[i] ?? generic ?? DEF })
        cfgMapRef.current = map
        forceUpdate(n => n + 1)
      })
    }

    loadAll()
    const iv = setInterval(loadAll, 15000)
    return () => clearInterval(iv)
  }, [uid, eventSlug])

  const getCfg = (ev: AlertEvent): Cfg => {
    const map = cfgMapRef.current
    if (ev.slug && map[ev.slug]) return map[ev.slug]
    return map[''] ?? DEF
  }

  useEffect(() => {
    if (!uid) return
    const baseUrl = `/api/overlay/alert?uid=${uid}${eventSlug ? '&event=' + eventSlug : ''}`
    let stopped = false
    let iv: ReturnType<typeof setInterval> | null = null
    let lastSeenTs = ''
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, current])

  if (!current) return null

  return (
    <AlertCard
      key={current.id}
      ev={current}
      cfg={getCfg(current)}
      onDone={() => setCurrent(null)}
    />
  )
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
