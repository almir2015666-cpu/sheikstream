'use client'
import { useEffect, useState, useRef, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

type SubathonState = {
  title: string
  end_time: string | null
  paused_remaining: number | null
  is_active: boolean
  is_paused: boolean
  seconds_per_sub: number
  seconds_per_bits100: number
  seconds_per_livepix: number
}

type Cfg = {
  font: string
  timerSize: number
  titleSize: number
  supportSize: number
  width: number
  bgColor: string
  bgOpacity: number
  textColor: string
  timerColor: string
  border: boolean
  borderColor: string
  borderThick: number
  borderRadius: number
  showTitle: boolean
  showTags: boolean
  showLastContrib: boolean
  textEffect: string
  textEffectSpeed: number
  textInterval: number
  textPosition: string
}

const DEF: Cfg = {
  font: 'Inter',
  timerSize: 120,
  titleSize: 14,
  supportSize: 11,
  width: 560,
  bgColor: '#0b0c17',
  bgOpacity: 0.92,
  textColor: '#ffffff',
  timerColor: '#9146FF',
  border: false,
  borderColor: '#9146FF',
  borderThick: 1,
  borderRadius: 16,
  showTitle: true,
  showTags: true,
  showLastContrib: true,
  textEffect: 'typewriter',
  textEffectSpeed: 60,
  textInterval: 5,
  textPosition: 'bottom',
}

const EFFECT_KEYFRAMES = `
@keyframes sk-slide-right { from { transform: translateX(-110%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
@keyframes sk-slide-left  { from { transform: translateX(110%);  opacity: 0 } to { transform: translateX(0); opacity: 1 } }
@keyframes sk-fade-up     { from { transform: translateY(18px);  opacity: 0 } to { transform: translateY(0);  opacity: 1 } }
@keyframes sk-fade-down   { from { transform: translateY(-18px); opacity: 0 } to { transform: translateY(0);  opacity: 1 } }
@keyframes sk-zoom-in     { from { transform: scale(0.4);        opacity: 0 } to { transform: scale(1);      opacity: 1 } }
@keyframes sk-flip-x      { from { transform: rotateX(90deg);    opacity: 0 } to { transform: rotateX(0deg); opacity: 1 } }
@keyframes sk-bounce {
  0%   { transform: translateY(-40px); opacity: 0 }
  60%  { transform: translateY(6px);   opacity: 1 }
  80%  { transform: translateY(-4px) }
  100% { transform: translateY(0) }
}
@keyframes sk-neon-pulse {
  0%   { opacity: 0; text-shadow: 0 0 0px transparent }
  40%  { opacity: 1; text-shadow: 0 0 18px var(--tc), 0 0 40px var(--tc) }
  70%  { opacity: 0.8; text-shadow: 0 0 6px var(--tc) }
  100% { opacity: 1; text-shadow: 0 0 12px var(--tc), 0 0 24px var(--tc)44 }
}
@keyframes sk-glitch-1 { 0%,100%{clip-path:inset(0 0 100% 0)} 20%{clip-path:inset(20% 0 60% 0)} 40%{clip-path:inset(50% 0 20% 0)} 60%{clip-path:inset(10% 0 80% 0)} 80%{clip-path:inset(70% 0 5% 0)} }
@keyframes sk-glitch-2 { 0%,100%{clip-path:inset(100% 0 0 0)} 20%{clip-path:inset(60% 0 20% 0)} 40%{clip-path:inset(20% 0 55% 0)} 60%{clip-path:inset(80% 0 10% 0)} 80%{clip-path:inset(5% 0 75% 0)} }
@keyframes sk-wave-char { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes sk-blink { 0%,100%{opacity:1} 50%{opacity:0} }
`

function fmt(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

const RANDOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
function randChar() { return RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)] }

function useTypewriter(text: string, speed: number, active: boolean) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!active) { setDisplayed(''); setDone(false); return }
    setDisplayed(''); setDone(false)
    let i = 0
    const iv = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(iv); setDone(true) }
    }, speed)
    return () => clearInterval(iv)
  }, [text, speed, active])
  return { displayed, done }
}

function useMatrix(text: string, speed: number, active: boolean) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!active) { setDisplayed(''); return }
    let frame = 0
    const totalFrames = Math.ceil(text.length * 2.5)
    const iv = setInterval(() => {
      frame++
      const progress = frame / totalFrames
      const revealedCount = Math.floor(progress * text.length)
      let out = ''
      for (let i = 0; i < text.length; i++) {
        if (i < revealedCount) out += text[i]
        else if (i < revealedCount + 3) out += randChar()
        else out += ' '
      }
      setDisplayed(out)
      if (frame >= totalFrames) { clearInterval(iv); setDisplayed(text) }
    }, speed * 0.7)
    return () => clearInterval(iv)
  }, [text, speed, active])
  return displayed
}

function TextEffectDisplay({
  text, effect, speed, color, fontSize, fontWeight,
}: {
  text: string; effect: string; speed: number; color: string; fontSize: number; fontWeight?: number
}) {
  const [key, setKey] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => { setKey(k => k + 1); setVisible(true) }, 50)
    return () => clearTimeout(t)
  }, [text])

  const { displayed: twText, done: twDone } = useTypewriter(text, speed, visible && effect === 'typewriter')
  const matrixText = useMatrix(text, speed, visible && effect === 'matrix')

  if (!visible) return null

  const baseStyle: React.CSSProperties = {
    fontSize, fontWeight: fontWeight ?? 700, color,
    display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden',
  }

  // CSS-animated effects
  const cssEffects: Record<string, React.CSSProperties> = {
    'slide-right': { animation: `sk-slide-right 0.55s cubic-bezier(.22,.68,0,1.2) forwards`, ...baseStyle },
    'slide-left':  { animation: `sk-slide-left  0.55s cubic-bezier(.22,.68,0,1.2) forwards`, ...baseStyle },
    'fade-up':     { animation: `sk-fade-up     0.5s ease forwards`, ...baseStyle },
    'fade-down':   { animation: `sk-fade-down   0.5s ease forwards`, ...baseStyle },
    'zoom-in':     { animation: `sk-zoom-in     0.5s cubic-bezier(.34,1.56,.64,1) forwards`, ...baseStyle },
    'flip-x':      { animation: `sk-flip-x      0.6s ease forwards`, perspective: '400px', ...baseStyle },
    'bounce':      { animation: `sk-bounce      0.7s cubic-bezier(.22,.68,0,1.2) forwards`, ...baseStyle },
    'neon-pulse':  { animation: `sk-neon-pulse  0.8s ease forwards`, ['--tc' as string]: color, ...baseStyle },
  }

  if (cssEffects[effect]) {
    return <span key={key} style={cssEffects[effect]}>{text}</span>
  }

  if (effect === 'typewriter') {
    return (
      <span key={key} style={baseStyle}>
        {twText}
        {!twDone && <span style={{ animation: 'sk-blink 0.8s step-end infinite', opacity: 1 }}>|</span>}
      </span>
    )
  }

  if (effect === 'matrix') {
    return <span key={key} style={{ ...baseStyle, fontFamily: 'monospace' }}>{matrixText || text}</span>
  }

  if (effect === 'wave') {
    return (
      <span key={key} style={baseStyle}>
        {text.split('').map((ch, i) => (
          <span key={i} style={{
            display: 'inline-block',
            animation: `sk-wave-char 0.6s ease ${i * 0.045}s both`,
          }}>{ch === ' ' ? ' ' : ch}</span>
        ))}
      </span>
    )
  }

  if (effect === 'glitch') {
    return (
      <span key={key} style={{ ...baseStyle, position: 'relative' }}>
        <span style={{ position: 'relative', zIndex: 1 }}>{text}</span>
        <span style={{ position: 'absolute', inset: 0, color: '#ff0040', opacity: 0.7, animation: 'sk-glitch-1 0.4s steps(1) forwards', transform: 'translateX(-2px)' }}>{text}</span>
        <span style={{ position: 'absolute', inset: 0, color: '#00ffff', opacity: 0.6, animation: 'sk-glitch-2 0.4s steps(1) 0.05s forwards', transform: 'translateX(2px)' }}>{text}</span>
      </span>
    )
  }

  if (effect === 'scramble') {
    return <span key={key} style={baseStyle}>{text.split('').map((ch, i) => (
      <span key={i} style={{ display: 'inline-block', animation: `sk-wave-char 0.4s ease ${i * 0.03}s both`, filter: 'blur(0)' }}>{ch === ' ' ? ' ' : ch}</span>
    ))}</span>
  }

  // fallback: fade-up
  return <span key={key} style={{ ...baseStyle, animation: 'sk-fade-up 0.5s ease forwards' }}>{text}</span>
}

function RotatingText({
  messages, effect, speed, interval, color, fontSize, accentColor,
}: {
  messages: string[]; effect: string; speed: number; interval: number
  color: string; fontSize: number; accentColor: string
}) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (messages.length <= 1) return
    const iv = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % messages.length)
        setVisible(true)
      }, 400)
    }, interval * 1000)
    return () => clearInterval(iv)
  }, [messages.length, interval])

  if (!messages.length) return null
  const text = messages[idx] ?? ''

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, overflow: 'hidden', minHeight: fontSize * 1.5,
      opacity: visible ? 1 : 0, transition: 'opacity 0.35s ease',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, flexShrink: 0, boxShadow: `0 0 8px ${accentColor}` }} />
      <TextEffectDisplay
        text={text}
        effect={effect}
        speed={speed}
        color={color}
        fontSize={fontSize}
        fontWeight={600}
      />
    </div>
  )
}

function SubathonOverlayContent() {
  const sp = useSearchParams()
  const uid = sp.get('uid') ?? ''
  const cfgRaw = sp.get('cfg') ?? ''

  const [cfg, setCfg] = useState<Cfg>(() => {
    if (cfgRaw) { try { return { ...DEF, ...JSON.parse(atob(cfgRaw)) } } catch {} }
    return DEF
  })
  const [state, setState] = useState<SubathonState | null>(null)
  const [remaining, setRemaining] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch config from DB
  useEffect(() => {
    if (!uid) return
    const loadCfg = () =>
      fetch(`/api/overlay-config/subathon?uid=${uid}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d || !Object.keys(d).length) return
          const mapped: Partial<Cfg> = {
            ...(d.style ?? {}),
            showTitle:       d.vis?.title       ?? d.showTitle       ?? true,
            showTags:        d.vis?.tags        ?? d.showTags        ?? true,
            showLastContrib: d.vis?.lastContrib ?? d.showLastContrib ?? true,
          }
          setCfg(prev => ({ ...prev, ...mapped }))
        })
        .catch(() => {})
    loadCfg()
    const iv = setInterval(loadCfg, 10000)
    return () => clearInterval(iv)
  }, [uid])

  useEffect(() => {
    if (!uid) return
    const load = () =>
      fetch(`/api/overlay/subathon?uid=${uid}`)
        .then(r => r.json())
        .then(d => setState(d))
        .catch(() => {})
    load()
    const iv = setInterval(load, 5000)
    return () => clearInterval(iv)
  }, [uid])

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    if (!state?.is_active) { setRemaining(state?.paused_remaining ?? 0); return }
    if (state.is_paused) { setRemaining(state.paused_remaining ?? 0); return }
    if (!state.end_time) { setRemaining(0); return }
    const calc = () => {
      setRemaining(Math.max(0, Math.floor((new Date(state.end_time!).getTime() - Date.now()) / 1000)))
    }
    calc()
    tickRef.current = setInterval(calc, 1000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [state])

  if (!state?.is_active) return null

  const warningColor = remaining < 300 ? '#ff4444' : remaining < 1800 ? '#ffaa00' : cfg.timerColor
  const bg = cfg.bgOpacity === 0
    ? 'transparent'
    : `rgba(${hexToRgb(cfg.bgColor)},${cfg.bgOpacity})`

  function fmtDur(secs: number): string {
    if (secs >= 3600) return `${Math.floor(secs / 3600)}h`
    if (secs >= 60) return `${Math.floor(secs / 60)}m${secs % 60 > 0 ? ` ${secs % 60}s` : ''}`
    return `${secs}s`
  }

  const RULE_TAGS = [
    { label: `+${fmtDur(state.seconds_per_sub || 120)} TWITCH SUB`, color: cfg.timerColor },
    { label: `+${fmtDur(state.seconds_per_livepix || 60)} LIVEPIX`, color: '#39ff14' },
    { label: `+${fmtDur(state.seconds_per_bits100 || 30)} BITS/100`, color: '#fbbf24' },
  ]

  // Rotating messages for the text effect display
  const rotatingMessages = [
    `+${fmtDur(state.seconds_per_sub || 120)} por Sub Twitch`,
    `+${fmtDur(state.seconds_per_livepix || 60)} por doação Livepix`,
    `+${fmtDur(state.seconds_per_bits100 || 30)} por 100 Bits`,
    state.title ? `📺 ${state.title}` : '📺 Subathon ao vivo!',
    'Contribua e ganhe mais tempo!',
    'Obrigado por apoiar a live!',
  ].filter(Boolean)

  const textBlock = cfg.showLastContrib ? (
    <RotatingText
      messages={rotatingMessages}
      effect={cfg.textEffect || 'typewriter'}
      speed={cfg.textEffectSpeed || 60}
      interval={cfg.textInterval || 5}
      color={`rgba(${hexToRgb(cfg.textColor)},0.65)`}
      fontSize={cfg.supportSize + 1}
      accentColor={warningColor}
    />
  ) : null

  return (
    <div style={{
      fontFamily: `'${cfg.font}', -apple-system, system-ui, sans-serif`,
      width: cfg.width,
      background: bg,
      borderRadius: cfg.borderRadius,
      border: cfg.border ? `${cfg.borderThick}px solid ${cfg.borderColor}` : 'none',
      padding: '24px 32px 20px',
      textAlign: 'center',
      boxShadow: `0 0 40px ${warningColor}22`,
    }}>
      {cfg.showLastContrib && cfg.textPosition === 'top' && (
        <div style={{ marginBottom: 10 }}>{textBlock}</div>
      )}

      {cfg.showTitle && (
        <div style={{
          fontSize: cfg.titleSize,
          color: cfg.textColor,
          opacity: 0.7,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          {state.title || 'SUBATHON'}
        </div>
      )}

      <div style={{
        fontSize: cfg.timerSize,
        fontWeight: 900,
        color: warningColor,
        lineHeight: 1,
        letterSpacing: '-2px',
        textShadow: `0 0 30px ${warningColor}66, 0 0 60px ${warningColor}33`,
        marginBottom: cfg.showTags || cfg.showLastContrib ? 14 : 0,
      }}>
        {state.is_paused && (
          <div style={{ fontSize: cfg.titleSize, color: '#ffaa00', fontWeight: 700, marginBottom: 4 }}>⏸ PAUSADO</div>
        )}
        {fmt(remaining)}
      </div>

      {cfg.showTags && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          {RULE_TAGS.map(t => (
            <span key={t.label} style={{
              padding: '3px 10px',
              background: `${t.color}22`,
              color: t.color,
              border: `1px solid ${t.color}55`,
              borderRadius: 999,
              fontSize: cfg.supportSize + 1,
              fontWeight: 700,
              letterSpacing: '0.03em',
            }}>
              {t.label}
            </span>
          ))}
        </div>
      )}

      {cfg.showLastContrib && cfg.textPosition !== 'top' && (
        <div style={{ marginTop: 4 }}>{textBlock}</div>
      )}
    </div>
  )
}

export default function SubathonOverlayPage() {
  return (
    <>
      <style>{`
        html, body, #__next, [data-nextjs-scroll-focus-boundary] {
          background: transparent !important;
          background-color: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        @keyframes sk-keep-awake{from{opacity:0.001}to{opacity:0.002}}
        ${EFFECT_KEYFRAMES}
      `}</style>
      {/* keep-awake: keeps GPU compositor active in OBS */}
      <div style={{ position: 'fixed', width: 1, height: 1, opacity: 0.001, pointerEvents: 'none', animation: 'sk-keep-awake 1s linear infinite' }} />
      <div style={{ padding: '12px', display: 'inline-block' }}>
        <Suspense fallback={null}>
          <SubathonOverlayContent />
        </Suspense>
      </div>
    </>
  )
}
