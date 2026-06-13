'use client'
import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Msg = { id: string; user: string; color: string; text: string; ts: number }

const COLORS = ['#ff7070','#70b8ff','#70ffb8','#ffb870','#c470ff','#ff70c4','#70ffd4','#ffd470']
function userColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

function ChatContent() {
  const sp       = useSearchParams()
  const channel  = sp.get('channel') ?? ''
  const fontSize = Number(sp.get('size') ?? 15)
  const maxMsgs  = Number(sp.get('max') ?? 25)
  const bg       = sp.get('bg') !== 'false'
  const direction = sp.get('dir') ?? 'bottom' // top | bottom
  const [msgs, setMsgs] = useState<Msg[]>([])
  const wsRef    = useRef<WebSocket | null>(null)
  const idRef    = useRef(0)

  useEffect(() => {
    if (!channel) return
    const connect = () => {
      const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443')
      wsRef.current = ws
      ws.onopen = () => {
        ws.send('CAP REQ :twitch.tv/tags\r\n')
        ws.send('PASS SCHMOOZE\r\n')
        ws.send('NICK justinfan99999\r\n')
        ws.send(`JOIN #${channel.toLowerCase()}\r\n`)
      }
      ws.onmessage = (e) => {
        const raw = e.data as string
        if (raw.includes('PING')) { ws.send('PONG :tmi.twitch.tv\r\n'); return }
        const privmsg = raw.match(/^(@[^ ]+ )?:([^!]+)![^ ]+ PRIVMSG #[^ ]+ :(.+)/)
        if (!privmsg) return
        const tagStr = privmsg[1] ?? ''
        const user   = privmsg[2]
        const text   = privmsg[3].trimEnd()
        const tags: Record<string, string> = {}
        tagStr.replace(/^@/, '').split(';').forEach(t => {
          const [k, v] = t.split('=')
          tags[k] = v ?? ''
        })
        const color = tags['color'] || userColor(user)
        setMsgs(prev => {
          const next = [...prev, { id: String(idRef.current++), user, color, text, ts: Date.now() }]
          return next.slice(-maxMsgs)
        })
      }
      ws.onclose = () => { setTimeout(connect, 3000) }
    }
    connect()
    return () => { wsRef.current?.close() }
  }, [channel, maxMsgs])

  const msgStyle: React.CSSProperties = {
    padding: bg ? '5px 10px' : '3px 0',
    borderRadius: bg ? 8 : 0,
    background: bg ? 'rgba(0,0,0,0.55)' : 'transparent',
    backdropFilter: bg ? 'blur(8px)' : 'none',
    marginBottom: 4,
    animation: 'fadeIn .2s ease',
    lineHeight: 1.45,
    wordBreak: 'break-word',
  }

  const list = direction === 'top' ? msgs : [...msgs].reverse()

  return (
    <>
      <style>{`
        html,body,#__next,[data-nextjs-scroll-focus-boundary]{
          background:transparent!important;background-color:transparent!important;
          margin:0!important;padding:0!important;overflow:hidden!important;
        }
        @keyframes fadeIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, background: 'transparent',
        display: 'flex', flexDirection: 'column',
        justifyContent: direction === 'top' ? 'flex-start' : 'flex-end',
        padding: '12px 10px',
        fontFamily: "'Inter',system-ui,sans-serif",
        fontSize, pointerEvents: 'none', overflow: 'hidden',
      }}>
        {!channel ? (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>?channel= não configurado</div>
        ) : (
          list.map(m => (
            <div key={m.id} style={msgStyle}>
              <span style={{ fontWeight: 700, color: m.color, marginRight: 6 }}>{m.user}:</span>
              <span style={{ color: '#fff' }}>{m.text}</span>
            </div>
          ))
        )}
      </div>
    </>
  )
}

export default function ChatOverlay() {
  return <Suspense><ChatContent /></Suspense>
}
