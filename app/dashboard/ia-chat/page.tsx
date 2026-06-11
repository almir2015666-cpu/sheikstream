'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { notify } from '@/app/lib/notify'

const DEFAULT_PROMPT = `Você é um assistente de chat ao vivo para streamers. Responda de forma animada, concisa e divertida.
- Máximo 2 frases por resposta
- Use linguagem casual e amigável
- Não responda perguntas ofensivas ou inapropriadas
- Quando não souber algo, diga honestamente
- Adapte o tom ao contexto da conversa`

type IaChatCfg = {
  enabled: boolean
  system_prompt: string
  response_chance: number
  cooldown_seconds: number
  platforms: string[]
  trigger_keywords: string
  max_length: number
  model: string
  ignore_bots: boolean
}

const DEFAULT_CFG: IaChatCfg = {
  enabled: false,
  system_prompt: DEFAULT_PROMPT,
  response_chance: 15,
  cooldown_seconds: 30,
  platforms: ['Twitch'],
  trigger_keywords: '',
  max_length: 200,
  model: 'haiku',
  ignore_bots: true,
}

const PLATS = [
  { id: 'Twitch',  color: '#9146FF', icon: <svg width="13" height="13" viewBox="0 0 24 28" fill="currentColor"><path d="M2.149 0L0 5.573V23.33h5.996V28l4.998-4.67H14.8L24 14.497V0H2.149zm19.851 13.63l-3.996 3.734h-4.998L9.008 21.1v-3.736H4.01V2.8h18v10.83zm-3.996-6.994H16v6.23h2.004v-6.23zm-5.998 0H10v6.23h2.006v-6.23z"/></svg> },
  { id: 'Kick',    color: '#53FC18', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M2 2h4v8l6-8h5l-7 9 7 11h-5l-6-9v9H2z"/></svg> },
  { id: 'YouTube', color: '#FF4040', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg> },
]

const MODELS = [
  { id: 'haiku',  label: 'Haiku 4.5',  desc: 'Rápido e econômico — recomendado para chat',   color: '#22c55e' },
  { id: 'sonnet', label: 'Sonnet 4.6', desc: 'Mais inteligente, respostas mais elaboradas',    color: '#3b82f6' },
]

const CSS = `
* { box-sizing: border-box; }
.ia-ta { background: rgba(0,0,0,.25); border: 1.5px solid rgba(255,255,255,.08); border-radius: 10px; color: #e8e6f8; font-size: .875rem; padding: .75rem 1rem; resize: vertical; font-family: inherit; outline: none; line-height: 1.65; width: 100%; transition: border-color .18s; }
.ia-ta:focus { border-color: rgba(155,48,255,.5); }
.ia-ta::placeholder { color: rgba(232,230,248,.2); }
.ia-range { width: 100%; accent-color: #9b30ff; cursor: pointer; }
.ia-plat { display: flex; align-items: center; gap: .55rem; padding: .55rem .85rem; border-radius: 9px; cursor: pointer; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.02); transition: all .15s; font-family: inherit; }
.ia-plat.on { border-color: var(--pc); background: color-mix(in srgb, var(--pc) 12%, transparent); }
.ia-plat:hover:not(.on) { border-color: rgba(255,255,255,.18); background: rgba(255,255,255,.04); }
@keyframes ia-spin { to { transform: rotate(360deg) } }
.ia-spin { animation: ia-spin .75s linear infinite; }
@keyframes ia-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(57,255,20,.45)} 70%{box-shadow:0 0 0 7px rgba(57,255,20,0)} }
.ia-live { animation: ia-pulse 1.8s ease-in-out infinite; }
`

export default function IaChatPage() {
  const [cfg, setCfg] = useState<IaChatCfg>(DEFAULT_CFG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [uid, setUid] = useState('')
  const lastSaved = useRef('')
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(u => {
      if (!u?.id) { setLoading(false); return }
      setUid(u.id)
      fetch(`/api/overlay-config/ia-chat?uid=${u.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.cfg) { const merged = { ...DEFAULT_CFG, ...d.cfg }; setCfg(merged); lastSaved.current = JSON.stringify(merged) }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }).catch(() => setLoading(false))
  }, [])

  const save = useCallback(async (data: IaChatCfg) => {
    if (!uid) return
    setSaving(true)
    try {
      const r = await fetch('/api/overlay-config/ia-chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cfg: data }),
      })
      if (!r.ok) { notify('Erro ao salvar configuração', 'error'); return }
      lastSaved.current = JSON.stringify(data)
      setSavedOk(true); notify('Configuração salva!', 'success')
      setTimeout(() => setSavedOk(false), 2500)
    } catch { notify('Erro de conexão', 'error') }
    setSaving(false)
  }, [uid])

  const up = useCallback(<K extends keyof IaChatCfg>(k: K, v: IaChatCfg[K]) => {
    setCfg(p => {
      const next = { ...p, [k]: v }
      if (autoTimer.current) clearTimeout(autoTimer.current)
      autoTimer.current = setTimeout(() => {
        if (JSON.stringify(next) !== lastSaved.current) save(next)
      }, 2000)
      return next
    })
  }, [save])

  const togglePlat = (id: string) => {
    const next = cfg.platforms.includes(id)
      ? cfg.platforms.filter(p => p !== id)
      : [...cfg.platforms, id]
    if (next.length) up('platforms', next)
  }

  const P = '#9b30ff', BD = 'rgba(255,255,255,.07)', DIM = 'rgba(232,230,248,.28)', MUT = 'rgba(232,230,248,.55)', TXT = '#e8e6f8'
  const GR = '#22c55e', CARD = '#0d0f18'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: DIM, fontSize: '.9rem', gap: '.6rem' }}>
      <svg className="ia-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
      Carregando...
    </div>
  )

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1.25rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: TXT }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '.55rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>
            IA de Chat
          </h1>
          <p style={{ margin: '.25rem 0 0', fontSize: '.78rem', color: DIM }}>Bot com IA que responde automaticamente no chat da live</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          {cfg.enabled && (
            <div className="ia-live" style={{ display: 'flex', alignItems: 'center', gap: '.35rem', padding: '.3rem .7rem', borderRadius: 999, background: 'rgba(57,255,20,.1)', border: '1px solid rgba(57,255,20,.3)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: GR, display: 'inline-block' }} />
              <span style={{ fontSize: '.7rem', fontWeight: 700, color: GR }}>ATIVO</span>
            </div>
          )}
          <button
            onClick={() => save(cfg)} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.5rem 1.1rem', borderRadius: 9, background: savedOk ? 'rgba(34,197,94,.15)' : saving ? 'rgba(155,48,255,.08)' : 'rgba(155,48,255,.18)', border: `1px solid ${savedOk ? 'rgba(34,197,94,.4)' : 'rgba(155,48,255,.4)'}`, color: savedOk ? GR : P, cursor: saving ? 'default' : 'pointer', fontSize: '.82rem', fontWeight: 700, transition: 'all .15s' }}>
            {saving
              ? <svg className="ia-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
              : savedOk
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            }
            {saving ? 'Salvando...' : savedOk ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Enable toggle */}
        <div style={{ background: CARD, border: `1px solid ${cfg.enabled ? 'rgba(57,255,20,.3)' : BD}`, borderRadius: 14, padding: '1.1rem 1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.92rem', marginBottom: '.2rem' }}>Bot IA no chat</div>
            <div style={{ fontSize: '.76rem', color: DIM }}>Quando ativado, o bot responde mensagens do chat automaticamente usando IA</div>
          </div>
          <button type="button" onClick={() => up('enabled', !cfg.enabled)} style={{
            width: 48, height: 26, borderRadius: 13, background: cfg.enabled ? GR : 'rgba(255,255,255,.12)',
            border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0,
          }}>
            <span style={{ position: 'absolute', top: 4, left: cfg.enabled ? 26 : 4, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .18s', display: 'block' }} />
          </button>
        </div>

        {/* Platforms */}
        <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 14, padding: '1.1rem 1.3rem' }}>
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.75rem' }}>Plataformas</div>
          <div style={{ display: 'flex', gap: '.55rem', flexWrap: 'wrap' }}>
            {PLATS.map(pl => (
              <button key={pl.id} type="button" onClick={() => togglePlat(pl.id)}
                className={`ia-plat${cfg.platforms.includes(pl.id) ? ' on' : ''}`}
                style={{ '--pc': pl.color } as React.CSSProperties}>
                <span style={{ color: cfg.platforms.includes(pl.id) ? pl.color : DIM }}>{pl.icon}</span>
                <span style={{ fontSize: '.82rem', fontWeight: cfg.platforms.includes(pl.id) ? 700 : 400, color: cfg.platforms.includes(pl.id) ? pl.color : MUT }}>{pl.id}</span>
                {cfg.platforms.includes(pl.id) && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={pl.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 14, padding: '1.1rem 1.3rem' }}>
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.75rem' }}>Modelo de IA</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.55rem' }}>
            {MODELS.map(m => {
              const sel = cfg.model === m.id
              return (
                <button key={m.id} type="button" onClick={() => up('model', m.id)}
                  style={{ padding: '.75rem 1rem', background: sel ? `${m.color}12` : 'transparent', border: `1px solid ${sel ? m.color + '50' : 'rgba(255,255,255,.08)'}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all .15s', fontFamily: 'inherit' }}>
                  <div style={{ fontSize: '.84rem', fontWeight: 700, color: sel ? m.color : TXT, marginBottom: '.18rem' }}>{m.label}</div>
                  <div style={{ fontSize: '.72rem', color: DIM, lineHeight: 1.4 }}>{m.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* System prompt */}
        <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 14, padding: '1.1rem 1.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.65rem' }}>
            <div style={{ fontWeight: 700, fontSize: '.88rem' }}>Prompt do sistema</div>
            <button type="button" onClick={() => up('system_prompt', DEFAULT_PROMPT)}
              style={{ fontSize: '.7rem', color: DIM, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              ↺ Restaurar padrão
            </button>
          </div>
          <textarea
            className="ia-ta"
            rows={7}
            value={cfg.system_prompt}
            onChange={e => up('system_prompt', e.target.value)}
            placeholder="Instruções para o bot..."
          />
          <div style={{ fontSize: '.68rem', color: DIM, marginTop: '.4rem', lineHeight: 1.5 }}>
            Defina a personalidade, estilo de resposta e restrições do bot. Use linguagem clara e direta.
          </div>
        </div>

        {/* Response chance + cooldown */}
        <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 14, padding: '1.1rem 1.3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.35rem' }}>
              <span style={{ fontSize: '.82rem', fontWeight: 700 }}>Chance de responder</span>
              <span style={{ fontSize: '.82rem', fontWeight: 800, color: P }}>{cfg.response_chance}%</span>
            </div>
            <input type="range" className="ia-range" min={1} max={100} value={cfg.response_chance}
              onChange={e => up('response_chance', Number(e.target.value))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.2rem' }}>
              <span style={{ fontSize: '.65rem', color: DIM }}>1% — raramente</span>
              <span style={{ fontSize: '.65rem', color: DIM }}>100% — sempre</span>
            </div>
            <div style={{ marginTop: '.45rem', padding: '.45rem .7rem', background: 'rgba(155,48,255,.07)', border: '1px solid rgba(155,48,255,.18)', borderRadius: 7, fontSize: '.72rem', color: MUT }}>
              {cfg.response_chance <= 10
                ? 'Recomendado para chats movimentados — responde 1 em ~' + Math.round(100 / cfg.response_chance) + ' mensagens'
                : cfg.response_chance <= 30
                  ? 'Moderado — o bot participa sem dominar o chat'
                  : cfg.response_chance <= 60
                    ? 'Ativo — o bot responde com frequência'
                    : 'Alta frequência — pode parecer spam em chats movimentados'}
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.35rem' }}>
              <span style={{ fontSize: '.82rem', fontWeight: 700 }}>Cooldown entre respostas</span>
              <span style={{ fontSize: '.82rem', fontWeight: 800, color: P }}>{cfg.cooldown_seconds}s</span>
            </div>
            <input type="range" className="ia-range" min={5} max={300} step={5} value={cfg.cooldown_seconds}
              onChange={e => up('cooldown_seconds', Number(e.target.value))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.2rem' }}>
              <span style={{ fontSize: '.65rem', color: DIM }}>5s</span>
              <span style={{ fontSize: '.65rem', color: DIM }}>5 min</span>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.35rem' }}>
              <span style={{ fontSize: '.82rem', fontWeight: 700 }}>Comprimento máximo da resposta</span>
              <span style={{ fontSize: '.82rem', fontWeight: 800, color: P }}>{cfg.max_length} chars</span>
            </div>
            <input type="range" className="ia-range" min={50} max={500} step={10} value={cfg.max_length}
              onChange={e => up('max_length', Number(e.target.value))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.2rem' }}>
              <span style={{ fontSize: '.65rem', color: DIM }}>50</span>
              <span style={{ fontSize: '.65rem', color: DIM }}>500</span>
            </div>
          </div>
        </div>

        {/* Trigger keywords */}
        <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 14, padding: '1.1rem 1.3rem' }}>
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.25rem' }}>Palavras-gatilho (opcional)</div>
          <div style={{ fontSize: '.73rem', color: DIM, marginBottom: '.65rem' }}>
            O bot responde <strong style={{ color: MUT }}>apenas</strong> quando a mensagem contiver uma dessas palavras. Deixe vazio para responder qualquer mensagem.
          </div>
          <input
            value={cfg.trigger_keywords}
            onChange={e => up('trigger_keywords', e.target.value)}
            placeholder="Ex: !ia, @bot, ajuda, pergunta"
            style={{ width: '100%', padding: '.6rem .9rem', background: '#08090d', border: `1px solid ${BD}`, borderRadius: 8, color: TXT, fontSize: '.875rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: '.68rem', color: DIM, marginTop: '.35rem' }}>Separe com vírgula. Ex: <code style={{ color: MUT }}>!ia, bot, ajuda</code></div>
        </div>

        {/* Options */}
        <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 14, padding: '1.1rem 1.3rem' }}>
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.75rem' }}>Opções</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.65rem 0', borderBottom: `1px solid ${BD}` }}>
            <div>
              <div style={{ fontSize: '.84rem', fontWeight: 600 }}>Ignorar outros bots</div>
              <div style={{ fontSize: '.72rem', color: DIM }}>Não responde mensagens de contas bot (Nightbot, Streamlabs etc.)</div>
            </div>
            <button type="button" onClick={() => up('ignore_bots', !cfg.ignore_bots)} style={{
              width: 44, height: 24, borderRadius: 12, background: cfg.ignore_bots ? GR : 'rgba(255,255,255,.12)',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .18s', flexShrink: 0,
            }}>
              <span style={{ position: 'absolute', top: 3, left: cfg.ignore_bots ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .16s', display: 'block' }} />
            </button>
          </div>
        </div>

        {/* Info box */}
        <div style={{ background: 'rgba(155,48,255,.06)', border: '1px solid rgba(155,48,255,.18)', borderRadius: 12, padding: '1rem 1.2rem', fontSize: '.78rem', color: MUT, lineHeight: 1.6 }}>
          <strong style={{ color: TXT }}>Como funciona:</strong> Quando ativado, o bot monitora o chat da live em tempo real.
          A cada mensagem recebida, há uma chance de {cfg.response_chance}% de o bot gerar uma resposta com IA.
          O cooldown de {cfg.cooldown_seconds}s garante que o bot não responda com muita frequência.
          {cfg.trigger_keywords && <> Respostas ocorrem apenas quando a mensagem contém: <code style={{ color: P }}>{cfg.trigger_keywords}</code>.</>}
        </div>

        {/* Save footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '.5rem', paddingBottom: '2rem' }}>
          <button
            onClick={() => save(cfg)} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1.5rem', borderRadius: 10, background: savedOk ? 'rgba(34,197,94,.15)' : saving ? 'rgba(155,48,255,.08)' : 'rgba(155,48,255,.2)', border: `1px solid ${savedOk ? 'rgba(34,197,94,.4)' : 'rgba(155,48,255,.45)'}`, color: savedOk ? GR : P, cursor: saving ? 'default' : 'pointer', fontSize: '.88rem', fontWeight: 700 }}>
            {saving
              ? <svg className="ia-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
              : savedOk
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            }
            {saving ? 'Salvando...' : savedOk ? '✓ Configuração salva!' : 'Salvar configuração'}
          </button>
        </div>
      </div>
    </div>
  )
}
