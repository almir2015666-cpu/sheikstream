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
  const sp = useSearchParams()
  const channel  = sp.get('channel') ?? ''
  const fontSize = Number(sp.get('size') ?? 15)
  const maxMsgs  = Number(sp.get('max') ?? 25)
  const bgOn     = sp.get('bg') !== 'false'
  const direction = sp.get('dir') ?? 'bottom'
  const opacity  = Number(sp.get('opacity') ?? 55)
  const radius   = Number(sp.get('radius') ?? 8)
  const anim     = sp.get('anim') ?? 'slide'
  const shadow   = sp.get('shadow') === 'true'
  const hidecmd  = sp.get('hidecmd') === 'true'
  const bgcol    = sp.get('bgcol') ?? '#000000'

  const [msgs, setMsgs] = useState<Msg[]>([])
  const wsRef  = useRef<WebSocket | null>(null)
  const idRef  = useRef(0)

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
        if (hidecmd && text.startsWith('!')) return
        const tags: Record<string, string> = {}
        tagStr.replace(/^@/, '').split(';').forEach(t => {
          const [k, v] = t.split('='); tags[k] = v ?? ''
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
  }, [channel, maxMsgs, hidecmd])

  // Background color with opacity
  const getMsgBg = () => {
    if (!bgOn) return 'transparent'
    const op  = Math.round(Math.min(opacity, 95) * 2.55).toString(16).padStart(2, '0')
    return `${bgcol}${op}`
  }
  const msgBg = getMsgBg()
  const textShadow = shadow ? '0 1px 5px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,1)' : 'none'

  const animClass = anim === 'slide' ? 'msg-slide' : anim === 'fade' ? 'msg-fade' : 'msg-pop'

  // both directions: newest first in DOM
  // bottom → column-reverse: newest anchors to bottom, overflow clips oldest at top
  // top    → column:         newest anchors to top,    overflow clips oldest at bottom
  const list = [...msgs].reverse()

  return (
    <>
      <style>{`
        html,body,#__next,[data-nextjs-scroll-focus-boundary]{
          background:transparent!important;background-color:transparent!important;
          margin:0!important;padding:0!important;overflow:hidden!important;
        }
        @keyframes msg-slide{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes msg-fade{from{opacity:0}to{opacity:1}}
        @keyframes msg-pop{from{opacity:0;transform:scale(0.82)}to{opacity:1;transform:scale(1)}}
        .msg-slide{animation:msg-slide .22s cubic-bezier(0.4,0,0.2,1) both}
        .msg-fade{animation:msg-fade .3s ease both}
        .msg-pop{animation:msg-pop .18s cubic-bezier(0.34,1.56,0.64,1) both}
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, background: 'transparent',
        overflow: 'hidden',
        fontFamily: "'Inter',system-ui,sans-serif",
        fontSize, pointerEvents: 'none',
      }}>
        {!channel ? (
          <div style={{ position: 'absolute', bottom: 12, left: 10, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>?channel= não configurado</div>
        ) : (
          <div style={{
            position: 'absolute',
            ...(direction === 'top'
              ? { top: 12, left: 10, right: 10 }
              : { bottom: 12, left: 10, right: 10 }),
            height: 'calc(100% - 24px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: direction === 'top' ? 'column' : 'column-reverse',
            gap: 4,
          }}>
            {list.map(m => (
              <div key={m.id} className={animClass} style={{
                padding: bgOn ? '5px 10px' : '2px 0',
                borderRadius: bgOn ? radius : 0,
                background: msgBg,
                backdropFilter: bgOn && bgcol === '#000000' ? 'blur(6px)' : 'none',
                lineHeight: 1.45, wordBreak: 'break-word',
                flexShrink: 0,
              }}>
                <span style={{ fontWeight: 700, color: m.color, marginRight: 5, textShadow }}>{m.user}:</span>
                <span style={{ color: '#fff', textShadow }}>{m.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default function ChatOverlay() {
  return <Suspense><ChatContent /></Suspense>
}
