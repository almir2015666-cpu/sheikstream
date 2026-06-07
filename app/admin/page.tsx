'use client'
import { useState, useEffect, useCallback } from 'react'

const DARK = {
  bg: '#08090d', navBg: 'rgba(8,9,13,0.95)',
  cardBg: '#0f1018', cardBgAlt: '#0e0f17',
  text: '#f0eefc', muted: 'rgba(240,238,252,0.5)', dim: 'rgba(240,238,252,0.28)',
  vdim: 'rgba(240,238,252,0.12)', vvdim: 'rgba(240,238,252,0.06)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  primaryBgMed: 'rgba(155,48,255,0.18)',
  accent: '#39ff14', accentBg: 'rgba(57,255,20,0.1)', accentBorder: 'rgba(57,255,20,0.3)',
  danger: '#ff4444', dangerBg: 'rgba(255,68,68,0.1)', dangerBorder: 'rgba(255,68,68,0.3)',
  border: 'rgba(155,48,255,0.18)', borderStrong: 'rgba(155,48,255,0.3)',
  inputBg: '#08090d', inputBorder: 'rgba(155,48,255,0.3)',
}
const LIGHT = {
  bg: '#f6f5ff', navBg: 'rgba(246,245,255,0.95)',
  cardBg: '#ffffff', cardBgAlt: '#faf9ff',
  text: '#0d0c1e', muted: 'rgba(13,12,30,0.55)', dim: 'rgba(13,12,30,0.32)',
  vdim: 'rgba(13,12,30,0.12)', vvdim: 'rgba(13,12,30,0.06)',
  primary: '#7c2af5', primaryBg: 'rgba(124,42,245,0.08)',
  primaryBgMed: 'rgba(124,42,245,0.15)',
  accent: '#0a8c00', accentBg: 'rgba(10,140,0,0.08)', accentBorder: 'rgba(10,140,0,0.3)',
  danger: '#cc2222', dangerBg: 'rgba(204,34,34,0.07)', dangerBorder: 'rgba(204,34,34,0.25)',
  border: 'rgba(124,42,245,0.12)', borderStrong: 'rgba(124,42,245,0.22)',
  inputBg: '#f8f7ff', inputBorder: 'rgba(124,42,245,0.28)',
}

type User = {
  id: string
  platform: string
  platform_username?: string
  email?: string
  status: 'pending' | 'approved' | 'rejected' | 'banned'
  created_at: string
}

const PLATFORM_COLORS: Record<string, string> = {
  Twitch: '#9147ff', YouTube: '#ff0000', Kick: '#53fc18',
  Discord: '#5865f2', Google: '#4285f4',
}

function makeCSS(C: typeof DARK) {
  return `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  .sk-nav { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
  .sk-theme-btn { transition: transform 0.11s; background: transparent; border: none; cursor: pointer; padding: 0.4rem; }
  .sk-theme-btn:hover { transform: rotate(18deg) scale(1.15); }
  .sk-user-row { transition: background 0.07s; }
  .sk-user-row:hover { background: ${C.primaryBg} !important; }
  .sk-btn-approve { transition: all 0.07s; border: 1px solid ${C.accentBorder}; background: ${C.accentBg}; color: ${C.accent}; border-radius: 6px; padding: 0.32rem 0.8rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
  .sk-btn-approve:hover { filter: brightness(1.15); transform: translateY(-1px); }
  .sk-btn-approve:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .sk-btn-reject { transition: all 0.07s; border: 1px solid ${C.dangerBorder}; background: ${C.dangerBg}; color: ${C.danger}; border-radius: 6px; padding: 0.32rem 0.8rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
  .sk-btn-reject:hover { filter: brightness(1.15); transform: translateY(-1px); }
  .sk-btn-reject:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .sk-btn-ban { transition: all 0.07s; border: 1px solid rgba(255,120,0,0.35); background: rgba(255,120,0,0.1); color: #ff7800; border-radius: 6px; padding: 0.32rem 0.8rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
  .sk-btn-ban:hover { filter: brightness(1.15); transform: translateY(-1px); }
  .sk-btn-ban:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .sk-tab { transition: all 0.07s; cursor: pointer; padding: 0.4rem 1rem; border-radius: 6px; font-size: 0.82rem; font-weight: 600; border: none; background: transparent; }
  .sk-tab.active { background: ${C.primaryBg}; color: ${C.primary}; }
  .sk-tab:not(.active) { color: ${C.muted}; }
  .sk-tab:not(.active):hover { color: ${C.text}; background: ${C.vvdim}; }
  .sk-pw-toggle { background: transparent; border: none; cursor: pointer; padding: 0.2rem; display: flex; align-items: center; color: ${C.dim}; transition: color 0.07s; position: absolute; right: 0.7rem; top: 50%; transform: translateY(-50%); }
  .sk-pw-toggle:hover { color: ${C.primary}; }
  @keyframes sk-pop-in { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: none; } }
  .sk-card { animation: sk-pop-in 0.12s ease both; }
  @keyframes sk-spin { to { transform: rotate(360deg); } }
  .sk-spin { animation: sk-spin 0.8s linear infinite; }
  `
}

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export default function AdminPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'banned'>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [storedPw, setStoredPw] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [dbError, setDbError] = useState('')

  const isDark = theme === 'dark'
  const C = isDark ? DARK : LIGHT

  const fetchUsers = useCallback(async (pw: string) => {
    setUsersLoading(true)
    setDbError('')
    try {
      const res = await fetch('/api/admin/users', { headers: { 'x-admin-password': pw } })
      if (res.status === 401) {
        setAuthed(false)
        setStoredPw('')
        sessionStorage.removeItem('sk-admin-pw')
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setDbError(body?.error || `Erro ${res.status} ao conectar com o banco de dados`)
        setUsers([])
        return
      }
      const data = await res.json()
      setDbError('')
      setUsers(data)
    } catch (e) {
      setDbError('Falha de rede ao buscar usuários')
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // On mount: verify any stored session BEFORE showing anything
  useEffect(() => {
    setPassword('')
    const saved = localStorage.getItem('sk-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)

    const pw = sessionStorage.getItem('sk-admin-pw')
    if (!pw) {
      setAuthChecked(true) // no session → show login immediately
      return
    }

    // Verify the stored password against the API
    fetch('/api/admin/users', { headers: { 'x-admin-password': pw } })
      .then(async res => {
        if (res.ok) {
          const data = await res.json()
          setUsers(data)
          setStoredPw(pw)
          setAuthed(true)
        } else {
          sessionStorage.removeItem('sk-admin-pw')
        }
      })
      .catch(() => {
        sessionStorage.removeItem('sk-admin-pw')
      })
      .finally(() => setAuthChecked(true))
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.ok) {
        sessionStorage.setItem('sk-admin-pw', password)
        setStoredPw(password)
        setAuthed(true)
        fetchUsers(password)
      } else {
        setAuthError(data.error || 'Acesso negado')
      }
    } catch {
      setAuthError('Erro de conexão')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleAction(id: string, status: 'approved' | 'rejected' | 'banned') {
    setActionLoading(id + status)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u))
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function handleResetSessions() {
    if (!confirm('Isso irá remover todos os usuários Twitch da lista, forçando re-aprovação. Confirmar?')) return
    setResetLoading(true)
    try {
      await fetch('/api/admin/reset-sessions', {
        method: 'POST',
        headers: { 'x-admin-password': storedPw },
      })
      fetchUsers(storedPw)
    } finally {
      setResetLoading(false)
    }
  }

  function toggleTheme() {
    const t = isDark ? 'light' : 'dark'
    setTheme(t)
    localStorage.setItem('sk-theme', t)
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const filtered = users.filter(u => filter === 'all' || u.status === filter)
  const counts = {
    all: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    rejected: users.filter(u => u.status === 'rejected').length,
    banned: users.filter(u => u.status === 'banned').length,
  }

  const statusBadge = (status: User['status']) => {
    const cfg = {
      pending:  { bg: C.primaryBg, color: C.primary, border: C.border, label: 'Pendente' },
      approved: { bg: C.accentBg, color: C.accent, border: C.accentBorder, label: 'Ativo' },
      rejected: { bg: C.dangerBg, color: C.danger, border: C.dangerBorder, label: 'Rejeitado' },
      banned:   { bg: 'rgba(255,120,0,0.1)', color: '#ff7800', border: 'rgba(255,120,0,0.3)', label: 'Banido' },
    }[status]
    return (
      <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: '999px', padding: '0.18rem 0.65rem', fontSize: '0.7rem', fontWeight: 700 }}>
        {cfg.label}
      </span>
    )
  }

  // Show spinner while verifying stored session
  if (!authChecked) {
    return (
      <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: DARK.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <svg className="sk-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={DARK.primary} strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <style>{`.sk-spin { animation: sk-spin 0.8s linear infinite; } @keyframes sk-spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: DARK.muted, fontSize: '0.85rem' }}>Verificando acesso...</span>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{makeCSS(C)}</style>

      <nav className="sk-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0.75rem 1rem' : '1rem 2rem', borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/" style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.5px', color: C.text, textDecoration: 'none' }}>
            Sheik<span style={{ color: C.accent }}>STREAM</span>
          </a>
          <span style={{ fontSize: '0.68rem', background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.danger, padding: '0.2rem 0.7rem', borderRadius: '999px', fontWeight: 700, letterSpacing: '0.5px' }}>
            ADMIN
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {authed && (
            <button onClick={() => { setAuthed(false); setUsers([]); sessionStorage.removeItem('sk-admin-pw'); setStoredPw('') }}
              style={{ background: 'transparent', border: `1px solid ${C.dangerBorder}`, color: C.danger, padding: '0.35rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
              Sair
            </button>
          )}
          <button onClick={toggleTheme} className="sk-theme-btn" style={{ color: C.muted }}>
            {isDark
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
        </div>
      </nav>

      {!authed ? (
        /* ── Login gate ── */
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '2rem' }}>
          <div className="sk-card" style={{ background: C.cardBg, border: `1px solid ${C.borderStrong}`, borderTop: `3px solid ${C.primary}`, borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '380px', boxShadow: `0 12px 50px ${C.primaryBg}` }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: C.primaryBg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>
                🔒
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: C.text, margin: 0 }}>Painel Admin</h2>
              <p style={{ fontSize: '0.83rem', color: C.muted, marginTop: '0.4rem', margin: '0.4rem 0 0' }}>Acesso restrito ao administrador</p>
            </div>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha de administrador"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  name="sk_admin_secret_field"
                  autoFocus
                  style={{ width: '100%', padding: '0.75rem 2.8rem 0.75rem 1rem', background: C.inputBg, border: `1px solid ${authError ? C.dangerBorder : C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="sk-pw-toggle"
                  title={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {authError && (
                <p style={{ color: C.danger, fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>⚠</span> {authError}
                </p>
              )}
              <button type="submit" disabled={authLoading || !password}
                style={{ padding: '0.82rem', background: `linear-gradient(135deg,${C.primary},${isDark ? '#7b5cff' : '#5a15d0'})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 700, cursor: authLoading || !password ? 'not-allowed' : 'pointer', opacity: !password ? 0.6 : 1, transition: 'opacity 0.15s' }}>
                {authLoading ? 'Verificando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* ── Admin dashboard ── */
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '1rem' : '2.5rem 2rem' }}>
          {/* DB error banner */}
          {dbError && (
            <div style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.danger, borderRadius: '10px', padding: '0.9rem 1.2rem', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.1rem' }}>⚠</span>
              <div>
                <strong>Erro no banco de dados:</strong> {dbError}
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.2rem' }}>Verifique se o projeto Supabase está ativo em supabase.com (projetos gratuitos pausam após inatividade)</div>
              </div>
            </div>
          )}
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {([
              { label: 'Total', key: 'all' as const, color: C.primary },
              { label: 'Pendentes', key: 'pending' as const, color: C.primary },
              { label: 'Ativos', key: 'approved' as const, color: C.accent },
              { label: 'Rejeitados', key: 'rejected' as const, color: C.danger },
              { label: 'Banidos', key: 'banned' as const, color: '#ff7800' },
            ]).map(s => (
              <div key={s.key} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1.2rem 1.5rem' }}>
                <div style={{ fontSize: '0.68rem', color: C.dim, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{s.label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{usersLoading ? '—' : counts[s.key]}</div>
              </div>
            ))}
          </div>

          {/* Table card */}
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '0.5rem', padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {(['all', 'approved', 'pending', 'rejected', 'banned'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`sk-tab${filter === f ? ' active' : ''}`} style={{ color: filter === f ? C.primary : C.muted }}>
                    {{ all: 'Todos', pending: 'Pendentes', approved: 'Ativos', rejected: 'Rejeitados', banned: 'Banidos' }[f]}
                    <span style={{ marginLeft: '0.3rem', fontSize: '0.7rem', opacity: 0.7 }}>({counts[f]})</span>
                  </button>
                ))}
              </div>
              <button onClick={handleResetSessions} disabled={resetLoading}
                style={{ background: 'transparent', border: `1px solid ${C.dangerBorder}`, color: C.danger, padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>
                {resetLoading ? 'Resetando...' : '⊘ Resetar sessões Twitch'}
              </button>
              <button onClick={() => fetchUsers(storedPw)} disabled={usersLoading}
                style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                {usersLoading ? 'Carregando...' : 'Atualizar'}
              </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
            {usersLoading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Carregando usuários...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>
                Nenhum usuário {filter !== 'all' ? `com status "${filter}"` : ''} encontrado.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Plataforma', 'Usuário / E-mail', 'Status', 'Cadastrado em', 'Ações'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1.2rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, color: C.dim, letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="sk-user-row" style={{ borderBottom: `1px solid ${C.vdim}`, background: 'transparent' }}>
                      <td style={{ padding: '0.85rem 1.2rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.88rem', color: PLATFORM_COLORS[u.platform] || C.primary }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PLATFORM_COLORS[u.platform] || C.primary, display: 'inline-block', flexShrink: 0 }} />
                          {u.platform}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.2rem' }}>
                        <div style={{ fontSize: '0.85rem', color: C.text, fontWeight: 500 }}>{u.platform_username || '—'}</div>
                        {u.email && <div style={{ fontSize: '0.75rem', color: C.dim, marginTop: '0.1rem' }}>{u.email}</div>}
                      </td>
                      <td style={{ padding: '0.85rem 1.2rem' }}>{statusBadge(u.status)}</td>
                      <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.78rem', color: C.dim }}>{fmtDate(u.created_at)}</td>
                      <td style={{ padding: '0.85rem 1.2rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {u.status !== 'approved' && (
                            <button
                              className="sk-btn-approve"
                              onClick={() => handleAction(u.id, 'approved')}
                              disabled={actionLoading === u.id + 'approved'}
                            >
                              {actionLoading === u.id + 'approved' ? '...' : '✓ Ativar'}
                            </button>
                          )}
                          {u.status !== 'rejected' && u.status !== 'banned' && (
                            <button
                              className="sk-btn-reject"
                              onClick={() => handleAction(u.id, 'rejected')}
                              disabled={actionLoading === u.id + 'rejected'}
                            >
                              {actionLoading === u.id + 'rejected' ? '...' : '✕ Rejeitar'}
                            </button>
                          )}
                          {u.status !== 'banned' && (
                            <button
                              className="sk-btn-ban"
                              onClick={() => handleAction(u.id, 'banned')}
                              disabled={actionLoading === u.id + 'banned'}
                            >
                              {actionLoading === u.id + 'banned' ? '...' : '⊘ Banir'}
                            </button>
                          )}
                          {u.status === 'banned' && (
                            <button
                              className="sk-btn-approve"
                              onClick={() => handleAction(u.id, 'approved')}
                              disabled={actionLoading === u.id + 'approved'}
                            >
                              {actionLoading === u.id + 'approved' ? '...' : '↩ Reativar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
