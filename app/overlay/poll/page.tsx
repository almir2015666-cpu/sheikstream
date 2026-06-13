'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Option = { text: string; votes: number }
type Poll = { question: string; options: Option[]; status: string }

function PollContent() {
  const sp      = useSearchParams()
  const uid     = sp.get('uid') ?? ''
  const color   = sp.get('color') ?? '#9b30ff'
  const bg      = sp.get('bg') !== 'false'
  const channel = sp.get('channel') ?? ''

  const [poll, setPoll] = useState<Poll | null>(null)
  const pollRef  = useRef<Poll | null>(null)
  const ivRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const wsRef    = useRef<WebSocket | null>(null)
  const votedRef = useRef<Set<string>>(new Set())

  const total = (poll?.options ?? []).reduce((s, o) => s + o.votes, 0)

  // Poll the API for results every 3s
  useEffect(() => {
    if (!uid) return
    const load = () =>
      fetch(`/api/poll?uid=${uid}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) { setPoll(d); pollRef.current = d } })
        .catch(() => {})
    load()
    ivRef.current = setInterval(load, 3000)
    return () => { if (ivRef.current) clearInterval(ivRef.current) }
  }, [uid])

  // Twitch IRC — chat voting
  useEffect(() => {
    if (!uid || !channel) return

    const connect = () => {
      const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443')
      wsRef.current = ws

      ws.onopen = () => {
        ws.send('CAP REQ :twitch.tv/tags\r\n')
        ws.send('PASS SCHMOOZE\r\n')
        ws.send('NICK justinfan99999\r\n')
        ws.send(`JOIN #${channel.toLowerCase()}\r\n`)
      }

      ws.onmessage = async (e) => {
        const raw = e.data as string
        if (raw.includes('PING')) { ws.send('PONG :tmi.twitch.tv\r\n'); return }

        const m = raw.match(/^(@[^ ]+ )?:([^!]+)![^ ]+ PRIVMSG #[^ ]+ :(.+)/)
        if (!m) return

        const tagStr = m[1] ?? ''
        const username = m[2].toLowerCase()
        const text = m[3].trim().toLowerCase()

        // Accept: !vote 1, !vote 2, !1, !2, !v1, !v2
        let idx = -1
        const cmd1 = text.match(/^!vote\s+(\d+)$/)
        const cmd2 = text.match(/^!(\d+)$/)
        const cmd3 = text.match(/^!v(\d+)$/)
        if (cmd1) idx = parseInt(cmd1[1]) - 1
        else if (cmd2) idx = parseInt(cmd2[1]) - 1
        else if (cmd3) idx = parseInt(cmd3[1]) - 1
        if (idx < 0) return

        const cur = pollRef.current
        if (!cur || cur.status !== 'active') return
        if (idx >= cur.options.length) return
        if (votedRef.current.has(username)) return

        // Deduplicate immediately before the await
        votedRef.current.add(username)

        try {
          const r = await fetch('/api/poll', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, optionIndex: idx }),
          })
          if (!r.ok) votedRef.current.delete(username)
        } catch {
          votedRef.current.delete(username)
        }
      }

      ws.onclose = () => { setTimeout(connect, 3000) }
    }

    connect()
    return () => { wsRef.current?.close() }
  }, [uid, channel])

  // Reset voted set when poll resets (new poll or reset action)
  const prevPollKey = useRef('')
  useEffect(() => {
    if (!poll) return
    const key = poll.question + poll.options.map(o => o.text).join('|')
    if (key !== prevPollKey.current) {
      prevPollKey.current = key
      votedRef.current = new Set()
    }
  }, [poll])

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
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>{poll.status === 'closed' ? '🔒 ENCERRADA' : '📊 ENQUETE'}</span>
              {channel && poll.status === 'active' && (
                <span style={{ opacity: 0.6, fontWeight: 500, letterSpacing: '0.06em', fontSize: '0.64rem' }}>
                  · vote no chat: !vote 1, !vote 2...
                </span>
              )}
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
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {channel && poll.status === 'active' && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: color, opacity: 0.8,
                            background: `${color}22`, padding: '1px 5px', borderRadius: 4 }}>
                            !{i + 1}
                          </span>
                        )}
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
