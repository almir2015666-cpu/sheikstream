'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.4)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  border: 'rgba(255,255,255,0.07)', green: '#22c55e',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem', background: '#08090d',
  border: `1px solid ${S.border}`, borderRadius: 8, color: S.text,
  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

export default function ChatConfigPage() {
  const router  = useRouter()
  const [channel, setChannel] = useState('')
  const [size,    setSize]    = useState('15')
  const [max,     setMax]     = useState('25')
  const [bg,      setBg]      = useState(true)
  const [dir,     setDir]     = useState('bottom')
  const [copied,  setCopied]  = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const overlayUrl = channel.trim()
    ? `${origin}/overlay/chat?channel=${channel.trim().toLowerCase()}&size=${size}&max=${max}&bg=${bg}&dir=${dir}`
    : ''

  const copy = () => { navigator.clipboard.writeText(overlayUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const lbl = (t: string) => (
    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: S.dim, marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t}</div>
  )
  const toggle = (val: boolean, set: (v: boolean) => void, on: string, off: string) => (
    <div style={{ display: 'flex', gap: 6 }}>
      {([true, false] as const).map(v => (
        <button key={String(v)} onClick={() => set(v)}
          style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: `1px solid ${val === v ? 'rgba(155,48,255,0.5)' : S.border}`,
            background: val === v ? S.primaryBg : 'transparent', color: val === v ? S.primary : S.muted,
            fontWeight: val === v ? 700 : 500, fontSize: '0.82rem', cursor: 'pointer' }}>
          {v ? on : off}
        </button>
      ))}
    </div>
  )

  return (
    <div style={{ padding: '28px 24px', maxWidth: 640, margin: '0 auto', fontFamily: "'Inter',system-ui,sans-serif", color: S.text }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard/overlays')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 8, color: S.muted, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </button>
        <h1 style={{ flex: 1, color: S.text, fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Chat Overlay</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>Configuração</div>

            <div style={{ marginBottom: 12 }}>
              {lbl('Canal da Twitch')}
              <input style={inp} value={channel} onChange={e => setChannel(e.target.value)} placeholder="nomeDaLive" />
            </div>
            <div style={{ marginBottom: 12 }}>
              {lbl('Tamanho da fonte (px)')}
              <input style={{ ...inp, width: 100 }} type="number" min={10} max={28} value={size} onChange={e => setSize(e.target.value)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              {lbl('Máx. mensagens visíveis')}
              <input style={{ ...inp, width: 100 }} type="number" min={5} max={50} value={max} onChange={e => setMax(e.target.value)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              {lbl('Direção das mensagens')}
              <div style={{ display: 'flex', gap: 6 }}>
                {(['bottom', 'top'] as const).map(v => (
                  <button key={v} onClick={() => setDir(v)}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: `1px solid ${dir === v ? 'rgba(155,48,255,0.5)' : S.border}`,
                      background: dir === v ? S.primaryBg : 'transparent', color: dir === v ? S.primary : S.muted,
                      fontWeight: dir === v ? 700 : 500, fontSize: '0.82rem', cursor: 'pointer' }}>
                    {v === 'bottom' ? 'De baixo pra cima' : 'De cima pra baixo'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              {lbl('Fundo nas mensagens')}
              {toggle(bg, setBg, 'Com fundo', 'Sem fundo')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: S.card, border: `1px solid rgba(155,48,255,0.2)`, borderRadius: 12, padding: 18 }}>
            {lbl('URL do overlay para OBS (Browser Source)')}
            {!channel.trim() ? (
              <div style={{ fontSize: '0.8rem', color: S.dim }}>Digite o canal para gerar a URL</div>
            ) : (
              <>
                <div style={{ background: '#08090d', border: `1px solid ${S.border}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.73rem', color: S.muted, wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 8 }}>
                  {overlayUrl}
                </div>
                <button onClick={copy}
                  style={{ width: '100%', padding: '9px 0', background: copied ? S.green : S.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s' }}>
                  {copied ? '✓ Copiado!' : 'Copiar URL'}
                </button>
              </>
            )}
            <div style={{ marginTop: 10, fontSize: '0.75rem', color: S.dim, lineHeight: 1.5 }}>
              Tamanho recomendado: <strong style={{ color: S.muted }}>400 × 600</strong> px.<br />
              Ative "fundo transparente" no Browser Source do OBS.
            </div>
          </div>

          <div style={{ background: 'rgba(60,160,255,0.06)', border: `1px solid rgba(60,160,255,0.18)`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, color: S.text, fontSize: '0.85rem', marginBottom: 8 }}>Como funciona</div>
            <ul style={{ color: S.muted, fontSize: '0.78rem', margin: 0, paddingLeft: 18, lineHeight: 2 }}>
              <li>Conecta direto ao IRC da Twitch (sem backend)</li>
              <li>Lê o chat anonimamente — sem login necessário</li>
              <li>Reconecta automaticamente se cair</li>
              <li>Cores dos usuários são preservadas do Twitch</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
