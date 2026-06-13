'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.4)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  border: 'rgba(255,255,255,0.07)', green: '#22c55e',
}

const PREVIEW_MSGS = [
  { user: 'SheikFabio', color: '#9b30ff', text: 'Boa live! 🔥' },
  { user: 'viewer123',  color: '#60a5fa', text: 'qual game é esse?' },
  { user: 'fã_top',     color: '#34d399', text: 'manda ver! GGGG' },
  { user: 'madruga99',  color: '#f87171', text: '!rank' },
  { user: 'xablau',     color: '#fbbf24', text: 'PogChamp PogChamp' },
]
const BG_COLORS = ['#000000','#3b0764','#0c1445','#052e16','#1c1c1c']

function SelBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 7, fontSize: '0.8rem', cursor: 'pointer',
      fontWeight: active ? 700 : 400,
      border: `1px solid ${active ? 'rgba(155,48,255,0.5)' : S.border}`,
      background: active ? S.primaryBg : 'transparent',
      color: active ? S.primary : S.muted,
    }}>{children}</button>
  )
}

function Lbl({ children }: { children: string }) {
  return <div style={{ fontSize: '0.72rem', fontWeight: 600, color: S.dim, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{children}</div>
}

export default function ChatConfigPage() {
  const router = useRouter()
  const [channel,  setChannel]  = useState('')
  const [size,     setSize]     = useState(15)
  const [max,      setMax]      = useState(25)
  const [dir,      setDir]      = useState<'bottom'|'top'>('bottom')
  const [bgPreset, setBgPreset] = useState('dark')
  const [opacity,  setOpacity]  = useState(55)
  const [radius,   setRadius]   = useState(8)
  const [anim,     setAnim]     = useState('slide')
  const [shadow,   setShadow]   = useState(false)
  const [hidecmd,  setHidecmd]  = useState(false)
  const [bgColor,  setBgColor]  = useState('#000000')
  const [copied,   setCopied]   = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [saveMsg,  setSaveMsg]  = useState('')

  useEffect(() => {
    fetch('/api/overlay/chat')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        if (d.channel  != null) setChannel(d.channel)
        if (d.size     != null) setSize(d.size)
        if (d.max      != null) setMax(d.max)
        if (d.dir      != null) setDir(d.dir)
        if (d.bgPreset != null) setBgPreset(d.bgPreset)
        if (d.opacity  != null) setOpacity(d.opacity)
        if (d.radius   != null) setRadius(d.radius)
        if (d.anim     != null) setAnim(d.anim)
        if (d.shadow   != null) setShadow(d.shadow)
        if (d.hidecmd  != null) setHidecmd(d.hidecmd)
        if (d.bgColor  != null) setBgColor(d.bgColor)
      })
      .catch(() => {})
  }, [])

  async function save() {
    setSaving(true)
    const r = await fetch('/api/overlay/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, size, max, dir, bgPreset, opacity, radius, anim, shadow, hidecmd, bgColor }),
    })
    setSaving(false)
    setSaveMsg(r.ok ? 'Salvo!' : 'Erro ao salvar')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const bgOff = bgPreset === 'none'
  const isColored = bgPreset === 'color'

  const overlayUrl = channel.trim()
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/overlay/chat` +
      `?channel=${channel.trim().toLowerCase()}` +
      `&size=${size}&max=${max}&dir=${dir}` +
      `&bg=${bgOff ? 'false' : 'true'}` +
      `&opacity=${opacity}&radius=${radius}&anim=${anim}` +
      (shadow  ? '&shadow=true'  : '') +
      (hidecmd ? '&hidecmd=true' : '') +
      (!bgOff && isColored ? `&bgcol=${encodeURIComponent(bgColor)}` : '')
    : ''

  const copy = () => {
    navigator.clipboard.writeText(overlayUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Preview helpers
  const msgBg = (() => {
    if (bgOff) return 'transparent'
    const col = isColored ? bgColor : '#000000'
    const op  = bgPreset === 'darker' ? 80 : opacity
    return `${col}${Math.round(op * 2.55).toString(16).padStart(2, '0')}`
  })()
  const visibleMsgs = hidecmd ? PREVIEW_MSGS.filter(m => !m.text.startsWith('!')) : PREVIEW_MSGS
  const previewList = visibleMsgs

  return (
    <div style={{ padding: '28px 24px', maxWidth: 820, margin: '0 auto', fontFamily: "'Inter',system-ui,sans-serif", color: S.text }}>
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes popIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => router.push('/dashboard/overlays')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 8, color: S.muted, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </button>
        <h1 style={{ flex: 1, color: S.text, fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Chat Overlay</h1>
        {saveMsg && <span style={{ fontSize: '0.82rem', fontWeight: 600, color: saveMsg === 'Salvo!' ? S.green : '#ef4444' }}>{saveMsg}</span>}
        <button type="button" onClick={save} disabled={saving}
          style={{ padding: '8px 22px', background: 'linear-gradient(135deg,#9b30ff,#6b1fc2)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>

        {/* Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>Conexão</div>
            <Lbl>Canal da Twitch</Lbl>
            <input value={channel} onChange={e => setChannel(e.target.value)} placeholder="nomeDaLive"
              style={{ width: '100%', padding: '0.6rem 0.9rem', background: '#08090d', border: `1px solid ${S.border}`, borderRadius: 8, color: S.text, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>

          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>Layout</div>

            <div style={{ marginBottom: 12 }}>
              <Lbl>Tamanho da fonte</Lbl>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="range" min={10} max={26} value={size} onChange={e => setSize(Number(e.target.value))} style={{ flex: 1, accentColor: S.primary }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: S.text, width: 32 }}>{size}px</span>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Lbl>Máx. mensagens visíveis</Lbl>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="range" min={5} max={50} value={max} onChange={e => setMax(Number(e.target.value))} style={{ flex: 1, accentColor: S.primary }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: S.text, width: 28 }}>{max}</span>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Lbl>Direção das mensagens</Lbl>
              <div style={{ display: 'flex', gap: 6 }}>
                <SelBtn active={dir === 'bottom'} onClick={() => setDir('bottom')}>Baixo → cima</SelBtn>
                <SelBtn active={dir === 'top'}    onClick={() => setDir('top')}>Cima → baixo</SelBtn>
              </div>
            </div>

            <div>
              <Lbl>Bordas das mensagens</Lbl>
              <div style={{ display: 'flex', gap: 6 }}>
                <SelBtn active={radius === 0}  onClick={() => setRadius(0)}>Quadrado</SelBtn>
                <SelBtn active={radius === 8}  onClick={() => setRadius(8)}>Suave</SelBtn>
                <SelBtn active={radius === 99} onClick={() => setRadius(99)}>Pílula</SelBtn>
              </div>
            </div>
          </div>

          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>Visual</div>

            <div style={{ marginBottom: 12 }}>
              <Lbl>Fundo das mensagens</Lbl>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <SelBtn active={bgPreset === 'none'}   onClick={() => setBgPreset('none')}>Sem fundo</SelBtn>
                <SelBtn active={bgPreset === 'dark'}   onClick={() => { setBgPreset('dark');   setOpacity(55) }}>Escuro</SelBtn>
                <SelBtn active={bgPreset === 'darker'} onClick={() => { setBgPreset('darker'); setOpacity(80) }}>Mais escuro</SelBtn>
                <SelBtn active={bgPreset === 'color'}  onClick={() => { setBgPreset('color');  setOpacity(40) }}>Colorido</SelBtn>
              </div>
            </div>

            {!bgOff && isColored && (
              <div style={{ marginBottom: 12 }}>
                <Lbl>Cor do fundo</Lbl>
                <div style={{ display: 'flex', gap: 6 }}>
                  {BG_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setBgColor(c)}
                      style={{ width: 26, height: 26, borderRadius: 6, background: c, border: bgColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
            )}

            {!bgOff && (
              <div style={{ marginBottom: 12 }}>
                <Lbl>Opacidade do fundo</Lbl>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min={10} max={95} value={opacity} onChange={e => setOpacity(Number(e.target.value))} style={{ flex: 1, accentColor: S.primary }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: S.text, width: 36 }}>{opacity}%</span>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <Lbl>Animação de entrada</Lbl>
              <div style={{ display: 'flex', gap: 6 }}>
                <SelBtn active={anim === 'slide'} onClick={() => setAnim('slide')}>Deslizar</SelBtn>
                <SelBtn active={anim === 'fade'}  onClick={() => setAnim('fade')}>Fade</SelBtn>
                <SelBtn active={anim === 'pop'}   onClick={() => setAnim('pop')}>Aparecer</SelBtn>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '0.8rem', color: S.muted }}>Sombra no texto</span>
              <button type="button" onClick={() => setShadow(v => !v)} style={{
                padding: '5px 14px', borderRadius: 7, fontSize: '0.8rem', cursor: 'pointer', fontWeight: shadow ? 700 : 400,
                border: `1px solid ${shadow ? 'rgba(34,197,94,0.5)' : S.border}`,
                background: shadow ? 'rgba(34,197,94,0.1)' : 'transparent',
                color: shadow ? S.green : S.muted,
              }}>{shadow ? 'Ativado' : 'Desativado'}</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: S.muted }}>Ocultar comandos (!rank…)</span>
              <button type="button" onClick={() => setHidecmd(v => !v)} style={{
                padding: '5px 14px', borderRadius: 7, fontSize: '0.8rem', cursor: 'pointer', fontWeight: hidecmd ? 700 : 400,
                border: `1px solid ${hidecmd ? 'rgba(34,197,94,0.5)' : S.border}`,
                background: hidecmd ? 'rgba(34,197,94,0.1)' : 'transparent',
                color: hidecmd ? S.green : S.muted,
              }}>{hidecmd ? 'Ativado' : 'Desativado'}</button>
            </div>
          </div>
        </div>

        {/* Preview + URL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>Preview</div>
            <div style={{
              background: 'rgba(0,100,0,0.25)', border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: 8, height: 280, overflow: 'hidden', position: 'relative',
              display: 'flex', flexDirection: dir === 'top' ? 'column' : 'column-reverse',
              justifyContent: 'flex-start',
              padding: 10,
            }}>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', position: 'absolute', top: 6, right: 8 }}>OBS preview</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {previewList.map((m, i) => (
                  <div key={i} style={{
                    padding: bgOff ? '2px 0' : '5px 10px',
                    borderRadius: bgOff ? 0 : radius,
                    background: msgBg,
                    lineHeight: 1.4, wordBreak: 'break-word' as const,
                    fontSize: Math.min(size, 14),
                    animation: anim === 'slide' ? `slideIn .2s ${i*0.04}s both` : anim === 'fade' ? `fadeIn .25s ${i*0.04}s both` : `popIn .18s ${i*0.04}s both`,
                  }}>
                    <span style={{ fontWeight: 700, color: m.color, marginRight: 5, textShadow: shadow ? '0 1px 4px rgba(0,0,0,0.9)' : 'none' }}>{m.user}:</span>
                    <span style={{ color: '#fff', textShadow: shadow ? '0 1px 4px rgba(0,0,0,0.9)' : 'none' }}>{m.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.72rem', color: S.dim }}>Fundo verde = área transparente no OBS</div>
          </div>

          <div style={{ background: S.card, border: `1px solid rgba(155,48,255,0.2)`, borderRadius: 12, padding: 16 }}>
            <Lbl>URL do overlay para OBS (Browser Source)</Lbl>
            {!channel.trim() ? (
              <div style={{ fontSize: '0.8rem', color: S.dim, padding: '8px 0' }}>Digite o canal para gerar a URL</div>
            ) : (
              <>
                <div style={{ background: '#08090d', border: `1px solid ${S.border}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.72rem', color: S.muted, wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 8 }}>
                  {overlayUrl}
                </div>
                <button type="button" onClick={copy}
                  style={{ width: '100%', padding: '9px 0', background: copied ? S.green : S.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s' }}>
                  {copied ? '✓ Copiado!' : 'Copiar URL'}
                </button>
              </>
            )}
            <div style={{ marginTop: 10, fontSize: '0.73rem', color: S.dim, lineHeight: 1.6 }}>
              Recomendado: <strong style={{ color: S.muted }}>400 × 600 px</strong> · ative <strong style={{ color: S.muted }}>"fundo transparente"</strong> no OBS.
            </div>
          </div>

          <div style={{ background: 'rgba(60,160,255,0.06)', border: `1px solid rgba(60,160,255,0.18)`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 700, color: S.text, fontSize: '0.82rem', marginBottom: 8 }}>Como funciona</div>
            <ul style={{ color: S.muted, fontSize: '0.76rem', margin: 0, paddingLeft: 16, lineHeight: 2 }}>
              <li>Conecta direto ao IRC da Twitch — sem backend</li>
              <li>Lê o chat anonimamente, sem login</li>
              <li>Reconecta automaticamente se cair</li>
              <li>Cores dos usuários são preservadas do Twitch</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
