'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { playAlertSound, playTts } from '@/app/lib/sound'

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

// Higher number = higher priority (raid/giftsub jump the queue)
const PRIORITY: Record<string, number> = {
  'twitch-giftsub': 5, 'kick-giftsub': 5, 'youtube-giftmember': 5,
  'twitch-sub': 4, 'kick-sub': 4, 'youtube-member': 4,
  'twitch-resub': 3,
  'twitch-bits': 2, 'livepix': 2, 'paypal': 2,
  'twitch-follow': 1, 'kick-follow': 1,
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.startsWith('data:video/')
}

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
  ttsEnabled: boolean; ttsVoice: string; ttsRate: number; ttsPitch: number; ttsVol: number; ttsText: string
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
  ttsEnabled: false, ttsVoice: '', ttsRate: 0.95, ttsPitch: 1, ttsVol: 1, ttsText: '',
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

function AlertCard({ ev, cfg, onDone, debug }: { ev: AlertEvent; cfg: Cfg; onDone: () => void; debug?: boolean }) {
  const [visible, setVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [dbgLog, setDbgLog] = useState<string[]>([])
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const stamp = () => new Date().toISOString().slice(11, 23)
  const dbg = (msg: string) => {
    if (!debug) return
    setDbgLog(prev => [...prev.slice(-12), `${stamp()} ${msg}`])
  }

  const meta = EVENT_META[ev.type] ?? EVENT_META.command
  const accent = cfg.timerColor !== '#9146FF' ? cfg.timerColor : (cfg.accentColor !== '#9146FF' ? cfg.accentColor : meta.color)
  const titleClr = cfg.titleColor || accent
  const subClr = cfg.subtitleColor || cfg.textColor

  const animOut = cfg.animOut ?? 'fade'
  const exitDurMs = Math.max(400, (11 - (cfg.animSpeed ?? 5)) * 200)

  useEffect(() => {
    dbg(`MOUNT animOut=${animOut} dur=${cfg.duration}s exitMs=${exitDurMs}`)
    // Entrance: set visible after 50ms so CSS transition has a "from" state to diff against
    const t1 = setTimeout(() => { setVisible(true); dbg('visible=true (entrance start)') }, 50)
    // Exit: switch to isExiting — CSS keyframe on inner div fires on compositor thread (no rAF needed)
    const t2 = setTimeout(() => { setIsExiting(true); dbg(`isExiting=true anim=sk-out-${animOut}`) }, cfg.duration * 1000)
    // Unmount: after exit animation completes
    const t3 = setTimeout(() => { dbg('onDone → unmount'); onDoneRef.current() }, cfg.duration * 1000 + exitDurMs + 50)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!visible) return
    playAlertSound(ev.slug, {
      soundEnabled: cfg.soundEnabled !== false,
      soundDataUrl: cfg.soundDataUrl ?? '',
      soundVolume: cfg.soundVolume ?? 70,
    }).then(() => {
      if (!cfg.ttsEnabled) return
      return playTts(
        buildTtsText(ev, cfg),
        cfg.ttsVoice || 'pt-BR',
        cfg.ttsRate  ?? 0.95,
        cfg.ttsVol   ?? 1,
      )
    }).catch(() => { /* sound/tts failed silently */ })
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

  // wrapperStyle: handles both entrance (CSS transition/keyframe) and exit (CSS keyframe on compositor)
  // When isExiting: only `animation` is set — no conflicting opacity/transform inline styles so the
  // keyframe animation can freely control those properties (inline styles override animation values)
  const wrapperStyle: React.CSSProperties = isExiting
    ? (animOut === 'none'
        ? { opacity: 0 }
        : { animation: `sk-out-${animOut} ${exitDurMs}ms ease forwards` })
    : {
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
    @keyframes sk-keep-awake{from{opacity:0.001}to{opacity:0.002}}
  `

  // Custom art: replace entire card with image or video
  if (cfg.customArt) return (
    <>
      <style>{ANIM_CSS}</style>
      <div style={{ display: 'inline-block', position: 'relative' }}>
        {isVideoUrl(cfg.customArt) ? (
          <video
            src={cfg.customArt}
            autoPlay loop muted playsInline
            style={{ width: cfg.width, maxHeight: 300, objectFit: 'contain', borderRadius: cfg.borderRadius, display: 'block', ...wrapperStyle }}
          />
        ) : (
          <img
            src={cfg.customArt}
            alt=""
            style={{ width: cfg.width, maxHeight: 200, objectFit: 'contain', borderRadius: cfg.borderRadius, display: 'block', ...wrapperStyle }}
          />
        )}
      </div>
    </>
  )

  return (
    <>
      <style>{ANIM_CSS}</style>
      <div style={{ display: 'inline-block', position: 'relative' }}>
      {/* 1px invisible div — keeps GPU compositor active so exit transition fires reliably in OBS */}
      <div style={{ position: 'absolute', width: 1, height: 1, opacity: 0.001, pointerEvents: 'none', animation: 'sk-keep-awake 1s linear infinite' }} />
      {/* inner div: entrance AND exit animations via wrapperStyle (CSS compositor thread) */}
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
      {debug && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.85)', color: '#0f0', fontFamily: 'monospace',
          fontSize: 11, padding: '6px 10px', zIndex: 9999, lineHeight: 1.5,
          pointerEvents: 'none',
        }}>
          <div><b>visible:</b> {String(visible)} | <b>isExiting:</b> {String(isExiting)} | <b>animOut:</b> {animOut} | <b>exitMs:</b> {exitDurMs}</div>
          <div><b>wrapStyle:</b> {JSON.stringify(isExiting ? (animOut === 'none' ? {opacity:0} : {animation:`sk-out-${animOut} ${exitDurMs}ms ease forwards`}) : {visible})}</div>
          {dbgLog.map((l, i) => <div key={i} style={{ color: '#aaffaa' }}>{l}</div>)}
        </div>
      )}
    </>
  )
}

function buildTtsText(ev: AlertEvent, cfg: Cfg): string {
  const meta = EVENT_META[ev.type] ?? EVENT_META.command
  const titleLabel = cfg.titleText || meta.label
  const subLabel = cfg.subtitleText
    ? cfg.subtitleText
        .replace(/\$user/g,   ev.user || 'Anônimo')
        .replace(/\$valor/g,  String(ev.amount ?? ''))
        .replace(/\$months/g, ev.extra ? ev.extra.replace(' meses', '') : '')
        .replace(/\$count/g,  String(ev.amount ?? ''))
        .replace(/\$msg/g,    ev.extra ?? '')
    : [
        ev.user,
        ev.amount ? `${ev.amount}${ev.type === 'bits' ? ' bits' : ev.type === 'donation' ? ' reais' : ''}` : '',
        ev.extra ?? '',
      ].filter(Boolean).join(', ')
  const template = cfg.ttsText || '$title. $subtitle'
  return template
    .replace('$title',    titleLabel)
    .replace('$subtitle', subLabel)
    .replace(/\$user/g,   ev.user || 'Anônimo')
    .replace(/\$valor/g,  String(ev.amount ?? ''))
    .replace(/\$months/g, ev.extra ? ev.extra.replace(' meses', '') : '')
    .replace(/\$count/g,  String(ev.amount ?? ''))
    .replace(/\$msg/g,    ev.extra ?? '')
    .trim()
}

function AlertOverlayContent() {
  const sp = useSearchParams()
  const uid = sp.get('uid') ?? ''
  const eventSlug = sp.get('event') ?? ''
  const debug = sp.get('debug') === '1'
  const ttsTest = sp.get('tts_test') === '1'

  // Quick TTS smoke test: open overlay with ?tts_test=1 to verify audio chain
  useEffect(() => {
    if (!ttsTest) return
    const t = setTimeout(() => playTts('teste de leitura em voz', 'pt-BR', 1, 1), 1000)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsTest])

  // cfgMap holds one config per event slug (+ '' for the generic fallback)
  // Each entry may also have `variations: Cfg[]` for random selection
  const cfgMapRef = useRef<Record<string, { cfg: Cfg; variations?: Cfg[] }>>({})
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
        .then(d => {
          if (!d?.style) return null
          const cfg = { ...DEF, ...d.style } as Cfg
          const variations = Array.isArray(d.variations)
            ? (d.variations as Partial<Cfg>[]).map(v => ({ ...DEF, ...v } as Cfg))
            : undefined
          return { cfg, variations }
        })
        .catch(() => null)

    const loadAll = () => {
      const slugsToLoad = eventSlug ? [eventSlug] : ALL_EVENT_SLUGS
      Promise.all([
        load('alert'),
        ...slugsToLoad.map(s => load(`alert-${s}`)),
      ]).then(([generic, ...eventCfgs]) => {
        const def = { cfg: DEF }
        const map: Record<string, { cfg: Cfg; variations?: Cfg[] }> = { '': generic ?? def }
        slugsToLoad.forEach((s, i) => { map[s] = eventCfgs[i] ?? generic ?? def })
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
    const entry = (ev.slug && map[ev.slug]) ? map[ev.slug] : (map[''] ?? { cfg: DEF })
    // Random variation: if variations exist, pick one at random (including the base cfg)
    if (entry.variations && entry.variations.length > 0) {
      const all = [entry.cfg, ...entry.variations]
      return all[Math.floor(Math.random() * all.length)]
    }
    return entry.cfg
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
            if (newEvents.length === 0) return prev
            // Sort queue by priority so higher-priority alerts (raid, giftsub) jump ahead
            return [...prev, ...newEvents].sort((a, b) =>
              (PRIORITY[b.slug ?? ''] ?? 0) - (PRIORITY[a.slug ?? ''] ?? 0)
            )
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
      debug={debug}
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
