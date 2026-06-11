'use client'
import React, { useState, useEffect, useCallback } from 'react'

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
  image_url?: string
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
  .sk-sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: 240px; background: ${C.navBg}; border-right: 1px solid ${C.border}; display: flex; flex-direction: column; z-index: 300; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); transition: transform 0.22s cubic-bezier(.4,0,.2,1); overflow: hidden; }
  .sk-sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 250; }
  .sk-nav-item { display: flex; align-items: center; gap: 0.55rem; padding: 0.52rem 1.1rem; width: 100%; text-align: left; background: transparent; border: none; cursor: pointer; font-size: 0.82rem; font-weight: 500; color: ${C.muted}; transition: background 0.1s, color 0.1s; border-left: 2px solid transparent; }
  .sk-nav-item:hover { background: ${C.primaryBg}; color: ${C.text}; }
  .sk-nav-item.sk-nav-active { background: ${C.primaryBg}; color: ${C.primary}; font-weight: 700; border-left-color: ${C.primary}; }
  .sk-nav-badge { margin-left: auto; min-width: 18px; height: 18px; padding: 0 5px; background: ${C.primary}; color: #fff; border-radius: 999px; font-size: 0.6rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .sk-nav-group-label { padding: 0.8rem 1.1rem 0.3rem; font-size: 0.58rem; font-weight: 800; color: ${C.vdim}; text-transform: uppercase; letter-spacing: 0.1em; }
  .sk-stat-card { background: ${C.cardBg}; border: 1px solid ${C.border}; border-radius: 14px; padding: 1.1rem 1.3rem; transition: border-color 0.15s, box-shadow 0.15s; }
  .sk-stat-card:hover { border-color: ${C.borderStrong}; box-shadow: 0 4px 24px ${C.primaryBg}; }
  @keyframes sk-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
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
  const [view, setView] = useState<'users' | 'logs' | 'banner' | 'passwords' | 'roles' | 'tickets' | 'online' | 'notify' | 'navorder' | 'invites' | 'iaimagens'>('users')
  type AiImgCfg = { enabled: boolean; cooldown_seconds: number; max_per_day: number; allowed_roles: string[]; role_limits: Record<string, number>; role_delays: Record<string, number> }
  type AiGen = { id: string; user_name: string; user_role: string; prompt: string; status: string; created_at: string }
  const [aiCfg, setAiCfg] = useState<AiImgCfg>({ enabled: true, cooldown_seconds: 300, max_per_day: 10, allowed_roles: ['admin', 'moderador', 'vip'], role_limits: {}, role_delays: {} })
  const [aiRecent, setAiRecent] = useState<AiGen[]>([])
  const [aiImgExpanded, setAiImgExpanded] = useState<Record<string, string | null>>({})
  const [aiImgLoading, setAiImgLoading] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSaving, setAiSaving] = useState(false)
  const [aiSaved, setAiSaved] = useState(false)
  const fetchAiCfg = async (pw: string) => {
    setAiLoading(true)
    const res = await fetch('/api/admin/ia-imagens/config', { headers: { 'x-admin-password': pw } })
    const d = await res.json()
    if (d.config) {
      const maxDay = d.config.max_per_day || 10
      const defCd = d.config.cooldown_seconds || 300
      const rl: Record<string, number> = {}
      const rd: Record<string, number> = {}
      const groups = ['todos', 'admin', 'moderador', 'vip', 'streamer']
      groups.forEach(g => {
        rl[g] = (d.config.role_limits ?? {})[g] ?? maxDay
        rd[g] = (d.config.role_delays ?? {})[g] ?? defCd
      })
      setAiCfg({ ...d.config, role_limits: rl, role_delays: rd })
    }
    setAiRecent(d.recent ?? [])
    setAiImgExpanded({})
    setAiLoading(false)
  }

  const toggleAiImg = async (id: string) => {
    if (aiImgExpanded[id] !== undefined) {
      setAiImgExpanded(p => { const n = { ...p }; delete n[id]; return n })
      return
    }
    setAiImgLoading(id)
    try {
      const res = await fetch(`/api/admin/ia-imagens/image?id=${id}`, { headers: { 'x-admin-password': storedPw } })
      const d = await res.json()
      setAiImgExpanded(p => ({ ...p, [id]: d.image_url ?? null }))
    } catch {
      setAiImgExpanded(p => ({ ...p, [id]: null }))
    } finally {
      setAiImgLoading(null)
    }
  }
  const saveAiCfg = async () => {
    setAiSaving(true)
    try {
      const res = await fetch('/api/admin/ia-imagens/config', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw }, body: JSON.stringify(aiCfg) })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(`Erro ao salvar: ${d.error ?? `HTTP ${res.status}`}`)
      } else {
        setAiSaved(true); setTimeout(() => setAiSaved(false), 2500)
      }
    } catch { alert('Erro de conexão ao salvar') }
    setAiSaving(false)
  }
  const [userSearch, setUserSearch] = useState('')
  const [navSearch, setNavSearch] = useState('')
  type LoginLog = { id: string; ip: string; user_agent: string; success: boolean; created_at: string }
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
  const [loginLogsLoading, setLoginLogsLoading] = useState(false)
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
  const [logTab, setLogTab] = useState<'admin' | 'auth' | 'dashboard' | 'feature' | 'errors' | 'system' | 'logins' | 'changelog'>('admin')
  const [logSearch, setLogSearch] = useState('')
  type SupportTicket = { id: string; subject: string; message: string; reply_email: string | null; username: string | null; status: string; created_at: string; updated_at: string; admin_reply: string | null }
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [adminReply, setAdminReply] = useState<Record<string, string>>({})
  const [ticketUpdating, setTicketUpdating] = useState<string | null>(null)
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [errorLogsLoading, setErrorLogsLoading] = useState(false)
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [systemLogsLoading, setSystemLogsLoading] = useState(false)
  const [bannerCfg, setBannerCfg] = useState({ active: false, icon: '☕', text_main: 'Apoie o desenvolvimento da plataforma!', text_sub: 'Sua doação vai direto para o desenvolvedor e ajuda a manter tudo gratuito.', text_note: 'Não conta em sorteios ou metas do seu canal.', action_label: 'Apoiar dev', action_url: '', color: '#f59e0b', text_main_color: '', text_sub_color: '', text_note_color: '', glow: false, amount_current: 10, amount_goal: 5000, supporter_count: 1, position: 'bottom' as 'top' | 'bottom' })
  const [bannerSaving, setBannerSaving] = useState(false)
  const [bannerLoading, setBannerLoading] = useState(false)
  const [bannerSaved, setBannerSaved] = useState(false)
  type OnlineUser = { id: string; platform: string; username: string | null; email: string | null; status: string; created_at: string; last_seen_at: string | null; is_online: boolean; access_count: number; twitch_connected: boolean; livepix_connected: boolean; spotify_connected: boolean; youtube_connected: boolean; kick_connected: boolean; is_live: boolean; twitch_url: string | null }
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [onlineLoading, setOnlineLoading] = useState(false)
  type AdminNotification = { id: string; title: string | null; message: string; icon: string; color: string; created_at: string; target_username: string | null; duration_seconds?: number }
  const [notifyList, setNotifyList] = useState<AdminNotification[]>([])
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notifySaving, setNotifySaving] = useState(false)
  const [notifyForm, setNotifyForm] = useState({ title: '', message: '', icon: '📢', color: '#9b30ff', target_username: '', max_views: 0 })
  type ChangelogEntry = { date: string; time?: string; title: string; desc: string }
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [changelogLoading, setChangelogLoading] = useState(false)
  type AdminInvite = { id: string; inviter_id: string; inviter_username?: string; invitee_email: string; token: string; status: string; created_at: string }
  type InviteQuota = { platform_username: string; quota: number }
  const [adminInvites, setAdminInvites] = useState<AdminInvite[]>([])
  const [inviteQuotas, setInviteQuotas] = useState<InviteQuota[]>([])
  const [adminInvitesLoading, setAdminInvitesLoading] = useState(false)
  const [inviteVetoLoading, setInviteVetoLoading] = useState<string | null>(null)
  const [quotaEdits, setQuotaEdits] = useState<Record<string, number>>({})
  const [quotaSaving, setQuotaSaving] = useState<string | null>(null)
  const NAV_ITEMS_LIST = [
    { id: 'dashboard',   label: 'Dashboard' },
    { id: 'subathon',    label: 'Subathon' },
    { id: 'timers',      label: 'Timers' },
    { id: 'comandos',    label: 'Comandos' },
    { id: 'sorteios',    label: 'Sorteios' },
    { id: 'plataformas', label: 'Plataformas' },
    { id: 'metas',       label: 'Metas' },
    { id: 'overlays',    label: 'Overlays' },
    { id: 'banners',     label: 'Banners' },
    { id: 'ia-imagens',  label: 'IA de Imagens' },
    { id: 'conexoes',    label: 'Conexões' },
    { id: 'convites',    label: 'Convites' },
    { id: 'perfil',      label: 'Meu Perfil' },
  ]
  const [navOrder, setNavOrder] = useState<string[]>(NAV_ITEMS_LIST.map(i => i.id))

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isDark = theme === 'dark'
  const C = isDark ? DARK : LIGHT

  function navigateTo(v: typeof view) {
    setView(v)
    if (isMobile) setSidebarOpen(false)
    if (v === 'logs') { setLogTab('logins'); fetchLoginLogs(storedPw) }
    else if (v === 'banner') fetchBanner(storedPw)
    else if (v === 'passwords') fetchPasswords(storedPw)
    else if (v === 'roles') { fetchRoles(storedPw); fetchUsers(storedPw) }
    else if (v === 'tickets') fetchTickets(storedPw)
    else if (v === 'online') fetchOnlineUsers(storedPw)
    else if (v === 'notify') { fetchNotifications(storedPw); if (users.length === 0) fetchUsers(storedPw) }
    else if (v === 'invites') fetchAdminInvites(storedPw)
    else if (v === 'iaimagens') fetchAiCfg(storedPw)
  }

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

  const fetchLoginLogs = useCallback(async (pw: string) => {
    setLoginLogsLoading(true)
    try {
      const res = await fetch('/api/admin/login-logs', { headers: { 'x-admin-password': pw } })
      if (res.ok) setLoginLogs(await res.json())
    } catch { /* ignore */ } finally {
      setLoginLogsLoading(false)
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

  const fetchTickets = useCallback(async (pw: string) => {
    setTicketsLoading(true)
    try {
      const res = await fetch('/api/admin/tickets', { headers: { 'x-admin-password': pw } })
      if (res.ok) setTickets(await res.json())
    } catch { /* ignore */ } finally {
      setTicketsLoading(false)
    }
  }, [])

  async function updateTicket(id: string, updates: { status?: string; admin_reply?: string }) {
    setTicketUpdating(id)
    try {
      const res = await fetch('/api/admin/tickets', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw }, body: JSON.stringify({ id, ...updates }) })
      const d = await res.json().catch(() => ({}))
      if (updates.admin_reply && d.email_error) alert(`Resposta salva, mas e-mail falhou: ${d.email_error}`)
      else if (updates.admin_reply && d.email_sent) alert('✓ Resposta salva e e-mail enviado!')
      const now = new Date().toISOString()
      setTickets(prev => prev.map(t => {
        if (t.id !== id) return t
        let newReply = t.admin_reply
        if (updates.admin_reply !== undefined) {
          const prev2 = (t.admin_reply ?? '').trim()
          newReply = prev2
            ? `${prev2}\n\n---[${now}]---\n${updates.admin_reply.trim()}`
            : updates.admin_reply.trim()
        }
        return { ...t, ...(updates.status ? { status: updates.status } : {}), admin_reply: newReply, updated_at: now }
      }))
      if (updates.admin_reply !== undefined) {
        setAdminReply(prev => { const next = { ...prev }; delete next[id]; return next })
      }
    } finally {
      setTicketUpdating(null)
    }
  }

  async function deleteTicket(id: string) {
    setTicketUpdating(id)
    try {
      await fetch(`/api/admin/tickets?id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': storedPw } })
      setTickets(prev => prev.filter(t => t.id !== id))
      if (expandedTicket === id) setExpandedTicket(null)
    } finally {
      setTicketUpdating(null)
    }
  }

  const fetchNotifications = useCallback(async (pw: string) => {
    setNotifyLoading(true)
    try {
      const res = await fetch('/api/admin/notifications', { headers: { 'x-admin-password': pw } })
      if (res.ok) setNotifyList(await res.json())
    } catch { /* ignore */ } finally {
      setNotifyLoading(false)
    }
  }, [])

  async function sendNotification() {
    if (!notifyForm.message.trim()) return
    setNotifySaving(true)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw },
        body: JSON.stringify(notifyForm),
      })
      if (res.ok) {
        const d = await res.json()
        setNotifyList(prev => [d, ...prev])
        setNotifyForm(p => ({ ...p, title: '', message: '', max_views: 0 }))
      } else {
        const d = await res.json().catch(() => ({}))
        alert(`Erro ao salvar aviso: ${d.error ?? res.status}`)
      }
    } catch { /* ignore */ } finally {
      setNotifySaving(false)
    }
  }

  async function deleteNotification(id: string) {
    try {
      await fetch(`/api/admin/notifications?id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': storedPw } })
      setNotifyList(prev => prev.filter(n => n.id !== id))
    } catch { /* ignore */ }
  }

  const fetchChangelog = useCallback(async (pw: string) => {
    setChangelogLoading(true)
    try {
      const res = await fetch('/api/admin/changelog', { headers: { 'x-admin-password': pw } })
      if (res.ok) setChangelog(await res.json())
    } catch { /* ignore */ } finally {
      setChangelogLoading(false)
    }
  }, [])

  // Auto-refresh any log tab every 30s while the logs view is open
  useEffect(() => {
    if (view !== 'logs' || !storedPw) return
    const refresh = () => {
      if (logTab === 'logins') fetchLoginLogs(storedPw)
      else if (logTab === 'admin') fetchLogs(storedPw)
      else if (logTab === 'errors') fetchErrorLogs(storedPw)
      else if (logTab === 'system') fetchSystemLogs(storedPw)
      else if (logTab === 'changelog') fetchChangelog(storedPw)
      else fetchActivity(storedPw, logTab)
    }
    const iv = setInterval(refresh, 30000)
    return () => clearInterval(iv)
  }, [logTab, storedPw, view, fetchLogs, fetchErrorLogs, fetchSystemLogs, fetchLoginLogs, fetchChangelog, fetchActivity])

  // Load nav order from localStorage when switching to navorder view
  useEffect(() => {
    if (view !== 'navorder') return
    try {
      const s = localStorage.getItem('sk-nav-order')
      setNavOrder(s ? JSON.parse(s) : NAV_ITEMS_LIST.map(i => i.id))
    } catch {}
  }, [view])

  const fetchOnlineUsers = useCallback(async (pw: string) => {
    setOnlineLoading(true)
    try {
      const res = await fetch('/api/admin/online', { headers: { 'x-admin-password': pw } })
      if (res.ok) setOnlineUsers(await res.json())
    } catch { /* ignore */ } finally {
      setOnlineLoading(false)
    }
  }, [])

  const fetchAdminInvites = useCallback(async (pw: string) => {
    setAdminInvitesLoading(true)
    try {
      const res = await fetch('/api/admin/invites', { headers: { 'x-admin-password': pw } })
      if (res.ok) {
        const d = await res.json()
        setAdminInvites(d.invites ?? [])
        setInviteQuotas(d.quotas ?? [])
        const edits: Record<string, number> = {}
        ;(d.quotas ?? []).forEach((q: InviteQuota) => { edits[q.platform_username] = q.quota })
        setQuotaEdits(edits)
      }
    } catch { /* ignore */ } finally {
      setAdminInvitesLoading(false)
    }
  }, [])

  async function vetoInvite(inviteId: string) {
    setInviteVetoLoading(inviteId)
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw },
        body: JSON.stringify({ invite_id: inviteId }),
      })
      if (res.ok) setAdminInvites(prev => prev.map(i => i.id === inviteId ? { ...i, status: 'vetado' } : i))
    } finally {
      setInviteVetoLoading(null)
    }
  }

  async function saveQuota(platformUsername: string, overrideValue?: number) {
    setQuotaSaving(platformUsername)
    const newQuota = overrideValue !== undefined ? overrideValue : (quotaEdits[platformUsername] ?? 0)
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw },
        body: JSON.stringify({ platform_username: platformUsername, quota: newQuota }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(d.error || 'Erro ao salvar quota')
      } else {
        setInviteQuotas(prev => prev.map(q => q.platform_username === platformUsername ? { ...q, quota: newQuota } : q))
        setQuotaEdits(prev => ({ ...prev, [platformUsername]: newQuota }))
      }
    } finally {
      setQuotaSaving(null)
    }
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

  useEffect(() => {
    if (!authed || view !== 'online') return
    fetchOnlineUsers(storedPw)
    const iv = setInterval(() => fetchOnlineUsers(storedPw), 30000)
    return () => clearInterval(iv)
  }, [view, authed, storedPw, fetchOnlineUsers])

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
        try { localStorage.setItem('sk-admin-authed', '1') } catch {}
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

  const filtered = users.filter(u => {
    const matchStatus = filter === 'all' || u.status === filter
    if (!matchStatus) return false
    if (!userSearch) return true
    const q = userSearch.toLowerCase()
    return (u.platform_username ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q) || u.platform.toLowerCase().includes(q)
  })
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

  const SUN = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
  const MOON = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>

  const SIDEBAR_GROUPS = [
    { label: 'Usuários', items: [
      { v: 'users'   as const, icon: '👥', label: 'Usuários',    badge: counts.pending },
      { v: 'online'  as const, icon: '🟢', label: 'Online Agora' },
      { v: 'roles'   as const, icon: '🏷', label: 'Funções' },
      { v: 'tickets' as const, icon: '🎫', label: 'Suporte',     badge: tickets.filter(t => t.status === 'open').length },
      { v: 'notify'  as const, icon: '📣', label: 'Avisos',      badge: notifyList.length },
      { v: 'invites' as const, icon: '✉️', label: 'Convites' },
    ]},
    { label: 'Sistema', items: [
      { v: 'logs'      as const, icon: '📋', label: 'Logs' },
      { v: 'banner'    as const, icon: '🎗', label: 'Banner' },
      { v: 'passwords' as const, icon: '🔑', label: 'Senhas Admin' },
      { v: 'navorder'  as const, icon: '⠿', label: 'Ordem do Menu' },
      { v: 'iaimagens' as const, icon: '🎨', label: 'IA de Imagens' },
    ]},
  ]

  const VIEW_LABELS: Record<string, string> = {
    users: 'Usuários', online: 'Online Agora', roles: 'Funções', tickets: 'Suporte',
    notify: 'Avisos', invites: 'Convites', logs: 'Logs', banner: 'Banner',
    passwords: 'Senhas Admin', navorder: 'Ordem do Menu', iaimagens: 'IA de Imagens',
  }

  return (
    <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: C.bg, minHeight: '100vh', color: C.text, display: 'flex' }}>
      <style>{makeCSS(C)}</style>

      {/* Sidebar */}
      {authed && (
        <>
          {isMobile && sidebarOpen && <div className="sk-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
          <aside className="sk-sidebar" style={{ transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)' }}>
            {/* Logo */}
            <div style={{ padding: '1.1rem 1.2rem 1rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <a href="/" style={{ fontSize: '1.05rem', fontWeight: 900, color: C.text, textDecoration: 'none', letterSpacing: '0.3px', display: 'block' }}>
                  Sheik<span style={{ color: C.accent }}>STREAM</span>
                </a>
                <span style={{ fontSize: '0.58rem', background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.danger, padding: '0.1rem 0.5rem', borderRadius: '999px', fontWeight: 800, letterSpacing: '0.6px' }}>ADMIN</span>
              </div>
              {isMobile && <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '1.1rem', padding: '0.2rem', lineHeight: 1 }}>✕</button>}
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: '0.5rem' }}>
              {SIDEBAR_GROUPS.map(group => (
                <div key={group.label}>
                  <div className="sk-nav-group-label">{group.label}</div>
                  {group.items.map(item => (
                    <button key={item.v} onClick={() => navigateTo(item.v)} className={`sk-nav-item${view === item.v ? ' sk-nav-active' : ''}`}>
                      <span style={{ fontSize: '0.92rem', lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                      <span>{item.label}</span>
                      {'badge' in item && (item.badge ?? 0) > 0 && <span className="sk-nav-badge">{item.badge}</span>}
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            {/* Bottom actions */}
            <div style={{ padding: '0.75rem 1rem', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <button onClick={toggleTheme} className="sk-theme-btn" style={{ color: C.muted, flexShrink: 0 }}>{isDark ? SUN : MOON}</button>
              <button onClick={() => { setAuthed(false); setUsers([]); sessionStorage.removeItem('sk-admin-pw'); setStoredPw('') }}
                style={{ flex: 1, background: 'transparent', border: `1px solid ${C.dangerBorder}`, color: C.danger, padding: '0.38rem 0.7rem', borderRadius: '7px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                Sair
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: authed && !isMobile ? 240 : 0, transition: 'margin-left 0.22s' }}>

        {/* Top bar */}
        <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: isMobile ? '0.75rem 1rem' : '0.85rem 2rem', borderBottom: `1px solid ${C.border}`, background: C.navBg, position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', flexShrink: 0 }}>
          {authed && isMobile && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.38rem 0.55rem', borderRadius: '7px', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>☰</button>
          )}
          {!authed && (
            <a href="/" style={{ fontSize: '1.1rem', fontWeight: 900, color: C.text, textDecoration: 'none' }}>
              Sheik<span style={{ color: C.accent }}>STREAM</span>
            </a>
          )}
          {authed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '0.72rem', color: C.vdim }}>/</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{VIEW_LABELS[view] ?? view}</span>
            </div>
          )}
          {!authed && (
            <div style={{ marginLeft: 'auto' }}>
              <button onClick={toggleTheme} className="sk-theme-btn" style={{ color: C.muted }}>{isDark ? SUN : MOON}</button>
            </div>
          )}
        </header>

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
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '1rem' : '2rem 2rem' }}>

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
                  { key: 'logins',    label: '🔐 Logins Admin' },
                  { key: 'admin',     label: '🛡 Ações Admin' },
                  { key: 'auth',      label: '🔑 Autenticação' },
                  { key: 'dashboard', label: '📊 Navegação' },
                  { key: 'feature',   label: '⚡ Funcionalidades' },
                  { key: 'errors',    label: '⚠ Erros' },
                  { key: 'system',    label: '⚙ Sistema' },
                  { key: 'changelog', label: '📝 Changelog' },
                ] as const).map(t => (
                  <button key={t.key}
                    onClick={() => {
                      setLogTab(t.key)
                      setLogSearch('')
                      if (t.key === 'logins') fetchLoginLogs(storedPw)
                      else if (t.key === 'admin') fetchLogs(storedPw)
                      else if (t.key === 'errors') fetchErrorLogs(storedPw)
                      else if (t.key === 'system') fetchSystemLogs(storedPw)
                      else if (t.key === 'changelog') fetchChangelog(storedPw)
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
                    {({ logins: '🔐 Logins no painel admin', admin: '🛡 Ações do admin', auth: '🔑 Autenticação', dashboard: '📊 Navegação no dashboard', feature: '⚡ Uso de funcionalidades', errors: '⚠ Logs de erro', system: '⚙ Logs do sistema', changelog: '📝 Changelog do sistema' } as Record<string, string>)[logTab]}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {logTab !== 'changelog' && (
                    <div style={{ position: 'relative' }}>
                      <svg style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)', color: C.dim, pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Buscar..." style={{ padding: '0.35rem 1.8rem 0.35rem 1.8rem', background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: '6px', color: C.text, fontSize: '0.78rem', outline: 'none', width: '160px' }} />
                      {logSearch && <button onClick={() => setLogSearch('')} style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: C.dim, fontSize: '0.8rem', lineHeight: 1, padding: 0 }}>✕</button>}
                    </div>
                  )}
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
                    onClick={() => { if (logTab === 'logins') fetchLoginLogs(storedPw); else if (logTab === 'admin') fetchLogs(storedPw); else if (logTab === 'errors') fetchErrorLogs(storedPw); else if (logTab === 'system') fetchSystemLogs(storedPw); else if (logTab === 'changelog') fetchChangelog(storedPw); else fetchActivity(storedPw, logTab) }}
                    disabled={logTab === 'logins' ? loginLogsLoading : logTab === 'admin' ? logsLoading : logTab === 'errors' ? errorLogsLoading : logTab === 'system' ? systemLogsLoading : logTab === 'changelog' ? changelogLoading : activityLoading}
                    style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                    {(logTab === 'admin' ? logsLoading : logTab === 'errors' ? errorLogsLoading : logTab === 'system' ? systemLogsLoading : activityLoading) ? 'Carregando...' : 'Atualizar'}
                  </button>
                  </div>
                </div>

                {/* Login logs tab */}
                {logTab === 'logins' && (() => {
                  const lq = logSearch.toLowerCase()
                  const rows = lq ? loginLogs.filter(l => l.ip?.toLowerCase().includes(lq) || l.user_agent?.toLowerCase().includes(lq) || (l.success ? 'sucesso' : 'falhou').includes(lq)) : loginLogs
                  return loginLogsLoading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Carregando...</div>
                  ) : rows.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>{logSearch ? 'Nenhum resultado.' : 'Nenhum login registrado ainda.'}</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                            {['Data / Hora', 'Status', 'IP', 'Navegador'].map(h => (
                              <th key={h} style={{ padding: '0.75rem 1.2rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, color: C.dim, letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map(l => (
                            <tr key={l.id} className="sk-user-row" style={{ borderBottom: `1px solid ${C.vdim}`, background: 'transparent' }}>
                              <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.78rem', color: C.dim, whiteSpace: 'nowrap' }}>{fmtDate(l.created_at)}</td>
                              <td style={{ padding: '0.85rem 1.2rem' }}>
                                {l.success
                                  ? <span style={{ background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBorder}`, borderRadius: '999px', padding: '0.18rem 0.65rem', fontSize: '0.7rem', fontWeight: 700 }}>✓ Sucesso</span>
                                  : <span style={{ background: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}`, borderRadius: '999px', padding: '0.18rem 0.65rem', fontSize: '0.7rem', fontWeight: 700 }}>✕ Falhou</span>
                                }
                              </td>
                              <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.8rem', color: C.text, fontFamily: 'monospace' }}>{l.ip}</td>
                              <td style={{ padding: '0.85rem 1.2rem', fontSize: '0.72rem', color: C.muted, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.user_agent}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}

                {/* Admin tab — approve/reject/ban */}
                {logTab === 'admin' && (() => {
                  const lq = logSearch.toLowerCase()
                  const rows = lq ? logs.filter(l => l.action?.toLowerCase().includes(lq) || l.target_username?.toLowerCase().includes(lq) || l.target_platform?.toLowerCase().includes(lq)) : logs
                  return logsLoading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Carregando...</div>
                  ) : rows.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>{logSearch ? 'Nenhum resultado.' : 'Nenhuma ação registrada ainda.'}</div>
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
                          {rows.map(log => {
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
                })()}

                {/* Error logs tab */}
                {logTab === 'errors' && (() => {
                  const lq = logSearch.toLowerCase()
                  const rows = lq ? errorLogs.filter(e => e.endpoint?.toLowerCase().includes(lq) || e.error_message?.toLowerCase().includes(lq) || e.user_id?.toLowerCase().includes(lq)) : errorLogs
                  return errorLogsLoading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Carregando...</div>
                  ) : rows.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>{logSearch ? 'Nenhum resultado.' : 'Nenhum erro registrado.'}</div>
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
                          {rows.map(e => (
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
                })()}

                {/* System logs tab */}
                {logTab === 'system' && (() => {
                  const lq = logSearch.toLowerCase()
                  const rows = lq ? systemLogs.filter(s => s.type?.toLowerCase().includes(lq) || s.message?.toLowerCase().includes(lq) || s.user_id?.toLowerCase().includes(lq)) : systemLogs
                  return systemLogsLoading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Carregando...</div>
                  ) : rows.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>{logSearch ? 'Nenhum resultado.' : 'Nenhum evento do sistema registrado.'}</div>
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
                          {rows.map(s => {
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
                })()}

                {/* Auth / Dashboard / Feature tabs */}
                {logTab === 'changelog' && (() => {
                  const lq = logSearch.toLowerCase()
                  const filtered = changelogLoading ? [] : lq ? changelog.filter(e => e.title.toLowerCase().includes(lq) || e.desc.toLowerCase().includes(lq) || e.date.includes(lq)) : changelog
                  return (
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {changelogLoading && <div style={{ textAlign: 'center', color: C.dim, fontSize: '0.9rem', padding: '2rem' }}>Carregando...</div>}
                      {!changelogLoading && !filtered.length && <div style={{ textAlign: 'center', color: C.dim, fontSize: '0.9rem', padding: '2rem' }}>{changelog.length === 0 ? 'Clique em Atualizar para carregar o changelog.' : 'Nenhum resultado.'}</div>}
                      {filtered.map((entry, i) => (
                        <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.9rem 1rem', background: C.cardBgAlt, borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <div style={{ flexShrink: 0, minWidth: '86px' }}>
                            <div style={{ fontSize: '0.68rem', color: C.dim, fontWeight: 600 }}>{entry.date}</div>
                            {entry.time && <div style={{ fontSize: '0.62rem', color: C.vdim, fontWeight: 500, marginTop: '0.1rem' }}>{entry.time}</div>}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: C.text, marginBottom: '0.2rem' }}>{entry.title}</div>
                            <div style={{ fontSize: '0.78rem', color: C.muted, lineHeight: 1.55 }}>{entry.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
                {logTab !== 'logins' && logTab !== 'admin' && logTab !== 'errors' && logTab !== 'system' && logTab !== 'changelog' && (() => {
                  const lq = logSearch.toLowerCase()
                  const rows = lq ? activity.filter(a => a.event?.toLowerCase().includes(lq) || a.username?.toLowerCase().includes(lq) || a.details?.toLowerCase().includes(lq) || a.platform?.toLowerCase().includes(lq)) : activity
                  return activityLoading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Carregando...</div>
                  ) : rows.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>{logSearch ? 'Nenhum resultado.' : 'Nenhum registro ainda.'}</div>
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
                          {rows.map(a => {
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
                })()}
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
            <div onClick={() => setBannerCfg(p => ({ ...p, active: !p.active }))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: bannerCfg.active ? C.accentBg : C.vvdim, border: `1px solid ${bannerCfg.active ? C.accentBorder : C.border}`, borderRadius: '10px', cursor: 'pointer', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: bannerCfg.active ? C.accent : C.muted }}>{bannerCfg.active ? '● Banner ativo — visível para todos os usuários' : '○ Banner inativo — não é exibido'}</span>
              <div style={{ width: 40, height: 22, background: bannerCfg.active ? C.accent : C.vdim, borderRadius: 11, position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: bannerCfg.active ? 19 : 3, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
              </div>
            </div>
            {/* Position selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: C.muted, fontWeight: 600 }}>Posição:</span>
              {(['top', 'bottom'] as const).map(pos => (
                <button key={pos} onClick={() => setBannerCfg(p => ({ ...p, position: pos }))}
                  style={{ padding: '0.3rem 0.9rem', borderRadius: '7px', border: `1px solid ${bannerCfg.position === pos ? C.primaryBgMed : C.border}`, background: bannerCfg.position === pos ? C.primaryBg : 'transparent', color: bannerCfg.position === pos ? C.primary : C.muted, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  {pos === 'top' ? '▲ Topo' : '▼ Rodapé'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'Ícone (emoji)', key: 'icon' as const, placeholder: '☕' },
                { label: 'Cor do tema (hex)', key: 'color' as const, placeholder: '#f59e0b', type: 'color' },
                { label: 'Texto principal', key: 'text_main' as const, placeholder: 'Apoie o desenvolvimento...' },
                { label: 'Cor do texto principal (vazio = cor do tema)', key: 'text_main_color' as const, placeholder: '', type: 'color' },
                { label: 'Texto secundário', key: 'text_sub' as const, placeholder: 'Sua doação vai direto...' },
                { label: 'Cor do texto secundário (vazio = padrão)', key: 'text_sub_color' as const, placeholder: '', type: 'color' },
                { label: 'Nota (pequena)', key: 'text_note' as const, placeholder: 'Não conta em sorteios...' },
                { label: 'Cor da nota (vazio = padrão)', key: 'text_note_color' as const, placeholder: '', type: 'color' },
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', justifyContent: 'center' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Efeito Glow no texto</label>
                <div onClick={() => setBannerCfg(p => ({ ...p, glow: !p.glow }))} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.5rem 0.75rem', background: bannerCfg.glow ? C.primaryBg : C.vvdim, border: `1px solid ${bannerCfg.glow ? C.borderStrong : C.border}`, borderRadius: '7px' }}>
                  <div style={{ width: 36, height: 20, background: bannerCfg.glow ? C.primary : C.vdim, borderRadius: 10, position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 2, left: bannerCfg.glow ? 17 : 2, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: bannerCfg.glow ? C.primary : C.muted, fontWeight: 600 }}>{bannerCfg.glow ? 'Ativado' : 'Desativado'}</span>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div style={{ marginTop: '1.5rem', borderTop: `1px solid ${C.border}`, paddingTop: '1.25rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Preview</div>
              <div style={{ background: `${bannerCfg.color}15`, borderTop: `2px solid ${bannerCfg.color}55`, borderRadius: '0 0 10px 10px', padding: '0.65rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.2rem' }}>{bannerCfg.icon}</span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: bannerCfg.text_main_color || bannerCfg.color, ...(bannerCfg.glow ? { textShadow: `0 0 8px ${bannerCfg.text_main_color || bannerCfg.color}cc` } : {}) }}>{bannerCfg.text_main}</span>
                    <span style={{ fontSize: '0.76rem', color: bannerCfg.text_sub_color || C.muted }}>{bannerCfg.text_sub}</span>
                  </div>
                  {bannerCfg.text_note && <div style={{ fontSize: '0.68rem', color: bannerCfg.text_note_color || C.dim }}>{bannerCfg.text_note}</div>}
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
          ) : view === 'users' ? (
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
            <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '0.5rem', padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {(['all', 'approved', 'pending', 'rejected', 'banned'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`sk-tab${filter === f ? ' active' : ''}`} style={{ color: filter === f ? C.primary : C.muted }}>
                    {{ all: 'Todos', pending: 'Pendentes', approved: 'Ativos', rejected: 'Rejeitados', banned: 'Banidos' }[f]}
                    <span style={{ marginLeft: '0.3rem', fontSize: '0.7rem', opacity: 0.7 }}>({counts[f]})</span>
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg style={{ position: 'absolute', left: '0.6rem', color: C.dim, pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Buscar usuário..." style={{ padding: '0.4rem 0.7rem 0.4rem 2rem', background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: '7px', color: C.text, fontSize: '0.82rem', outline: 'none', width: '200px' }} />
                {userSearch && <button onClick={() => setUserSearch('')} style={{ position: 'absolute', right: '0.5rem', background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1, padding: 0 }}>✕</button>}
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
                Nenhum usuário {userSearch ? `com "${userSearch}"` : filter !== 'all' ? `com status "${filter}"` : ''} encontrado.
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
          ) : null}
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
                              {pw.expires_at && <span style={{ fontSize: '0.72rem', color: C.dim }}>Expira: {new Date(pw.expires_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>}
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
          {view === 'tickets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px' }}>
                <div style={{ padding: '1.2rem 1.5rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.text }}>Tickets de suporte</h3>
                    <div style={{ fontSize: '0.78rem', color: C.muted, marginTop: '0.2rem' }}>Enviados via formulário na landing page</div>
                  </div>
                  <button onClick={() => fetchTickets(storedPw)} disabled={ticketsLoading} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>
                    {ticketsLoading ? 'Carregando...' : '↻ Atualizar'}
                  </button>
                </div>
                {ticketsLoading ? (
                  <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Carregando...</div>
                ) : tickets.length === 0 ? (
                  <div style={{ padding: '4rem', textAlign: 'center', color: C.dim, fontSize: '0.9rem' }}>Nenhum ticket ainda.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {tickets.map(t => {
                      const isExpanded = expandedTicket === t.id
                      const statusColors: Record<string, { bg: string; color: string; border: string }> = {
                        open:        { bg: C.accentBg,            color: C.accent,   border: C.accentBorder },
                        in_progress: { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24',  border: 'rgba(251,191,36,0.3)' },
                        resolved:    { bg: C.primaryBg,           color: C.primary,  border: C.borderStrong },
                        closed:      { bg: C.vvdim,               color: C.dim,      border: C.border },
                      }
                      const sc = statusColors[t.status] ?? statusColors.open
                      return (
                        <div key={t.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <div className="sk-user-row" onClick={() => setExpandedTicket(isExpanded ? null : t.id)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.5rem', cursor: 'pointer', background: 'transparent' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                              <div style={{ fontSize: '0.72rem', color: C.dim, marginTop: '0.1rem', display: 'flex', gap: '0.75rem' }}>
                                <span>{t.username || '—'}</span>
                                {t.reply_email && <span style={{ color: C.muted }}>{t.reply_email}</span>}
                                <span>{new Date(t.created_at).toLocaleString('pt-BR')}</span>
                              </div>
                            </div>
                            <span style={{ ...sc, padding: '0.18rem 0.65rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{t.status}</span>
                            <span style={{ color: C.dim, fontSize: '0.85rem' }}>{isExpanded ? '▲' : '▼'}</span>
                          </div>
                          {isExpanded && (
                            <div style={{ borderTop: `1px solid ${C.vdim}`, background: C.cardBgAlt, display: 'flex', flexDirection: 'column', maxHeight: '520px' }}>
                              {/* Status bar */}
                              <div style={{ padding: '0.65rem 1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', borderBottom: `1px solid ${C.vdim}`, flexShrink: 0 }}>
                                {(['open','in_progress','resolved','closed','archived'] as const).map(s => {
                                  const extra: Record<string, { bg: string; color: string; border: string }> = {
                                    archived: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: 'rgba(148,163,184,0.28)' },
                                  }
                                  const sc2 = extra[s] ?? statusColors[s] ?? statusColors.open
                                  return (
                                    <button key={s} disabled={t.status === s || ticketUpdating === t.id}
                                      onClick={() => updateTicket(t.id, { status: s })}
                                      style={{ padding: '0.22rem 0.65rem', background: t.status === s ? sc2.bg : 'transparent', border: `1px solid ${sc2.border}`, color: t.status === s ? sc2.color : C.dim, borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, cursor: t.status === s ? 'default' : 'pointer' }}>
                                      {s === 'archived' ? '🗃 Arquivar' : s}
                                    </button>
                                  )
                                })}
                                <button disabled={ticketUpdating === t.id}
                                  onClick={() => { if (confirm('Excluir este ticket permanentemente?')) deleteTicket(t.id) }}
                                  style={{ marginLeft: 'auto', padding: '0.22rem 0.65rem', background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.danger, borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}>
                                  🗑 Excluir
                                </button>
                              </div>

                              {/* Chat thread */}
                              <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: '100px', flex: 1, overflowY: 'auto' }}>
                                {/* User message — left bubble */}
                                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.primaryBg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: C.primary, flexShrink: 0 }}>
                                    {(t.username ?? '?')[0].toUpperCase()}
                                  </div>
                                  <div style={{ maxWidth: '78%' }}>
                                    <div style={{ fontSize: '0.62rem', color: C.dim, marginBottom: '0.25rem' }}>
                                      {t.username || 'Usuário'} · {new Date(t.created_at).toLocaleString('pt-BR')}
                                    </div>
                                    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '0 10px 10px 10px', padding: '0.65rem 0.9rem', fontSize: '0.82rem', color: C.text, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' as const }}>
                                      {t.message}
                                    </div>
                                    {t.reply_email && (
                                      <div style={{ fontSize: '0.62rem', color: C.vdim, marginTop: '0.2rem' }}>✉ {t.reply_email}</div>
                                    )}
                                  </div>
                                </div>

                                {/* Admin replies — multiple bubbles parsed from history */}
                                {t.admin_reply && (() => {
                                  // Parse history: entries split by \n\n---[ISO]---\n
                                  const raw = t.admin_reply
                                  const parts: { text: string; ts?: string }[] = []
                                  const segments = raw.split(/\n\n---\[([^\]]+)\]---\n/)
                                  // segments: [text0, ts1, text1, ts2, text2, ...]
                                  parts.push({ text: segments[0].trim() })
                                  for (let i = 1; i < segments.length; i += 2) {
                                    const ts = segments[i]
                                    const txt = (segments[i + 1] ?? '').trim()
                                    if (txt) parts.push({ text: txt, ts })
                                  }
                                  return parts.filter(p => p.text).map((p, pi) => (
                                    <div key={pi} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                                      <div style={{ maxWidth: '78%' }}>
                                        <div style={{ fontSize: '0.62rem', color: C.dim, marginBottom: '0.25rem', textAlign: 'right' }}>
                                          Admin {p.ts ? '· ' + new Date(p.ts).toLocaleString('pt-BR') : pi === parts.length - 1 && t.updated_at ? '· ' + new Date(t.updated_at).toLocaleString('pt-BR') : ''}
                                        </div>
                                        <div style={{ background: C.primaryBg, border: `1px solid ${C.borderStrong}`, borderRadius: '10px 0 10px 10px', padding: '0.65rem 0.9rem', fontSize: '0.82rem', color: C.primary, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' as const }}>
                                          {p.text}
                                        </div>
                                      </div>
                                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.primaryBg, border: `1px solid ${C.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: C.primary, flexShrink: 0 }}>
                                        A
                                      </div>
                                    </div>
                                  ))
                                })()}
                              </div>

                              {/* Reply input */}
                              <div style={{ padding: '0 1.5rem 0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-end', borderTop: `1px solid ${C.vdim}`, flexShrink: 0 }}>
                                <textarea
                                  value={adminReply[t.id] ?? ''}
                                  onChange={e => setAdminReply(p => ({ ...p, [t.id]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && adminReply[t.id]?.trim()) { e.preventDefault(); updateTicket(t.id, { admin_reply: adminReply[t.id].trim() }) } }}
                                  placeholder={t.admin_reply ? 'Adicionar nova resposta... (Ctrl+Enter para enviar)' : 'Escreva uma resposta... (Ctrl+Enter para enviar)'}
                                  rows={2}
                                  style={{ flex: 1, marginTop: '0.65rem', padding: '0.5rem 0.75rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '7px', color: C.text, fontSize: '0.82rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                                />
                                <button
                                  disabled={ticketUpdating === t.id || !adminReply[t.id]?.trim()}
                                  onClick={() => updateTicket(t.id, { admin_reply: adminReply[t.id]!.trim() })}
                                  style={{ marginTop: '0.65rem', padding: '0.5rem 1rem', background: adminReply[t.id]?.trim() ? C.primaryBg : C.vvdim, border: `1px solid ${adminReply[t.id]?.trim() ? C.borderStrong : C.border}`, color: adminReply[t.id]?.trim() ? C.primary : C.dim, borderRadius: '7px', fontSize: '0.78rem', fontWeight: 700, cursor: adminReply[t.id]?.trim() ? 'pointer' : 'not-allowed', alignSelf: 'flex-end', whiteSpace: 'nowrap' as const }}>
                                  {ticketUpdating === t.id ? '...' : '➤ Responder'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          {view === 'online' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: C.text, marginBottom: '0.2rem' }}>
                    Usuários na plataforma
                  </div>
                  <div style={{ fontSize: '0.74rem', color: C.muted }}>
                    Online = ativo nos últimos 15 min · Atualiza a cada 30s
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: C.muted }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    {onlineUsers.filter(u => u.is_online).length} online
                  </div>
                  <button onClick={() => fetchOnlineUsers(storedPw)} disabled={onlineLoading}
                    style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg className={onlineLoading ? 'sk-spin' : ''} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Atualizar
                  </button>
                </div>
              </div>
              {onlineLoading && onlineUsers.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: C.muted, fontSize: '0.85rem' }}>Carregando...</div>
              ) : onlineUsers.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: C.vdim, fontSize: '0.85rem' }}>Nenhum usuário aprovado encontrado</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {onlineUsers.map(u => {
                    const isOn = u.is_online
                    const lastSeen = u.last_seen_at ? new Date(u.last_seen_at) : null
                    const minAgo = lastSeen ? Math.floor((Date.now() - lastSeen.getTime()) / 60000) : null
                    const timeLabel = isOn
                      ? minAgo !== null && minAgo < 1 ? 'agora mesmo' : `há ${minAgo} min`
                      : lastSeen
                        ? minAgo! < 60 ? `há ${minAgo} min` : minAgo! < 1440 ? `há ${Math.floor(minAgo! / 60)}h` : `há ${Math.floor(minAgo! / 1440)}d`
                        : 'nunca'
                    const joinDate = new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                    return (
                      <div key={u.id} style={{ background: C.cardBg, border: `1px solid ${u.is_live ? 'rgba(239,68,68,0.35)' : isOn ? 'rgba(34,197,94,0.3)' : C.border}`, borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: u.is_live ? '#ef4444' : isOn ? '#22c55e' : 'transparent', borderRadius: '3px 0 0 3px' }} />
                        {/* Avatar */}
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: isOn ? 'rgba(34,197,94,0.12)' : C.primaryBg, border: `2px solid ${isOn ? 'rgba(34,197,94,0.35)' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.05rem', color: isOn ? '#22c55e' : C.primary, flexShrink: 0 }}>
                          {(u.username ?? '?')[0].toUpperCase()}
                        </div>
                        {/* Main info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.22rem' }}>
                            {u.twitch_url ? (
                              <a href={u.twitch_url} target="_blank" rel="noopener noreferrer"
                                style={{ fontWeight: 700, fontSize: '0.9rem', color: u.is_live ? '#bf94ff' : C.text, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                {u.username ?? '—'}
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              </a>
                            ) : (
                              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: C.text }}>{u.username ?? '—'}</span>
                            )}
                            {u.is_live && (
                              <a href={u.twitch_url!} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.66rem', fontWeight: 800, padding: '0.14rem 0.55rem', borderRadius: '999px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', textDecoration: 'none', animation: 'sk-pulse 2s ease-in-out infinite' }}>
                                🔴 AO VIVO
                              </a>
                            )}
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.66rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: '999px', background: isOn ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isOn ? 'rgba(34,197,94,0.28)' : 'rgba(255,255,255,0.08)'}`, color: isOn ? '#22c55e' : C.dim }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: isOn ? '#22c55e' : C.dim, display: 'inline-block', ...(isOn ? { animation: 'sk-pulse 1.8s ease-in-out infinite' } : {}) }} />
                              {isOn ? 'online' : 'offline'}
                            </span>
                            <span style={{ fontSize: '0.66rem', color: C.vdim }}>{timeLabel}</span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: C.muted, marginBottom: '0.45rem' }}>{u.email ?? '—'}</div>
                          {/* Platform chips — only show for online users (offline = no active connection) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {isOn && u.twitch_connected && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.66rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '5px', background: 'rgba(145,71,255,0.12)', border: '1px solid rgba(145,71,255,0.25)', color: '#9147ff' }}>
                                <svg width="10" height="10" viewBox="0 0 24 28" fill="#9147ff"><path d="M2.149 0L0 5.573V23.33h5.996V28l4.998-4.67H14.8L24 14.497V0H2.149zm19.851 13.63l-3.996 3.734h-4.998L9.008 21.1v-3.736H4.01V2.8h18v10.83zm-3.996-6.994H16v6.23h2.004v-6.23zm-5.998 0H10v6.23h2.006v-6.23z"/></svg>
                                Twitch
                              </span>
                            )}
                            {isOn && u.livepix_connected && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.66rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '5px', background: 'rgba(255,105,180,0.1)', border: '1px solid rgba(255,105,180,0.2)', color: '#ff69b4' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ff69b4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
                                Livepix
                              </span>
                            )}
                            {isOn && u.spotify_connected && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.66rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '5px', background: 'rgba(30,215,96,0.1)', border: '1px solid rgba(30,215,96,0.2)', color: '#1ed760' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="#1ed760"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                                Spotify
                              </span>
                            )}
                            {isOn && u.youtube_connected && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.66rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '5px', background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)', color: '#ff4444' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="#ff4444"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                YouTube
                              </span>
                            )}
                            {isOn && u.kick_connected && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.66rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '5px', background: 'rgba(83,252,24,0.08)', border: '1px solid rgba(83,252,24,0.2)', color: '#53fc18' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="#53fc18"><path d="M2 2h4v8l6-8h5l-7 9 7 11h-5l-6-9v9H2z"/></svg>
                                Kick
                              </span>
                            )}
                            {(!isOn || (!u.twitch_connected && !u.livepix_connected && !u.spotify_connected && !u.youtube_connected && !u.kick_connected)) && (
                              <span style={{ fontSize: '0.63rem', color: C.vdim }}>nenhuma plataforma conectada</span>
                            )}
                          </div>
                        </div>
                        {/* Right info */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '0.72rem', color: C.dim, marginBottom: '0.2rem' }}>Entrou em {joinDate}</div>
                          <div style={{ fontSize: '0.7rem', color: C.vdim }}>{u.access_count > 0 ? `${u.access_count} acessos (7d)` : 'sem atividade'}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {view === 'notify' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Compose notification */}
              <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.3rem', fontSize: '1rem', fontWeight: 700, color: C.text }}>Enviar aviso aos usuários</h3>
                <p style={{ margin: '0 0 1.2rem', fontSize: '0.78rem', color: C.muted }}>O aviso aparece no dashboard de todos os usuários ativos até ser removido.</p>

                {/* Icon picker */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>Ícone</div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {['📢','⚠️','🔔','✅','❌','🚀','🎉','💡','🔧','📅','🌐','🎮','💬','🏆','⭐'].map(ico => (
                      <button key={ico} onClick={() => setNotifyForm(p => ({ ...p, icon: ico }))}
                        style={{ width: 38, height: 38, fontSize: '1.3rem', borderRadius: '8px', border: `2px solid ${notifyForm.icon === ico ? C.primary : C.border}`, background: notifyForm.icon === ico ? C.primaryBg : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {ico}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>Cor</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {['#9b30ff','#3b82f6','#22c55e','#f59e0b','#ef4444','#ec4899','#06b6d4','#f97316','#ffffff'].map(col => (
                      <button key={col} onClick={() => setNotifyForm(p => ({ ...p, color: col }))}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: col, border: `3px solid ${notifyForm.color === col ? C.text : 'transparent'}`, cursor: 'pointer', outline: 'none', boxShadow: notifyForm.color === col ? `0 0 0 1px ${col}` : 'none' }} />
                    ))}
                    <input type="color" value={notifyForm.color} onChange={e => setNotifyForm(p => ({ ...p, color: e.target.value }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }} title="Cor personalizada" />
                  </div>
                </div>

                {/* Destinatário */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>Destinatário</div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => setNotifyForm(p => ({ ...p, target_username: '' }))}
                      style={{ padding: '0.35rem 0.9rem', borderRadius: '7px', border: `1px solid ${!notifyForm.target_username ? C.primary + '60' : C.border}`, background: !notifyForm.target_username ? C.primaryBg : 'transparent', color: !notifyForm.target_username ? C.primary : C.muted, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                      👥 Todos os usuários
                    </button>
                    <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                      <select
                        value={notifyForm.target_username}
                        onChange={e => setNotifyForm(p => ({ ...p, target_username: e.target.value }))}
                        style={{ width: '100%', padding: '0.38rem 0.75rem', background: C.inputBg, border: `1px solid ${notifyForm.target_username ? C.primary + '60' : C.inputBorder}`, borderRadius: '7px', color: notifyForm.target_username ? C.text : C.dim, fontSize: '0.82rem', outline: 'none', appearance: 'auto' }}>
                        <option value="">— Selecionar usuário específico —</option>
                        {users.filter(u => u.status === 'approved').map(u => (
                          <option key={u.id} value={u.platform_username ?? u.email ?? ''}>
                            {u.platform_username || u.email || u.id.slice(0, 8)} ({u.platform})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {notifyForm.target_username && (
                    <div style={{ fontSize: '0.72rem', color: C.primary, marginTop: '0.35rem' }}>
                      ↳ Aviso visível apenas para <strong>{notifyForm.target_username}</strong>
                    </div>
                  )}
                </div>

                {/* Quantas vezes */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>Quantas vezes exibir</div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Ilimitado', value: 0 },
                      { label: '1×', value: 1 },
                      { label: '2×', value: 2 },
                      { label: '3×', value: 3 },
                      { label: '5×', value: 5 },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setNotifyForm(p => ({ ...p, max_views: opt.value }))}
                        style={{ padding: '0.35rem 0.85rem', borderRadius: '7px', border: `1px solid ${notifyForm.max_views === opt.value ? C.primary + '60' : C.border}`, background: notifyForm.max_views === opt.value ? C.primaryBg : 'transparent', color: notifyForm.max_views === opt.value ? C.primary : C.muted, fontSize: '0.8rem', fontWeight: notifyForm.max_views === opt.value ? 700 : 500, cursor: 'pointer' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: C.vdim, marginTop: '0.3rem' }}>
                    {notifyForm.max_views === 0 ? 'Aviso permanece até ser removido manualmente.' : `Aviso desaparece automaticamente após aparecer ${notifyForm.max_views}× para cada usuário.`}
                  </div>
                </div>

                {/* Title (optional) */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Título (opcional)</div>
                  <input value={notifyForm.title} onChange={e => setNotifyForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Atualização da plataforma"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                {/* Message */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Mensagem *</div>
                  <textarea value={notifyForm.message} onChange={e => setNotifyForm(p => ({ ...p, message: e.target.value }))} placeholder="Escreva a mensagem para os usuários..." rows={3}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '8px', color: C.text, fontSize: '0.85rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>

                {/* Preview */}
                {(notifyForm.message || notifyForm.title) && (
                  <div style={{ background: `${notifyForm.color}15`, border: `1px solid ${notifyForm.color}40`, borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{notifyForm.icon}</span>
                    <div>
                      {notifyForm.title && <div style={{ fontWeight: 700, fontSize: '0.84rem', color: notifyForm.color, marginBottom: '0.2rem' }}>{notifyForm.title}</div>}
                      <div style={{ fontSize: '0.8rem', color: C.muted }}>{notifyForm.message}</div>
                    </div>
                  </div>
                )}

                <button onClick={sendNotification} disabled={notifySaving || !notifyForm.message.trim()}
                  style={{ padding: '0.6rem 1.4rem', background: C.primaryBg, border: `1px solid ${C.borderStrong}`, color: C.primary, borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: notifyForm.message.trim() ? 'pointer' : 'not-allowed', opacity: notifyForm.message.trim() ? 1 : 0.5 }}>
                  {notifySaving ? 'Enviando...' : '📣 Enviar aviso'}
                </button>
              </div>

              {/* Active notifications list */}
              <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '1.1rem 1.5rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: C.text }}>Avisos ativos ({notifyList.length})</h3>
                  <button onClick={() => fetchNotifications(storedPw)} disabled={notifyLoading} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>↻ Atualizar</button>
                </div>
                {notifyLoading ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: C.muted, fontSize: '0.85rem' }}>Carregando...</div>
                ) : notifyList.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: C.vdim, fontSize: '0.85rem' }}>Nenhum aviso ativo.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {notifyList.map(n => (
                      <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '0.9rem 1.5rem', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{n.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {n.title && <div style={{ fontWeight: 700, fontSize: '0.82rem', color: n.color, marginBottom: '0.15rem' }}>{n.title}</div>}
                          <div style={{ fontSize: '0.8rem', color: C.muted }}>{n.message}</div>
                          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.68rem', color: C.vdim }}>{new Date(n.created_at).toLocaleString('pt-BR')}</span>
                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '999px', background: n.target_username ? 'rgba(155,48,255,0.12)' : 'rgba(255,255,255,0.05)', color: n.target_username ? C.primary : C.vdim, border: `1px solid ${n.target_username ? C.border : 'rgba(255,255,255,0.06)'}` }}>
                              {n.target_username ? `👤 ${n.target_username}` : '👥 Todos'}
                            </span>
                            {(n as Record<string, unknown>).max_views ? (
                              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '999px', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                                🔁 {(n as Record<string, unknown>).max_views as number}×
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '999px', background: 'rgba(255,255,255,0.04)', color: C.vdim, border: '1px solid rgba(255,255,255,0.06)' }}>
                                ∞ sempre
                              </span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => deleteNotification(n.id)} style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.danger, borderRadius: '6px', padding: '0.28rem 0.7rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Remover</button>
                      </div>
                    ))}
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
                              {u.image_url ? (
                                <img src={u.image_url} alt={uname} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${PLATFORM_COLORS[u.platform] || C.border}` }} />
                              ) : (
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: PLATFORM_COLORS[u.platform] || C.primaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                  {uname.slice(0, 2).toUpperCase()}
                                </div>
                              )}
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

          {view === 'navorder' && (() => {
            const ordered = navOrder.length > 0
              ? [...navOrder.filter(id => NAV_ITEMS_LIST.some(i => i.id === id)).map(id => NAV_ITEMS_LIST.find(i => i.id === id)!),
                 ...NAV_ITEMS_LIST.filter(i => !navOrder.includes(i.id))]
              : NAV_ITEMS_LIST

            const moveNav = (id: string, dir: 'up' | 'down') => {
              const arr = [...ordered.map(i => i.id)]
              const idx = arr.indexOf(id)
              const newIdx = dir === 'up' ? idx - 1 : idx + 1
              if (newIdx < 0 || newIdx >= arr.length) return
              ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
              setNavOrder(arr)
            }

            const saveNav = async () => {
              const arr = ordered.map(i => i.id)
              try { localStorage.setItem('sk-nav-order', JSON.stringify(arr)) } catch {}
              try {
                const res = await fetch('/api/admin/nav-order', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw },
                  body: JSON.stringify({ order: arr }),
                })
                if (res.ok) alert('Ordem salva! Vai refletir para todos os usuários.')
                else alert('Salvo localmente. Erro ao salvar no banco.')
              } catch {
                alert('Salvo localmente. Sem conexão com o banco.')
              }
            }

            const resetNav = async () => {
              setNavOrder(NAV_ITEMS_LIST.map(i => i.id))
              try { localStorage.removeItem('sk-nav-order') } catch {}
              try {
                await fetch('/api/admin/nav-order', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw },
                  body: JSON.stringify({ order: NAV_ITEMS_LIST.map(i => i.id) }),
                })
              } catch {}
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.3rem', fontSize: '1rem', fontWeight: 700, color: C.text }}>⠿ Ordem do Menu lateral</h3>
                  <p style={{ margin: '0 0 1.2rem', fontSize: '0.78rem', color: C.muted }}>Use os botões ▲/▼ para reordenar os itens da sidebar do dashboard. Clique em Salvar para aplicar.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                    {ordered.map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1rem', background: C.cardBgAlt, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.vdim, width: 18, textAlign: 'center', flexShrink: 0 }}>{idx + 1}</span>
                        <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600, color: C.text }}>{item.label}</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button disabled={idx === 0} onClick={() => moveNav(item.id, 'up')}
                            style={{ width: 28, height: 28, background: 'transparent', border: `1px solid ${C.border}`, color: idx === 0 ? C.vdim : C.muted, borderRadius: '6px', cursor: idx === 0 ? 'default' : 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
                          <button disabled={idx === ordered.length - 1} onClick={() => moveNav(item.id, 'down')}
                            style={{ width: 28, height: 28, background: 'transparent', border: `1px solid ${C.border}`, color: idx === ordered.length - 1 ? C.vdim : C.muted, borderRadius: '6px', cursor: idx === ordered.length - 1 ? 'default' : 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button onClick={saveNav}
                      style={{ flex: 1, padding: '0.55rem 0', background: C.primaryBg, border: `1px solid ${C.borderStrong}`, color: C.primary, borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                      ✓ Salvar ordem
                    </button>
                    <button onClick={resetNav}
                      style={{ padding: '0.55rem 1rem', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                      ↺ Reset
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

          {view === 'invites' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Quota management */}
              <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.3rem', fontSize: '1rem', fontWeight: 700, color: C.text }}>✉️ Quotas de Convite</h3>
                <p style={{ margin: '0 0 1.2rem', fontSize: '0.78rem', color: C.muted }}>Defina quantos convites cada usuário pode enviar. Padrão inicial: 0.</p>
                {adminInvitesLoading ? (
                  <div style={{ color: C.muted, fontSize: '0.85rem' }}>Carregando...</div>
                ) : inviteQuotas.length === 0 ? (
                  <div style={{ color: C.dim, fontSize: '0.84rem' }}>Nenhum usuário registrado ainda.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {inviteQuotas.map(q => {
                      const sentCount = adminInvites.filter(i =>
                        (i.inviter_username ?? i.inviter_id).toLowerCase() === q.platform_username.toLowerCase()
                      ).length
                      const key = q.platform_username
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1rem', background: C.cardBgAlt, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: C.text }}>@{q.platform_username}</div>
                            <div style={{ fontSize: '0.72rem', color: C.dim }}>{sentCount} convite{sentCount !== 1 ? 's' : ''} enviado{sentCount !== 1 ? 's' : ''}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: C.muted }}>Quota:</span>
                            <input
                              type="number"
                              min={0}
                              max={50}
                              value={quotaEdits[key] ?? q.quota}
                              onChange={e => setQuotaEdits(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                              style={{ width: '60px', padding: '0.35rem 0.5rem', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: '6px', color: C.text, fontSize: '0.85rem', outline: 'none', textAlign: 'center' }}
                            />
                            <button
                              onClick={() => saveQuota(key)}
                              disabled={quotaSaving === key || (quotaEdits[key] ?? q.quota) === q.quota}
                              style={{ padding: '0.35rem 0.75rem', background: (quotaEdits[key] ?? q.quota) === q.quota ? 'transparent' : C.primaryBg, border: `1px solid ${(quotaEdits[key] ?? q.quota) === q.quota ? C.border : C.borderStrong}`, color: (quotaEdits[key] ?? q.quota) === q.quota ? C.dim : C.primary, borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: (quotaEdits[key] ?? q.quota) === q.quota ? 'default' : 'pointer' }}>
                              {quotaSaving === key ? '...' : 'Salvar'}
                            </button>
                            <button
                              onClick={() => saveQuota(key, 0)}
                              disabled={quotaSaving === key || q.quota === 0}
                              title="Resetar quota para 0"
                              style={{ padding: '0.35rem 0.6rem', background: 'transparent', border: `1px solid ${q.quota === 0 ? C.border : 'rgba(255,68,68,0.3)'}`, color: q.quota === 0 ? C.vdim : '#ff6b6b', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: q.quota === 0 ? 'default' : 'pointer' }}>
                              ↺ 0
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* All invites */}
              <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.text }}>Todos os convites</h3>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', background: C.primaryBg, color: C.primary, borderRadius: 999, border: `1px solid ${C.borderStrong}` }}>{adminInvites.length}</span>
                  <button onClick={() => fetchAdminInvites(storedPw)} style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${C.border}`, color: C.dim, borderRadius: '6px', padding: '0.3rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>↺ Atualizar</button>
                </div>
                {adminInvites.length === 0 ? (
                  <div style={{ color: C.dim, fontSize: '0.84rem' }}>Nenhum convite enviado ainda.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {adminInvites.map(inv => {
                      const inviterUsername = inv.inviter_username ?? inv.inviter_id
                      const statusColor =
                        inv.status === 'aceito'  ? C.accent :
                        inv.status === 'vetado'  ? C.danger :
                        C.primary
                      const statusBg =
                        inv.status === 'aceito'  ? C.accentBg :
                        inv.status === 'vetado'  ? C.dangerBg :
                        C.primaryBg
                      return (
                        <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', background: C.cardBgAlt, border: `1px solid ${C.border}`, borderRadius: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: C.muted }}>@{inviterUsername}</span>
                              <span style={{ fontSize: '0.72rem', color: C.vdim }}>→</span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: C.text }}>@{inv.invitee_email}</span>
                            </div>
                            <div style={{ fontSize: '0.68rem', color: C.dim }}>{new Date(inv.created_at).toLocaleDateString('pt-BR')}</div>
                          </div>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.5rem', background: statusBg, color: statusColor, borderRadius: 999, border: `1px solid ${statusColor}40` }}>
                            {inv.status}
                          </span>
                          {inv.status === 'pendente' && (
                            <button
                              onClick={() => vetoInvite(inv.id)}
                              disabled={inviteVetoLoading === inv.id}
                              className="sk-btn-reject"
                              style={{ flexShrink: 0 }}>
                              {inviteVetoLoading === inv.id ? '...' : 'Vetar'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'iaimagens' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {aiLoading ? <div style={{ color: C.muted, fontSize: '0.85rem' }}>Carregando...</div> : (
                <>
                  {/* Config card */}
                  <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.3rem', fontSize: '1rem', fontWeight: 700, color: C.text }}>🎨 IA de Imagens — Configuração</h3>
                    <p style={{ margin: '0 0 1.25rem', fontSize: '0.78rem', color: C.muted }}>Configure quem pode usar a geração de imagens com DALL-E 3 e o delay entre usos.</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Enable toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', background: C.cardBgAlt, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: C.text }}>Funcionalidade ativa</div>
                          <div style={{ fontSize: '0.72rem', color: C.muted, marginTop: '0.1rem' }}>Desativar bloqueia para todos os grupos</div>
                        </div>
                        <button onClick={() => setAiCfg(p => ({ ...p, enabled: !p.enabled }))} style={{ width: 44, height: 24, borderRadius: 12, background: aiCfg.enabled ? C.accent : C.vvdim, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <span style={{ position: 'absolute', top: 3, left: aiCfg.enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
                        </button>
                      </div>

                      {/* Per-group table */}
                      <div style={{ padding: '0.8rem 1rem', background: C.cardBgAlt, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: C.text, marginBottom: '0.15rem' }}>Configuração por grupo</div>
                        <div style={{ fontSize: '0.7rem', color: C.dim, marginBottom: '0.85rem' }}>Limite diário, delay e acesso individuais por grupo.</div>

                        {/* Table header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 52px', gap: '0.6rem', alignItems: 'center', paddingBottom: '0.45rem', borderBottom: `1px solid ${C.border}`, marginBottom: '0.1rem' }}>
                          {['Grupo','Limite / dia','Delay (seg)','Acesso'].map(h => (
                            <span key={h} style={{ fontSize: '0.62rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h === 'Acesso' ? 'center' : undefined }}>{h}</span>
                          ))}
                        </div>

                        {['todos','admin','moderador','vip','streamer'].map(role => {
                          const limitVal = aiCfg.role_limits?.[role] ?? aiCfg.max_per_day
                          const delayVal = aiCfg.role_delays?.[role] ?? aiCfg.cooldown_seconds
                          const hasAccess = aiCfg.allowed_roles.includes(role)
                          const dFmt = (s: number) => s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s/60)}m` : `${Math.floor(s/3600)}h`
                          return (
                            <div key={role} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 52px', gap: '0.6rem', alignItems: 'center', padding: '0.45rem 0', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                              {/* Name */}
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: hasAccess ? (role === 'todos' ? '#60a5fa' : C.primary) : C.dim }}>
                                {role === 'todos' ? '🌐 todos' : role}
                              </span>
                              {/* Limit */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <input type="number" min={0} value={limitVal}
                                  onChange={e => setAiCfg(p => ({ ...p, role_limits: { ...(p.role_limits ?? {}), [role]: Number(e.target.value) } }))}
                                  style={{ width: 56, padding: '0.3rem 0.45rem', background: C.inputBg, border: `1px solid ${C.borderStrong}`, borderRadius: 6, color: C.text, fontSize: '0.82rem', outline: 'none' }} />
                                <span style={{ fontSize: '0.62rem', color: C.dim }}>img/d</span>
                              </div>
                              {/* Delay */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <input type="number" min={0} value={delayVal}
                                  onChange={e => setAiCfg(p => ({ ...p, role_delays: { ...(p.role_delays ?? {}), [role]: Number(e.target.value) } }))}
                                  style={{ width: 56, padding: '0.3rem 0.45rem', background: C.inputBg, border: `1px solid ${C.borderStrong}`, borderRadius: 6, color: C.text, fontSize: '0.82rem', outline: 'none' }} />
                                <span style={{ fontSize: '0.62rem', color: C.dim }}>{dFmt(delayVal)}</span>
                              </div>
                              {/* Access toggle */}
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button onClick={() => setAiCfg(p => ({ ...p, allowed_roles: hasAccess ? p.allowed_roles.filter(r => r !== role) : [...p.allowed_roles, role] }))}
                                  style={{ width: 38, height: 22, borderRadius: 11, background: hasAccess ? (role === 'todos' ? '#3b82f6' : '#22c55e') : C.vvdim, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                                  <span style={{ position: 'absolute', top: 3, left: hasAccess ? 18 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                        <div style={{ fontSize: '0.67rem', color: C.dim, marginTop: '0.6rem' }}>
                          💡 &quot;todos&quot; ativo = qualquer usuário aprovado tem acesso, independente do grupo.
                        </div>
                      </div>

                      <button onClick={saveAiCfg} disabled={aiSaving} style={{ padding: '0.65rem', borderRadius: 10, fontWeight: 800, fontSize: '0.9rem', background: aiSaved ? C.accentBg : C.primaryBg, border: `1px solid ${aiSaved ? C.accentBorder : C.borderStrong}`, color: aiSaved ? C.accent : C.primary, cursor: 'pointer' }}>
                        {aiSaving ? 'Salvando...' : aiSaved ? '✓ Salvo!' : '💾 Salvar configuração'}
                      </button>
                    </div>
                  </div>

                  {/* Recent generations */}
                  <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: C.text }}>🖼 Gerações recentes ({aiRecent.length})</h3>
                    {aiRecent.length === 0 ? (
                      <div style={{ color: C.dim, fontSize: '0.84rem' }}>Nenhuma imagem gerada ainda.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {aiRecent.map(g => (
                          <div key={g.id} style={{ background: C.cardBgAlt, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.65rem 0.85rem' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: C.text }}>@{g.user_name}</span>
                                  {g.user_role && <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', background: C.primaryBg, color: C.primary, borderRadius: 999, border: `1px solid ${C.borderStrong}` }}>{g.user_role}</span>}
                                  <span style={{ fontSize: '0.68rem', color: C.dim, marginLeft: 'auto' }}>{new Date(g.created_at).toLocaleString('pt-BR')}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.prompt}</div>
                              </div>
                              <button onClick={() => toggleAiImg(g.id)} disabled={aiImgLoading === g.id}
                                style={{ flexShrink: 0, padding: '0.3rem 0.65rem', borderRadius: 6, border: `1px solid ${aiImgExpanded[g.id] !== undefined ? C.dangerBorder : C.border}`, background: 'transparent', color: aiImgExpanded[g.id] !== undefined ? C.danger : C.muted, fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {aiImgLoading === g.id ? '...' : aiImgExpanded[g.id] !== undefined ? '✕ Fechar' : '🖼 Ver'}
                              </button>
                            </div>
                            {aiImgExpanded[g.id] !== undefined && (
                              <div style={{ padding: '0 0.85rem 0.85rem' }}>
                                {aiImgExpanded[g.id] ? (
                                  <>
                                    <img src={aiImgExpanded[g.id]!} alt={g.prompt} style={{ width: '100%', height: 'auto', borderRadius: 8, border: `1px solid ${C.border}`, display: 'block' }} />
                                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                      <button onClick={() => { const a = document.createElement('a'); a.href = aiImgExpanded[g.id]!; a.download = `sheikstream-ia-${g.id}.png`; a.click() }}
                                        style={{ flex: 1, textAlign: 'center', padding: '0.4rem', background: C.primaryBg, border: `1px solid ${C.borderStrong}`, borderRadius: 7, color: C.primary, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                                        ⬇ Baixar imagem
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ padding: '0.75rem', textAlign: 'center', color: C.dim, fontSize: '0.78rem' }}>Imagem não disponível</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
