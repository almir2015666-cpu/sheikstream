'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Option = { text: string; votes: number }
type Poll = { question: string; options: Option[]; status: string }

function PollContent() {
  const sp = useSearchParams()
  const uid    = sp.get('uid') ?? ''
  const color  = sp.get('color') ?? '#9b30ff'
  const bg     = sp.get('bg') !== 'false'
  const [poll, setPoll] = useState<Poll | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = (poll?.options ?? []).reduce((s, o) => s + o.votes, 0)

  useEffect(() => {
    if (!uid) return
    const load = () =>
      fetch(`/api/poll?uid=${uid}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setPoll(d) })
        .catch(() => {})
    load()
    intervalRef.current = setInterval(load, 3000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [uid])

  const boxStyle: React.CSSProperties = bg ? {
    background: 'rgba(8,9,13,0.88)',
    backdropFilter: 'blur(12px)',
    border: `1px solid ${color}44`,
    borderRadius: 16,
    padding: '20px 24px',
  } : {}

  return (
    <>
      <style>{`
        html,body,#__next,[data-nextjs-scroll-focus-boundary]{
          background:transparent!important;background-color:transparent!important;
          margin:0!important;padding:0!important;overflow:hidden!important;
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fillBar{from{width:0%}to{width:var(--w)}}
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, background: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter',system-ui,sans-serif", pointerEvents: 'none',
      }}>
        {!uid ? (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>?uid= não configurado</div>
        ) : !poll ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Nenhuma enquete ativa</div>
        ) : (
          <div style={{ ...boxStyle, minWidth: 320, maxWidth: 440, animation: 'fadeUp .4s ease' }}>
            <div style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em',
              color: color, textTransform: 'uppercase', marginBottom: 10,
            }}>
              {poll.status === 'closed' ? '🔒 ENCERRADA' : '📊 ENQUETE'}
            </div>
            <div style={{
              fontSize: '1.05rem', fontWeight: 800, color: '#fff',
              marginBottom: 16, lineHeight: 1.35,
            }}>
              {poll.question}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {poll.options.map((opt, i) => {
                const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0
                const isLeader = total > 0 && opt.votes === Math.max(...poll.options.map(o => o.votes))
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{
                        fontSize: '0.85rem', fontWeight: isLeader ? 700 : 500,
                        color: isLeader ? '#fff' : 'rgba(255,255,255,0.7)',
                      }}>
                        {isLeader && total > 0 ? '✦ ' : ''}{opt.text}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isLeader ? color : 'rgba(255,255,255,0.5)' }}>
                        {pct}% <span style={{ fontWeight: 400, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>({opt.votes})</span>
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        background: isLeader ? color : `${color}88`,
                        width: `${pct}%`,
                        transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                        boxShadow: isLeader ? `0 0 8px ${color}` : 'none',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 12, fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>
              {total} voto{total !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function PollOverlay() {
  return <Suspense><PollContent /></Suspense>
}
