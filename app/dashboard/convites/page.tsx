'use client'
import { useState, useEffect, useCallback } from 'react'
import { notify } from '@/app/lib/notify'
import { useLang } from '@/lib/i18n'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)',
  text: '#e8e6f8', dim: 'rgba(232,230,248,0.35)', vdim: 'rgba(232,230,248,0.15)',
  primary: '#3b82f6', primaryBg: 'rgba(59,130,246,0.1)', primaryB: 'rgba(59,130,246,0.3)',
  warn: '#fbbf24', warnBg: 'rgba(251,191,36,0.1)', warnB: 'rgba(251,191,36,0.3)',
  green: '#22c55e', greenBg: 'rgba(34,197,94,0.08)',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.08)',
}

const inp: React.CSSProperties = { flex: 1, padding: '0.65rem 1rem', background: '#0b0d1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: C.text, fontSize: '0.88rem', outline: 'none' }

type Invite = { id: string; inviter_id: string; invitee_email: string; token: string; status: string; created_at: string }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const cfg =
    status === 'aceito'  ? { bg: C.greenBg, color: C.green,  border: 'rgba(34,197,94,0.25)' } :
    status === 'vetado'  ? { bg: C.redBg,   color: C.red,    border: 'rgba(239,68,68,0.25)' } :
                           { bg: C.warnBg,  color: C.warn,   border: C.warnB }
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', background: cfg.bg, color: cfg.color, borderRadius: 999, border: `1px solid ${cfg.border}` }}>
      {status}
    </span>
  )
}

export default function ConvitesPage() {
  const { t } = useLang()
  const [invites, setInvites] = useState<Invite[]>([])
  const [quota, setQuota] = useState(0)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/convites').catch(() => null)
    if (res?.ok) {
      const d = await res.json()
      setInvites(d.invites ?? [])
      setQuota(d.quota ?? 0)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function sendInvite() {
    const u = username.trim().replace(/^@/, '')
    if (!u) return
    setSending(true)
    const res = await fetch('/api/convites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u }) })
    setSending(false)
    if (res.ok) {
      setUsername('')
      notify(`Convite enviado para @${u}!`, 'success')
      load()
    } else {
      const d = await res.json()
      notify(d.error || 'Erro ao enviar convite', 'error')
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/convite/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token)
      setTimeout(() => setCopied(null), 2000)
    }).catch(() => {})
  }

  const used = invites.length
  const remaining = Math.max(0, quota - used)
  const slots = Array.from({ length: Math.max(quota, used) }, (_, i) => i < used)
  const atLimit = quota <= 0 || used >= quota

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 800 }}>{t('pt_invites')}</h2>
        <p style={{ margin: 0, fontSize: '0.84rem', color: C.dim }}>{t('invites_subtitle')}</p>
      </div>

      {/* Invite card */}
      <div style={{ background: C.card, border: `1px solid rgba(59,130,246,0.2)`, borderRadius: '14px', padding: '1.4rem', marginBottom: '1.25rem', maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '1.1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: C.primaryBg, border: `1px solid ${C.primaryB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2"><rect x="3" y="8" width="18" height="13" rx="2"/><polyline points="3 8 12 14 21 8"/><path d="M3 8l9-5 9 5"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{t('invites_yours')}</div>
            {quota <= 0
              ? <div style={{ fontSize: '0.78rem', color: C.vdim }}>{t('invites_no_quota')}</div>
              : <div style={{ fontSize: '0.78rem', color: C.dim }}>Você pode convidar mais {remaining} streamer{remaining !== 1 ? 's' : ''} ({used}/{quota} usados)</div>
            }
          </div>
          {quota > 0 && (
            <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
              {slots.map((u, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: u ? C.primary : 'rgba(255,255,255,0.1)', border: u ? `1px solid ${C.primaryB}` : '1px solid rgba(255,255,255,0.12)' }} />
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendInvite() }}
            placeholder="@ usuario_twitch"
            disabled={atLimit || sending}
            style={{ ...inp, opacity: atLimit ? 0.5 : 1 }}
          />
          <button
            onClick={sendInvite}
            disabled={!username.trim() || atLimit || sending}
            style={{ padding: '0.65rem 1.2rem', background: (!username.trim() || atLimit) ? 'rgba(59,130,246,0.3)' : C.primary, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700, cursor: (!username.trim() || atLimit) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            {sending ? t('invites_sending') : t('invites_send_btn')}
          </button>
        </div>
        {atLimit && quota > 0 && (
          <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: C.warn }}>Limite de {quota} convite{quota !== 1 ? 's' : ''} atingido.</div>
        )}
      </div>

      {/* Invited list */}
      {loading ? (
        <div style={{ color: C.dim, fontSize: '0.85rem' }}>{t('state_loading')}</div>
      ) : invites.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: C.dim }}>{t('invites_none_sent')}</div>
          <div style={{ fontSize: '0.75rem', color: C.vdim, marginTop: '0.35rem' }}>Use o campo acima para convidar um streamer pelo username da Twitch</div>
        </div>
      ) : (
        <div style={{ maxWidth: 700 }}>
          <div style={{ fontSize: '0.67rem', fontWeight: 700, color: C.vdim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>{t('invites_you_invited')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {invites.map(inv => (
              <div key={inv.id} style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '10px', padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>@{inv.invitee_email}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: C.vdim }}>{fmtDate(inv.created_at)}</div>
                </div>
                {inv.status === 'pendente' && (
                  <button onClick={() => copyLink(inv.token)} style={{ padding: '0.4rem 0.85rem', background: 'transparent', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    {copied === inv.token ? '✓ Copiado!' : t('invites_copy_link')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
