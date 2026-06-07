'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type SubathonState = {
  title: string
  end_time: string | null
  paused_remaining: number | null
  is_active: boolean
  is_paused: boolean
}

function fmt(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function SubathonOverlayContent() {
  const sp = useSearchParams()
  const uid = sp.get('uid') ?? ''
  const [state, setState] = useState<SubathonState | null>(null)
  const [remaining, setRemaining] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Client-side countdown
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    if (!state?.is_active) { setRemaining(state?.paused_remaining ?? 0); return }
    if (state.is_paused) { setRemaining(state.paused_remaining ?? 0); return }
    if (!state.end_time) { setRemaining(0); return }

    const calc = () => {
      const secs = Math.max(0, Math.floor((new Date(state.end_time!).getTime() - Date.now()) / 1000))
      setRemaining(secs)
    }
    calc()
    tickRef.current = setInterval(calc, 1000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [state])

  if (!state?.is_active) return null

  const totalSecs = state.end_time
    ? Math.floor((new Date(state.end_time).getTime() - Date.now()) / 1000) + remaining
    : (state.paused_remaining ?? 0)

  const warningColor = remaining < 300 ? '#ff4444' : remaining < 1800 ? '#ffaa00' : '#39ff14'

  return (
    <div style={{
      fontFamily: "-apple-system,'Inter',system-ui,sans-serif",
      padding: '16px 28px',
      background: 'rgba(11,12,23,0.93)',
      borderRadius: '14px',
      border: `1px solid ${warningColor}44`,
      display: 'flex',
      alignItems: 'center',
      gap: '18px',
      boxShadow: `0 0 20px ${warningColor}22`,
      minWidth: '280px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={warningColor} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        {state.is_paused && <span style={{ fontSize: '0.5rem', color: '#ffaa00', fontWeight: 700, marginTop: '3px' }}>PAUSE</span>}
      </div>
      <div>
        <div style={{ fontSize: '0.62rem', color: 'rgba(232,230,248,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{state.title}</div>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: warningColor, letterSpacing: '-1px', lineHeight: 1, textShadow: `0 0 15px ${warningColor}66` }}>
          {fmt(remaining)}
        </div>
      </div>
    </div>
  )
}

export default function SubathonOverlayPage() {
  return (
    <>
      <style>{`html,body{margin:0;padding:0;background:transparent!important;}`}</style>
      <div style={{ padding: '12px' }}>
        <Suspense fallback={null}>
          <SubathonOverlayContent />
        </Suspense>
      </div>
    </>
  )
}
