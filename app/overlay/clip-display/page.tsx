'use client'
import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Clip = {
  id: string
  title: string
  creator_name: string
  view_count: number
  thumbnail_url: string
  url: string
  created_at: string
}

type Config = {
  position?: string
  theme?: string
  duration?: number
  interval?: number
  showThumb?: boolean
  showViews?: boolean
}

function themeBg(t: string) {
  if (t === 'purple') return 'rgba(90,20,180,0.88)'
  if (t === 'glass')  return 'rgba(10,10,20,0.55)'
  return 'rgba(8,9,13,0.88)'
}
function themeBorder(t: string) {
  if (t === 'purple') return 'rgba(155,48,255,0.6)'
  if (t === 'glass')  return 'rgba(255,255,255,0.12)'
  return 'rgba(255,255,255,0.1)'
}
function posStyle(pos: string): React.CSSProperties {
  const base: React.CSSProperties = { position: 'fixed', zIndex: 999, maxWidth: 420 }
  if (pos === 'bottom-left')  return { ...base, bottom: 24, left: 24 }
  if (pos === 'bottom-right') return { ...base, bottom: 24, right: 24 }
  if (pos === 'top-left')     return { ...base, top: 24, left: 24 }
  if (pos === 'top-right')    return { ...base, top: 24, right: 24 }
  return { ...base, bottom: 24, left: 24 }
}

function ClipContent() {
  const sp = useSearchParams()
  const uid = sp.get('uid') ?? ''

  const [cfg,      setCfg]      = useState<Config>({})
  const [clip,     setClip]     = useState<Clip | null>(null)
  const [visible,  setVisible]  = useState(false)
  const [imgError, setImgError] = useState(false)
  const baselineRef  = useRef<string | null>(null)   // ISO timestamp of first fetch
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const position  = cfg.position  ?? 'bottom-left'
  const theme     = cfg.theme     ?? 'dark'
  const duration  = (cfg.duration ?? 10) * 1000
  const pollMs    = (cfg.interval ?? 30) * 1000
  const showThumb = cfg.showThumb ?? true
  const showViews = cfg.showViews ?? true

  useEffect(() => {
    if (!uid) return
    fetch(`/api/overlay/clip-display?uid=${uid}`)
      .then(r => r.ok ? r.json() : {})
      .then(d => setCfg(d))
      .catch(() => {})
  }, [uid])

  function showClip(c: Clip) {
    setClip(c)
    setImgError(false)
    setVisible(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), duration)
  }

  async function fetchClips(isBaseline: boolean) {
    if (!uid) return
    const url = isBaseline
      ? `/api/twitch/clips?uid=${uid}&first=1`
      : `/api/twitch/clips?uid=${uid}${baselineRef.current ? `&after=${encodeURIComponent(baselineRef.current)}` : ''}`
    try {
      const r = await fetch(url)
      if (!r.ok) return
      const { clips } = await r.json() as { clips: Clip[] }
      if (!clips?.length) return
      if (isBaseline) {
        baselineRef.current = clips[0].created_at
      } else {
        const newest = clips[0]
        if (newest.created_at > (baselineRef.current ?? '')) {
          baselineRef.current = newest.created_at
          showClip(newest)
        }
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!uid) return
    fetchClips(true)
    intervalRef.current = setInterval(() => fetchClips(false), pollMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timerRef.current)    clearTimeout(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, pollMs])

  if (!visible || !clip) return null

  const thumbUrl = clip.thumbnail_url?.replace('%{width}', '320').replace('%{height}', '180') ?? ''

  return (
    <div style={{
      ...posStyle(position),
      background: themeBg(theme),
      border: `1px solid ${themeBorder(theme)}`,
      backdropFilter: theme === 'glass' ? 'blur(16px)' : 'none',
      WebkitBackdropFilter: theme === 'glass' ? 'blur(16px)' : 'none',
      borderRadius: 12,
      padding: '0.75rem 0.9rem',
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'center',
      fontFamily: "-apple-system,'Inter',system-ui,sans-serif",
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      animation: 'clipIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <style>{`
        @keyframes clipIn {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {showThumb && !imgError && thumbUrl && (
        <img
          src={thumbUrl}
          alt=""
          onError={() => setImgError(true)}
          style={{ width: 80, height: 45, borderRadius: 7, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9b30ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#9b30ff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Novo Clipe
          </span>
        </div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e8e6f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {clip.title}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(232,230,248,0.5)', marginTop: '0.15rem' }}>
          por @{clip.creator_name}
          {showViews && clip.view_count > 0 && ` · ${clip.view_count} view${clip.view_count !== 1 ? 's' : ''}`}
        </div>
      </div>
    </div>
  )
}

export default function ClipDisplayOverlay() {
  return (
    <Suspense>
      <ClipContent />
    </Suspense>
  )
}
