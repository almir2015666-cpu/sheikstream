'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type GoalData = {
  title?: string; goalType?: string; target?: number; current?: number
  color?: string; bg?: boolean; showNumbers?: boolean; showPct?: boolean; label?: string
}

function GoalContent() {
  const sp  = useSearchParams()
  const uid = sp.get('uid') ?? ''
  const [data, setData] = useState<GoalData | null>(null)
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!uid) return
    const load = () =>
      fetch(`/api/overlay/goal?uid=${uid}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setData(d) })
        .catch(() => {})
    load()
    ivRef.current = setInterval(load, 30_000)
    return () => { if (ivRef.current) clearInterval(ivRef.current) }
  }, [uid])

  const color   = data?.color ?? '#9b30ff'
  const target  = Number(data?.target ?? 100)
  const current = Number(data?.current ?? 0)
  const pct     = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const title   = data?.title ?? 'Meta'
  const label   = data?.label ?? ''
  const showBg  = data?.bg !== false
  const showNum = data?.showNumbers !== false
  const showP   = data?.showPct !== false

  const boxStyle: React.CSSProperties = showBg ? {
    background: 'rgba(8,9,13,0.88)',
    backdropFilter: 'blur(12px)',
    border: `1px solid ${color}44`,
    borderRadius: 14,
    padding: '18px 22px',
  } : {}

  return (
    <>
      <style>{`
        html,body,#__next,[data-nextjs-scroll-focus-boundary]{
          background:transparent!important;background-color:transparent!important;
          margin:0!important;padding:0!important;overflow:hidden!important;
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes countUp{from{opacity:0}to{opacity:1}}
        @keyframes barGlow{0%,100%{box-shadow:0 0 8px var(--c)}50%{box-shadow:0 0 16px var(--c)}}
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, background: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter',system-ui,sans-serif", pointerEvents: 'none',
      }}>
        {!uid ? (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>?uid= não configurado</div>
        ) : !data ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Carregando meta...</div>
        ) : (
          <div style={{ ...boxStyle, minWidth: 300, maxWidth: 420, animation: 'fadeUp .4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{title}</div>
              {showP && (
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color, textShadow: `0 0 20px ${color}88` }}>
                  {pct}%
                </div>
              )}
            </div>

            {/* Bar */}
            <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{
                height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                width: `${pct}%`, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: `0 0 12px ${color}99`,
              }} />
            </div>

            {showNum && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: color, fontWeight: 700 }}>
                  {current.toLocaleString('pt-BR')}
                  {label && <span style={{ fontWeight: 400, marginLeft: 3, color: 'rgba(255,255,255,0.5)' }}>{label}</span>}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                  / {target.toLocaleString('pt-BR')}{label && ` ${label}`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default function GoalOverlay() {
  return <Suspense><GoalContent /></Suspense>
}
