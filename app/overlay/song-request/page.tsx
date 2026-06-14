'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type NowPlaying = {
  title: string
  artist: string
  thumbnail: string
  progress_ms: number
  duration_ms: number
  is_playing: boolean
}

type NextUp = {
  title: string
  artist: string
  thumbnail: string
  requester: string
}

function SongRequestOverlayContent() {
  const sp = useSearchParams()
  const uid = sp.get('uid') ?? ''
  const theme = sp.get('theme') ?? 'dark'
  const showNext = sp.get('next') !== '0'

  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null)
  const [nextUp, setNextUp] = useState<NextUp | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    document.body.style.background = 'transparent'
    document.body.style.backgroundColor = 'transparent'
    document.documentElement.style.background = 'transparent'
    document.documentElement.style.backgroundColor = 'transparent'
  }, [])

  useEffect(() => {
    if (!uid) return
    let stopped = false

    const poll = async () => {
      if (stopped) return
      try {
        const [npRes, qRes] = await Promise.all([
          fetch(`/api/spotify/now-playing?uid=${uid}`, { cache: 'no-store' }),
          fetch(`/api/song-requests?uid=${uid}`, { cache: 'no-store' }),
        ])
        const np = npRes.ok ? await npRes.json() : null
        const queue = qRes.ok ? await qRes.json() : []
        setNowPlaying(np)
        const next = Array.isArray(queue) ? queue.find((q: { status: string }) => q.status === 'pending') : null
        setNextUp(next ?? null)
        setVisible(!!np?.is_playing)
      } catch { /* ignore */ }
    }

    poll()
    const iv = setInterval(poll, 3000)
    return () => { stopped = true; clearInterval(iv) }
  }, [uid])

  if (!visible || !nowPlaying) return null

  const progress = nowPlaying.duration_ms > 0 ? (nowPlaying.progress_ms / nowPlaying.duration_ms) * 100 : 0
  const isDark = theme !== 'light'
  const bg = isDark ? 'rgba(11,12,23,0.92)' : 'rgba(255,255,255,0.92)'
  const textColor = isDark ? '#e8e6f8' : '#0a0918'
  const mutedColor = isDark ? 'rgba(232,230,248,0.6)' : 'rgba(10,9,24,0.6)'
  const green = '#1DB954'

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px' }}>
      {/* Now playing card */}
      <div style={{
        background: bg,
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '280px',
        maxWidth: '380px',
        boxShadow: `0 0 0 1px ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
      }}>
        {nowPlaying.thumbnail && (
          <img src={nowPlaying.thumbnail} alt="" style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '1px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill={green}><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
            <span style={{ fontSize: '9px', fontWeight: 700, color: green, letterSpacing: '0.5px' }}>TOCANDO AGORA</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nowPlaying.title}</div>
          <div style={{ fontSize: '11px', color: mutedColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nowPlaying.artist}</div>
          {/* Progress bar */}
          <div style={{ marginTop: '6px', height: '2px', background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: green, width: `${progress}%`, borderRadius: '99px', transition: 'width 0.5s linear' }} />
          </div>
        </div>
      </div>

      {/* Next up */}
      {showNext && nextUp && (
        <div style={{
          background: isDark ? 'rgba(11,12,23,0.75)' : 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: `0 0 0 1px ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
        }}>
          {nextUp.thumbnail && <img src={nextUp.thumbnail} alt="" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '9px', color: mutedColor, fontWeight: 600, letterSpacing: '0.3px' }}>A SEGUIR · pedido por @{nextUp.requester}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextUp.title} — {nextUp.artist}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SongRequestOverlayPage() {
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
      `}</style>
      <div style={{ padding: '8px', display: 'inline-block' }}>
        <Suspense fallback={null}>
          <SongRequestOverlayContent />
        </Suspense>
      </div>
    </>
  )
}
