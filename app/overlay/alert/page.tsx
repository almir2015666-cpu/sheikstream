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
  animIn: string; duration: number
}

const DEF: Cfg = {
  bgColor: '#0b0c17', bgOpacity: 0.92, textColor: '#ffffff', accentColor: '#9146FF',
  borderRadius: 14, border: true, borderColor: '#9146FF', borderThick: 1,
  font: 'Inter', titleSize: 15, supportSize: 12, width: 480,
  animIn: 'slide-right', duration: 6,
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

const ANIM_IN: Record<string, string> = {
  'slide-right': 'translateX(-120%)',
  'slide-left':  'translateX(120%)',
  'fade-up':     'translateY(20px)',
  'zoom-in':     'scale(0.5)',
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function AlertCard({ ev, cfg }: { ev: AlertEvent; cfg: Cfg }) {
  const [visible, setVisible] = useState(false)
  const meta = EVENT_META[ev.type] ?? EVENT_META.command
  const accent = cfg.accentColor !== '#9146FF' ? cfg.accentColor : (meta.color)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const fromTransform = ANIM_IN[cfg.animIn] ?? ANIM_IN['slide-right']
  const bg = cfg.bgOpacity === 0 ? 'transparent' : `rgba(${hexToRgb(cfg.bgColor)},${cfg.bgOpacity})`

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
      transform: visible ? 'none' : fromTransform,
      opacity: visible ? 1 : 0,
      transition: 'transform 0.45s cubic-bezier(.22,.68,0,1.2), opacity 0.35s ease',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: `${accent}22`, border: `1px solid ${accent}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        {meta.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: cfg.titleSize, fontWeight: 800, color: accent, lineHeight: 1.2 }}>
          {meta.label}
        </div>
        <div style={{ fontSize: cfg.supportSize + 1, color: cfg.textColor, opacity: 0.8, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <strong>{ev.user}</strong>
          {ev.amount ? ` · ${ev.amount}${ev.type === 'bits' ? ' bits' : ev.type === 'donation' ? ' R$' : '×'}` : ''}
          {ev.extra ? ` · ${ev.extra}` : ''}
        </div>
      </div>
      {/* Progress bar */}
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
  const cfgRaw = sp.get('cfg') ?? ''

  const [cfg, setCfg] = useState<Cfg>(() => {
    if (cfgRaw) { try { return { ...DEF, ...JSON.parse(atob(cfgRaw)) } } catch {} }
    return DEF
  })
  const [queue, setQueue] = useState<AlertEvent[]>([])
  const [current, setCurrent] = useState<AlertEvent | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!uid) return
    const loadCfg = () =>
      fetch(`/api/overlay-config/alert?uid=${uid}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.style) setCfg(prev => ({ ...prev, ...d.style })) })
        .catch(() => {})
    loadCfg()
    const iv = setInterval(loadCfg, 15000)
    return () => clearInterval(iv)
  }, [uid])

  // Poll for pending alerts
  useEffect(() => {
    if (!uid) return
    const poll = () =>
      fetch(`/api/overlay/alert?uid=${uid}`)
        .then(r => r.ok ? r.json() : null)
        .then((data: AlertEvent[] | null) => {
          if (data && data.length > 0) {
            setQueue(prev => {
              const ids = new Set(prev.map(e => e.id))
              return [...prev, ...data.filter(e => !ids.has(e.id))]
            })
          }
        })
        .catch(() => {})
    poll()
    const iv = setInterval(poll, 2000)
    return () => clearInterval(iv)
  }, [uid])

  // Drain queue one at a time
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
        html, body, #__next, [data-nextjs-scroll-focus-boundary] {
          background: transparent !important;
          background-color: transparent !important;
          margin: 0 !important; padding: 0 !important;
          overflow: hidden !important;
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
