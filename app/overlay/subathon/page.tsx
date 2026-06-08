'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
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
}

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

  // Fetch config from DB (auto-updates when editor saves)
  useEffect(() => {
    if (!uid) return
    const loadCfg = () =>
      fetch(`/api/overlay-config/subathon?uid=${uid}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d || !Object.keys(d).length) return
          const mapped: Partial<Cfg> = {
            ...(d.style ?? {}),
            showTitle:      d.vis?.title       ?? d.showTitle       ?? true,
            showTags:       d.vis?.tags        ?? d.showTags        ?? true,
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

      {cfg.showLastContrib && (
        <div style={{
          color: cfg.textColor,
          opacity: 0.45,
          fontSize: cfg.supportSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: warningColor, display: 'inline-block' }} />
          última contribuição aparecerá aqui
        </div>
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
      `}</style>
      <div style={{ padding: '12px', display: 'inline-block' }}>
        <Suspense fallback={null}>
          <SubathonOverlayContent />
        </Suspense>
      </div>
    </>
  )
}
