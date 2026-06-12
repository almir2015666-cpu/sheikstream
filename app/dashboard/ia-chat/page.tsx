'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { notify } from '@/app/lib/notify'

type IaChatCfg = {
  enabled: boolean
  personality: string
  bot_name: string
  response_chance: number
  max_delay: number
  response_size: string
  language: string
  cooldown_user: number
  mention_user: boolean
  ignore_commands: boolean
  reply_to_streamer: boolean
  lurk_mode: boolean
  react_emotes: boolean
  memory: boolean
  words_to_ignore: string
  whitelist: string
  blacklist: string
  channel_context: string
  allowed_topics: string
  forbidden_topics: string
  generated_prompt: string
}

const DEFAULT_CFG: IaChatCfg = {
  enabled: false,
  personality: '',
  bot_name: '',
  response_chance: 40,
  max_delay: 5,
  response_size: 'medium',
  language: 'pt-BR',
  cooldown_user: 30,
  mention_user: true,
  ignore_commands: true,
  reply_to_streamer: false,
  lurk_mode: false,
  react_emotes: true,
  memory: true,
  words_to_ignore: '',
  whitelist: '',
  blacklist: '',
  channel_context: '',
  allowed_topics: '',
  forbidden_topics: '',
  generated_prompt: '',
}

const RESPONSE_SIZES = [
  { id: 'short',  label: 'Curta (1 linha)' },
  { id: 'medium', label: 'Média (2-4 linhas)' },
  { id: 'long',   label: 'Longa (5+ linhas)' },
]

const LANGUAGES = [
  { id: 'pt-BR', label: 'Português (BR)' },
  { id: 'en-US', label: 'English (US)' },
  { id: 'es',    label: 'Español' },
]

const CSS = `
* { box-sizing: border-box; }
.iac-inp { width: 100%; padding: .6rem .9rem; background: rgba(0,0,0,.3); border: 1.5px solid rgba(255,255,255,.08); border-radius: 9px; color: #e8e6f8; font-size: .875rem; outline: none; font-family: inherit; transition: border-color .18s; }
.iac-inp:focus { border-color: rgba(155,48,255,.5); }
.iac-inp::placeholder { color: rgba(232,230,248,.2); }
.iac-ta { width: 100%; padding: .65rem .9rem; background: rgba(0,0,0,.3); border: 1.5px solid rgba(255,255,255,.08); border-radius: 9px; color: #e8e6f8; font-size: .875rem; outline: none; font-family: inherit; resize: vertical; line-height: 1.65; transition: border-color .18s; }
.iac-ta:focus { border-color: rgba(155,48,255,.5); }
.iac-ta::placeholder { color: rgba(232,230,248,.2); }
.iac-sel { width: 100%; padding: .6rem .9rem; background: rgba(0,0,0,.3); border: 1.5px solid rgba(255,255,255,.08); border-radius: 9px; color: #e8e6f8; font-size: .875rem; outline: none; font-family: inherit; cursor: pointer; }
.iac-sel:focus { border-color: rgba(155,48,255,.5); }
.iac-num { padding: .6rem .9rem; background: rgba(0,0,0,.3); border: 1.5px solid rgba(255,255,255,.08); border-radius: 9px; color: #e8e6f8; font-size: .875rem; outline: none; font-family: inherit; width: 100%; }
.iac-num:focus { border-color: rgba(155,48,255,.5); }
.iac-section { background: #0d0f18; border: 1px solid rgba(255,255,255,.07); border-radius: 14px; overflow: hidden; margin-bottom: 1rem; }
.iac-section-hd { display: flex; align-items: center; gap: .55rem; padding: .85rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,.06); }
.iac-section-body { padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: .9rem; }
.iac-label { font-size: .8rem; font-weight: 600; color: rgba(232,230,248,.7); margin-bottom: .32rem; display: block; }
.iac-hint { font-size: .72rem; color: rgba(232,230,248,.3); margin-top: .3rem; }
.iac-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .6rem 0; border-bottom: 1px solid rgba(255,255,255,.04); }
.iac-toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
.iac-toggle-row:first-child { padding-top: 0; }
@keyframes iac-spin { to { transform: rotate(360deg) } }
.iac-spin { animation: iac-spin .75s linear infinite; }
@keyframes iac-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(57,255,20,.4)} 70%{box-shadow:0 0 0 8px rgba(57,255,20,0)} }
.iac-live { animation: iac-pulse 2s ease-in-out infinite; }
`

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} style={{
      width: 46, height: 26, borderRadius: 13, background: on ? '#9b30ff' : 'rgba(255,255,255,.12)',
      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0,
    }}>
      <span style={{ position: 'absolute', top: 4, left: on ? 24 : 4, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .18s', display: 'block', boxShadow: '0 1px 4px rgba(0,0,0,.4)' }} />
    </button>
  )
}

function SectionHead({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="iac-section-hd">
      <span style={{ color: 'rgba(155,48,255,.8)', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: '.72rem', fontWeight: 800, color: 'rgba(232,230,248,.45)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</span>
    </div>
  )
}

function buildPrompt(cfg: IaChatCfg): string {
  const lines: string[] = []

  const name = cfg.bot_name.trim() || 'Assistente'
  lines.push(`Você é ${name}, um assistente de chat ao vivo para streamers.`)
  lines.push('')

  if (cfg.personality.trim()) {
    lines.push('=== PERSONALIDADE ===')
    lines.push(cfg.personality.trim())
    lines.push('')
  }

  if (cfg.channel_context.trim()) {
    lines.push('=== CONTEXTO DO CANAL ===')
    lines.push(cfg.channel_context.trim())
    lines.push('')
  }

  lines.push('=== COMPORTAMENTO ===')
  const sizeLbl = cfg.response_size === 'short' ? '1 linha' : cfg.response_size === 'medium' ? '2-4 linhas' : '5+ linhas'
  lines.push(`- Mantenha respostas com ${sizeLbl}`)
  lines.push(`- Responda em ${LANGUAGES.find(l => l.id === cfg.language)?.label ?? 'Português (BR)'}`)
  if (cfg.mention_user) lines.push('- Mencione o usuário com @nome quando responder')
  if (cfg.react_emotes) lines.push('- Use emotes e reações quando apropriado para o contexto')
  if (cfg.memory) lines.push('- Considere o histórico da conversa para contextualizar suas respostas')
  if (cfg.lurk_mode) lines.push('- Você está em modo silencioso: responda SOMENTE quando for diretamente mencionado pelo nome')
  if (!cfg.reply_to_streamer) lines.push('- Não responda mensagens do próprio dono do canal')
  if (cfg.ignore_commands) lines.push('- Ignore mensagens que começam com !, / ou ? (são comandos de outros bots)')
  lines.push('')

  if (cfg.allowed_topics.trim()) {
    lines.push('=== TÓPICOS PERMITIDOS ===')
    lines.push(cfg.allowed_topics.trim())
    lines.push('')
  }

  if (cfg.forbidden_topics.trim()) {
    lines.push('=== TÓPICOS PROIBIDOS ===')
    lines.push(`Nunca aborde: ${cfg.forbidden_topics.trim()}`)
    lines.push('')
  }

  if (cfg.words_to_ignore.trim()) {
    lines.push('=== PALAVRAS A IGNORAR ===')
    lines.push(`Ignore mensagens contendo: ${cfg.words_to_ignore.trim()}`)
    lines.push('')
  }

  lines.push('=== REGRAS GERAIS ===')
  lines.push('- Seja natural, animado e autêntico')
  lines.push('- Nunca invente informações')
  lines.push('- Não responda conteúdo ofensivo, preconceituoso ou spam')
  lines.push('- Adapte o tom ao contexto da conversa')

  return lines.join('\n')
}

export default function IaChatPage() {
  const [cfg, setCfg] = useState<IaChatCfg>(DEFAULT_CFG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [uid, setUid] = useState('')
  const [noAccess, setNoAccess] = useState(false)
  const lastSaved = useRef('')
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(u => {
      if (!u?.id) { setLoading(false); return }
      setUid(u.id)
      Promise.all([
        fetch('/api/ia-chat/access').then(r => r.ok ? r.json() : { canAccess: true }),
        fetch(`/api/overlay-config/ia-chat?uid=${u.id}`).then(r => r.ok ? r.json() : null),
      ]).then(([access, d]) => {
        if (!access.canAccess) { setNoAccess(true); setLoading(false); return }
        if (d?.cfg) { const m = { ...DEFAULT_CFG, ...d.cfg }; setCfg(m); lastSaved.current = JSON.stringify(m) }
        setLoading(false)
      }).catch(() => setLoading(false))
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
      if (!r.ok) { notify('Erro ao salvar', 'error'); setSaving(false); return }
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

  const P = '#9b30ff', DIM = 'rgba(232,230,248,.28)', MUT = 'rgba(232,230,248,.55)', TXT = '#e8e6f8'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: DIM, fontSize: '.9rem', gap: '.55rem' }}>
      <svg className="iac-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
      Carregando...
    </div>
  )

  if (noAccess) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '65vh', padding: '2rem', textAlign: 'center', fontFamily: "-apple-system,'Inter',system-ui,sans-serif" }}>
      <div style={{ fontSize: '2.8rem', marginBottom: '1rem', lineHeight: 1 }}>🔒</div>
      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'rgba(239,68,68,.9)', marginBottom: '.55rem' }}>Sem acesso a IA de Chat</div>
      <div style={{ fontSize: '.82rem', color: 'rgba(232,230,248,.4)', lineHeight: 1.7, maxWidth: 380 }}>
        Seu grupo atual não tem permissão para usar esta funcionalidade. Entre em contato com o administrador.
      </div>
    </div>
  )

  const generatedPrompt = buildPrompt(cfg)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1.25rem 3rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: TXT }}>
      <style>{CSS}</style>

      {/* Page header + save */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>IA de Chat</h1>
          <p style={{ margin: '.2rem 0 0', fontSize: '.76rem', color: DIM }}>Configure o bot que responde automaticamente no chat</p>
        </div>
        <button onClick={() => save(cfg)} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.5rem 1.1rem', borderRadius: 9, background: savedOk ? 'rgba(34,197,94,.15)' : saving ? 'rgba(155,48,255,.07)' : 'rgba(155,48,255,.18)', border: `1px solid ${savedOk ? 'rgba(34,197,94,.4)' : 'rgba(155,48,255,.4)'}`, color: savedOk ? '#22c55e' : P, cursor: saving ? 'default' : 'pointer', fontSize: '.82rem', fontWeight: 700 }}>
          {saving ? <svg className="iac-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
            : savedOk ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>}
          {saving ? 'Salvando...' : savedOk ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      {/* Enable card */}
      <div className="iac-section" style={{ border: `1px solid ${cfg.enabled ? 'rgba(57,255,20,.25)' : 'rgba(255,255,255,.07)'}` }}>
        <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.enabled ? '#22c55e' : P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.9rem', color: cfg.enabled ? '#22c55e' : TXT }}>IA de chat {cfg.enabled ? 'ativa' : 'inativa'}</div>
              <div style={{ fontSize: '.73rem', color: DIM }}>Liga ou desliga a IA para responder no chat da live</div>
            </div>
          </div>
          <Toggle on={cfg.enabled} onChange={v => up('enabled', v)} />
        </div>
      </div>

      {/* PERSONALIDADE */}
      <div className="iac-section">
        <SectionHead
          label="Personalidade"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>}
        />
        <div className="iac-section-body">
          <div>
            <label className="iac-label">Personalidade da IA</label>
            <textarea className="iac-ta" rows={4}
              value={cfg.personality}
              onChange={e => up('personality', e.target.value)}
              placeholder="Ex: Você é uma IA irritada, sarcástica e impaciente. Responde com ironia mas sempre entrega a informação. Nunca é grosseira a ponto de ofender, mas definitivamente é difícil de agradar..." />
            <div className="iac-hint">Descreva livremente o jeito que a IA deve se comportar, falar e reagir.</div>
          </div>
          <div>
            <label className="iac-label">Nome/apelido da IA</label>
            <input className="iac-inp" type="text" value={cfg.bot_name} onChange={e => up('bot_name', e.target.value)} placeholder="Ex: BotZeiro, AstroBot, Lurk..." />
          </div>
        </div>
      </div>

      {/* COMPORTAMENTO */}
      <div className="iac-section">
        <SectionHead
          label="Comportamento"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>}
        />
        <div className="iac-section-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <div>
              <label className="iac-label">Chance de responder (%)</label>
              <input className="iac-num" type="number" min={1} max={100}
                value={cfg.response_chance} onChange={e => up('response_chance', Math.min(100, Math.max(1, Number(e.target.value))))} />
              <div className="iac-hint">% de mensagens que recebem resposta</div>
            </div>
            <div>
              <label className="iac-label">Delay máximo (segundos)</label>
              <input className="iac-num" type="number" min={0} max={60}
                value={cfg.max_delay} onChange={e => up('max_delay', Math.max(0, Number(e.target.value)))} />
              <div className="iac-hint">Tempo antes de responder</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <div>
              <label className="iac-label">Tamanho das respostas</label>
              <select className="iac-sel" value={cfg.response_size} onChange={e => up('response_size', e.target.value)}>
                {RESPONSE_SIZES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="iac-label">Idioma principal</label>
              <select className="iac-sel" value={cfg.language} onChange={e => up('language', e.target.value)}>
                {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="iac-label">Cooldown por usuário (segundos)</label>
            <input className="iac-num" type="number" min={0} max={3600}
              value={cfg.cooldown_user} onChange={e => up('cooldown_user', Math.max(0, Number(e.target.value)))} />
            <div className="iac-hint">Tempo mínimo entre respostas para o mesmo usuário</div>
          </div>
        </div>
      </div>

      {/* FUNCIONALIDADES */}
      <div className="iac-section">
        <SectionHead
          label="Funcionalidades"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>}
        />
        <div style={{ padding: '0 1.25rem 1.1rem' }}>
          {[
            { key: 'mention_user'      as const, label: 'Mencionar o usuário',      desc: 'Inclui o @nome de quem a IA está respondendo' },
            { key: 'ignore_commands'   as const, label: 'Ignorar comandos (!, /, ?)', desc: 'Não responde a mensagens que parecem comandos de bot' },
            { key: 'reply_to_streamer' as const, label: 'Responder ao streamer',    desc: 'Permite que a IA responda o próprio dono do canal' },
            { key: 'lurk_mode'         as const, label: 'Responder só quando chamado pelo nome', desc: 'Ignora todas as mensagens e só responde quando alguém mencionar o nome/apelido da IA', badge: false },
            { key: 'react_emotes'      as const, label: 'Reagir a emotes',          desc: 'Inclui emotes e reações nas respostas quando adequado' },
            { key: 'memory'            as const, label: 'Memória de conversa',       desc: 'Lembra das últimas mensagens para contextualizar respostas' },
          ].map(item => (
            <div key={item.key} className="iac-toggle-row">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <span style={{ fontSize: '.86rem', fontWeight: 600, color: TXT }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ fontSize: '.58rem', fontWeight: 800, padding: '.08rem .4rem', background: 'rgba(155,48,255,.15)', color: P, borderRadius: 999, border: '1px solid rgba(155,48,255,.3)', letterSpacing: '.03em' }}>novo</span>
                  )}
                </div>
                <div style={{ fontSize: '.72rem', color: DIM, marginTop: '.12rem' }}>{item.desc}</div>
              </div>
              <Toggle on={cfg[item.key] as boolean} onChange={v => up(item.key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* FILTROS E LIMITES */}
      <div className="iac-section">
        <SectionHead
          label="Filtros e Limites"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2V12.46z"/></svg>}
        />
        <div className="iac-section-body">
          <div>
            <label className="iac-label">Palavras/temas a ignorar</label>
            <input className="iac-inp" type="text" value={cfg.words_to_ignore} onChange={e => up('words_to_ignore', e.target.value)} placeholder="Ex: spam, propaganda, link, discord..." />
            <div className="iac-hint">Separadas por vírgula — mensagens com essas palavras são puladas</div>
          </div>
          <div>
            <label className="iac-label">Usuários na whitelist (sempre responde)</label>
            <input className="iac-inp" type="text" value={cfg.whitelist} onChange={e => up('whitelist', e.target.value)} placeholder="Ex: mod1, amigo123, fã_vip..." />
          </div>
          <div>
            <label className="iac-label">Usuários na blacklist (nunca responde)</label>
            <input className="iac-inp" type="text" value={cfg.blacklist} onChange={e => up('blacklist', e.target.value)} placeholder="Ex: troll99, spam_bot..." />
          </div>
        </div>
      </div>

      {/* CONTEXTO DA LIVE */}
      <div className="iac-section">
        <SectionHead
          label="Contexto da Live"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>}
        />
        <div className="iac-section-body">
          <div>
            <label className="iac-label">Sobre o canal / streamer</label>
            <textarea className="iac-ta" rows={3}
              value={cfg.channel_context}
              onChange={e => up('channel_context', e.target.value)}
              placeholder="Ex: Canal de um dev que transmite programação ao vivo. Foco em JavaScript e games indie. Comunidade jovem e descontraída." />
            <div className="iac-hint">A IA usa isso para adaptar as respostas ao contexto da live</div>
          </div>
          <div>
            <label className="iac-label">Tópicos que a IA pode abordar</label>
            <textarea className="iac-ta" rows={3}
              value={cfg.allowed_topics}
              onChange={e => up('allowed_topics', e.target.value)}
              placeholder="Ex: tecnologia, games, piadas, memes, perguntas sobre o streamer, hype na live..." />
          </div>
          <div>
            <label className="iac-label">Tópicos proibidos</label>
            <input className="iac-inp" type="text" value={cfg.forbidden_topics} onChange={e => up('forbidden_topics', e.target.value)} placeholder="Ex: política, religião, concorrentes, dados pessoais..." />
          </div>
        </div>
      </div>

      {/* Generate + Save */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        <button type="button" onClick={() => setShowPrompt(p => !p)}
          style={{ width: '100%', padding: '.75rem', background: 'rgba(155,48,255,.08)', border: '1px solid rgba(155,48,255,.25)', borderRadius: 11, color: MUT, cursor: 'pointer', fontSize: '.86rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', transition: 'all .15s', fontFamily: 'inherit' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          {showPrompt ? 'Ocultar prompt do sistema' : 'Gerar prompt do sistema'}
        </button>

        {showPrompt && (
          <div style={{ background: '#0d0f18', border: '1px solid rgba(155,48,255,.2)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '.65rem 1rem', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '.72rem', fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '.08em' }}>Prompt gerado</span>
              <button onClick={() => { navigator.clipboard.writeText(generatedPrompt).catch(() => {}); notify('Prompt copiado!', 'success') }}
                style={{ padding: '.25rem .65rem', background: 'rgba(155,48,255,.1)', border: '1px solid rgba(155,48,255,.25)', borderRadius: 6, color: P, cursor: 'pointer', fontSize: '.7rem', fontWeight: 700, fontFamily: 'inherit' }}>
                Copiar
              </button>
            </div>
            <pre style={{ margin: 0, padding: '1rem', fontSize: '.78rem', color: MUT, lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{generatedPrompt}</pre>
          </div>
        )}

        <button onClick={() => save(cfg)} disabled={saving}
          style={{ width: '100%', padding: '.75rem', background: savedOk ? 'rgba(34,197,94,.12)' : saving ? 'rgba(155,48,255,.07)' : 'rgba(155,48,255,.18)', border: `1px solid ${savedOk ? 'rgba(34,197,94,.35)' : 'rgba(155,48,255,.4)'}`, borderRadius: 11, color: savedOk ? '#22c55e' : P, cursor: saving ? 'default' : 'pointer', fontSize: '.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', fontFamily: 'inherit' }}>
          {saving
            ? <><svg className="iac-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg> Salvando...</>
            : savedOk
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Configuração salva!</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Salvar configuração</>
          }
        </button>
      </div>
    </div>
  )
}
