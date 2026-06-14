'use client'
import { useEffect, useState, useCallback } from 'react'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.45)',
  primary: '#f59e0b', primaryBg: 'rgba(245,158,11,0.12)',
  border: 'rgba(255,255,255,0.06)', borderP: 'rgba(245,158,11,0.2)',
  red: '#ef4444', green: '#22c55e', purple: '#9b30ff', yellow: '#f59e0b',
}

type LoyaltyConfig = {
  enabled: boolean
  points_per_message: number
  points_per_follow: number
  points_per_sub: number
  points_per_giftsub: number
  points_per_bits100: number
  points_per_raid: number
  currency_name: string
}

type Reward = {
  id: string
  name: string
  description: string
  cost: number
  max_redemptions: number | null
  active: boolean
}

type Redemption = {
  id: string
  viewer_login: string
  status: 'pending' | 'fulfilled' | 'rejected'
  created_at: string
  loyalty_rewards: { name: string; cost: number } | null
}

type LeaderEntry = {
  viewer_login: string
  points: number
  total_earned: number
}

export default function FidelidadePage() {
  const [cfg, setCfg] = useState<LoyaltyConfig>({
    enabled: true, points_per_message: 5, points_per_follow: 100,
    points_per_sub: 500, points_per_giftsub: 300, points_per_bits100: 100,
    points_per_raid: 200, currency_name: 'pontos',
  })
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'config' | 'recompensas' | 'resgates' | 'ranking'>('config')
  const [newReward, setNewReward] = useState({ name: '', description: '', cost: 500, max_redemptions: '' })
  const [addingReward, setAddingReward] = useState(false)
  const [showAddReward, setShowAddReward] = useState(false)

  const load = useCallback(async () => {
    const [cfgRes, rewardsRes, redRes, lbRes] = await Promise.all([
      fetch('/api/loyalty/config').then(r => r.ok ? r.json() : null),
      fetch('/api/loyalty/rewards').then(r => r.ok ? r.json() : []),
      fetch('/api/loyalty/redemptions').then(r => r.ok ? r.json() : []),
      fetch('/api/loyalty/leaderboard?limit=10').then(r => r.ok ? r.json() : []),
    ])
    if (cfgRes) setCfg(cfgRes)
    setRewards(rewardsRes ?? [])
    setRedemptions(redRes ?? [])
    setLeaderboard(lbRes ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const saveCfg = async () => {
    setSaving(true)
    await fetch('/api/loyalty/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) }).finally(() => setSaving(false))
  }

  const addReward = async () => {
    if (!newReward.name.trim() || !newReward.cost) return
    setAddingReward(true)
    await fetch('/api/loyalty/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newReward, cost: Number(newReward.cost), max_redemptions: newReward.max_redemptions ? Number(newReward.max_redemptions) : null }),
    })
    setNewReward({ name: '', description: '', cost: 500, max_redemptions: '' })
    setShowAddReward(false)
    setAddingReward(false)
    await load()
  }

  const toggleReward = async (r: Reward) => {
    await fetch('/api/loyalty/rewards', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, active: !r.active }) })
    await load()
  }

  const deleteReward = async (id: string) => {
    if (!confirm('Deletar recompensa?')) return
    await fetch(`/api/loyalty/rewards?id=${id}`, { method: 'DELETE' })
    await load()
  }

  const updateRedemption = async (id: string, status: 'fulfilled' | 'rejected') => {
    await fetch('/api/loyalty/redemptions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    await load()
  }

  const pendingRedemptions = redemptions.filter(r => r.status === 'pending')

  if (loading) return <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted }}>Carregando...</div>

  return (
    <div style={{ background: S.bg, minHeight: '100vh', padding: '1.5rem 2rem', color: S.text }}>
      <style>{`input:focus,textarea:focus{outline:none;border-color:${S.primary}!important;}`}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🏆</span>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Sistema de Fidelidade</h1>
          <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', background: 'rgba(245,158,11,0.15)', color: S.primary, borderRadius: '99px', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700 }}>NOVO</span>
        </div>
        <p style={{ margin: 0, color: S.muted, fontSize: '0.85rem' }}>Viewers ganham pontos assistindo, interagindo no chat e apoiando o canal. Use !pontos e !ranking no chat.</p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total de viewers', value: leaderboard.length, icon: '👥', color: S.purple },
          { label: 'Resgates pendentes', value: pendingRedemptions.length, icon: '⏳', color: S.yellow },
          { label: 'Recompensas ativas', value: rewards.filter(r => r.active).length, icon: '🎁', color: S.green },
          { label: 'Moeda', value: cfg.currency_name, icon: '🪙', color: S.primary },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <span>{icon}</span>
              <span style={{ fontSize: '0.75rem', color: S.muted, fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {([['config', '⚙️ Config'], ['recompensas', '🎁 Recompensas'], ['resgates', '⏳ Resgates'], ['ranking', '🏆 Ranking']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', border: `1px solid ${tab === t ? S.primary + '60' : S.border}`, background: tab === t ? S.primaryBg : 'transparent', color: tab === t ? S.primary : S.muted, fontWeight: tab === t ? 700 : 500, cursor: 'pointer', fontSize: '0.85rem' }}>
            {label}{t === 'resgates' && pendingRedemptions.length > 0 ? ` (${pendingRedemptions.length})` : ''}
          </button>
        ))}
      </div>

      {/* Config tab */}
      {tab === 'config' && (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, color: S.text }}>Sistema Ativado</div>
                <div style={{ color: S.muted, fontSize: '0.8rem' }}>Viewers ganham pontos automaticamente</div>
              </div>
              <button onClick={() => setCfg(c => ({ ...c, enabled: !c.enabled }))}
                style={{ width: '44px', height: '24px', borderRadius: '99px', background: cfg.enabled ? S.primary : 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: '2px', left: cfg.enabled ? '22px' : '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.2s', display: 'block' }} />
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: S.muted, marginBottom: '0.4rem', fontWeight: 600 }}>Nome da moeda</label>
              <input value={cfg.currency_name} onChange={e => setCfg(c => ({ ...c, currency_name: e.target.value }))}
                placeholder="pontos, moedas, coins..."
                style={{ width: '200px', padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`, borderRadius: '8px', color: S.text, fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: S.muted, fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '0.3px' }}>PONTOS POR AÇÃO</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { key: 'points_per_message', label: 'Mensagem no chat', icon: '💬' },
                  { key: 'points_per_follow', label: 'Follow', icon: '❤️' },
                  { key: 'points_per_sub', label: 'Inscrição (Sub)', icon: '⭐' },
                  { key: 'points_per_giftsub', label: 'Gift Sub (por unidade)', icon: '🎁' },
                  { key: 'points_per_bits100', label: 'Bits (por 100)', icon: '💎' },
                  { key: 'points_per_raid', label: 'Raid', icon: '⚔️' },
                ].map(({ key, label, icon }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${S.border}`, borderRadius: '8px' }}>
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', color: S.muted, marginBottom: '0.3rem' }}>{label}</div>
                      <input type="number" min="0" value={(cfg as Record<string, unknown>)[key] as number}
                        onChange={e => setCfg(c => ({ ...c, [key]: Number(e.target.value) }))}
                        style={{ width: '80px', padding: '0.35rem 0.6rem', background: 'rgba(255,255,255,0.06)', border: `1px solid ${S.border}`, borderRadius: '6px', color: S.text, fontSize: '0.9rem', fontWeight: 700 }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: S.dim, flexShrink: 0 }}>{cfg.currency_name}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={saveCfg} disabled={saving}
              style={{ padding: '0.75rem', background: saving ? 'rgba(255,255,255,0.06)' : S.primary, border: 'none', borderRadius: '10px', color: saving ? S.muted : '#000', fontWeight: 700, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Salvando...' : '✓ Salvar Configurações'}
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${S.border}`, borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: S.muted, marginBottom: '0.5rem' }}>COMANDOS DO CHAT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[['!pontos', 'Ver seus pontos'], ['!ranking', 'Ver top 5'], ['!resgatar <nome>', 'Resgatar recompensa']].map(([cmd, desc]) => (
                <div key={cmd} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <code style={{ fontSize: '0.82rem', color: S.primary, background: S.primaryBg, padding: '0.2rem 0.55rem', borderRadius: '5px' }}>{cmd}</code>
                  <span style={{ fontSize: '0.8rem', color: S.muted }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${S.border}`, borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: S.muted, marginBottom: '0.5rem' }}>URL DO OVERLAY RANKING (OBS)</div>
            <div style={{ fontSize: '0.78rem', color: S.dim, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {typeof window !== 'undefined' ? `${window.location.origin}/overlay/leaderboard?uid=SEU_ID` : '/overlay/leaderboard?uid=SEU_ID'}
            </div>
          </div>
        </div>
      )}

      {/* Recompensas tab */}
      {tab === 'recompensas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAddReward(!showAddReward)}
              style={{ padding: '0.6rem 1.25rem', background: S.primaryBg, border: `1px solid ${S.borderP}`, borderRadius: '10px', color: S.primary, fontWeight: 700, cursor: 'pointer', fontSize: '0.87rem' }}>
              + Nova Recompensa
            </button>
          </div>

          {showAddReward && (
            <div style={{ background: S.card, border: `1px solid ${S.borderP}`, borderRadius: '14px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: S.text, marginBottom: '1rem' }}>Nova Recompensa</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {[
                  { key: 'name', label: 'Nome', placeholder: 'Jogar comigo, TTS, ...' },
                  { key: 'cost', label: `Custo (${cfg.currency_name})`, placeholder: '500', type: 'number' },
                  { key: 'description', label: 'Descrição (opcional)', placeholder: 'Detalhes da recompensa' },
                  { key: 'max_redemptions', label: 'Máx. resgates (opcional)', placeholder: '∞', type: 'number' },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: S.muted, marginBottom: '0.3rem', fontWeight: 600 }}>{label}</label>
                    <input type={type ?? 'text'} placeholder={placeholder}
                      value={(newReward as Record<string, unknown>)[key] as string}
                      onChange={e => setNewReward(r => ({ ...r, [key]: e.target.value }))}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`, borderRadius: '8px', color: S.text, fontSize: '0.87rem', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={addReward} disabled={addingReward || !newReward.name.trim()}
                  style={{ padding: '0.6rem 1.5rem', background: S.primary, border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.87rem' }}>
                  {addingReward ? 'Criando...' : 'Criar'}
                </button>
                <button onClick={() => setShowAddReward(false)}
                  style={{ padding: '0.6rem 1rem', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: '8px', color: S.muted, cursor: 'pointer', fontSize: '0.87rem' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {rewards.length === 0 ? (
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: S.dim }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎁</div>
              <div>Nenhuma recompensa criada ainda. Viewers poderão usar !resgatar para trocar pontos.</div>
            </div>
          ) : (
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', overflow: 'hidden' }}>
              {rewards.map((r, idx) => (
                <div key={r.id} style={{ padding: '1rem 1.25rem', borderBottom: idx < rewards.length - 1 ? `1px solid ${S.border}` : 'none', display: 'flex', alignItems: 'center', gap: '1rem', opacity: r.active ? 1 : 0.5 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: S.text, fontSize: '0.9rem' }}>{r.name}</div>
                    {r.description && <div style={{ fontSize: '0.78rem', color: S.muted, marginTop: '0.15rem' }}>{r.description}</div>}
                    <div style={{ fontSize: '0.75rem', color: S.primary, marginTop: '0.2rem', fontWeight: 600 }}>
                      {r.cost} {cfg.currency_name}{r.max_redemptions ? ` · máx. ${r.max_redemptions}x` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button onClick={() => toggleReward(r)}
                      style={{ padding: '0.35rem 0.75rem', background: r.active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${r.active ? 'rgba(34,197,94,0.3)' : S.border}`, borderRadius: '6px', color: r.active ? S.green : S.dim, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                      {r.active ? 'Ativo' : 'Inativo'}
                    </button>
                    <button onClick={() => deleteReward(r.id)}
                      style={{ padding: '0.35rem 0.75rem', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: '6px', color: S.dim, cursor: 'pointer', fontSize: '0.78rem' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resgates tab */}
      {tab === 'resgates' && (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', overflow: 'hidden' }}>
          {redemptions.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: S.dim }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              <div>Nenhum resgate ainda. Viewers podem usar !resgatar no chat.</div>
            </div>
          ) : (
            redemptions.map((r, idx) => (
              <div key={r.id} style={{ padding: '0.85rem 1.25rem', borderBottom: idx < redemptions.length - 1 ? `1px solid ${S.border}` : 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: S.text, fontSize: '0.87rem' }}>
                    @{r.viewer_login} → {r.loyalty_rewards?.name ?? '?'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: S.muted }}>
                    {r.loyalty_rewards?.cost ?? 0} {cfg.currency_name} · {new Date(r.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '99px', fontWeight: 700, flexShrink: 0,
                  background: r.status === 'pending' ? 'rgba(245,158,11,0.15)' : r.status === 'fulfilled' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                  color: r.status === 'pending' ? S.yellow : r.status === 'fulfilled' ? S.green : S.red,
                }}>
                  {r.status === 'pending' ? 'PENDENTE' : r.status === 'fulfilled' ? 'CONCLUÍDO' : 'REJEITADO'}
                </span>
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button onClick={() => updateRedemption(r.id, 'fulfilled')}
                      style={{ padding: '0.35rem 0.75rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', color: S.green, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>✓</button>
                    <button onClick={() => updateRedemption(r.id, 'rejected')}
                      style={{ padding: '0.35rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: S.red, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>✕</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Ranking tab */}
      {tab === 'ranking' && (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${S.border}`, fontWeight: 700, color: S.text }}>Top 10 — {cfg.currency_name}</div>
          {leaderboard.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: S.dim }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
              <div>Nenhum dado ainda. Viewers começarão a acumular pontos quando interagirem.</div>
            </div>
          ) : (
            leaderboard.map((entry, idx) => (
              <div key={entry.viewer_login} style={{ padding: '0.85rem 1.25rem', borderBottom: idx < leaderboard.length - 1 ? `1px solid ${S.border}` : 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: idx < 3 ? '1.1rem' : '0.9rem', width: '28px', textAlign: 'center', flexShrink: 0 }}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: S.text, fontSize: '0.9rem' }}>@{entry.viewer_login}</div>
                  <div style={{ fontSize: '0.75rem', color: S.muted }}>Total ganho: {entry.total_earned} {cfg.currency_name}</div>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: S.primary, flexShrink: 0 }}>
                  {entry.points.toLocaleString('pt-BR')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
