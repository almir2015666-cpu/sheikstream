'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const SOUND_URL = 'https://www.myinstants.com/media/sounds/whatsapp.mp3'

const S = {
  bg: '#111219', header: '#16182e', border: 'rgba(255,255,255,0.07)',
  borderP: 'rgba(155,48,255,0.25)', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.6)', dim: 'rgba(232,230,248,0.38)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.14)',
  sent: '#9b30ff', received: '#1e2035',
  input: 'rgba(255,255,255,0.05)',
}

type ChatUser = { id: string; name: string; image?: string | null; email?: string }
type Message = {
  id: string; sender_id: string; receiver_id: string
  sender_name: string; sender_image?: string | null
  content: string; read_at: string | null; created_at: string
}
type Notification = { user: ChatUser; message: string; msgId: string }

function Avatar({ name, image, size = 36 }: { name: string; image?: string | null; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const hue = name.charCodeAt(0) * 5 % 360
  if (image) return <img src={image} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},60%,40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function timeLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function playNotificationSound() {
  try {
    const audio = new Audio(SOUND_URL)
    audio.volume = 0.6
    audio.play().catch(() => {})
  } catch {}
}

// localStorage helpers
const LS_MSGS = (a: string, b: string) => `sk-dm-${[a, b].sort().join('-')}`
const LS_USERS = 'sk-dm-users'

function lsGetMsgs(a: string, b: string): Message[] {
  try { return JSON.parse(localStorage.getItem(LS_MSGS(a, b)) || '[]') } catch { return [] }
}
function lsSaveMsgs(a: string, b: string, msgs: Message[]) {
  try { localStorage.setItem(LS_MSGS(a, b), JSON.stringify(msgs.slice(-200))) } catch {}
}
function lsGetUsers(): ChatUser[] {
  try { return JSON.parse(localStorage.getItem(LS_USERS) || '[]') } catch { return [] }
}
function lsSaveUsers(users: ChatUser[]) {
  try { localStorage.setItem(LS_USERS, JSON.stringify(users)) } catch {}
}

export function ChatWidget({
  currentUserId, currentUserName, currentUserImage,
}: {
  currentUserId: string | null
  currentUserName: string | null
  currentUserImage?: string | null
}) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'list' | 'chat'>('list')
  const [users, setUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState<Record<string, number>>({})
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const lastCheckRef = useRef<string>(new Date().toISOString())
  const msgsEndRef = useRef<HTMLDivElement>(null)
  const knownMsgIds = useRef<Set<string>>(new Set())

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      const r = await fetch('/api/dm/users')
      if (r.ok) {
        const data: ChatUser[] = await r.json()
        if (data.length > 0) { setUsers(data); lsSaveUsers(data) }
        else setUsers(lsGetUsers())
      } else setUsers(lsGetUsers())
    } catch { setUsers(lsGetUsers()) }
  }, [])

  // Load conversation
  const loadConversation = useCallback(async (otherUser: ChatUser) => {
    if (!currentUserId) return
    try {
      const r = await fetch(`/api/dm?with=${otherUser.id}`)
      if (r.ok) {
        const data: Message[] = await r.json()
        setMessages(data)
        data.forEach(m => knownMsgIds.current.add(m.id))
        lsSaveMsgs(currentUserId, otherUser.id, data)
      } else {
        setMessages(lsGetMsgs(currentUserId, otherUser.id))
      }
    } catch {
      setMessages(lsGetMsgs(currentUserId, otherUser.id))
    }
  }, [currentUserId])

  // Poll for new messages
  const poll = useCallback(async () => {
    if (!currentUserId) return
    try {
      const since = lastCheckRef.current
      lastCheckRef.current = new Date().toISOString()
      const r = await fetch(`/api/dm?since=${encodeURIComponent(since)}`)
      if (!r.ok) return
      const newMsgs: Message[] = await r.json()
      if (newMsgs.length === 0) return

      const truly = newMsgs.filter(m => !knownMsgIds.current.has(m.id))
      if (truly.length === 0) return
      truly.forEach(m => knownMsgIds.current.add(m.id))

      // Update unread counts
      const counts: Record<string, number> = {}
      truly.forEach(m => { counts[m.sender_id] = (counts[m.sender_id] ?? 0) + 1 })
      setUnread(prev => {
        const next = { ...prev }
        Object.entries(counts).forEach(([id, c]) => { next[id] = (next[id] ?? 0) + c })
        return next
      })
      setTotalUnread(prev => prev + truly.length)

      // Update open conversation if relevant
      if (selectedUser) {
        const relevant = truly.filter(m => m.sender_id === selectedUser.id || m.receiver_id === selectedUser.id)
        if (relevant.length > 0) {
          setMessages(prev => {
            const updated = [...prev, ...relevant]
            lsSaveMsgs(currentUserId, selectedUser.id, updated)
            return updated
          })
        }
      }

      // Notification + sound for each unique sender
      playNotificationSound()
      const senders = new Map<string, Message>()
      truly.forEach(m => { if (!senders.has(m.sender_id)) senders.set(m.sender_id, m) })
      senders.forEach((msg) => {
        const u = users.find(u => u.id === msg.sender_id) ?? {
          id: msg.sender_id, name: msg.sender_name, image: msg.sender_image,
        }
        const notif: Notification = { user: u, message: msg.content, msgId: msg.id }
        setNotifications(prev => [...prev.filter(n => n.user.id !== u.id), notif])
        // Auto-dismiss after 6s
        setTimeout(() => setNotifications(prev => prev.filter(n => n.msgId !== notif.msgId)), 6000)
      })
    } catch {}
  }, [currentUserId, selectedUser, users])

  useEffect(() => {
    if (!currentUserId) return
    loadUsers()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [currentUserId, loadUsers, poll])

  // Scroll to bottom when messages update
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark as read when opening conversation
  function openConversation(u: ChatUser) {
    setSelectedUser(u)
    setView('chat')
    loadConversation(u)
    setUnread(prev => { const n = { ...prev }; delete n[u.id]; return n })
    setTotalUnread(prev => Math.max(0, prev - (unread[u.id] ?? 0)))
    // Mark as read in backend
    fetch('/api/dm', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender_id: u.id }) }).catch(() => {})
  }

  function handleNotificationOpen(notif: Notification) {
    setNotifications(prev => prev.filter(n => n.msgId !== notif.msgId))
    setOpen(true)
    openConversation(notif.user)
  }

  async function sendMessage() {
    if (!input.trim() || !selectedUser || !currentUserId) return
    setSending(true)
    const optimistic: Message = {
      id: crypto.randomUUID(),
      sender_id: currentUserId, receiver_id: selectedUser.id,
      sender_name: currentUserName ?? 'Você',
      sender_image: currentUserImage ?? null,
      content: input.trim(), read_at: null,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => {
      const updated = [...prev, optimistic]
      lsSaveMsgs(currentUserId, selectedUser.id, updated)
      return updated
    })
    knownMsgIds.current.add(optimistic.id)
    setInput('')
    try {
      const r = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: selectedUser.id, content: optimistic.content }),
      })
      if (r.ok) {
        const real: Message = await r.json()
        knownMsgIds.current.add(real.id)
        setMessages(prev => {
          const updated = prev.map(m => m.id === optimistic.id ? real : m)
          lsSaveMsgs(currentUserId, selectedUser.id, updated)
          return updated
        })
      }
    } catch {}
    setSaving(false)
  }

  function setSaving(_: boolean) { setSending(false) }

  if (!currentUserId) return null

  const unreadByUser = (uid: string) => unread[uid] ?? 0

  return (
    <>
      {/* Notification popups */}
      {notifications.map((notif, idx) => (
        <div key={notif.msgId} style={{
          position: 'fixed', bottom: 88 + idx * 90, right: 24, width: 300, zIndex: 9999,
          background: '#1a1c30', border: '1px solid rgba(155,48,255,0.35)',
          borderRadius: '14px', padding: '0.85rem 1rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(155,48,255,0.12)',
          animation: 'slideInRight 0.25s ease',
          display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
        }}>
          <Avatar name={notif.user.name} image={notif.user.image} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: S.text, fontWeight: 700, fontSize: '0.83rem', marginBottom: '0.15rem' }}>{notif.user.name}</div>
            <div style={{ color: S.muted, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{notif.message}</div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem' }}>
              <button onClick={() => handleNotificationOpen(notif)} style={{ flex: 1, background: S.primary, border: 'none', color: '#fff', borderRadius: '7px', padding: '0.3rem 0', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}>
                Abrir
              </button>
              <button onClick={() => setNotifications(p => p.filter(n => n.msgId !== notif.msgId))} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: S.muted, borderRadius: '7px', padding: '0.3rem 0.6rem', fontSize: '0.72rem', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 80, right: 24, width: 340, height: 500,
          background: S.bg, border: `1px solid ${S.border}`,
          borderRadius: '16px', zIndex: 9998, display: 'flex', flexDirection: 'column',
          boxShadow: '0 16px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(155,48,255,0.08)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ background: S.header, padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
            {view === 'chat' && (
              <button onClick={() => { setView('list'); setSelectedUser(null); setMessages([]) }} style={{ background: 'transparent', border: 'none', color: S.muted, cursor: 'pointer', padding: '0.2rem', fontSize: '1rem', lineHeight: 1 }}>
                ←
              </button>
            )}
            {view === 'chat' && selectedUser ? (
              <>
                <Avatar name={selectedUser.name} image={selectedUser.image} size={28} />
                <span style={{ color: S.text, fontWeight: 700, fontSize: '0.88rem', flex: 1 }}>{selectedUser.name}</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9b30ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span style={{ color: S.text, fontWeight: 700, fontSize: '0.88rem', flex: 1 }}>Mensagens</span>
              </>
            )}
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: S.dim, cursor: 'pointer', padding: '0.2rem', fontSize: '1rem', lineHeight: 1 }}>
              ✕
            </button>
          </div>

          {/* User list */}
          {view === 'list' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {users.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: S.dim, fontSize: '0.83rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                  Nenhum usuário encontrado
                </div>
              ) : users.map(u => {
                const uc = unreadByUser(u.id)
                return (
                  <button key={u.id} onClick={() => openConversation(u)} style={{
                    width: '100%', background: 'transparent', border: 'none',
                    borderBottom: `1px solid ${S.border}`, padding: '0.85rem 1rem',
                    display: 'flex', alignItems: 'center', gap: '0.7rem',
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar name={u.name} image={u.image} size={38} />
                      {uc > 0 && (
                        <span style={{ position: 'absolute', top: -3, right: -3, background: S.primary, color: '#fff', borderRadius: '99px', fontSize: '0.6rem', fontWeight: 800, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                          {uc}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: uc > 0 ? S.text : S.muted, fontWeight: uc > 0 ? 700 : 500, fontSize: '0.85rem' }}>{u.name}</div>
                      <div style={{ color: S.dim, fontSize: '0.72rem' }}>{u.email ?? ''}</div>
                    </div>
                    {uc > 0 && <div style={{ width: 8, height: 8, borderRadius: '50%', background: S.primary, flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
          )}

          {/* Conversation */}
          {view === 'chat' && selectedUser && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: S.dim, fontSize: '0.78rem', marginTop: '2rem' }}>
                    Nenhuma mensagem ainda.<br />Diga olá! 👋
                  </div>
                )}
                {messages.map(m => {
                  const isMine = m.sender_id === currentUserId
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '78%', padding: '0.5rem 0.75rem',
                        borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isMine ? S.sent : S.received,
                        color: S.text, fontSize: '0.83rem', lineHeight: 1.5,
                      }}>
                        <div>{m.content}</div>
                        <div style={{ fontSize: '0.62rem', color: isMine ? 'rgba(255,255,255,0.5)' : S.dim, marginTop: '0.2rem', textAlign: 'right' }}>
                          {timeLabel(m.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={msgsEndRef} />
              </div>
              <div style={{ padding: '0.75rem', borderTop: `1px solid ${S.border}`, display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Mensagem..."
                  style={{ flex: 1, background: S.input, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '0.55rem 0.75rem', color: S.text, fontSize: '0.83rem', outline: 'none' }}
                />
                <button onClick={sendMessage} disabled={sending || !input.trim()} style={{
                  background: input.trim() ? S.primary : 'rgba(255,255,255,0.05)',
                  border: 'none', borderRadius: '10px', padding: '0 0.85rem',
                  color: input.trim() ? '#fff' : S.dim, cursor: input.trim() ? 'pointer' : 'default',
                  fontSize: '1rem', transition: 'all 0.15s',
                }}>
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating button */}
      <button onClick={() => { setOpen(o => !o); if (!open) setView('list') }} style={{
        position: 'fixed', bottom: 24, right: 24, width: 52, height: 52,
        borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg, #9b30ff, #6b1fc2)',
        boxShadow: open ? '0 0 0 3px rgba(155,48,255,0.4)' : '0 4px 20px rgba(155,48,255,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9997, transition: 'transform 0.2s, box-shadow 0.2s',
        transform: open ? 'scale(0.92)' : 'scale(1)',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {totalUnread > 0 && (
          <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', borderRadius: '99px', fontSize: '0.6rem', fontWeight: 800, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid #08090d' }}>
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
    </>
  )
}
