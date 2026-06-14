'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.45)',
  vdim: 'rgba(232,230,248,0.28)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  border: 'rgba(255,255,255,0.06)', borderP: 'rgba(155,48,255,0.2)',
  red: '#ef4444', green: '#22c55e', yellow: '#f59e0b',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${S.border}`,
  borderRadius: '8px', color: S.text, fontSize: '0.875rem',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

const lbl: React.CSSProperties = {
  fontSize: '0.73rem', fontWeight: 600,
  color: 'rgba(232,230,248,0.5)',
  marginBottom: '0.3rem', display: 'block',
  textTransform: 'uppercase', letterSpacing: '0.4px',
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: on ? S.green : 'rgba(255,255,255,0.12)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
    </button>
  )
}

type LoyaltyConfig = {
  enabled: boolean; currency_name: string
  points_per_follow: number; points_per_sub: number; points_per_giftsub: number
  points_per_bits_100: number; points_per_message: number
}

type Reward = { id: string; name: string; description: string; cost: number; enabled: boolean }
type Redemption = { id: string; viewer_login: string; status: 'pending' | 'approved' | 'rejected'; created_at: string; loyalty_rewards: { name: string; cost: number } | null }
type LeaderEntry = { viewer_login: string; points: number }

const DEFAULT_CFG: LoyaltyConfig = {
  enabled: true, currency_name: 'pontos',
  points_per_follow: 50, points_per_sub: 500, points_per_giftsub: 200,
  points_per_bits_100: 100, points_per_message: 1,
}

export default function FidelidadePage() {
  const router = useRouter()
  const [cfg, setCfg] = useState<LoyaltyConfig>(DEFAULT_CFG)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [togglingEnabled, setTogglingEnabled] = useState(false)
  const [tab, setTab] = useState<'config' | 'recompensas' | 'resgates' | 'ranking'>('config')

  const [newReward, setNewReward] = useState({ name: '', description: '', cost: '' })
  const [addingReward, setAddingReward] = useState(false)
  const [editingReward, setEditingReward] = useState<{ id: string; name: string; description: string; cost: string } | null>(null)
  const [savingReward, setSavingReward] = useState(false)

  const [totalViewers, setTotalViewers] = useState(0)
  const [totalPending, setTotalPending] = useState(0)

  const loadAll = useCallback(async () => {
    const [cfgRes, rwRes, rdRes, lbRes] = await Promise.all([
      fetch('/api/loyalty/config').then(r => r.ok ? r.json() : null),
      fetch('/api/loyalty/rewards').then(r => r.ok ? r.json() : []),
      fetch('/api/loyalty/redemptions').then(r => r.ok ? r.json() : []),
      fetch('/api/loyalty/leaderboard?limit=10').then(r => r.ok ? r.json() : []),
    ])
    if (cfgRes) setCfg(cfgRes)
    setRewards(rwRes ?? [])
    const rds: Redemption[] = rdRes ?? []
    setRedemptions(rds)
    setTotalPending(rds.filter(r => r.status === 'pending').length)
    const lb: LeaderEntry[] = lbRes ?? []
    setLeaderboard(lb)
    setTotalViewers(lb.length)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const saveCfg = async () => {
    setSaving(true)
    await fetch('/api/loyalty/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) }).finally(() => setSaving(false))
  }

  const handleToggleEnabled = async () => {
    const next = !cfg.enabled
    setTogglingEnabled(true)
    setCfg(c => ({ ...c, enabled: next }))
    await fetch('/api/loyalty/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...cfg, enabled: next }) }).finally(() => setTogglingEnabled(false))
  }

  const addReward = async () => {
    if (!newReward.name.trim() || !newReward.cost) return
    setAddingReward(true)
    await fetch('/api/loyalty/rewards', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newReward.name, description: newReward.description, cost: Number(newReward.cost) }),
    }).finally(() => setAddingReward(false))
    setNewReward({ name: '', description: '', cost: '' })
    await loadAll()
  }

  const toggleReward = async (id: string, enabled: boolean) => {
    await fetch('/api/loyalty/rewards', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, enabled }) })
    setRewards(rs => rs.map(r => r.id === id ? { ...r, enabled } : r))
  }

  const deleteReward = async (id: string) => {
    if (!confirm('Remover esta recompensa?')) return
    await fetch(`/api/loyalty/rewards?id=${id}`, { method: 'DELETE' })
    setRewards(rs => rs.filter(r => r.id !== id))
  }

  const saveRewardEdit = async () => {
    if (!editingReward) return
    setSavingReward(true)
    await fetch('/api/loyalty/rewards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingReward.id, name: editingReward.name, description: editingReward.description, cost: Number(editingReward.cost) }),
    }).finally(() => setSavingReward(false))
    setRewards(rs => rs.map(r => r.id === editingReward.id ? { ...r, name: editingReward.name, description: editingReward.description, cost: Number(editingReward.cost) } : r))
    setEditingReward(null)
  }

  const handleRedemption = async (id: string, status: 'approved' | 'rejected') => {
    await fetch('/api/loyalty/redemptions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    setRedemptions(rs => rs.map(r => r.id === id ? { ...r, status } : r))
    setTotalPending(p => p - 1)
  }

  const topPoints = leaderboard[0]?.points ?? 0

  if (loading) return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontSize: '0.9rem' }}>Carregando...</div>
  )

  return (
    <div style={{ background: S.bg, minHeight: '100vh', padding: '2rem 3rem', maxWidth: '1440px', margin: '0 auto', color: S.text, fontFamily: "-apple-system,'Inter',system-ui,sans-serif" }}>
      <style>{`
        input:focus, textarea:focus, select:focus { outline: none; border-color: rgba(155,48,255,0.5) !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(155,48,255,0.2); border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
          <button onClick={() => router.back()}
            style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`, borderRadius: '8px', color: S.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
            title="Voltar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: S.text }}>Sistema de Fidelidade</h1>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: '99px', border: '1px solid rgba(59,130,246,0.25)', letterSpacing: '0.3px' }}>NOVO</span>
          <button onClick={handleToggleEnabled} disabled={togglingEnabled}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.3rem 0.8rem 0.3rem 0.55rem', background: cfg.enabled ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)', border: `1px solid ${cfg.enabled ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '99px', color: cfg.enabled ? S.green : S.red, cursor: togglingEnabled ? 'wait' : 'pointer', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.2s', opacity: togglingEnabled ? 0.6 : 1, flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.enabled ? S.green : S.red, display: 'inline-block', flexShrink: 0 }} />
            {cfg.enabled ? 'Sistema ativo' : 'Sistema desativado'}
          </button>
        </div>
        <p style={{ margin: 0, color: S.muted, fontSize: '0.82rem' }}>Recompense viewers fiéis com {cfg.currency_name} ganhos por interagir com a stream</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '1rem' }}>👥</span>
            <span style={{ fontSize: '0.73rem', color: S.muted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>Viewers no ranking</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: S.primary }}>{totalViewers}</div>
        </div>

        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '1rem' }}>🏆</span>
            <span style={{ fontSize: '0.73rem', color: S.muted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>Maior pontuação</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: S.yellow }}>{topPoints.toLocaleString('pt-BR')}</div>
          {leaderboard[0] && (
            <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: S.muted, fontWeight: 600 }}>
              @{leaderboard[0].viewer_login}
            </div>
          )}
        </div>

        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '1rem' }}>🎁</span>
            <span style={{ fontSize: '0.73rem', color: S.muted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>Resgates pendentes</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: totalPending > 0 ? S.yellow : S.green }}>{totalPending}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`, borderRadius: '10px', padding: '3px', marginBottom: '1.25rem', width: 'fit-content' }}>
        {([
          { key: 'config', label: '⚙ Config' },
          { key: 'recompensas', label: `🎁 Recompensas${rewards.length ? ` (${rewards.length})` : ''}` },
          { key: 'resgates', label: `📋 Resgates${totalPending > 0 ? ` (${totalPending})` : ''}` },
          { key: 'ranking', label: '🏆 Ranking' },
        ] as { key: string; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            style={{ padding: '0.45rem 1.1rem', borderRadius: '7px', border: 'none', background: tab === t.key ? S.primaryBg : 'transparent', color: tab === t.key ? S.primary : S.muted, fontWeight: tab === t.key ? 700 : 500, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Config ── */}
      {tab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '2rem 2.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Currency name */}
              <div>
                <label style={lbl}>Nome da moeda</label>
                <input value={cfg.currency_name} onChange={e => setCfg(c => ({ ...c, currency_name: e.target.value }))} style={{ ...inp, maxWidth: '260px' }} placeholder="pontos" />
                <div style={{ marginTop: '0.3rem', fontSize: '0.73rem', color: S.dim }}>
                  Viewers usam <code style={{ color: S.primary, background: S.primaryBg, padding: '0 3px', borderRadius: '3px' }}>!pontos</code> e <code style={{ color: S.primary, background: S.primaryBg, padding: '0 3px', borderRadius: '3px' }}>!ranking</code> no chat
                </div>
              </div>

              <div style={{ height: '1px', background: S.border }} />

              {/* Points per action */}
              <div>
                <div style={{ ...lbl, marginBottom: '0.8rem' }}>Pontos por ação</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {([
                    { key: 'points_per_follow', label: 'Follow' },
                    { key: 'points_per_sub', label: 'Inscrição (sub)' },
                    { key: 'points_per_giftsub', label: 'Gift sub (por unidade)' },
                    { key: 'points_per_bits_100', label: 'A cada 100 bits' },
                    { key: 'points_per_message', label: 'Mensagem no chat' },
                  ] as { key: keyof LoyaltyConfig; label: string }[]).map(({ key, label }) => (
                    <div key={key}>
                      <label style={lbl}>{label}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="number" min="0" value={(cfg as Record<string, unknown>)[key] as number}
                          onChange={e => setCfg(c => ({ ...c, [key]: Number(e.target.value) }))}
                          style={{ ...inp, maxWidth: '120px' }}
                        />
                        <span style={{ fontSize: '0.78rem', color: S.muted }}>{cfg.currency_name || 'pontos'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.25rem' }}>
                <button onClick={saveCfg} disabled={saving}
                  style={{ padding: '0.65rem 1.5rem', background: saving ? 'rgba(255,255,255,0.05)' : S.primary, border: 'none', borderRadius: '8px', color: saving ? S.muted : '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Salvando...' : 'Salvar configurações'}
                </button>
              </div>
            </div>
          </div>

          {/* Overlay URL */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '1.5rem 2rem' }}>
            <div style={lbl}>URL do Overlay — Ranking ao vivo (OBS Browser Source)</div>
            <code style={{ fontSize: '0.78rem', color: S.muted, wordBreak: 'break-all', display: 'block', lineHeight: 1.6 }}>
              {typeof window !== 'undefined' ? `${window.location.origin}/overlay/leaderboard?uid=SEU_ID` : '/overlay/leaderboard?uid=SEU_ID'}
            </code>
            <div style={{ marginTop: '0.5rem', fontSize: '0.73rem', color: S.dim }}>
              Parâmetros: <code style={{ color: S.primary }}>limit=5</code> · <code style={{ color: S.primary }}>title=Top Viewers</code> · <code style={{ color: S.primary }}>theme=light</code>
            </div>
          </div>
        </div>
      )}

      {/* ── Recompensas ── */}
      {tab === 'recompensas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Add form */}
          <div style={{ background: S.card, border: `1px solid ${S.borderP}`, borderRadius: '14px', padding: '1.75rem 2rem' }}>
            <div style={{ ...lbl, marginBottom: '0.8rem' }}>Nova recompensa</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div>
                <label style={lbl}>Nome</label>
                <input value={newReward.name} onChange={e => setNewReward(r => ({ ...r, name: e.target.value }))} placeholder="ex: Escolher jogo" style={inp} />
              </div>
              <div>
                <label style={lbl}>Custo ({cfg.currency_name || 'pontos'})</label>
                <input type="number" min="1" value={newReward.cost} onChange={e => setNewReward(r => ({ ...r, cost: e.target.value }))} placeholder="1000" style={inp} />
              </div>
              <button onClick={addReward} disabled={addingReward || !newReward.name.trim() || !newReward.cost}
                style={{ padding: '0.6rem 1.2rem', background: S.primary, border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', opacity: (!newReward.name.trim() || !newReward.cost) ? 0.45 : 1, whiteSpace: 'nowrap' }}>
                {addingReward ? '...' : '+ Adicionar'}
              </button>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <label style={lbl}>Descrição <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, opacity: 0.7 }}>(opcional)</span></label>
              <input value={newReward.description} onChange={e => setNewReward(r => ({ ...r, description: e.target.value }))} placeholder="Descrição da recompensa..." style={inp} />
            </div>
          </div>

          {/* List */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 2rem', borderBottom: `1px solid ${S.border}` }}>
              <span style={{ fontWeight: 700, fontSize: '0.87rem', color: S.text }}>Recompensas cadastradas</span>
            </div>
            {rewards.length === 0 ? (
              <div style={{ padding: '3.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem', opacity: 0.4 }}>🎁</div>
                <div style={{ fontSize: '0.83rem', color: S.muted }}>Nenhuma recompensa criada</div>
              </div>
            ) : rewards.map((r, idx) => (
              <div key={r.id} style={{ borderBottom: idx < rewards.length - 1 ? `1px solid ${S.border}` : 'none' }}>
                {editingReward?.id === r.id ? (
                  /* Edit mode */
                  <div style={{ padding: '1rem 2rem', background: 'rgba(155,48,255,0.04)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.6rem' }}>
                      <div>
                        <label style={lbl}>Nome</label>
                        <input value={editingReward.name} onChange={e => setEditingReward(v => v && ({ ...v, name: e.target.value }))} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Custo</label>
                        <input type="number" min="1" value={editingReward.cost} onChange={e => setEditingReward(v => v && ({ ...v, cost: e.target.value }))} style={inp} />
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Descrição</label>
                      <input value={editingReward.description} onChange={e => setEditingReward(v => v && ({ ...v, description: e.target.value }))} placeholder="Opcional..." style={inp} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={saveRewardEdit} disabled={savingReward || !editingReward.name.trim() || !editingReward.cost}
                        style={{ padding: '0.45rem 1.1rem', background: S.primary, border: 'none', borderRadius: '7px', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', opacity: savingReward ? 0.6 : 1 }}>
                        {savingReward ? 'Salvando...' : '✓ Salvar'}
                      </button>
                      <button onClick={() => setEditingReward(null)}
                        style={{ padding: '0.45rem 0.85rem', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: '7px', color: S.muted, fontSize: '0.82rem', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: r.description ? '0.15rem' : 0 }}>
                        <span style={{ fontWeight: 700, color: S.text, fontSize: '0.875rem' }}>{r.name}</span>
                        <span style={{ fontSize: '0.73rem', fontWeight: 700, color: S.yellow, background: 'rgba(245,158,11,0.1)', padding: '0.1rem 0.45rem', borderRadius: '99px', border: '1px solid rgba(245,158,11,0.2)' }}>
                          {r.cost.toLocaleString('pt-BR')} {cfg.currency_name || 'pts'}
                        </span>
                      </div>
                      {r.description && <div style={{ fontSize: '0.75rem', color: S.muted }}>{r.description}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <button onClick={() => setEditingReward({ id: r.id, name: r.name, description: r.description || '', cost: String(r.cost) })}
                        style={{ padding: '0.3rem 0.65rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`, borderRadius: '6px', color: S.muted, cursor: 'pointer', fontSize: '0.78rem' }}>✏</button>
                      <Toggle on={r.enabled} onChange={v => toggleReward(r.id, v)} />
                      <button onClick={() => deleteReward(r.id)}
                        style={{ padding: '0.3rem 0.65rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', color: 'rgba(239,68,68,0.7)', cursor: 'pointer', fontSize: '0.78rem' }}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Resgates ── */}
      {tab === 'resgates' && (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 2rem', borderBottom: `1px solid ${S.border}` }}>
            <span style={{ fontWeight: 700, fontSize: '0.87rem', color: S.text }}>Pedidos de resgate</span>
          </div>
          {redemptions.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem', opacity: 0.4 }}>📋</div>
              <div style={{ fontSize: '0.83rem', color: S.muted }}>Nenhum resgate ainda</div>
            </div>
          ) : redemptions.map((rd, idx) => {
            const isPending = rd.status === 'pending'
            const statusColor = rd.status === 'approved' ? S.green : rd.status === 'rejected' ? S.red : S.yellow
            const statusLabel = rd.status === 'approved' ? 'Aprovado' : rd.status === 'rejected' ? 'Rejeitado' : 'Pendente'
            return (
              <div key={rd.id} style={{ padding: '1rem 2rem', borderBottom: idx < redemptions.length - 1 ? `1px solid ${S.border}` : 'none', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: S.text, fontSize: '0.875rem' }}>@{rd.viewer_login}</span>
                    {rd.loyalty_rewards && (
                      <>
                        <span style={{ color: S.vdim, fontSize: '0.78rem' }}>→</span>
                        <span style={{ fontSize: '0.82rem', color: S.muted }}>{rd.loyalty_rewards.name}</span>
                        <span style={{ fontSize: '0.73rem', fontWeight: 700, color: S.yellow, background: 'rgba(245,158,11,0.1)', padding: '0.1rem 0.4rem', borderRadius: '99px', border: '1px solid rgba(245,158,11,0.2)' }}>
                          {rd.loyalty_rewards.cost.toLocaleString('pt-BR')} pts
                        </span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: S.dim }}>
                    {new Date(rd.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    {' · '}
                    <span style={{ color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
                  </div>
                </div>
                {isPending && (
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => handleRedemption(rd.id, 'approved')}
                      style={{ padding: '0.35rem 0.85rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '6px', color: S.green, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                      ✓ Aprovar
                    </button>
                    <button onClick={() => handleRedemption(rd.id, 'rejected')}
                      style={{ padding: '0.35rem 0.85rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: S.red, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                      ✕ Rejeitar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Ranking ── */}
      {tab === 'ranking' && (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 2rem', borderBottom: `1px solid ${S.border}` }}>
            <span style={{ fontWeight: 700, fontSize: '0.87rem', color: S.text }}>Top 10 viewers mais fiéis</span>
          </div>
          {leaderboard.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem', opacity: 0.4 }}>🏆</div>
              <div style={{ fontSize: '0.83rem', color: S.muted }}>Nenhum viewer com pontos ainda</div>
            </div>
          ) : leaderboard.map((entry, idx) => {
            const medals = ['🥇', '🥈', '🥉']
            const bar = topPoints > 0 ? (entry.points / topPoints) * 100 : 0
            return (
              <div key={entry.viewer_login} style={{ padding: '1rem 2rem', borderBottom: idx < leaderboard.length - 1 ? `1px solid ${S.border}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: idx < 3 ? '1rem' : '0.73rem', width: '24px', textAlign: 'center', flexShrink: 0, color: idx >= 3 ? S.dim : undefined, fontWeight: 700 }}>
                    {idx < 3 ? medals[idx] : `#${idx + 1}`}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600, color: S.text, fontSize: '0.875rem' }}>{entry.viewer_login}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: S.yellow }}>
                    {entry.points.toLocaleString('pt-BR')}
                    <span style={{ fontSize: '0.73rem', fontWeight: 500, color: S.dim, marginLeft: '0.3rem' }}>{cfg.currency_name || 'pts'}</span>
                  </span>
                </div>
                <div style={{ marginLeft: '36px', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${bar}%`, background: idx === 0 ? S.yellow : idx === 1 ? 'rgba(168,168,255,0.7)' : idx === 2 ? 'rgba(180,130,80,0.7)' : S.primary, borderRadius: '99px', opacity: idx === 0 ? 1 : 0.5 + 0.05 * (10 - idx) }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
