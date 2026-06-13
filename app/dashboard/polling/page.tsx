'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.4)', vdim: 'rgba(232,230,248,0.18)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)', border: 'rgba(255,255,255,0.07)',
  green: '#22c55e', red: '#ef4444',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem', background: '#08090d',
  border: `1px solid ${S.border}`, borderRadius: 8, color: S.text,
  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

type Option = { text: string; votes: number }
type Poll   = { question: string; options: Option[]; status: string; created_at: string }

export default function PollingPage() {
  const router = useRouter()
  const [uid,      setUid]     = useState('')
  const [channel,  setChannel] = useState('')
  const [poll,     setPoll]    = useState<Poll | null>(null)
  const [loading,  setLoading] = useState(true)
  const [saving,   setSaving]  = useState(false)
  const [msg,      setMsg]     = useState('')
  const [question, setQuestion] = useState('')
  const [options,  setOptions]  = useState(['', '', '', ''])
  const [copied,   setCopied]   = useState<'overlay'|'vote'|null>(null)
  const [creating, setCreating] = useState(false)
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(u => {
      if (u?.id) setUid(u.id)
      if (u?.name) setChannel(u.name.toLowerCase().replace(/\s/g, ''))
    }).catch(() => {})
  }, [])

  const loadPoll = useCallback(() =>
    fetch('/api/poll').then(r => r.ok ? r.json() : null)
      .then(d => { setPoll(d); setLoading(false) }).catch(() => setLoading(false))
  , [])

  useEffect(() => {
    loadPoll()
    ivRef.current = setInterval(loadPoll, 4000)
    return () => { if (ivRef.current) clearInterval(ivRef.current) }
  }, [loadPoll])

  async function create() {
    const validOpts = options.filter(o => o.trim())
    if (!question.trim() || validOpts.length < 2) { flash('Preencha a pergunta e ao menos 2 opções'); return }
    setSaving(true)
    const r = await fetch('/api/poll', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, options: validOpts }),
    })
    setSaving(false)
    if (r.ok) { loadPoll(); setCreating(false); setQuestion(''); setOptions(['', '', '', '']); flash('Enquete criada!') }
    else flash('Erro ao criar enquete')
  }

  async function patchPoll(body: object) {
    setSaving(true)
    await fetch('/api/poll', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    loadPoll()
  }

  async function deletePoll() {
    if (!confirm('Excluir enquete permanentemente?')) return
    setSaving(true)
    await fetch('/api/poll', { method: 'DELETE' })
    setSaving(false)
    setPoll(null)
    flash('Enquete excluída')
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const overlayUrl = uid
    ? `${origin}/overlay/poll?uid=${uid}&color=%239b30ff${channel ? `&channel=${channel}` : ''}`
    : ''
  const voteUrl = uid ? `${origin}/votar/${uid}` : ''

  const copy = (url: string, which: 'overlay'|'vote') => {
    navigator.clipboard.writeText(url); setCopied(which); setTimeout(() => setCopied(null), 2000)
  }

  const total = (poll?.options ?? []).reduce((s, o) => s + o.votes, 0)
  const lbl = (t: string) => (
    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: S.dim, marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t}</div>
  )

  if (loading) return <div style={{ padding: 40, color: S.dim }}>Carregando...</div>

  return (
    <div style={{ padding: '28px 24px', maxWidth: 720, margin: '0 auto', fontFamily: "'Inter',system-ui,sans-serif", color: S.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard/overlays')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 8, color: S.muted, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </button>
        <h1 style={{ flex: 1, color: S.text, fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Enquete ao vivo</h1>
        {msg && <span style={{ fontSize: '0.82rem', color: msg.startsWith('Erro') ? S.red : S.green, fontWeight: 600 }}>{msg}</span>}
        {!creating && (
          <button onClick={() => setCreating(true)}
            style={{ padding: '8px 20px', background: S.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
            + Nova enquete
          </button>
        )}
      </div>

      {/* Criar enquete */}
      {creating && (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 16 }}>Nova enquete</div>
          {lbl('Pergunta')}
          <input style={{ ...inp, marginBottom: 16 }} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Qual game jogar agora?" />
          {lbl('Opções (mín. 2, máx. 4)')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {options.map((o, i) => (
              <input key={i} style={inp} value={o} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n) }}
                placeholder={`Opção ${i + 1}${i < 2 ? ' *' : ' (opcional)'}`} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={create} disabled={saving}
              style={{ flex: 1, padding: '9px 0', background: S.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Criando...' : 'Criar e ativar'}
            </button>
            <button onClick={() => setCreating(false)}
              style={{ padding: '9px 18px', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 8, color: S.muted, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Enquete ativa */}
      {poll ? (
        <>
          <div style={{ background: S.card, border: `1px solid ${poll.status === 'active' ? 'rgba(34,197,94,0.3)' : S.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: poll.status === 'active' ? S.green : S.muted, display: 'inline-block', flexShrink: 0,
                animation: poll.status === 'active' ? 'pulse 2s infinite' : 'none' }} />
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: poll.status === 'active' ? S.green : S.muted }}>
                {poll.status === 'active' ? 'ATIVA' : 'ENCERRADA'}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: S.dim }}>{total} voto{total !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 18, lineHeight: 1.4 }}>{poll.question}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {poll.options.map((opt, i) => {
                const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0
                const isLeader = total > 0 && opt.votes === Math.max(...poll.options.map(o => o.votes))
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: isLeader ? 700 : 500, color: isLeader ? S.text : S.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: S.primary, background: S.primaryBg, padding: '1px 5px', borderRadius: 4 }}>!{i+1}</span>
                        {opt.text}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isLeader ? S.primary : S.dim }}>{pct}% ({opt.votes})</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: isLeader ? S.primary : `${S.primary}55`,
                        width: `${pct}%`, transition: 'width 0.6s ease', boxShadow: isLeader ? `0 0 8px ${S.primary}` : 'none' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              {poll.status === 'active' ? (
                <button onClick={() => patchPoll({ close: true })} disabled={saving}
                  style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: S.red, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                  Encerrar
                </button>
              ) : (
                <button onClick={() => patchPoll({ reset: true })} disabled={saving}
                  style={{ padding: '8px 16px', background: S.primaryBg, border: `1px solid rgba(155,48,255,0.3)`, borderRadius: 8, color: S.primary, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                  Zerar votos e reativar
                </button>
              )}
              <button onClick={deletePoll} disabled={saving}
                style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 8, color: S.dim, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                Excluir
              </button>
              {!creating && (
                <button onClick={() => setCreating(true)}
                  style={{ marginLeft: 'auto', padding: '8px 16px', background: S.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                  Substituir por nova
                </button>
              )}
            </div>
          </div>

          {/* Canal + URLs */}
          <div style={{ background: S.card, border: `1px solid rgba(155,48,255,0.2)`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ marginBottom: 14 }}>
              {lbl('Seu canal da Twitch')}
              <input
                value={channel}
                onChange={e => setChannel(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="nomeDaLive"
                style={{ ...inp }}
              />
              <div style={{ marginTop: 6, fontSize: '0.73rem', color: S.dim }}>
                Necessário para votação por chat — será incluído na URL do overlay.
              </div>
            </div>

            {lbl('URL do overlay para OBS (Browser Source)')}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ flex: 1, background: '#08090d', border: `1px solid ${S.border}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.73rem', color: S.muted, wordBreak: 'break-all' }}>
                {overlayUrl || '—'}
              </div>
              {overlayUrl && (
                <button onClick={() => copy(overlayUrl, 'overlay')}
                  style={{ padding: '8px 16px', background: copied === 'overlay' ? S.green : S.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
                  {copied === 'overlay' ? '✓' : 'Copiar'}
                </button>
              )}
            </div>

            {lbl('URL de votação pelo navegador (link alternativo)')}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, background: '#08090d', border: `1px solid ${S.border}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.73rem', color: S.muted, wordBreak: 'break-all' }}>
                {voteUrl || '—'}
              </div>
              {voteUrl && (
                <button onClick={() => copy(voteUrl, 'vote')}
                  style={{ padding: '8px 16px', background: copied === 'vote' ? S.green : 'rgba(255,255,255,0.07)', color: copied === 'vote' ? '#fff' : S.muted, border: `1px solid ${S.border}`, borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
                  {copied === 'vote' ? '✓' : 'Copiar'}
                </button>
              )}
            </div>
          </div>
        </>
      ) : !creating && (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 700, color: S.muted, marginBottom: 8 }}>Nenhuma enquete ativa</div>
          <div style={{ fontSize: '0.82rem', color: S.dim, marginBottom: 20 }}>Crie uma enquete e exiba os resultados ao vivo no OBS</div>
          <button onClick={() => setCreating(true)}
            style={{ padding: '10px 28px', background: S.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            Criar enquete
          </button>
        </div>
      )}

      {/* Como usar */}
      <div style={{ background: 'rgba(155,48,255,0.06)', border: `1px solid rgba(155,48,255,0.15)`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 700, color: S.text, fontSize: '0.9rem', marginBottom: 10 }}>Como usar</div>
        <ol style={{ color: S.muted, fontSize: '0.82rem', margin: 0, paddingLeft: 20, lineHeight: 2.1 }}>
          <li>Digite o nome do seu canal da Twitch e copie a <strong style={{ color: S.text }}>URL do overlay</strong></li>
          <li>Cole no OBS como Browser Source (400×250 px) — o overlay lê o chat sozinho enquanto o OBS estiver aberto</li>
          <li>Crie uma enquete. Viewers digitam <strong style={{ color: S.text }}>!vote 1</strong>, <strong style={{ color: S.text }}>!vote 2</strong>… no chat</li>
          <li>Cada viewer só vota uma vez (verificado pelo servidor)</li>
          <li>Encerre quando quiser — resultado trava na tela</li>
        </ol>
        <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, fontSize: '0.76rem', color: S.green }}>
          ✓ Não é necessário manter o dashboard aberto — a votação acontece dentro do OBS
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
