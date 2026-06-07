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

type Log = {
  id: string
  action: string
  target_username: string | null
  target_platform: string | null
  performed_at: string
}

type ActivityLog = {
  id: string
  category: string
  event: string
  username: string | null
  platform: string | null
  details: string | null
  performed_at: string
}

type ErrorLog = {
  id: string
  endpoint: string
  error_message: string
  error_stack: string | null
  user_id: string | null
  context: Record<string, unknown> | null
  created_at: string
}

type SystemLog = {
  id: string
  type: string
  message: string
  user_id: string | null
  data: Record<string, unknown> | null
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
  .sk-btn-reset { transition: all 0.07s; border: 1px solid rgba(99,179,237,0.35); background: rgba(59,130,246,0.1); color: #60a5fa; border-radius: 6px; padding: 0.32rem 0.8rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
  .sk-btn-reset:hover { filter: brightness(1.15); transform: translateY(-1px); }
  .sk-btn-reset:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .sk-btn-delete { transition: all 0.07s; border: 1px solid rgba(255,68,68,0.2); background: transparent; color: rgba(255,68,68,0.5); border-radius: 6px; padding: 0.32rem 0.65rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
  .sk-btn-delete:hover { border-color: rgba(255,68,68,0.45); background: rgba(255,68,68,0.08); color: #ff4444; transform: translateY(-1px); }
  .sk-btn-delete:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
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
  const [view, setView] = useState<'users' | 'logs' | 'banner' | 'passwords' | 'roles'>('users')
  type UserRole = { id: string; user_id: string; role: string; created_at: string }
  const [roles, setRoles] = useState<UserRole[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesSaving, setRolesSaving] = useState<string | null>(null)
  type AdminPw = { id: string; label: string; password: string; type: 'temporary' | 'permanent'; active: boolean; expires_at: string | null; created_at: string }
  const [passwords, setPasswords] = useState<AdminPw[]>([])
  const [pwLoading, setPwLoading] = useState(false)
  const [showPw, setShowPw] = useState<Record<string, boolean>>({})
  const [pwForm, setPwForm] = useState({ label: '', password: '', type: 'temporary', expires_hours: '24' })
  const [pwSaving, setPwSaving] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logTab, setLogTab] = useState<'admin' | 'auth' | 'dashboard' | 'feature' | 'errors' | 'system'>('admin')
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [errorLogsLoading, setErrorLogsLoading] = useState(false)
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [systemLogsLoading, setSystemLogsLoading] = useState(false)
  const [bannerCfg, setBannerCfg] = useState({ active: false, icon: '☕', text_main: 'Apoie o desenvolvimento da plataforma!', text_sub: 'Sua doação vai direto para o desenvolvedor e ajuda a manter tudo gratuito.', text_note: 'Não conta em sorteios ou metas do seu canal.', action_label: 'Apoiar dev', action_url: '', color: '#f59e0b', amount_current: 10, amount_goal: 5000, supporter_count: 1 })
  const [bannerSaving, setBannerSaving] = useState(false)
  const [bannerLoading, setBannerLoading] = useState(false)
  const [bannerSaved, setBannerSaved] = useState(false)

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

  const fetchLogs = useCallback(async (pw: string) => {
    setLogsLoading(true)
    try {
      const res = await fetch('/api/admin/logs', { headers: { 'x-admin-password': pw } })
      if (res.ok) setLogs(await res.json())
    } catch { /* ignore */ } finally {
      setLogsLoading(false)
    }
  }, [])

  const fetchActivity = useCallback(async (pw: string, category: string) => {
    setActivityLoading(true)
    try {
      const res = await fetch(`/api/admin/activity?category=${category}`, { headers: { 'x-admin-password': pw } })
      if (res.ok) setActivity(await res.json())
    } catch { /* ignore */ } finally {
      setActivityLoading(false)
    }
  }, [])

  const fetchErrorLogs = useCallback(async (pw: string) => {
    setErrorLogsLoading(true)
    try {
      const res = await fetch('/api/admin/error-logs', { headers: { 'x-admin-password': pw } })
      if (res.ok) setErrorLogs(await res.json())
    } catch { /* ignore */ } finally {
      setErrorLogsLoading(false)
    }
  }, [])

  const fetchSystemLogs = useCallback(async (pw: string) => {
    setSystemLogsLoading(true)
    try {
      const res = await fetch('/api/admin/system-logs', { headers: { 'x-admin-password': pw } })
      if (res.ok) setSystemLogs(await res.json())
    } catch { /* ignore */ } finally {
      setSystemLogsLoading(false)
    }
  }, [])

  const fetchPasswords = useCallback(async (pw: string) => {
    setPwLoading(true)
    try {
      const res = await fetch('/api/admin/passwords', { headers: { 'x-admin-password': pw } })
      if (res.ok) setPasswords(await res.json())
    } catch { /* ignore */ } finally {
      setPwLoading(false)
    }
  }, [])

  const fetchRoles = useCallback(async (pw: string) => {
    setRolesLoading(true)
    try {
      const res = await fetch('/api/admin/roles', { headers: { 'x-admin-password': pw } })
      if (res.ok) setRoles(await res.json())
    } catch { /* ignore */ } finally {
      setRolesLoading(false)
    }
  }, [])

  async function assignRole(userId: string, role: string) {
    setRolesSaving(userId)
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw },
        body: JSON.stringify({ user_id: userId, role }),
      })
      if (res.ok) await fetchRoles(storedPw)
    } finally {
      setRolesSaving(null)
    }
  }

  async function removeRole(userId: string) {
    setRolesSaving(userId)
    try {
      await fetch(`/api/admin/roles?user_id=${userId}`, { method: 'DELETE', headers: { 'x-admin-password': storedPw } })
      setRoles(r => r.filter(x => x.user_id !== userId))
    } finally {
      setRolesSaving(null)
    }
  }

  async function createPassword() {
    if (!pwForm.label.trim()) return
    setPwSaving(true)
    const res = await fetch('/api/admin/passwords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw },
      body: JSON.stringify({ label: pwForm.label, password: pwForm.password || undefined, type: pwForm.type, expires_hours: pwForm.type === 'temporary' ? Number(pwForm.expires_hours) : undefined }),
    })
    setPwSaving(false)
    if (res.ok) { setPwForm({ label: '', password: '', type: 'temporary', expires_hours: '24' }); fetchPasswords(storedPw) }
  }

  async function deletePassword(id: string) {
    await fetch(`/api/admin/passwords?id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': storedPw } })
    setPasswords(p => p.filter(x => x.id !== id))
  }

  async function togglePasswordActive(pw: AdminPw) {
    await fetch('/api/admin/passwords', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw }, body: JSON.stringify({ id: pw.id, active: !pw.active }) })
    setPasswords(p => p.map(x => x.id === pw.id ? { ...x, active: !x.active } : x))
  }

  async function clearErrorLogs() {
    if (!confirm('Limpar todos os logs de erro?')) return
    await fetch('/api/admin/error-logs', { method: 'DELETE', headers: { 'x-admin-password': storedPw } })
    setErrorLogs([])
  }

  async function clearSystemLogs() {
    if (!confirm('Limpar todos os logs do sistema?')) return
    await fetch('/api/admin/system-logs', { method: 'DELETE', headers: { 'x-admin-password': storedPw } })
    setSystemLogs([])
  }

  const fetchBanner = useCallback(async (pw: string) => {
    setBannerLoading(true)
    try {
      const res = await fetch('/api/admin/dev-banner', { headers: { 'x-admin-password': pw } })
      if (res.ok) {
        const d = await res.json()
        if (d && Object.keys(d).length > 0) setBannerCfg(prev => ({ ...prev, ...d }))
      }
    } catch { /* ignore */ } finally {
      setBannerLoading(false)
    }
  }, [])

  async function saveBanner() {
    setBannerSaving(true)
    try {
      await fetch('/api/admin/dev-banner', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw }, body: JSON.stringify(bannerCfg) })
      setBannerSaved(true)
      setTimeout(() => setBannerSaved(false), 2000)
    } finally {
      setBannerSaving(false)
    }
  }

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

  async function handleAction(id: string, status: 'approved' | 'rejected' | 'banned' | 'pending') {
    setActionLoading(id + status)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u))
        fetchLogs(storedPw)
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(id: string, username: string) {
    if (!confirm(`Excluir permanentemente "${username}"? Esta ação não pode ser desfeita.`)) return
    setActionLoading(id + 'delete')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw },
        body: JSON.stringify({ id }),
      })
      if (res.ok) setUsers(prev => prev.filter(u => u.id !== id))
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
          {/* View switcher */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
            {([
              { v: 'users',     label: '👥 Usuários' },
              { v: 'logs',      label: '📋 Logs' },
              { v: 'banner',    label: '🎗 Banner' },
              { v: 'passwords', label: '🔑 Senhas Admin' },
              { v: 'roles',     label: '🏷 Funções' },
            ] as const).map(({ v, label }) => (
              <button key={v} onClick={() => { setView(v); if (v === 'logs') fetchLogs(storedPw); if (v === 'banner') fetchBanner(storedPw); if (v === 'passwords') fetchPasswords(storedPw); if (v === 'roles') { fetchRoles(storedPw); fetchUsers(storedPw) } }}
                className={`sk-tab${view === v ? ' active' : ''}`}
                style={{ color: view === v ? C.primary : C.muted }}>
                {label}
              </button>
            ))}
          </div>

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
          {view === 'logs' ? (
            /* ── Logs view ── */
            <>
              {/* Log sub-tabs */}
              <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {([
                  { key: 'admin',     label: '🛡 Admin' },
                  { key: 'auth',      label: '🔑 Autenticação' },
                  { key: 'dashboard', label: '📊 Navegação' },
                  { key: 'feature',   label: '⚡ Funcionalidades' },
                  { key: 'errors',    label: '⚠ Erros' },
                  { key: 'system',    label: '⚙ Sistema' },
                ] as const).map(t => (
                  <button key={t.key}
                    onClick={() => {
                      setLogTab(t.key)
                      if (t.key === 'admin') fetchLogs(storedPw)
                      else if (t.key === 'errors') fetchErrorLogs(storedPw)
                      else if (t.key === 'system') fetchSystemLogs(storedPw)
                      else fetchActivity(storedPw, t.key)
                    }}
                    className={`sk-tab${logTab === t.key ? ' active' : ''}`}
                    style={{ color: logTab === t.key ? (t.key === 'errors' ? C.danger : C.primary) : C.muted }}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: C.text }}>
                    {{ admin: '🛡 Ações do admin', auth: '🔑 Autenticação', dashboard: '📊 Navegação no dashboard', feature: '⚡ Uso de funcionalidades', errors: '⚠ Logs de erro', system: '⚙ Logs do sistema' }[logTab]}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {logTab === 'errors' && (
                    <button onClick={clearErrorLogs} style={{ background: 'transparent', border: `1px solid ${C.dangerBorder}`, color: C.danger, padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>
                      Limpar
                    </button>
                  )}
                  {logTab === 'system' && (
                    <button onClick={clearSystemLogs} style={{ background: 'transparent', border: `1px solid ${C.dangerBorder}`, color: C.danger, padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>
                      Limpar
                    </button>
                  )}
                  <button
                    onClick={() => { if (logTab === 'admin') fetchLogs(storedPw); else if (logTab === 'errors') fetchErrorLogs(storedPw); else if (logTab === 'system') fetchSystemLogs(storedPw); else fetchActivity(storedPw, logTab) }}
                    disabled={logTab === 'admin' ? logsLoading : logTab === 'errors' ? errorLogsLoading : logTab === 'system' ? systemLogsLoading : activityLoading}
                    style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                    {(logTab === 'admin' ? logsLoading : logTab === 'errors' ? errorLogsLoading : logTab === 'system' ? systemLogsLoading : activityLoading) ? 'Carregando...' : 'Atualizar'}
                  </button>
                  </div>
                </div>

                {/* Admin tab — approve/reject/ban */}
                {logTab === 'admin' && (
                  logsLoading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Carregando...</div>
                  ) : logs.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Nenhuma ação registrada ainda.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                            {['Data / Hora', 'Ação', 'Plataforma', 'Usuário'].map(h => (
                              <th key={h} style={{ padding: '0.75rem 1.2rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, color: C.dim, letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map(log => {
                            const actionCfg: Record<string, { label: string; bg: string; color: string; border: string }> = {
                              approved: { label: '✓ Aprovado',  bg: C.accentBg,            color: C.accent,  border: C.accentBorder },
                              rejected: { label: '✕ Rejeitado', bg: C.dangerBg,            color: C.danger,  border: C.dangerBorder },
                              banned:   { label: '⊘ Banido',   bg: 'rgba(255,120,0,0.1)', color: '#ff7800', border: 'rgba(255,120,0,0.3)' },
                            }
                            const cfg = actionCfg[log.action] ?? { label: log.action, bg: C.primaryBg, color: C.primary, border: C.border }
                            return (
                              <tr key={log.id} className="sk-user-row" style={{ borderBottom: `1px solid ${C.vdim}`, background: 'transparent' }}>
                                <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.78rem', color: C.dim, whiteSpace: 'nowrap' }}>{fmtDate(log.performed_at)}</td>
                                <td style={{ padding: '0.85rem 1.2rem' }}>
                                  <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: '999px', padding: '0.18rem 0.65rem', fontSize: '0.72rem', fontWeight: 700 }}>{cfg.label}</span>
                                </td>
                                <td style={{ padding: '0.85rem 1.2rem' }}>
                                  {log.target_platform ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: PLATFORM_COLORS[log.target_platform] || C.primary }}>
                                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: PLATFORM_COLORS[log.target_platform] || C.primary, display: 'inline-block' }} />
                                      {log.target_platform}
                                    </span>
                                  ) : <span style={{ color: C.dim }}>—</span>}
                                </td>
                                <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.85rem', color: C.text, fontWeight: 500 }}>{log.target_username ?? '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {/* Error logs tab */}
                {logTab === 'errors' && (
                  errorLogsLoading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Carregando...</div>
                  ) : errorLogs.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Nenhum erro registrado.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                            {['Data / Hora', 'Endpoint', 'Erro', 'Contexto'].map(h => (
                              <th key={h} style={{ padding: '0.75rem 1.2rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, color: C.dim, letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {errorLogs.map(e => (
                            <tr key={e.id} className="sk-user-row" style={{ borderBottom: `1px solid ${C.vdim}`, background: 'transparent' }}>
                              <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.78rem', color: C.dim, whiteSpace: 'nowrap' }}>{fmtDate(e.created_at)}</td>
                              <td style={{ padding: '0.85rem 1.2rem' }}>
                                <span style={{ background: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}`, borderRadius: '6px', padding: '0.15rem 0.55rem', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace' }}>{e.endpoint}</span>
                              </td>
                              <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.8rem', color: C.text, maxWidth: '320px' }}>
                                <div style={{ color: C.danger, fontWeight: 600, marginBottom: '0.2rem' }}>{e.error_message}</div>
                                {e.error_stack && <details style={{ fontSize: '0.7rem', color: C.dim }}><summary style={{ cursor: 'pointer', color: C.muted }}>Stack trace</summary><pre style={{ margin: '0.4rem 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.68rem' }}>{e.error_stack}</pre></details>}
                              </td>
                              <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.72rem', color: C.muted, maxWidth: '200px' }}>
                                {e.context ? <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.68rem' }}>{JSON.stringify(e.context, null, 2)}</pre> : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {/* System logs tab */}
                {logTab === 'system' && (
                  systemLogsLoading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Carregando...</div>
                  ) : systemLogs.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Nenhum evento do sistema registrado.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                            {['Data / Hora', 'Tipo', 'Mensagem', 'Dados'].map(h => (
                              <th key={h} style={{ padding: '0.75rem 1.2rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, color: C.dim, letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {systemLogs.map(s => {
                            const typeColor = s.type.startsWith('auth') ? '#60a5fa' : s.type.startsWith('cron') ? '#a78bfa' : s.type.startsWith('token') ? '#fb923c' : C.muted
                            return (
                              <tr key={s.id} className="sk-user-row" style={{ borderBottom: `1px solid ${C.vdim}`, background: 'transparent' }}>
                                <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.78rem', color: C.dim, whiteSpace: 'nowrap' }}>{fmtDate(s.created_at)}</td>
                                <td style={{ padding: '0.85rem 1.2rem' }}>
                                  <span style={{ background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}44`, borderRadius: '6px', padding: '0.15rem 0.55rem', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace' }}>{s.type}</span>
                                </td>
                                <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.82rem', color: C.text }}>{s.message}</td>
                                <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.72rem', color: C.muted, maxWidth: '200px' }}>
                                  {s.data ? <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.68rem' }}>{JSON.stringify(s.data, null, 2)}</pre> : '—'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {/* Auth / Dashboard / Feature tabs */}
                {logTab !== 'admin' && logTab !== 'errors' && logTab !== 'system' && (
                  activityLoading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Carregando...</div>
                  ) : activity.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Nenhum registro ainda.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                            {['Data / Hora', 'Evento', 'Plataforma', 'Usuário', 'Detalhe'].map(h => (
                              <th key={h} style={{ padding: '0.75rem 1.2rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, color: C.dim, letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activity.map(a => {
                            const evtCfg: Record<string, { label: string; bg: string; color: string; border: string }> = {
                              login:     { label: '→ Login',      bg: C.accentBg,            color: C.accent,   border: C.accentBorder },
                              logout:    { label: '← Logout',     bg: 'rgba(255,120,0,0.1)', color: '#ff7800',  border: 'rgba(255,120,0,0.3)' },
                              page_view: { label: '👁 Visualizou', bg: C.primaryBg,           color: C.primary,  border: C.border },
                            }
                            const cfg = evtCfg[a.event] ?? { label: a.event, bg: C.vvdim, color: C.muted, border: C.border }
                            return (
                              <tr key={a.id} className="sk-user-row" style={{ borderBottom: `1px solid ${C.vdim}`, background: 'transparent' }}>
                                <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.78rem', color: C.dim, whiteSpace: 'nowrap' }}>{fmtDate(a.performed_at)}</td>
                                <td style={{ padding: '0.85rem 1.2rem' }}>
                                  <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: '999px', padding: '0.18rem 0.65rem', fontSize: '0.72rem', fontWeight: 700 }}>{cfg.label}</span>
                                </td>
                                <td style={{ padding: '0.85rem 1.2rem' }}>
                                  {a.platform ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: PLATFORM_COLORS[a.platform] || C.primary }}>
                                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: PLATFORM_COLORS[a.platform] || C.primary, display: 'inline-block' }} />
                                      {a.platform}
                                    </span>
                                  ) : <span style={{ color: C.dim }}>—</span>}
                                </td>
                                <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.85rem', color: C.text, fontWeight: 500 }}>{a.username ?? '—'}</td>
                                <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.78rem', color: C.muted, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.details ?? '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </>
          ) : view === 'banner' ? (
          /* ── Banner view ── */
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.text }}>🎗 Banner de Apoio ao Dev</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: C.muted }}>Exibido no rodapé do painel para todos os usuários</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button onClick={() => fetchBanner(storedPw)} disabled={bannerLoading} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>↺ Atualizar</button>
                <button onClick={saveBanner} disabled={bannerSaving} style={{ background: bannerSaved ? C.accentBg : C.primaryBg, border: `1px solid ${bannerSaved ? C.accentBorder : C.borderStrong}`, color: bannerSaved ? C.accent : C.primary, padding: '0.35rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                  {bannerSaving ? 'Salvando...' : bannerSaved ? '✓ Salvo' : 'Salvar'}
                </button>
              </div>
            </div>

            {/* Enable toggle */}
            <div onClick={() => setBannerCfg(p => ({ ...p, active: !p.active }))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: bannerCfg.active ? C.accentBg : C.vvdim, border: `1px solid ${bannerCfg.active ? C.accentBorder : C.border}`, borderRadius: '10px', cursor: 'pointer', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: bannerCfg.active ? C.accent : C.muted }}>{bannerCfg.active ? '● Banner ativo — visível para todos os usuários' : '○ Banner inativo — não é exibido'}</span>
              <div style={{ width: 40, height: 22, background: bannerCfg.active ? C.accent : C.vdim, borderRadius: 11, position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: bannerCfg.active ? 19 : 3, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'Ícone (emoji)', key: 'icon' as const, placeholder: '☕' },
                { label: 'Cor do tema (hex)', key: 'color' as const, placeholder: '#f59e0b', type: 'color' },
                { label: 'Texto principal', key: 'text_main' as const, placeholder: 'Apoie o desenvolvimento...' },
                { label: 'Texto secundário', key: 'text_sub' as const, placeholder: 'Sua doação vai direto...' },
                { label: 'Nota (pequena, itálico)', key: 'text_note' as const, placeholder: 'Não conta em sorteios...' },
                { label: 'Label do botão', key: 'action_label' as const, placeholder: 'Apoiar dev' },
                { label: 'URL do botão (link externo)', key: 'action_url' as const, placeholder: 'https://...' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                  {type === 'color' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="color" value={bannerCfg[key] as string} onChange={e => setBannerCfg(p => ({ ...p, [key]: e.target.value }))} style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px' }} />
                      <input value={bannerCfg[key] as string} onChange={e => setBannerCfg(p => ({ ...p, [key]: e.target.value }))} style={{ flex: 1, padding: '0.5rem 0.75rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '7px', color: C.text, fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                  ) : (
                    <input value={bannerCfg[key] as string} onChange={e => setBannerCfg(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                      style={{ padding: '0.5rem 0.75rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '7px', color: C.text, fontSize: '0.85rem', outline: 'none' }} />
                  )}
                </div>
              ))}

              {[
                { label: 'Valor arrecadado (R$)', key: 'amount_current' as const },
                { label: 'Meta total (R$)', key: 'amount_goal' as const },
                { label: 'Nº de apoiadores', key: 'supporter_count' as const },
              ].map(({ label, key }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                  <input type="number" value={bannerCfg[key]} onChange={e => setBannerCfg(p => ({ ...p, [key]: Number(e.target.value) }))}
                    style={{ padding: '0.5rem 0.75rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '7px', color: C.text, fontSize: '0.85rem', outline: 'none' }} />
                </div>
              ))}
            </div>

            {/* Preview */}
            <div style={{ marginTop: '1.5rem', borderTop: `1px solid ${C.border}`, paddingTop: '1.25rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Preview</div>
              <div style={{ background: `${bannerCfg.color}15`, borderTop: `2px solid ${bannerCfg.color}55`, borderRadius: '0 0 10px 10px', padding: '0.65rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.2rem' }}>{bannerCfg.icon}</span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: bannerCfg.color }}>{bannerCfg.text_main}</span>
                    <span style={{ fontSize: '0.76rem', color: C.muted }}>{bannerCfg.text_sub}</span>
                  </div>
                  {bannerCfg.text_note && <div style={{ fontSize: '0.68rem', color: C.dim }}>{bannerCfg.text_note}</div>}
                  {bannerCfg.amount_goal > 0 && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 120, background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                        <div style={{ background: bannerCfg.color, width: `${Math.min(100, (bannerCfg.amount_current / bannerCfg.amount_goal) * 100)}%`, height: '100%', borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: '0.68rem', color: bannerCfg.color, fontWeight: 600 }}>R$ {Number(bannerCfg.amount_current).toLocaleString('pt-BR',{minimumFractionDigits:2})} de R$ {Number(bannerCfg.amount_goal).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                    </div>
                  )}
                </div>
                {bannerCfg.action_url && <a href="#" style={{ padding: '0.45rem 1rem', background: `${bannerCfg.color}22`, border: `1px solid ${bannerCfg.color}55`, color: bannerCfg.color, borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>{bannerCfg.action_label}</a>}
              </div>
            </div>
          </div>
          ) : (
          /* ── Users view ── */
          <>
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
                          {u.status !== 'pending' && (
                            <button
                              className="sk-btn-reset"
                              onClick={() => handleAction(u.id, 'pending')}
                              disabled={actionLoading === u.id + 'pending'}
                              title="Volta o usuário para pendente — precisa ser aprovado novamente"
                            >
                              {actionLoading === u.id + 'pending' ? '...' : '↺ Resetar'}
                            </button>
                          )}
                          <button
                            className="sk-btn-delete"
                            onClick={() => handleDelete(u.id, u.platform_username || u.email || u.id)}
                            disabled={actionLoading === u.id + 'delete'}
                            title="Excluir permanentemente este usuário"
                          >
                            {actionLoading === u.id + 'delete' ? '...' : '🗑'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </div>
          </>
          )}
          {view === 'passwords' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Create form */}
              <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.2rem', fontSize: '1rem', fontWeight: 700, color: C.text }}>🔑 Nova senha admin</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: C.muted, marginBottom: '0.3rem' }}>Nome / Label</div>
                    <input value={pwForm.label} onChange={e => setPwForm(p => ({ ...p, label: e.target.value }))} placeholder="Ex: Admin temporário — João" style={{ width: '100%', padding: '0.55rem 0.85rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: C.muted, marginBottom: '0.3rem' }}>Senha (deixe vazio para gerar)</div>
                    <input value={pwForm.password} onChange={e => setPwForm(p => ({ ...p, password: e.target.value }))} placeholder="Gerar automaticamente" style={{ width: '100%', padding: '0.55rem 0.85rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: C.muted, marginBottom: '0.3rem' }}>Tipo</div>
                    <select value={pwForm.type} onChange={e => setPwForm(p => ({ ...p, type: e.target.value }))} style={{ width: '100%', padding: '0.55rem 0.85rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.85rem', outline: 'none' }}>
                      <option value="temporary">Temporária</option>
                      <option value="permanent">Permanente</option>
                    </select>
                  </div>
                  {pwForm.type === 'temporary' && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: C.muted, marginBottom: '0.3rem' }}>Validade (horas)</div>
                      <input type="number" min={1} max={720} value={pwForm.expires_hours} onChange={e => setPwForm(p => ({ ...p, expires_hours: e.target.value }))} style={{ width: '100%', padding: '0.55rem 0.85rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' as const }} />
                    </div>
                  )}
                </div>
                <button onClick={createPassword} disabled={pwSaving || !pwForm.label.trim()} className="sk-btn-approve" style={{ opacity: (!pwForm.label.trim() || pwSaving) ? 0.5 : 1 }}>
                  {pwSaving ? 'Criando...' : '+ Criar senha'}
                </button>
              </div>

              {/* List */}
              <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.2rem', fontSize: '1rem', fontWeight: 700, color: C.text }}>Senhas cadastradas</h3>
                {pwLoading ? (
                  <div style={{ color: C.muted, fontSize: '0.85rem' }}>Carregando...</div>
                ) : passwords.length === 0 ? (
                  <div style={{ color: C.muted, fontSize: '0.85rem' }}>Nenhuma senha cadastrada ainda.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {passwords.map(pw => {
                      const expired = pw.type === 'temporary' && pw.expires_at && new Date(pw.expires_at) < new Date()
                      return (
                        <div key={pw.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: pw.active && !expired ? C.primaryBg : C.vvdim, border: `1px solid ${pw.active && !expired ? C.border : C.border}`, borderRadius: '10px', flexWrap: 'wrap' as const }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' as const }}>
                              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: C.text }}>{pw.label}</span>
                              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.4rem', background: pw.type === 'permanent' ? C.accentBg : C.primaryBg, color: pw.type === 'permanent' ? C.accent : C.primary, borderRadius: 999 }}>{pw.type === 'permanent' ? 'PERMANENTE' : 'TEMPORÁRIA'}</span>
                              {expired && <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.4rem', background: C.dangerBg, color: C.danger, borderRadius: 999 }}>EXPIRADA</span>}
                              {!pw.active && <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.4rem', background: C.vvdim, color: C.muted, borderRadius: 999 }}>INATIVA</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                              <code style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: C.muted, background: C.vvdim, padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                                {showPw[pw.id] ? pw.password : '••••••••'}
                              </code>
                              <button onClick={() => setShowPw(p => ({ ...p, [pw.id]: !p[pw.id] }))} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '0.75rem', padding: '0.1rem 0.3rem' }}>
                                {showPw[pw.id] ? '🙈' : '👁'}
                              </button>
                              {pw.expires_at && <span style={{ fontSize: '0.72rem', color: C.dim }}>Expira: {new Date(pw.expires_at).toLocaleDateString('pt-BR')}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                            <button onClick={() => togglePasswordActive(pw)} className={pw.active ? 'sk-btn-reset' : 'sk-btn-approve'} style={{ fontSize: '0.75rem', padding: '0.28rem 0.65rem' }}>
                              {pw.active ? 'Desativar' : 'Ativar'}
                            </button>
                            <button onClick={() => deletePassword(pw.id)} className="sk-btn-delete">🗑</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          {view === 'roles' && (() => {
            const ROLES = ['admin', 'moderador', 'vip', 'streamer', 'parceiro', 'editor']
            const ROLE_COLORS: Record<string, string> = { admin: '#ff4444', moderador: '#9147ff', vip: '#fbbf24', streamer: '#39ff14', parceiro: '#3b82f6', editor: '#f97316' }
            const roleMap = Object.fromEntries(roles.map(r => [r.user_id, r]))
            const allUsers = users.filter(u => u.status === 'approved')
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: 700, color: C.text }}>Funções dos usuários</h3>
                  <p style={{ margin: '0 0 1.2rem', fontSize: '0.8rem', color: C.muted }}>Selecione um usuário aprovado e atribua uma função. A função aparece no perfil do usuário.</p>
                  {rolesLoading ? (
                    <div style={{ color: C.muted, fontSize: '0.85rem' }}>Carregando...</div>
                  ) : allUsers.length === 0 ? (
                    <div style={{ color: C.muted, fontSize: '0.85rem' }}>Nenhum usuário aprovado encontrado.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {allUsers.map(u => {
                        const uname = u.platform_username || u.email || u.id.slice(0, 8)
                        const currentRole = roleMap[u.id]?.role
                        const isSaving = rolesSaving === u.id
                        return (
                          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', background: C.cardBgAlt, borderRadius: '10px', border: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 140 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: PLATFORM_COLORS[u.platform] || C.primaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                {uname.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: C.text }}>{uname}</div>
                                <div style={{ fontSize: '0.68rem', color: C.muted }}>{u.platform}</div>
                              </div>
                            </div>
                            {currentRole && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.7rem', borderRadius: '999px', background: `${ROLE_COLORS[currentRole] ?? C.primaryBg}22`, color: ROLE_COLORS[currentRole] ?? C.primary, border: `1px solid ${ROLE_COLORS[currentRole] ?? C.primary}44` }}>
                                {currentRole}
                              </span>
                            )}
                            <select
                              value={currentRole ?? ''}
                              disabled={isSaving}
                              onChange={e => { if (e.target.value) assignRole(u.id, e.target.value); else removeRole(u.id) }}
                              style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.text, borderRadius: '7px', padding: '0.3rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}
                            >
                              <option value="">— sem função —</option>
                              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {isSaving && <span style={{ fontSize: '0.75rem', color: C.muted }}>Salvando...</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
