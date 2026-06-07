'use client'
import { useEffect, useState, useRef, useCallback } from 'react'

const C = {
  bg: '#08090d', card: '#0f1120', cardB: 'rgba(255,255,255,0.06)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.55)', dim: 'rgba(232,230,248,0.3)',
  vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)', primaryB: 'rgba(155,48,255,0.3)',
  accent: '#39ff14', blue: '#3b82f6', blueBg: 'rgba(59,130,246,0.15)', blueB: 'rgba(59,130,246,0.4)',
}

const inputCss: React.CSSProperties = { width: '100%', padding: '0.65rem 0.9rem', background: '#0b0d1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: C.text, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }
const labelCss: React.CSSProperties = { fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.55rem', display: 'block' }

type SubState = {
  broadcaster_id: string; title: string
  end_time: string | null; paused_remaining: number | null
  seconds_per_sub: number; seconds_per_bits100: number
  is_active: boolean; is_paused: boolean
}

type Rule = {
  id: string; label: string; seconds: number; color: string
}

const RULE_OPTIONS = [
  { id: 'twitch_sub', label: 'Twitch Sub', color: '#9b30ff', defaultSecs: 120 },
  { id: 'twitch_bits', label: 'Bits por 100', color: '#fbbf24', defaultSecs: 30 },
  { id: 'livepix', label: 'Livepix (R$1)', color: '#39ff14', defaultSecs: 60 },
]

function fmtTimer(secs: number) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function fmtHMS(h: number, m: number, s: number) {
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function NumBox({ val, min, max, label, onChange }: { val: number; min: number; max: number; label: string; onChange: (v: number) => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ background: '#0b0d1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.55rem 0.4rem', minWidth: 68, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <input type="number" value={val} min={min} max={max}
          onChange={e => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
          style={{ width: 52, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: '1.65rem', fontWeight: 700, textAlign: 'center', WebkitAppearance: 'none', MozAppearance: 'textfield' } as React.CSSProperties}
        />
      </div>
      <div style={{ fontSize: '0.62rem', color: C.dim, marginTop: '0.28rem', textTransform: 'lowercase' }}>{label}</div>
    </div>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={() => onChange(!on)} style={{ width: 36, height: 20, background: on ? C.blue : 'rgba(255,255,255,0.1)', borderRadius: 10, position: 'relative', flexShrink: 0, transition: 'background 0.18s', cursor: 'pointer' }}>
        <div style={{ position: 'absolute', top: 2, left: on ? 17 : 2, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.18s' }} />
      </div>
      <span style={{ fontSize: '0.82rem', color: C.muted }}>{label}</span>
    </label>
  )
}

export default function SubathonPage() {
  const [state, setState] = useState<SubState | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Create form
  const [name, setName] = useState('')
  const [hours, setHours] = useState(1)
  const [mins, setMins] = useState(0)
  const [secs, setSecs] = useState(0)
  const [rules, setRules] = useState<Rule[]>([])
  const [showTags, setShowTags] = useState(true)
  const [addingRule, setAddingRule] = useState(false)
  const [newRuleId, setNewRuleId] = useState('twitch_sub')
  const [newRuleSecs, setNewRuleSecs] = useState(120)

  // Active management
  const [addTime, setAddTime] = useState('60')
  const [copied, setCopied] = useState(false)
  const [events, setEvents] = useState<{ type: string; ts: string }[]>([])
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/subathon')
    const data = await res.json()
    setState(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!state?.is_active) return
    const iv = setInterval(load, 8000)
    return () => clearInterval(iv)
  }, [state?.is_active, load])

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    if (!state?.is_active) { setRemaining(0); return }
    if (state.is_paused) { setRemaining(state.paused_remaining ?? 0); return }
    if (!state.end_time) { setRemaining(0); return }
    const calc = () => setRemaining(Math.max(0, Math.floor((new Date(state.end_time!).getTime() - Date.now()) / 1000)))
    calc()
    tickRef.current = setInterval(calc, 1000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [state])

  async function apiAction(body: object) {
    setSaving(true)
    const res = await fetch('/api/subathon', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setState(data)
    setSaving(false)
    const action = (body as { action?: string }).action
    if (action) setEvents(p => [{ type: action, ts: new Date().toLocaleTimeString('pt-BR') }, ...p.slice(0, 19)])
  }

  async function createSubathon() {
    if (!name.trim()) return
    const initSecs = hours * 3600 + mins * 60 + secs
    const subRule = rules.find(r => r.id === 'twitch_sub')
    const bitsRule = rules.find(r => r.id === 'twitch_bits')
    await apiAction({ title: name, seconds_per_sub: subRule?.seconds ?? 60, seconds_per_bits100: bitsRule?.seconds ?? 30 })
    await apiAction({ action: 'start', initial_seconds: initSecs || 3600 })
  }

  function addRule() {
    const opt = RULE_OPTIONS.find(o => o.id === newRuleId)!
    setRules(prev => [...prev.filter(r => r.id !== newRuleId), { id: newRuleId, label: opt.label, seconds: newRuleSecs, color: opt.color }])
    setAddingRule(false)
  }

  function copyOverlay() {
    const url = `${window.location.origin}/overlay/subathon?uid=${state?.broadcaster_id}`
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }

  const totalSecs = hours * 3600 + mins * 60 + secs
  const overlayUrl = state ? `/overlay/subathon?uid=${state.broadcaster_id}` : '/overlay/subathon?uid=...'
  const warningColor = remaining < 300 ? '#ff4444' : remaining < 1800 ? '#ffaa00' : C.accent

  if (loading) return <div style={{ background: C.bg, minHeight: '100vh' }} />

  /* ─── ACTIVE VIEW ────────────────────────────────────────────────────────────── */
  if (state?.is_active) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{state.title || 'Subathon'}</h2>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.12rem 0.5rem', background: 'rgba(57,255,20,0.12)', color: '#39ff14', borderRadius: '999px', border: '1px solid rgba(57,255,20,0.25)' }}>AO VIVO</span>
          </div>
          <button onClick={copyOverlay} style={{ padding: '0.45rem 1rem', background: copied ? 'rgba(57,255,20,0.12)' : C.primaryBg, border: `1px solid ${copied ? 'rgba(57,255,20,0.3)' : C.primaryB}`, color: copied ? C.accent : C.primary, borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
            {copied ? '✓ Copiado' : 'URL OBS'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Big timer */}
          <div style={{ background: C.card, border: `1px solid ${warningColor}44`, borderRadius: '14px', padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
              {state.is_paused ? 'PAUSADO' : 'RODANDO'}
            </div>
            <div style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '-2px', color: warningColor, lineHeight: 1, textShadow: `0 0 30px ${warningColor}44`, transition: 'color 0.3s' }}>
              {fmtTimer(remaining)}
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: C.dim }}>
              +{state.seconds_per_sub}s por sub · +{state.seconds_per_bits100}s por 100 bits
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              {!state.is_paused && (
                <button onClick={() => apiAction({ action: 'pause' })} disabled={saving} style={{ padding: '0.55rem 1.2rem', background: 'rgba(255,170,0,0.1)', color: '#ffaa00', border: '1px solid rgba(255,170,0,0.25)', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>⏸ Pausar</button>
              )}
              {state.is_paused && (
                <button onClick={() => apiAction({ action: 'resume' })} disabled={saving} style={{ padding: '0.55rem 1.2rem', background: 'rgba(57,255,20,0.1)', color: C.accent, border: '1px solid rgba(57,255,20,0.25)', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>▶ Retomar</button>
              )}
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input value={addTime} onChange={e => setAddTime(e.target.value)} style={{ width: 90, ...inputCss, padding: '0.5rem 0.7rem', fontSize: '0.82rem' }} placeholder="seg" />
                <button onClick={() => apiAction({ action: 'add_time', seconds: Number(addTime) })} disabled={saving} style={{ padding: '0.55rem 1.1rem', background: C.primaryBg, color: C.primary, border: `1px solid ${C.primaryB}`, borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>+ Tempo</button>
              </div>
              <button onClick={() => { if (confirm('Encerrar o subathon?')) apiAction({ action: 'stop' }) }} disabled={saving} style={{ padding: '0.55rem 1.2rem', background: 'rgba(255,68,68,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,68,68,0.25)', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>■ Encerrar</button>
            </div>
          </div>

          {/* Recent events */}
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.2rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Ações recentes</div>
            {events.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: C.vdim, textAlign: 'center', padding: '1.5rem 0' }}>Nenhuma ação</div>
            ) : events.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span style={{ color: C.text }}>{e.type}</span>
                <span style={{ color: C.vdim, fontSize: '0.7rem' }}>{e.ts}</span>
              </div>
            ))}
          </div>

          {/* URL */}
          <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', padding: '1.2rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>URL do Overlay OBS</div>
            <div style={{ background: '#08090d', border: `1px solid ${C.cardB}`, borderRadius: 8, padding: '0.6rem 0.85rem' }}>
              <code style={{ fontSize: '0.72rem', color: '#818cf8', wordBreak: 'break-all' }}>{typeof window !== 'undefined' ? window.location.origin : 'https://sheikstream.com.br'}{overlayUrl}</code>
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: C.dim }}>Tamanho recomendado: 600×220px</p>
          </div>
        </div>
      </div>
    )
  }

  /* ─── CREATE VIEW ────────────────────────────────────────────────────────────── */
  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}`}</style>

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Novo Subathon</h2>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.12rem 0.5rem', background: 'rgba(59,130,246,0.18)', color: '#60a5fa', borderRadius: '999px', border: '1px solid rgba(59,130,246,0.3)' }}>NOVO</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(340px,1fr)', gap: '1.5rem', alignItems: 'start' }}>

        {/* ─ Left: Form ──────────────────────────────────────────────────────────── */}
        <div>
          {/* Name */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelCss}>Nome do Subathon</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Subathon de Aniversário" style={inputCss} />
          </div>

          {/* H : M : S */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelCss}>Tempo Inicial</label>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
              <NumBox val={hours} min={0} max={99} label="horas" onChange={setHours} />
              <span style={{ color: C.dim, fontSize: '1.8rem', fontWeight: 200, marginTop: '0.35rem', lineHeight: 1 }}>:</span>
              <NumBox val={mins} min={0} max={59} label="minutos" onChange={setMins} />
              <span style={{ color: C.dim, fontSize: '1.8rem', fontWeight: 200, marginTop: '0.35rem', lineHeight: 1 }}>:</span>
              <NumBox val={secs} min={0} max={59} label="segundos" onChange={setSecs} />
            </div>
            <div style={{ marginTop: '0.45rem', fontSize: '0.73rem', color: C.dim }}>Total: {fmtHMS(hours, mins, secs)}</div>
          </div>

          {/* Rules */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <label style={{ ...labelCss, marginBottom: 0 }}>Regras de Contribuição</label>
              <button onClick={() => { setAddingRule(true); const opt = RULE_OPTIONS.find(o => !rules.find(r => r.id === o.id)); if (opt) { setNewRuleId(opt.id); setNewRuleSecs(opt.defaultSecs) } }} style={{ padding: '0.32rem 0.75rem', background: C.primaryBg, border: `1px solid ${C.primaryB}`, color: C.primary, borderRadius: '7px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                + Adicionar
              </button>
            </div>

            {rules.length === 0 && !addingRule && (
              <div style={{ background: '#0b0d1a', border: `1px solid ${C.cardB}`, borderRadius: '10px', padding: '1.2rem', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: C.vdim }}>Nenhuma regra. Adicione plataformas que contarão para o subathon.</p>
              </div>
            )}

            {rules.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#0b0d1a', border: `1px solid ${C.cardB}`, borderRadius: '10px', padding: '0.65rem 0.85rem', marginBottom: '0.4rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.85rem', color: C.text, fontWeight: 500 }}>{r.label}</span>
                <span style={{ fontSize: '0.82rem', color: r.color, fontWeight: 700 }}>+{r.seconds >= 60 ? `${Math.round(r.seconds/60)}m` : `${r.seconds}s`}</span>
                <button onClick={() => setRules(prev => prev.filter(x => x.id !== r.id))} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 2px' }}>×</button>
              </div>
            ))}

            {addingRule && (
              <div style={{ background: '#0b0d1a', border: `1px solid ${C.primaryB}`, borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <select value={newRuleId} onChange={e => { setNewRuleId(e.target.value); const opt = RULE_OPTIONS.find(o => o.id === e.target.value); if (opt) setNewRuleSecs(opt.defaultSecs) }}
                  style={{ ...inputCss, padding: '0.5rem 0.75rem', fontSize: '0.83rem' }}>
                  {RULE_OPTIONS.filter(o => !rules.find(r => r.id === o.id)).map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="number" value={newRuleSecs} min={1} max={3600} onChange={e => setNewRuleSecs(Number(e.target.value))} style={{ ...inputCss, width: 100, padding: '0.5rem 0.7rem', fontSize: '0.83rem' }} />
                  <span style={{ fontSize: '0.78rem', color: C.dim }}>segundos por evento</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={addRule} style={{ flex: 1, padding: '0.5rem', background: C.primaryBg, border: `1px solid ${C.primaryB}`, color: C.primary, borderRadius: '7px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Adicionar</button>
                  <button onClick={() => setAddingRule(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: `1px solid ${C.cardB}`, color: C.dim, borderRadius: '7px', fontSize: '0.8rem', cursor: 'pointer' }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={createSubathon} disabled={saving || !name.trim() || totalSecs === 0}
              style={{ flex: 1, padding: '0.85rem', background: C.blue, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: (saving || !name.trim() || totalSecs === 0) ? 'not-allowed' : 'pointer', opacity: (saving || !name.trim() || totalSecs === 0) ? 0.5 : 1, transition: 'opacity 0.15s' }}>
              {saving ? 'Criando...' : 'Criar Subathon'}
            </button>
            <button onClick={() => { setName(''); setHours(1); setMins(0); setSecs(0); setRules([]) }}
              style={{ padding: '0.85rem 1.4rem', background: 'transparent', color: C.dim, border: `1px solid ${C.cardB}`, borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>

        {/* ─ Right: Preview + URL ───────────────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <label style={{ ...labelCss, marginBottom: 0 }}>Preview do Overlay</label>
            <Toggle on={showTags} onChange={setShowTags} label="Exibir tags de regra" />
          </div>

          {/* Preview panel */}
          <div style={{ background: '#0d0f1e', border: '1px solid rgba(155,48,255,0.22)', borderRadius: '14px', padding: '2rem 1.5rem', textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.primary, marginBottom: '0.75rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {name || 'Nome do Subathon'}
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-2px', color: C.primary, lineHeight: 1, marginBottom: '0.75rem', textShadow: `0 0 30px ${C.primary}55` }}>
              {fmtHMS(hours, mins, secs)}
            </div>
            <div style={{ fontSize: '0.72rem', color: C.dim, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <span>⏱</span> Tempo inicial configurado
            </div>
            {showTags && rules.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
                {rules.map(r => (
                  <span key={r.id} style={{ padding: '3px 10px', background: `${r.color}20`, color: r.color, border: `1px solid ${r.color}50`, borderRadius: 99, fontSize: '0.72rem', fontWeight: 700 }}>
                    +{r.seconds >= 60 ? `${Math.round(r.seconds/60)}m` : `${r.seconds}s`} {r.label.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
            {showTags && rules.length === 0 && (
              <div style={{ fontSize: '0.72rem', color: C.vdim }}>As tags de regra aparecerão aqui</div>
            )}
          </div>

          {/* URL */}
          <div style={{ background: '#0b0d1a', border: `1px solid ${C.cardB}`, borderRadius: '10px', padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: '0.67rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>URL do Overlay OBS</div>
            <code style={{ fontSize: '0.73rem', color: '#818cf8', wordBreak: 'break-all' }}>
              {overlayUrl}
              {rules.length === 0 && ' · {id após criar}'}
            </code>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.68rem', color: C.dim }}>Tamanho recomendado: 600×220px</p>
          </div>
        </div>
      </div>
    </div>
  )
}
