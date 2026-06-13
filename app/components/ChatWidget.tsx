'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const SOUND_URL = 'https://www.myinstants.com/media/sounds/whatsapp.mp3'

const S = {
  bg: '#111219', header: '#16182e', border: 'rgba(255,255,255,0.07)',
  borderP: 'rgba(155,48,255,0.25)', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.6)', dim: 'rgba(232,230,248,0.38)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.14)',
  sent: '#9b30ff', received: '#1e2035', input: 'rgba(255,255,255,0.05)',
}

const SETUP_SQL = `-- Cole esse SQL no editor de SQL do seu projeto Supabase (uma única vez)
CREATE TABLE IF NOT EXISTS dm_messages (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id   TEXT        NOT NULL,
  sender_name TEXT        NOT NULL,
  sender_image TEXT,
  receiver_id TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS dm_recv_idx ON dm_messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dm_send_idx ON dm_messages(sender_id,   created_at DESC);`

type ChatUser = { id: string; name: string; image?: string | null; email?: string; is_online?: boolean }
type Message  = {
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
  const d = new Date(iso), now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function playNotificationSound() {
  try { const a = new Audio(SOUND_URL); a.volume = 0.6; a.play().catch(() => {}) } catch {}
}

export function ChatWidget({
  currentUserId, currentUserName, currentUserImage,
}: {
  currentUserId: string | null
  currentUserName: string | null
  currentUserImage?: string | null
}) {
  const [open, setOpen]                   = useState(false)
  const [view, setView]                   = useState<'list' | 'chat' | 'setup'>('list')
  const [users, setUsers]                 = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser]   = useState<ChatUser | null>(null)
  const [messages, setMessages]           = useState<Message[]>([])
  const [input, setInput]                 = useState('')
  const [sending, setSending]             = useState(false)
  const [unread, setUnread]               = useState<Record<string, number>>({})
  const [totalUnread, setTotalUnread]     = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [copied, setCopied]               = useState(false)
  const lastCheckRef    = useRef<string>(new Date(Date.now() - 30000).toISOString())
  const knownIds        = useRef<Set<string>>(new Set())
  const usersRef        = useRef<ChatUser[]>([])
  const selectedUserRef = useRef<ChatUser | null>(null)  // stable ref for use inside poll
  const msgsEndRef      = useRef<HTMLDivElement>(null)

  // ── Load users ──────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    try {
      const r = await fetch('/api/dm/users')
      if (!r.ok) return
      const data: ChatUser[] = await r.json()
      if (Array.isArray(data)) { setUsers(data); usersRef.current = data }
    } catch {}
  }, [])

  // ── Load conversation ────────────────────────────────────────────────────────
  const loadConversation = useCallback(async (other: ChatUser) => {
    try {
      const r = await fetch(`/api/dm?with=${other.id}`)
      if (!r.ok) { setView('setup'); return }
      const data: Message[] = await r.json()
      setMessages(Array.isArray(data) ? data : [])
      data.forEach(m => knownIds.current.add(m.id))
    } catch { setView('setup') }
  }, [])

  // ── Poll ─────────────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    if (!currentUserId) return
    try {
      const since = lastCheckRef.current
      const r = await fetch(`/api/dm?since=${encodeURIComponent(since)}`, { credentials: 'include' })
      // Update AFTER fetch resolves so messages sent during a slow fetch are never missed
      lastCheckRef.current = new Date().toISOString()
      if (!r.ok) return
      const newMsgs: Message[] = await r.json()
      if (!Array.isArray(newMsgs) || newMsgs.length === 0) return

      const novel = newMsgs.filter(m => !knownIds.current.has(m.id))
      if (novel.length === 0) return
      novel.forEach(m => knownIds.current.add(m.id))

      // Update unread counts
      const counts: Record<string, number> = {}
      novel.forEach(m => { counts[m.sender_id] = (counts[m.sender_id] ?? 0) + 1 })
      setUnread(prev => { const n = { ...prev }; Object.entries(counts).forEach(([id, c]) => { n[id] = (n[id] ?? 0) + c }); return n })
      setTotalUnread(prev => prev + novel.length)

      // If conversation is open, append relevant messages directly via ref
      const su = selectedUserRef.current
      if (su) {
        const rel = novel.filter(m => m.sender_id === su.id || m.receiver_id === su.id)
        if (rel.length) setMessages(prev => [...prev, ...rel])
      }

      // Notification + sound
      playNotificationSound()
      const bySender = new Map<string, Message>()
      novel.forEach(m => { if (!bySender.has(m.sender_id)) bySender.set(m.sender_id, m) })
      bySender.forEach(msg => {
        const u = usersRef.current.find(u => u.id === msg.sender_id) ?? { id: msg.sender_id, name: msg.sender_name, image: msg.sender_image }
        const notif: Notification = { user: u, message: msg.content, msgId: msg.id }
        setNotifications(prev => [...prev.filter(n => n.user.id !== u.id), notif])
        setTimeout(() => setNotifications(prev => prev.filter(n => n.msgId !== notif.msgId)), 6000)
      })
    } catch {}
  }, [currentUserId])  // stable — no users dep, uses usersRef instead

  // Load initial unread count so badge shows on page load
  const loadInitialUnread = useCallback(async () => {
    try {
      const r = await fetch('/api/dm/unread', { credentials: 'include' })
      if (!r.ok) return
      const data: { sender_id: string; count: number }[] = await r.json()
      if (!Array.isArray(data)) return
      const counts: Record<string, number> = {}
      let total = 0
      data.forEach(({ sender_id, count }) => { counts[sender_id] = count; total += count })
      setUnread(counts)
      setTotalUnread(total)
    } catch {}
  }, [])

  useEffect(() => {
    if (!currentUserId) return
    loadUsers()
    loadInitialUnread()
    // Poll immediately on mount, then every 3s for more responsive notifications
    poll()
    const ivPoll  = setInterval(poll, 3000)
    const ivUsers = setInterval(loadUsers, 30000)
    return () => { clearInterval(ivPoll); clearInterval(ivUsers) }
  }, [currentUserId, loadUsers, loadInitialUnread, poll])

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ── Open conversation ────────────────────────────────────────────────────────
  function openConversation(u: ChatUser) {
    selectedUserRef.current = u
    setSelectedUser(u)
    setView('chat')
    loadConversation(u)
    const had = unread[u.id] ?? 0
    setUnread(prev => { const n = { ...prev }; delete n[u.id]; return n })
    setTotalUnread(prev => Math.max(0, prev - had))
    fetch('/api/dm', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender_id: u.id }) }).catch(() => {})
  }

  function handleNotificationOpen(notif: Notification) {
    setNotifications(prev => prev.filter(n => n.msgId !== notif.msgId))
    setOpen(true)
    openConversation(notif.user)
  }

  // ── Send message ─────────────────────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || !selectedUser || !currentUserId || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    const optimistic: Message = {
      id: `opt-${Date.now()}`, sender_id: currentUserId, receiver_id: selectedUser.id,
      sender_name: currentUserName ?? 'Você', sender_image: currentUserImage ?? null,
      content, read_at: null, created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    try {
      const r = await fetch('/api/dm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: selectedUser.id, content }),
      })
      if (r.ok) {
        const real: Message = await r.json()
        knownIds.current.add(real.id)
        setMessages(prev => prev.map(m => m.id === optimistic.id ? real : m))
      } else {
        setView('setup')
        setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    } finally { setSending(false) }
  }

  function copySQL() {
    navigator.clipboard.writeText(SETUP_SQL).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  if (!currentUserId) return null

  return (
    <>
      {/* ── Notification popups ─────────────────────────────────────────────── */}
      {notifications.map((notif, idx) => (
        <div key={notif.msgId} style={{
          position: 'fixed', top: 16 + idx * 96, right: 16, width: 320, zIndex: 99999,
          background: '#1a1c30', border: '1px solid rgba(155,48,255,0.5)',
          borderRadius: '14px', padding: '0.85rem 1rem',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(155,48,255,0.1)',
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

      {/* ── Chat panel ──────────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 80, right: 24, width: 340, height: 500,
          background: S.bg, border: `1px solid ${S.border}`, borderRadius: '16px',
          zIndex: 9998, display: 'flex', flexDirection: 'column',
          boxShadow: '0 16px 64px rgba(0,0,0,0.6)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ background: S.header, padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
            {(view === 'chat' || view === 'setup') && (
              <button onClick={() => { selectedUserRef.current = null; setView('list'); setSelectedUser(null); setMessages([]) }} style={{ background: 'transparent', border: 'none', color: S.muted, cursor: 'pointer', padding: '0.2rem', fontSize: '1rem' }}>←</button>
            )}
            {view === 'chat' && selectedUser ? (
              <>
                <Avatar name={selectedUser.name} image={selectedUser.image} size={28} />
                <span style={{ color: S.text, fontWeight: 700, fontSize: '0.88rem', flex: 1 }}>{selectedUser.name}</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9b30ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span style={{ color: S.text, fontWeight: 700, fontSize: '0.88rem', flex: 1 }}>
                  {view === 'setup' ? 'Configurar Chat' : 'Mensagens'}
                </span>
              </>
            )}
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: S.dim, cursor: 'pointer', padding: '0.2rem', fontSize: '1rem' }}>✕</button>
          </div>

          {/* Setup screen */}
          {view === 'setup' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '0.85rem', fontSize: '0.8rem', color: '#fcd34d', lineHeight: 1.5 }}>
                ⚠️ A tabela do chat ainda não foi criada no Supabase. Execute o SQL abaixo uma única vez.
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '0.85rem', fontSize: '0.72rem', color: '#86efac', fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap', userSelect: 'all', overflowX: 'auto' }}>
                {SETUP_SQL}
              </div>
              <button onClick={copySQL} style={{ background: copied ? 'rgba(34,197,94,0.15)' : S.primaryBg, border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : S.borderP}`, color: copied ? '#86efac' : S.primary, borderRadius: '9px', padding: '0.6rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                {copied ? '✓ Copiado!' : '📋 Copiar SQL'}
              </button>
              <div style={{ color: S.dim, fontSize: '0.72rem', textAlign: 'center', lineHeight: 1.6 }}>
                Após executar, volte aqui e clique em ← para tentar novamente.
              </div>
            </div>
          )}

          {/* User list */}
          {view === 'list' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {users.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: S.dim, fontSize: '0.83rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                  Nenhum usuário encontrado
                </div>
              ) : users.map(u => {
                const uc = unread[u.id] ?? 0
                return (
                  <button key={u.id} onClick={() => openConversation(u)} style={{
                    width: '100%', background: 'transparent', border: 'none',
                    borderBottom: `1px solid ${S.border}`, padding: '0.85rem 1rem',
                    display: 'flex', alignItems: 'center', gap: '0.7rem',
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar name={u.name} image={u.image} size={38} />
                      {/* online dot */}
                      <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: u.is_online ? '#22c55e' : 'rgba(255,255,255,0.15)', border: '2px solid #111219' }} />
                      {uc > 0 && (
                        <span style={{ position: 'absolute', top: -3, right: -3, background: S.primary, color: '#fff', borderRadius: '99px', fontSize: '0.6rem', fontWeight: 800, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                          {uc}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: uc > 0 ? S.text : S.muted, fontWeight: uc > 0 ? 700 : 500, fontSize: '0.85rem' }}>{u.name}</span>
                        {u.is_online && <span style={{ fontSize: '0.62rem', color: '#22c55e', background: 'rgba(34,197,94,0.12)', padding: '0.05rem 0.4rem', borderRadius: '99px', fontWeight: 600 }}>online</span>}
                      </div>
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
                    Nenhuma mensagem ainda. Diga olá! 👋
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
                          {isMine && m.read_at && ' ✓✓'}
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
                  color: input.trim() ? '#fff' : S.dim,
                  cursor: input.trim() ? 'pointer' : 'default', fontSize: '1rem',
                }}>
                  {sending ? '…' : '➤'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Floating button ──────────────────────────────────────────────────── */}
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
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
