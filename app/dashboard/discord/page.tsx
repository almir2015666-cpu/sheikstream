'use client'
import { useEffect, useState } from 'react'

const S = {
  bg: '#08090d', card: '#0f1018', cardB: 'rgba(255,255,255,0.06)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.55)', dim: 'rgba(232,230,248,0.28)',
  primary: '#5865F2', primaryBg: 'rgba(88,101,242,0.12)', primaryB: 'rgba(88,101,242,0.4)',
  green: '#22c55e', greenBg: 'rgba(34,197,94,0.1)', greenB: 'rgba(34,197,94,0.3)',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.1)', redB: 'rgba(239,68,68,0.3)',
  border: 'rgba(255,255,255,0.07)',
}

const COLORS = [
  { label: 'Roxo',   value: 0x9b30ff, hex: '#9b30ff' },
  { label: 'Azul',   value: 0x3b82f6, hex: '#3b82f6' },
  { label: 'Verde',  value: 0x22c55e, hex: '#22c55e' },
  { label: 'Rosa',   value: 0xec4899, hex: '#ec4899' },
  { label: 'Vermelho', value: 0xef4444, hex: '#ef4444' },
  { label: 'Discord', value: 0x5865F2, hex: '#5865F2' },
]

export default function DiscordPage() {
  const [url,       setUrl]       = useState('')
  const [msgTitle,  setMsgTitle]  = useState('🔴 Estou AO VIVO!')
  const [msgBody,   setMsgBody]   = useState('Bora assistir a live! 👾')
  const [color,     setColor]     = useState(0x9b30ff)
  const [twitchUrl, setTwitchUrl] = useState('')
  const [autoLive,  setAutoLive]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [testing,   setTesting]   = useState(false)
  const [testOk,    setTestOk]    = useState<boolean | null>(null)
  const [testErr,   setTestErr]   = useState('')
  const [sending,   setSending]   = useState(false)
  const [sendOk,    setSendOk]    = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/discord/webhook')
      .then(r => r.ok ? r.json() : {})
      .then((d: Record<string, unknown>) => {
        if (d.url)       setUrl(d.url as string)
        if (d.msgTitle)  setMsgTitle(d.msgTitle as string)
        if (d.msgBody)   setMsgBody(d.msgBody as string)
        if (d.color)     setColor(d.color as number)
        if (d.twitchUrl) setTwitchUrl(d.twitchUrl as string)
        if (d.autoLive)  setAutoLive(d.autoLive as boolean)
      })
      .catch(() => {})
  }, [])

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/discord/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, msgTitle, msgBody, color, twitchUrl, autoLive }),
      })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  async function test() {
    setTesting(true); setTestOk(null); setTestErr('')
    try {
      const r = await fetch('/api/discord/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTest: true, color, url }),
      })
      if (r.ok) { setTestOk(true) } else { const d = await r.json(); setTestOk(false); setTestErr(d.error ?? 'Erro') }
    } catch { setTestOk(false); setTestErr('Sem conexão') }
    finally { setTesting(false) }
  }

  async function sendLive() {
    setSending(true); setSendOk(null)
    const fields = twitchUrl ? [{ name: '📺 Canal', value: `[Assistir agora](${twitchUrl})`, inline: true }] : []
    try {
      const r = await fetch('/api/discord/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: msgTitle, message: msgBody, color, fields }),
      })
      setSendOk(r.ok)
    } catch { setSendOk(false) }
    finally { setSending(false); setTimeout(() => setSendOk(null), 3000) }
  }

  const hexColor = COLORS.find(c => c.value === color)?.hex ?? '#9b30ff'
  const inp: React.CSSProperties = { width: '100%', padding: '0.55rem 0.75rem', background: '#08090d', border: `1px solid ${S.border}`, borderRadius: 8, color: S.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const row: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.4rem' }
  const lbl: React.CSSProperties = { fontSize: '0.68rem', fontWeight: 700, color: S.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', padding: '1.75rem 2rem', fontFamily: "-apple-system,'Inter',sans-serif", color: S.text }}>
      <div style={{ maxWidth: 680 }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem' }}>
            <svg width="18" height="14" viewBox="0 0 71 55" fill={S.dim}><g clipPath="url(#c)"><path d="M60.1 4.9A58.5 58.5 0 0 0 45.6.7a40.7 40.7 0 0 0-1.8 3.7 54.1 54.1 0 0 0-16.3 0A39.7 39.7 0 0 0 25.7.7 58.4 58.4 0 0 0 11 5C1.6 18.8-1 32.3.3 45.6a58.9 58.9 0 0 0 18 9.1 42.3 42.3 0 0 0 3.7-6l-.1-.1a38.6 38.6 0 0 1-5.8-2.8l1-.7a42.2 42.2 0 0 0 36 0l1 .7a38.4 38.4 0 0 1-5.8 2.8 42.2 42.2 0 0 0 3.7 6 58.7 58.7 0 0 0 18-9C71.7 30.4 67.6 17 60.1 5ZM23.8 37.8c-3.5 0-6.4-3.2-6.4-7.2 0-3.9 2.8-7.2 6.4-7.2 3.6 0 6.5 3.3 6.4 7.2 0 4-2.8 7.2-6.4 7.2Zm23.4 0c-3.5 0-6.4-3.2-6.4-7.2 0-3.9 2.8-7.2 6.4-7.2 3.6 0 6.5 3.3 6.4 7.2 0 4-2.8 7.2-6.4 7.2Z"/></g><defs><clipPath id="c"><path fill="#fff" d="M0 0h71v55H0z"/></clipPath></defs></svg>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Discord Webhook</h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: S.muted }}>
            Envie notificações automáticas para o seu servidor Discord quando iniciar a live.
          </p>
        </div>

        {/* Webhook URL */}
        <div style={{ background: S.card, border: `1px solid ${S.cardB}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={row}>
            <span style={lbl}>URL do Webhook</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/…"
                style={{ ...inp, flex: 1 }}
              />
              <button onClick={test} disabled={!url || testing} style={{
                padding: '0.55rem 1rem', background: testOk === true ? S.greenBg : S.primaryBg,
                border: `1px solid ${testOk === true ? S.greenB : S.primaryB}`,
                color: testOk === true ? S.green : S.primary,
                borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: url ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {testing ? '…' : testOk === true ? '✓ OK' : 'Testar'}
              </button>
            </div>
            {testOk === false && <span style={{ fontSize: '0.72rem', color: S.red }}>{testErr || 'Falhou'}</span>}
            <span style={{ fontSize: '0.7rem', color: S.dim }}>
              No Discord: Configurações do servidor → Integrações → Webhooks → Novo Webhook → Copiar URL
            </span>
          </div>

          <div style={row}>
            <span style={lbl}>Link do canal Twitch (opcional)</span>
            <input value={twitchUrl} onChange={e => setTwitchUrl(e.target.value)} placeholder="https://twitch.tv/seuchannel" style={inp} />
          </div>
        </div>

        {/* Message config */}
        <div style={{ background: S.card, border: `1px solid ${S.cardB}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mensagem</div>

          <div style={row}>
            <span style={lbl}>Título</span>
            <input value={msgTitle} onChange={e => setMsgTitle(e.target.value)} style={inp} />
          </div>
          <div style={row}>
            <span style={lbl}>Descrição</span>
            <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={3}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
          </div>
          <div style={row}>
            <span style={lbl}>Cor da borda</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c.value} onClick={() => setColor(c.value)} title={c.label} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c.hex, border: color === c.value ? '2px solid #fff' : '2px solid transparent',
                  cursor: 'pointer', flexShrink: 0,
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{ background: S.card, border: `1px solid ${S.cardB}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: S.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Preview</div>
          <div style={{ borderLeft: `4px solid ${hexColor}`, background: 'rgba(255,255,255,0.03)', borderRadius: '0 6px 6px 0', padding: '0.75rem 1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: S.text, marginBottom: '0.35rem' }}>{msgTitle || 'Título…'}</div>
            <div style={{ fontSize: '0.8rem', color: S.muted, lineHeight: 1.5 }}>{msgBody || 'Descrição…'}</div>
            {twitchUrl && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#5865F2', textDecoration: 'underline', cursor: 'default' }}>
                📺 Assistir agora
              </div>
            )}
            <div style={{ marginTop: '0.6rem', fontSize: '0.65rem', color: S.dim }}>SheikStream • Dashboard</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={sendLive} disabled={!url || sending} style={{
            padding: '0.6rem 1.3rem', background: sendOk === true ? S.greenBg : sendOk === false ? S.redBg : 'rgba(255,255,255,0.05)',
            border: `1px solid ${sendOk === true ? S.greenB : sendOk === false ? S.redB : S.border}`,
            color: sendOk === true ? S.green : sendOk === false ? S.red : S.muted,
            borderRadius: 9, fontSize: '0.85rem', fontWeight: 600, cursor: url ? 'pointer' : 'not-allowed',
          }}>
            {sending ? 'Enviando…' : sendOk === true ? '✓ Enviado!' : sendOk === false ? '✗ Falhou' : '📣 Notificar agora'}
          </button>
          <button onClick={save} disabled={saving} style={{
            padding: '0.6rem 1.5rem', background: saved ? S.greenBg : S.primaryBg,
            border: `1px solid ${saved ? S.greenB : S.primaryB}`,
            color: saved ? S.green : S.primary,
            borderRadius: 9, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
          }}>
            {saving ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
