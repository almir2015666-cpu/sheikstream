'use client'
import { useState, useRef } from 'react'

const C = {
  page: '#08090d', card: '#0d0f18', border: 'rgba(255,255,255,0.07)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.55)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)', primary: '#9b30ff',
  blue: '#3b82f6', blueBg: 'rgba(59,130,246,0.12)',
  cyan: '#22d3ee', green: '#22c55e',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem', background: '#08090d',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
  color: '#e8e6f8', fontSize: '0.875rem', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

function Toggle({ on, onChange, size = 'md' }: { on: boolean; onChange: (v: boolean) => void; size?: 'sm' | 'md' }) {
  const [w, h, b, bOff, bOn] = size === 'sm' ? [34, 18, 12, 3, 19] : [44, 24, 18, 3, 23]
  return (
    <button type="button" onClick={() => onChange(!on)} style={{
      width: w, height: h, borderRadius: h / 2,
      background: on ? C.green : 'rgba(255,255,255,0.12)',
      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{ position: 'absolute', top: bOff, left: on ? bOn : bOff, width: b, height: b, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
    </button>
  )
}

type Cmd = { id: string; trigger: string; resposta: string; cooldown: number; habilitado: boolean; isEvento: boolean; origem: string; platform: string }

type FormState = {
  trigger: string; resposta: string; cooldown: number; ativo: boolean
  permissao: string; responderComo: 'canal' | 'bot'; notifOverlay: boolean
  template: string | null; extraVars: string[]; platforms: string[]
}

const emptyForm: FormState = { trigger: '', resposta: '', cooldown: 5, ativo: true, permissao: 'todos', responderComo: 'canal', notifOverlay: false, template: null, extraVars: [], platforms: ['Twitch'] }

const PERMS = [
  { id: 'todos',       label: 'Todos',       desc: 'Qualquer pessoa no chat',  color: '#22c55e' },
  { id: 'inscritos',   label: 'Inscritos',   desc: 'Apenas inscritos/membros', color: '#3b82f6' },
  { id: 'vip',         label: 'VIP',         desc: 'VIPs e acima',             color: '#8b5cf6' },
  { id: 'moderadores', label: 'Moderadores', desc: 'Apenas mods e streamer',   color: '#3b82f6' },
  { id: 'streamer',    label: 'Streamer',    desc: 'Apenas o streamer',        color: '#3b82f6' },
]

function TplIcon({ id, color }: { id: string; color: string }) {
  const s = { width: 18, height: 18 }
  if (id === 'discord') return <svg {...s} viewBox="0 0 24 24" fill={color}><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.112 18.1.132 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
  if (id === 'instagram') return <svg {...s} viewBox="0 0 24 24" fill={color}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
  if (id === 'youtube') return <svg {...s} viewBox="0 0 24 24" fill={color}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  if (id === 'kick') return <svg {...s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill={color}/><path d="M9 8l6 4-6 4V8z" fill="#000"/></svg>
  if (id === 'so') return <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
  if (id === 'musica') return <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
  if (id === 'sorteio') return <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
  return <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}

type Tpl = { id: string; label: string; trigger: string; resposta: string; permissao: string; cooldown: number; extraVars?: string[]; color: string }
const TEMPLATES: Tpl[] = [
  { id: 'discord',   label: '!discord',   trigger: 'discord',   resposta: '💬 Venha participar da nossa comunidade no Discord: discord.gg/LINK_AQUI',       permissao: 'todos',       cooldown: 5,  color: '#7289da' },
  { id: 'instagram', label: '!instagram', trigger: 'instagram', resposta: '📷 Me siga no Instagram: instagram.com/SEU_USER',                                  permissao: 'todos',       cooldown: 5,  color: '#e1306c' },
  { id: 'youtube',   label: '!youtube',   trigger: 'youtube',   resposta: '▶ Inscreva-se no YouTube: youtube.com/@SEU_CANAL',                                  permissao: 'todos',       cooldown: 5,  color: '#3b82f6' },
  { id: 'kick',      label: '!kick',      trigger: 'kick',      resposta: '🟢 Me siga no Kick: kick.com/SEU_USER',                                             permissao: 'todos',       cooldown: 5,  color: '#53fc18' },
  { id: 'so',        label: '!so',        trigger: 'so',        resposta: '📢 Shoutout para @$(1)! Vai lá conferir: twitch.tv/$(1) — dá aquele follow! PogChamp', permissao: 'moderadores', cooldown: 10, color: '#f97316' },
  { id: 'musica',    label: '!musica',    trigger: 'musica',    resposta: '🎵 Para sugerir uma música use: !sr [link do YouTube]',                             permissao: 'todos',       cooldown: 10, extraVars: ['$musica', '$artista', '$url', '$playlist', '$playlist_url', '$playlist_total'], color: '#a855f7' },
  { id: 'sorteio',   label: '!sorteio',   trigger: 'sorteio',   resposta: '🎰 Participe do sorteio! Doe via Livepix e ganhe tickets. Veja o link no perfil!',   permissao: 'todos',       cooldown: 15, color: '#6b7280' },
  { id: 'blank',     label: 'Em branco',  trigger: '',          resposta: '',                                                                                    permissao: 'todos',       cooldown: 5,  color: '#eab308' },
]

const BASE_VARS = ['$(user)', '$(channel)', '$(touser)', '$(1)', '$(count)', '$(uptime)', '$(game)']

const DEFAULTS: Cmd[] = [
  { id: '1', trigger: 'Sub Twitch',       resposta: 'Obrigado pelo sub, $user! Voce ganhou $tickets ticket(s).',           cooldown: 0,  habilitado: true,  isEvento: true,  origem: 'Automatico', platform: 'Twitch' },
  { id: '2', trigger: 'Gift sub Twitch',  resposta: 'Obrigado $user por presentear $count gift sub(s)!',                   cooldown: 0,  habilitado: true,  isEvento: true,  origem: 'Automatico', platform: 'Twitch' },
  { id: '3', trigger: 'Resub Twitch',     resposta: 'Obrigado pelo resub, $user! $months mes(es) de apoio. $msg',          cooldown: 0,  habilitado: true,  isEvento: true,  origem: 'Automatico', platform: 'Twitch' },
  { id: '4', trigger: 'Prime Twitch',     resposta: 'Obrigado pelo Prime, $user! Esse Prime fortalece demais a live.',      cooldown: 0,  habilitado: true,  isEvento: true,  origem: 'Automatico', platform: 'Twitch' },
  { id: '5', trigger: 'Follow Twitch',    resposta: 'Valeu pelo follow, $user! Seja bem-vindo(a).',                         cooldown: 0,  habilitado: true,  isEvento: true,  origem: 'Automatico', platform: 'Twitch' },
  { id: '6', trigger: 'Membro YouTube',   resposta: 'Obrigado por virar membro, $user! Voce ganhou $tickets ticket(s).',   cooldown: 0,  habilitado: true,  isEvento: true,  origem: 'Automatico', platform: 'Youtube' },
  { id: '7', trigger: 'Inscricao YouTube',resposta: 'Obrigado pela inscricao no YouTube, $user! Seja bem-vindo(a).',        cooldown: 0,  habilitado: true,  isEvento: true,  origem: 'Automatico', platform: 'Youtube' },
  { id: '8', trigger: '!discord',         resposta: '💬 Venha participar da nossa comunidade no Discord: discord.gg/...',  cooldown: 30, habilitado: true,  isEvento: false, origem: 'Todos',      platform: 'Twitch' },
  { id: '9', trigger: '!sorteio',         resposta: '🎰 Participe do sorteio! Doe via Livepix e ganhe tickets.',           cooldown: 15, habilitado: true,  isEvento: false, origem: 'Todos',      platform: 'Twitch' },
]

export default function ComandosPage() {
  const [cmds, setCmds]         = useState<Cmd[]>(DEFAULTS)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [botOn, setBotOn]       = useState(false)
  const [search, setSearch]     = useState('')
  const [form, setForm]         = useState<FormState>(emptyForm)
  const [advOpen, setAdvOpen]   = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)

  function insertVar(v: string) {
    const ta = taRef.current
    if (!ta) { setForm(p => ({ ...p, resposta: p.resposta + v })); return }
    const s = ta.selectionStart, e = ta.selectionEnd
    const next = form.resposta.slice(0, s) + v + form.resposta.slice(e)
    setForm(p => ({ ...p, resposta: next }))
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = s + v.length }, 0)
  }

  function selectTemplate(tpl: Tpl) {
    setAdvOpen(false)
    setForm({ trigger: tpl.trigger, resposta: tpl.resposta, cooldown: tpl.cooldown, ativo: true, permissao: tpl.permissao, responderComo: 'canal', notifOverlay: false, template: tpl.id, extraVars: tpl.extraVars ?? [] })
  }

  function startEdit(cmd: Cmd) {
    setEditingId(cmd.id)
    setForm({ trigger: cmd.trigger.replace(/^!/, ''), resposta: cmd.resposta, cooldown: cmd.cooldown, ativo: cmd.habilitado, permissao: cmd.origem.toLowerCase() === 'todos' ? 'todos' : cmd.origem.toLowerCase(), responderComo: 'canal', notifOverlay: false, template: null, extraVars: [], platforms: [cmd.platform] })
    setCreating(true)
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.trigger || !form.resposta) return
    const platform = form.platforms[0] ?? 'Twitch'
    if (editingId) {
      setCmds(p => p.map(c => c.id === editingId ? { ...c, trigger: '!' + form.trigger, resposta: form.resposta, cooldown: form.cooldown, habilitado: form.ativo, origem: form.permissao === 'todos' ? 'Todos' : form.permissao, platform } : c))
    } else {
      setCmds(p => [...p, { id: String(Date.now()), trigger: '!' + form.trigger, resposta: form.resposta, cooldown: form.cooldown, habilitado: form.ativo, isEvento: false, origem: form.permissao === 'todos' ? 'Todos' : form.permissao, platform }])
    }
    setForm(emptyForm); setCreating(false); setEditingId(null)
  }

  const filtered    = cmds.filter(c => c.trigger.toLowerCase().includes(search.toLowerCase()) || c.resposta.toLowerCase().includes(search.toLowerCase()))
  const ativos      = cmds.filter(c => c.habilitado).length
  const inativos    = cmds.filter(c => !c.habilitado).length
  const allVars     = [...BASE_VARS, ...form.extraVars]
  const activePerm  = PERMS.find(p => p.id === form.permissao) ?? PERMS[0]

  /* ──────────────────────── LIST VIEW ──────────────────────── */
  if (!creating) return (
    <div style={{ background: C.page, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: C.dim }}>{'>'}_</span>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Comandos do bot</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.82rem', color: C.dim }}>Bot</span>
            <Toggle on={botOn} onChange={setBotOn} size="sm" />
            <span style={{ fontSize: '0.78rem', color: botOn ? C.green : C.dim, minWidth: '60px' }}>
              {botOn ? 'Ativo' : 'Desativado'}
            </span>
          </div>
          <button onClick={() => { setForm(emptyForm); setCreating(true) }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: C.blue, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>
            + Novo comando
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        {[{ label: 'Total', value: cmds.length, color: C.text }, { label: 'Ativos', value: ativos, color: C.cyan }, { label: 'Inativos', value: inativos, color: C.dim }].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0.9rem 1.2rem' }}>
            <div style={{ fontSize: '0.72rem', color: C.dim, marginBottom: '0.3rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Commands table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
        {/* Table header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1.25rem', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Comandos</span>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar comando..." style={{ ...inp, width: '200px', padding: '0.38rem 0.75rem', fontSize: '0.8rem' }} />
        </div>

        {/* Column labels */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 3fr 90px', padding: '0.5rem 1.25rem', borderBottom: `1px solid rgba(255,255,255,0.04)`, fontSize: '0.67rem', fontWeight: 700, color: C.dim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <span>Comando/Evento</span><span>Resposta</span><span style={{ textAlign: 'right' }}>Ações</span>
        </div>

        {/* Rows */}
        {filtered.map((cmd, i) => (
          <div key={cmd.id}
            style={{ display: 'grid', gridTemplateColumns: '2.5fr 3fr 90px', padding: '0.7rem 1.25rem', borderBottom: i < filtered.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none', alignItems: 'center', transition: 'background 0.1s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.015)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
                <code style={{ fontSize: '0.84rem', color: C.cyan, fontFamily: 'monospace', fontWeight: 700 }}>{cmd.trigger}</code>
                {cmd.isEvento && (
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.06rem 0.35rem', border: `1px solid ${C.cyan}40`, color: C.cyan, borderRadius: '4px', letterSpacing: '0.03em' }}>evento</span>
                )}
              </div>
              <div style={{ fontSize: '0.71rem', color: C.dim }}>{cmd.origem} · {cmd.platform}</div>
            </div>
            <span style={{ fontSize: '0.79rem', color: C.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.75rem' }}>{cmd.resposta}</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
              <Toggle on={cmd.habilitado} onChange={v => setCmds(p => p.map(c => c.id === cmd.id ? { ...c, habilitado: v } : c))} size="sm" />
              {!cmd.isEvento && (
                <button onClick={() => startEdit(cmd)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: '0.15rem', display: 'flex', opacity: 0.7 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              )}
              {!cmd.isEvento && (
                <button onClick={() => setCmds(p => p.filter(c => c.id !== cmd.id))} style={{ background: 'none', border: 'none', color: 'rgba(255,100,100,0.45)', cursor: 'pointer', padding: '0.15rem', display: 'flex' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', fontSize: '0.84rem', color: C.dim }}>Nenhum comando encontrado</div>
        )}
      </div>
    </div>
  )

  /* ──────────────────────── CREATE VIEW ──────────────────────── */
  return (
    <div style={{ background: C.page, minHeight: '100vh', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Top bar */}
      <div style={{ padding: '0.9rem 2rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <button onClick={() => { setCreating(false); setEditingId(null) }} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '0.84rem', padding: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Voltar
        </button>
        <span style={{ color: C.vdim, fontSize: '0.9rem' }}>|</span>
        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{editingId ? 'Editar comando' : 'Novo comando'}</span>
      </div>

      <div style={{ padding: '1.5rem 2rem', maxWidth: '760px' }}>

        {/* Templates */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Modelos Prontos</div>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            {TEMPLATES.map(tpl => {
              const sel = form.template === tpl.id
              return (
                <button key={tpl.id} type="button" onClick={() => selectTemplate(tpl)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 0.8rem', background: sel ? `${tpl.color}18` : C.card, border: `1px solid ${sel ? tpl.color + '55' : C.border}`, borderRadius: '10px', cursor: 'pointer', minWidth: '68px', transition: 'all 0.15s' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: `${tpl.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TplIcon id={tpl.id} color={tpl.color} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: sel ? C.text : C.muted, whiteSpace: 'nowrap' }}>{tpl.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

          {/* 1 · Comando */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.2rem', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem' }}>
                <span style={{ fontFamily: 'monospace', color: C.dim, fontSize: '0.95rem' }}>{'>'}_</span> Comando
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: C.muted }}>
                Ativo <Toggle on={form.ativo} onChange={v => setForm(p => ({ ...p, ativo: v }))} size="sm" />
              </div>
            </div>
            <div style={{ padding: '1rem 1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#08090d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                <span style={{ padding: '0.6rem 0.75rem 0.6rem 0.9rem', color: C.dim, fontFamily: 'monospace', borderRight: '1px solid rgba(255,255,255,0.08)' }}>!</span>
                <input value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value.replace(/\s+/g, '').replace(/[^a-zA-Z0-9_]/g, '') }))} placeholder="meucomando" style={{ flex: 1, padding: '0.6rem 0.75rem', background: 'none', border: 'none', color: '#e8e6f8', fontSize: '0.875rem', outline: 'none', fontFamily: 'monospace' }} />
              </div>
              <div style={{ marginTop: '0.45rem', fontSize: '0.73rem', color: C.dim }}>
                Sem espaços ou caracteres especiais. Ex: <code style={{ color: C.cyan, fontFamily: 'monospace' }}>!discord</code>, <code style={{ color: C.cyan, fontFamily: 'monospace' }}>!sorteio</code>
              </div>
            </div>
          </div>

          {/* 2 · Resposta do bot */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.85rem 1.2rem', borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: '0.9rem' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Resposta do bot
            </div>
            <div style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {allVars.map(v => (
                  <button key={v} type="button" onClick={() => insertVar(v)} style={{ padding: '0.2rem 0.5rem', background: '#08090d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: C.muted, fontSize: '0.72rem', fontFamily: 'monospace', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                  >{v}</button>
                ))}
              </div>
              <textarea ref={taRef} value={form.resposta} onChange={e => setForm(p => ({ ...p, resposta: e.target.value }))} rows={3} placeholder="O que o bot responde... Ex: @$(user), nosso Discord está em discord.gg/LINK!" style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.84rem', lineHeight: 1.65 }} />
              {form.resposta && (
                <div style={{ background: '#08090d', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.6rem 0.85rem' }}>
                  <div style={{ fontSize: '0.67rem', color: C.dim, marginBottom: '0.28rem' }}>Preview:</div>
                  <div style={{ fontSize: '0.83rem', fontFamily: 'monospace', color: C.muted, lineHeight: 1.55 }}>💬 {form.resposta}</div>
                </div>
              )}
            </div>
          </div>

          {/* 3 · Permissões */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1rem 1.2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.8rem' }}>Permissões</div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
              {PERMS.map(p => {
                const sel = form.permissao === p.id
                return (
                  <button key={p.id} type="button" onClick={() => setForm(f => ({ ...f, permissao: p.id }))} style={{ flex: 1, minWidth: '75px', padding: '0.5rem 0.25rem', background: sel ? `${p.color}15` : 'transparent', border: `1px solid ${sel ? p.color + '55' : 'rgba(255,255,255,0.08)'}`, color: sel ? p.color : C.dim, borderRadius: '8px', fontSize: '0.79rem', fontWeight: sel ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>{p.label}</button>
                )
              })}
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              <span style={{ color: activePerm.color, fontWeight: 600 }}>{activePerm.label}</span>
              <span style={{ color: C.dim }}> — {activePerm.desc}</span>
            </div>
          </div>

          {/* 4 · Plataformas */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1rem 1.2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.8rem' }}>Plataformas</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[{ id: 'Twitch', color: '#9147ff' }, { id: 'YouTube', color: '#ff4444' }].map(pl => {
                const sel = form.platforms.includes(pl.id)
                return (
                  <button key={pl.id} type="button"
                    onClick={() => setForm(p => ({ ...p, platforms: sel ? p.platforms.filter(x => x !== pl.id) : [...p.platforms, pl.id] }))}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', background: sel ? `${pl.color}15` : 'transparent', border: `1px ${sel ? 'solid' : 'dashed'} ${sel ? pl.color + '55' : 'rgba(255,255,255,0.12)'}`, borderRadius: '8px', color: sel ? pl.color : C.dim, fontSize: '0.8rem', fontWeight: sel ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {sel
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    }
                    {sel ? pl.id : `Conectar ${pl.id}`}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 5 · Responder como */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1rem 1.2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.8rem' }}>Responder como</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                { id: 'canal' as const, label: 'Conta do canal',  desc: 'Responde como o dono da live' },
                { id: 'bot'   as const, label: 'SheikSTREAM',     desc: 'Responde pela conta bot da plataforma' },
              ].map(opt => {
                const sel = form.responderComo === opt.id
                return (
                  <button key={opt.id} type="button" onClick={() => setForm(p => ({ ...p, responderComo: opt.id }))} style={{ padding: '0.75rem 1rem', background: sel ? C.blueBg : 'transparent', border: `1px solid ${sel ? C.blue + '55' : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: sel ? C.blue : C.text }}>{opt.label}</div>
                    <div style={{ fontSize: '0.73rem', color: C.dim, marginTop: '0.18rem' }}>{opt.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 6 · Notificação no overlay */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1rem 1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notificação no overlay</span>
                <span style={{ fontSize: '0.74rem', color: form.notifOverlay ? C.green : C.dim }}>{form.notifOverlay ? 'Ativo' : 'Inativo'}</span>
              </div>
              <Toggle on={form.notifOverlay} onChange={v => setForm(p => ({ ...p, notifOverlay: v }))} size="sm" />
            </div>
            <div style={{ fontSize: '0.74rem', color: C.dim, lineHeight: 1.5 }}>
              Quando ativado, o bot exibe a resposta deste comando como um alerta em tempo real no overlay da transmissão.
            </div>
          </div>

          {/* 7 · Configurações avançadas */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            <button type="button" onClick={() => setAdvOpen(p => !p)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.2rem', background: 'none', border: 'none', cursor: 'pointer', color: C.text }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Configurações avançadas</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.78rem', color: C.dim }}>{form.cooldown}s cooldown</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: advOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </button>
            {advOpen && (
              <div style={{ padding: '0 1.2rem 1rem 1.2rem', borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.55rem' }}>Cooldown (segundos)</div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[5, 10, 15, 30, 60].map(s => (
                    <button key={s} type="button" onClick={() => setForm(p => ({ ...p, cooldown: s }))} style={{ padding: '0.38rem 0.75rem', background: form.cooldown === s ? C.blueBg : 'transparent', border: `1px solid ${form.cooldown === s ? C.blue + '55' : 'rgba(255,255,255,0.08)'}`, color: form.cooldown === s ? C.blue : C.dim, borderRadius: '6px', fontSize: '0.79rem', cursor: 'pointer', transition: 'all 0.15s' }}>{s}s</button>
                  ))}
                  <input type="number" value={form.cooldown} onChange={e => setForm(p => ({ ...p, cooldown: Math.max(0, Number(e.target.value)) }))} min={0} style={{ ...inp, width: '70px', padding: '0.38rem 0.6rem', fontSize: '0.79rem' }} />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button type="submit" style={{ width: '100%', padding: '0.85rem', background: C.blue, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}>
            {editingId ? 'Salvar alterações' : 'Criar comando'}
          </button>
        </form>
      </div>
    </div>
  )
}
