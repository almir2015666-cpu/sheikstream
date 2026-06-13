'use client'
import { useState, useEffect, useRef } from 'react'
import { use } from 'react'

type Option = { text: string; votes: number }
type Poll   = { question: string; options: Option[]; status: string }

export default function VotarPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid }   = use(params)
  const [poll, setPoll]       = useState<Poll | null>(null)
  const [voted, setVoted]     = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting]   = useState(false)
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = () =>
    fetch(`/api/poll?uid=${uid}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setPoll(d); setLoading(false) })
      .catch(() => setLoading(false))

  useEffect(() => {
    load()
    ivRef.current = setInterval(load, 4000)
    return () => { if (ivRef.current) clearInterval(ivRef.current) }
  }, [uid])

  async function vote(i: number) {
    if (voted !== null || poll?.status !== 'active') return
    setVoting(true)
    const r = await fetch('/api/poll', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, optionIndex: i }),
    })
    setVoting(false)
    if (r.ok) { setVoted(i); load() }
  }

  const total = (poll?.options ?? []).reduce((s, o) => s + o.votes, 0)
  const S = { bg: '#08090d', card: '#111219', text: '#e8e6f8', muted: 'rgba(232,230,248,0.6)', primary: '#9b30ff', border: 'rgba(255,255,255,0.07)', green: '#22c55e' }

  return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: S.text, marginBottom: 4 }}>SheikSTREAM</div>
          <div style={{ fontSize: '0.78rem', color: S.muted }}>Enquete ao vivo</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: S.muted, padding: 40 }}>Carregando...</div>
        ) : !poll ? (
          <div style={{ textAlign: 'center', color: S.muted, padding: 40 }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>📊</div>
            <div>Nenhuma enquete ativa no momento</div>
          </div>
        ) : (
          <div style={{ background: S.card, border: `1px solid rgba(155,48,255,0.2)`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: poll.status === 'active' ? S.green : S.muted, display: 'inline-block', animation: poll.status === 'active' ? 'pulse 2s infinite' : 'none' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: poll.status === 'active' ? S.green : S.muted, letterSpacing: '0.1em' }}>
                {poll.status === 'active' ? 'ATIVA' : 'ENCERRADA'}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: S.muted }}>{total} voto{total !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: S.text, marginBottom: 20, lineHeight: 1.4 }}>{poll.question}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {poll.options.map((opt, i) => {
                const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0
                const isVoted = voted === i
                const isLeader = total > 0 && voted !== null && opt.votes === Math.max(...poll.options.map(o => o.votes))
                const canVote = voted === null && poll.status === 'active'
                return (
                  <button key={i} onClick={() => vote(i)} disabled={!canVote || voting}
                    style={{
                      position: 'relative', padding: '12px 14px', borderRadius: 10, overflow: 'hidden',
                      border: `1px solid ${isVoted ? S.primary : 'rgba(255,255,255,0.08)'}`,
                      background: isVoted ? 'rgba(155,48,255,0.15)' : 'rgba(255,255,255,0.03)',
                      cursor: canVote ? 'pointer' : 'default', textAlign: 'left', color: S.text,
                      fontFamily: 'inherit', transition: 'all 0.2s',
                    }}>
                    {voted !== null && (
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `${S.primary}22`, transition: 'width 0.6s ease', borderRadius: '10px 0 0 10px' }} />
                    )}
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: isVoted ? 700 : 500 }}>{opt.text}</span>
                      {voted !== null && (
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isLeader ? S.primary : S.muted }}>{pct}%</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {voted !== null && (
              <div style={{ marginTop: 16, textAlign: 'center', fontSize: '0.82rem', color: S.green, fontWeight: 600 }}>
                ✓ Voto registrado!
              </div>
            )}
            {poll.status !== 'active' && (
              <div style={{ marginTop: 12, textAlign: 'center', fontSize: '0.78rem', color: S.muted }}>
                Esta enquete está encerrada
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
