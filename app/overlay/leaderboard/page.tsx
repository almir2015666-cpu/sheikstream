'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Entry = { viewer_login: string; points: number; total_earned: number }

function LeaderboardOverlayContent() {
  const sp = useSearchParams()
  const uid = sp.get('uid') ?? ''
  const limit = Math.min(Number(sp.get('limit') ?? '5'), 10)
  const theme = sp.get('theme') ?? 'dark'
  const title = sp.get('title') ?? 'Top Viewers'
  const currency = sp.get('currency') ?? 'pontos'

  const [entries, setEntries] = useState<Entry[]>([])

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
        const res = await fetch(`/api/loyalty/leaderboard?uid=${uid}&limit=${limit}`, { cache: 'no-store' })
        if (res.ok) setEntries(await res.json())
      } catch { /* ignore */ }
    }
    poll()
    const iv = setInterval(poll, 15000)
    return () => { stopped = true; clearInterval(iv) }
  }, [uid, limit])

  if (!entries.length) return null

  const isDark = theme !== 'light'
  const bg = isDark ? 'rgba(11,12,23,0.92)' : 'rgba(255,255,255,0.92)'
  const textColor = isDark ? '#e8e6f8' : '#0a0918'
  const mutedColor = isDark ? 'rgba(232,230,248,0.55)' : 'rgba(10,9,24,0.55)'
  const gold = '#f59e0b'
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{
      background: bg,
      backdropFilter: 'blur(14px)',
      borderRadius: '14px',
      overflow: 'hidden',
      minWidth: '240px',
      maxWidth: '300px',
      boxShadow: `0 0 0 1px ${border}`,
    }}>
      {/* Header */}
      <div style={{ padding: '10px 14px 8px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '14px' }}>🏆</span>
        <span style={{ fontSize: '12px', fontWeight: 800, color: gold, letterSpacing: '0.3px' }}>{title}</span>
      </div>

      {/* Entries */}
      <div style={{ padding: '6px 0' }}>
        {entries.map((entry, idx) => (
          <div key={entry.viewer_login} style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: idx < 3 ? '14px' : '11px', width: '20px', textAlign: 'center', flexShrink: 0, color: idx >= 3 ? mutedColor : undefined }}>
              {idx < 3 ? medals[idx] : `#${idx + 1}`}
            </span>
            <span style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.viewer_login}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: gold, flexShrink: 0 }}>
              {entry.points.toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '6px 14px 10px', borderTop: `1px solid ${border}`, textAlign: 'center' }}>
        <span style={{ fontSize: '10px', color: mutedColor }}>{currency} acumulados</span>
      </div>
    </div>
  )
}

export default function LeaderboardOverlayPage() {
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
          font-family: -apple-system, 'Inter', system-ui, sans-serif;
        }
      `}</style>
      <div style={{ padding: '8px', display: 'inline-block' }}>
        <Suspense fallback={null}>
          <LeaderboardOverlayContent />
        </Suspense>
      </div>
    </>
  )
}
