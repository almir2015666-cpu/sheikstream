'use client'

import { useEffect, useState, useCallback } from 'react'
import { useToast } from '@/app/components/Toast'
import { useLang } from '@/lib/i18n'

// ─── Types ───────────────────────────────────────────────────────────────────

type TimerLog = {
  id: string
  plataforma: string
  status: 'success' | 'error' | 'pending'
  erro: string | null
  created_at: string
}

type Timer = {
  id: string
  nome: string
  mensagem: string
  intervalo_minutos: number
  min_mensagens: number
  plataformas: string[]
  tipo_saida: 'chat' | 'overlay' | 'both'
  ativo: boolean
  ultimo_disparo: string | null
  created_at: string
  timer_logs: TimerLog[]
}

type FormState = {
  nome: string
  mensagem: string
  intervalo_minutos: number
  plataformas: string[]
  ativo: boolean
}

type UserConnections = {
  twitch?: boolean
  youtube?: boolean
}

const EMPTY_FORM: FormState = {
  nome: '',
  mensagem: '',
  intervalo_minutos: 60,
  plataformas: [],
  ativo: true,
}

const PLATS = [
  { key: 'twitch', label: 'Twitch', color: '#9146FF' },
  { key: 'youtube', label: 'YouTube', color: '#FF0000' },
  { key: 'kick', label: 'Kick', color: '#53FC18' },
  { key: 'tiktok', label: 'TikTok', color: '#fe2c55' },
]

function platStatus(timer: Timer, platKey: string): 'success' | 'error' | 'none' {
  const logs = [...timer.timer_logs]
    .filter(l => l.plataforma === platKey)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  if (!logs.length) return 'none'
  return logs[0].status === 'success' ? 'success' : 'error'
}

function formatInterval(mins: number) {
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        background: checked ? '#3b82f6' : '#374151',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function TimerModal({
  editingId,
  form,
  setForm,
  connections,
  setConnections,
  saving,
  onSave,
  onClose,
}: {
  editingId: string | null
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  connections: UserConnections
  setConnections: React.Dispatch<React.SetStateAction<UserConnections>>
  saving: boolean
  onSave: () => void
  onClose: () => void
}) {

  const { t } = useLang()

  const isConnected = (key: string) => {
    if (key === 'twitch') return !!connections.twitch
    if (key === 'youtube') return !!connections.youtube
    return true // kick/tiktok sempre disponíveis (overlay)
  }

  const oauthUrl: Record<string, string | null> = {
    twitch: '/api/auth/twitch?popup=1',
    youtube: '/api/auth/google?popup=1',
    kick: null,
    tiktok: null,
  }

  const openOAuth = (key: string, url: string) => {
    const w = 500, h = 700
    const left = window.screen.width - w - 20
    const top = Math.max(0, (window.screen.height - h) / 2)
    const popup = window.open(url, 'oauth_popup', `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`)
    const check = setInterval(() => {
      if (popup?.closed) {
        clearInterval(check)
        const connKey = key === 'twitch' ? 'twitch' : 'youtube'
        setConnections(c => ({ ...c, [connKey]: true }))
        setForm(f => ({
          ...f,
          plataformas: f.plataformas.includes(key) ? f.plataformas : [...f.plataformas, key],
        }))
      }
    }, 500)
  }

  const togglePlat = (key: string) => {
    const url = oauthUrl[key]

    // Se não está conectado e tem OAuth → abre popup de conexão
    if (!isConnected(key) && url) {
      openOAuth(key, url)
      return
    }

    // Já conectado ou sem OAuth (kick/tiktok) → apenas alterna seleção
    setForm(f => ({
      ...f,
      plataformas: f.plataformas.includes(key)
        ? f.plataformas.filter(p => p !== key)
        : [...f.plataformas, key],
    }))
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: 16,
          width: '100%',
          maxWidth: 520,
          padding: 28,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
            {editingId ? t('timer_modal_edit_title') : t('timer_modal_new_title')}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, padding: 4 }}
          >
            ×
          </button>
        </div>

        {/* Nome */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: 8 }}>
            {t('timer_lbl_name')}
          </label>
          <input
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            placeholder="Ex: Lembrete de doação"
            style={{
              width: '100%',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 8,
              padding: '11px 14px',
              color: '#f1f5f9',
              fontSize: 14,
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {/* Mensagem */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: 8 }}>
            {t('timer_lbl_message')}
          </label>
          <textarea
            value={form.mensagem}
            onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
            placeholder="Mensagem enviada pelo bot..."
            rows={3}
            style={{
              width: '100%',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 8,
              padding: '11px 14px',
              color: '#f1f5f9',
              fontSize: 14,
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {/* Intervalo */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: 8 }}>
            {t('timer_lbl_interval')}
          </label>
          <input
            type="number"
            min={1}
            max={1440}
            value={form.intervalo_minutos}
            onChange={e => setForm(f => ({ ...f, intervalo_minutos: Math.max(1, Number(e.target.value)) }))}
            style={{
              width: '100%',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 8,
              padding: '11px 14px',
              color: '#f1f5f9',
              fontSize: 14,
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {/* Plataformas */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: 6 }}>
            {t('timer_lbl_platforms')}
          </label>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
            Escolha em quais plataformas conectadas o timer deve aparecer. Fora da live, o envio fica pausado automaticamente.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PLATS.map(p => {
              const connected = isConnected(p.key)
              const selected = form.plataformas.includes(p.key)

              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePlat(p.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: selected ? `${p.color}15` : '#1f2937',
                    border: `1px solid ${selected ? p.color : '#374151'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: selected ? p.color : '#94a3b8' }}>
                    {p.label}
                  </span>
                  {oauthUrl[p.key] && !isConnected(p.key) && (
                    <span style={{ fontSize: 11, color: '#6366f1' }}>⇄ Conectar</span>
                  )}
                  {oauthUrl[p.key] && isConnected(p.key) && (
                    <span style={{ fontSize: 11, color: selected ? p.color : '#64748b' }}>
                      {selected ? '● Ativo' : '○ Conectado'}
                    </span>
                  )}
                  {!oauthUrl[p.key] && (
                    <span style={{ fontSize: 11, color: selected ? p.color : '#64748b' }}>
                      {selected ? '● Ativo' : '○ Overlay'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>


        {/* Timer ativo */}
        <div
          style={{
            background: '#1f2937',
            borderRadius: 10,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{t('timer_active_label')}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{t('timer_active_desc')}</p>
          </div>
          <Toggle checked={form.ativo} onChange={v => setForm(f => ({ ...f, ativo: v }))} />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: '1px solid #374151',
              borderRadius: 8,
              color: '#94a3b8',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('action_cancel')}
          </button>
          <button
            onClick={onSave}
            disabled={saving || !form.nome.trim() || !form.mensagem.trim()}
            style={{
              flex: 1,
              padding: '12px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: saving || !form.nome.trim() || !form.mensagem.trim() ? 'not-allowed' : 'pointer',
              opacity: !form.nome.trim() || !form.mensagem.trim() ? 0.5 : 1,
            }}
          >
            {saving ? t('action_saving') : editingId ? t('action_save') : t('action_create')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TimersPage() {
  const { t } = useLang()
  const toast = useToast()
  const [timers, setTimers] = useState<Timer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [connections, setConnections] = useState<UserConnections>({})
  const [userId, setUserId] = useState('')
  const fetchTimers = useCallback(async () => {
    try {
      const res = await fetch('/api/timers')
      if (res.ok) setTimers(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTimers()
    fetch('/api/me')
      .then(r => r.json())
      .then((u: { id?: string }) => { if (u?.id) setUserId(u.id) })
      .catch(() => {})
    fetch('/api/tokens/status')
      .then(r => r.json())
      .then((s: { twitch?: boolean; youtube?: boolean }) => {
        setConnections({ twitch: !!s.twitch, youtube: !!s.youtube })
      })
      .catch(() => {})
  }, [fetchTimers])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(timer: Timer) {
    setEditingId(timer.id)
    setForm({
      nome: timer.nome,
      mensagem: timer.mensagem,
      intervalo_minutos: timer.intervalo_minutos,
      plataformas: timer.plataformas,
      ativo: timer.ativo,
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.mensagem.trim()) {
      toast.show('Nome e mensagem são obrigatórios', 'error')
      return
    }
    setSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/timers/${editingId}` : '/api/timers'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, min_mensagens: 0, tipo_saida: 'both' }),
      })
      if (res.ok) {
        await fetchTimers()
        setShowModal(false)
        toast.show(editingId ? 'Timer atualizado!' : 'Timer criado com sucesso!', 'success')
      } else {
        toast.show('Erro ao salvar timer', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/timers/${id}`, { method: 'DELETE' })
      setTimers(prev => prev.filter(tm => tm.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  async function handleToggle(id: string, ativo: boolean) {
    setTimers(prev => prev.map(tm => (tm.id === id ? { ...tm, ativo } : tm)))
    await fetch(`/api/timers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo }),
    })
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>⏱ {t('pt_timers')}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
            {t('timers_subtitle')}
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('timers_new_btn')}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: t('timer_total'), value: timers.length, color: '#94a3b8' },
          { label: t('timer_active_count'), value: timers.filter(tm => tm.ativo).length, color: '#4ade80' },
          { label: t('timer_inactive_count'), value: timers.filter(tm => !tm.ativo).length, color: '#f87171' },
        ].map(s => (
          <div
            key={s.label}
            style={{
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: 10,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>{s.label}</span>
          </div>
        ))}
      </div>


      {/* List */}
      {loading ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>{t('state_loading')}</p>
      ) : timers.length === 0 ? (
        <div
          style={{
            background: '#111827',
            border: '1px dashed #1f2937',
            borderRadius: 12,
            padding: 48,
            textAlign: 'center',
            color: '#475569',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏱</div>
          <p style={{ margin: 0, fontSize: 15 }}>{t('timer_no_timers')}</p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>{t('timer_no_timers_desc')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {timers.map(tm => (
            <div
              key={tm.id}
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 16,
                alignItems: 'center',
                opacity: tm.ativo ? 1 : 0.55,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{tm.nome}</span>
                  <span
                    style={{
                      background: tm.ativo ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                      color: tm.ativo ? '#4ade80' : '#f87171',
                      border: `1px solid ${tm.ativo ? '#4ade80' : '#f87171'}`,
                      borderRadius: 20,
                      padding: '1px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {tm.ativo ? t('state_active') : t('state_inactive')}
                  </span>
                </div>

                <p style={{ margin: '0 0 10px', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 480 }}>
                  {tm.mensagem}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#475569' }}>🕐 {t('timer_every')} {formatInterval(tm.intervalo_minutos)}</span>

                  {/* Platform status */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {PLATS.filter(p => tm.plataformas.includes(p.key)).map(p => {
                      const st = platStatus(tm, p.key)
                      const dot = st === 'success' ? '#4ade80' : st === 'error' ? '#f87171' : '#64748b'
                      return (
                        <span
                          key={p.key}
                          title={`${p.label}: ${st === 'none' ? 'sem disparo' : st}`}
                          style={{
                            background: '#1f2937',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 11,
                            color: p.color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {p.label}
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, display: 'inline-block' }} />
                        </span>
                      )
                    })}
                  </div>

                  {tm.ultimo_disparo && (
                    <span style={{ fontSize: 11, color: '#374151' }}>
                      último: {new Date(tm.ultimo_disparo).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Toggle checked={tm.ativo} onChange={v => handleToggle(tm.id, v)} />
                <button
                  onClick={() => openEdit(tm)}
                  style={{ background: 'none', border: '1px solid #1f2937', borderRadius: 6, color: '#64748b', cursor: 'pointer', padding: '6px 10px', fontSize: 13 }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(tm.id)}
                  disabled={deleting === tm.id}
                  style={{ background: 'none', border: '1px solid #1f2937', borderRadius: 6, color: '#f87171', cursor: 'pointer', padding: '6px 10px', fontSize: 13 }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TimerModal
          editingId={editingId}
          form={form}
          setForm={setForm}
          connections={connections}
          setConnections={setConnections}
          saving={saving}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
