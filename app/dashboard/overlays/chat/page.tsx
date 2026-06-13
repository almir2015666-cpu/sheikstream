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
  padding: '0.6rem 0.9rem', background: '#08090d',
  border: `1px solid ${S.border}`, borderRadius: 8, color: S.text,
  fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
}

const PREVIEW_MSGS = [
  { user: 'SheikFabio', color: '#9b30ff', text: 'Boa live! 🔥' },
  { user: 'viewer123',  color: '#60a5fa', text: 'qual game é esse?' },
  { user: 'fã_top',     color: '#34d399', text: 'manda ver! GGGG' },
  { user: 'madruga99',  color: '#f87171', text: '!rank' },
  { user: 'xablau',     color: '#fbbf24', text: 'PogChamp PogChamp' },
]

const BG_PRESETS = [
  { label: 'Sem fundo',    value: 'none',    opacity: 0   },
  { label: 'Escuro',       value: 'dark',    opacity: 55  },
  { label: 'Mais escuro',  value: 'darker',  opacity: 80  },
  { label: 'Colorido',     value: 'color',   opacity: 40  },
]
const RADIUS_OPTS = [
  { label: 'Quadrado', value: 0  },
  { label: 'Suave',    value: 8  },
  { label: 'Pílula',   value: 99 },
]
const ANIM_OPTS = [
  { label: 'Deslizar',  value: 'slide' },
  { label: 'Fade',      value: 'fade'  },
  { label: 'Aparecer',  value: 'pop'   },
]
const BG_COLORS = [
  { label: 'Preto',   value: '#000000' },
  { label: 'Roxo',    value: '#3b0764' },
  { label: 'Azul',    value: '#0c1445' },
  { label: 'Verde',   value: '#052e16' },
  { label: 'Cinza',   value: '#1c1c1c' },
]

export default function ChatConfigPage() {
  const router  = useRouter()
  const [channel,  setChannel]  = useState('')
  const [size,     setSize]     = useState(15)
  const [max,      setMax]      = useState(25)
  const [dir,      setDir]      = useState('bottom')
  const [bgPreset, setBgPreset] = useState('dark')
  const [opacity,  setOpacity]  = useState(55)
  const [radius,   setRadius]   = useState(8)
  const [anim,     setAnim]     = useState('slide')
  const [shadow,   setShadow]   = useState(false)
  const [hidecmd,  setHidecmd]  = useState(false)
  const [bgColor,  setBgColor]  = useState('#000000')
  const [copied,   setCopied]   = useState(false)

  const bgOff = bgPreset === 'none'
  const isColored = bgPreset === 'color'

  const overlayUrl = channel.trim()
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/overlay/chat` +
      `?channel=${channel.trim().toLowerCase()}` +
      `&size=${size}&max=${max}&dir=${dir}` +
      `&bg=${bgOff ? 'false' : 'true'}` +
      `&opacity=${opacity}` +
      `&radius=${radius}` +
      `&anim=${anim}` +
      (shadow   ? '&shadow=true'   : '') +
      (hidecmd  ? '&hidecmd=true'  : '') +
      (!bgOff && isColored ? `&bgcol=${encodeURIComponent(bgColor)}` : '')
    : ''

  const copy = () => { navigator.clipboard.writeText(overlayUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const lbl = (t: string) => (
    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: S.dim, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t}</div>
  )
  const btn = (active: boolean, onClick: () => void, label: string) => (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 7, fontSize: '0.8rem', fontWeight: active ? 700 : 400, cursor: 'pointer',
      border: `1px solid ${active ? 'rgba(155,48,255,0.5)' : S.border}`,
      background: active ? S.primaryBg : 'transparent',
      color: active ? S.primary : S.muted,
    }}>{label}</button>
  )
  const toggle = (val: boolean, set: (v: boolean) => void) => (
    <button onClick={() => set(!val)} style={{
      padding: '6px 14px', borderRadius: 7, fontSize: '0.8rem', fontWeight: val ? 700 : 400, cursor: 'pointer',
      border: `1px solid ${val ? 'rgba(34,197,94,0.5)' : S.border}`,
      background: val ? 'rgba(34,197,94,0.1)' : 'transparent',
      color: val ? S.green : S.muted,
    }}>{val ? 'Ativado' : 'Desativado'}</button>
  )

  // Preview message style
  const getMsgBg = () => {
    if (bgOff) return 'transparent'
    const col = isColored ? bgColor : '#000000'
    const op  = bgPreset === 'darker' ? 80 : opacity
    const hex = Math.round(op * 2.55).toString(16).padStart(2, '0')
    return `${col}${hex}`
  }
  const animStyle = (i: number): React.CSSProperties => {
    const base: React.CSSProperties = { animation: 'none' }
    if (anim === 'slide') return { ...base, animation: `slideIn .25s ${i * 0.05}s both` }
    if (anim === 'fade')  return { ...base, animation: `fadeIn .3s ${i * 0.05}s both` }
    if (anim === 'pop')   return { ...base, animation: `popIn .2s ${i * 0.05}s both` }
    return base
  }
  const msgBg = getMsgBg()
  const visibleMsgs = hidecmd ? PREVIEW_MSGS.filter(m => !m.text.startsWith('!')) : PREVIEW_MSGS

  return (
    <div style={{ padding: '28px 24px', maxWidth: 820, margin: '0 auto', fontFamily: "'Inter',system-ui,sans-serif", color: S.text }}>
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes popIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push('/dashboard/overlays')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 8, color: S.muted, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </button>
        <h1 style={{ flex: 1, color: S.text, fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Chat Overlay</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>

        {/* Config panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Canal */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>Conexão</div>
            {lbl('Canal da Twitch')}
            <input style={{ ...inp, width: '100%', boxSizing: 'border-box' }} value={channel} onChange={e => setChannel(e.target.value)} placeholder="nomeDaLive" />
          </div>

          {/* Layout */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>Layout</div>

            <div style={{ marginBottom: 12 }}>
              {lbl('Tamanho da fonte')}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="range" min={10} max={26} value={size} onChange={e => setSize(Number(e.target.value))}
                  style={{ flex: 1, accentColor: S.primary }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: S.text, width: 32 }}>{size}px</span>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              {lbl('Máx. mensagens visíveis')}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="range" min={5} max={50} value={max} onChange={e => setMax(Number(e.target.value))}
                  style={{ flex: 1, accentColor: S.primary }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: S.text, width: 28 }}>{max}</span>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              {lbl('Direção')}
              <div style={{ display: 'flex', gap: 6 }}>
                {btn(dir === 'bottom', () => setDir('bottom'), 'Baixo → cima')}
                {btn(dir === 'top',    () => setDir('top'),    'Cima → baixo')}
              </div>
            </div>

            <div>
              {lbl('Bordas das mensagens')}
              <div style={{ display: 'flex', gap: 6 }}>
                {RADIUS_OPTS.map(r => btn(radius === r.value, () => setRadius(r.value), r.label))}
              </div>
            </div>
          </div>

          {/* Visual */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>Visual</div>

            <div style={{ marginBottom: 12 }}>
              {lbl('Fundo das mensagens')}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {BG_PRESETS.map(p => btn(bgPreset === p.value, () => { setBgPreset(p.value); if (p.opacity) setOpacity(p.opacity) }, p.label))}
              </div>
            </div>

            {!bgOff && isColored && (
              <div style={{ marginBottom: 12 }}>
                {lbl('Cor do fundo')}
                <div style={{ display: 'flex', gap: 6 }}>
                  {BG_COLORS.map(c => (
                    <button key={c.value} onClick={() => setBgColor(c.value)} title={c.label}
                      style={{ width: 26, height: 26, borderRadius: 6, background: c.value, border: bgColor === c.value ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
            )}

            {!bgOff && (
              <div style={{ marginBottom: 12 }}>
                {lbl('Opacidade do fundo')}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min={10} max={95} value={opacity} onChange={e => setOpacity(Number(e.target.value))}
                    style={{ flex: 1, accentColor: S.primary }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: S.text, width: 36 }}>{opacity}%</span>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              {lbl('Animação de entrada')}
              <div style={{ display: 'flex', gap: 6 }}>
                {ANIM_OPTS.map(a => btn(anim === a.value, () => setAnim(a.value), a.label))}
              </div>
            </div>

            <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: S.muted }}>Sombra no texto</span>
              {toggle(shadow, setShadow)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: S.muted }}>Ocultar comandos (!rank, !sr…)</span>
              {toggle(hidecmd, setHidecmd)}
            </div>
          </div>
        </div>

        {/* Preview + URL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Preview */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>Preview</div>
            <div style={{ background: 'rgba(0,100,0,0.25)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8, height: 280, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: dir === 'top' ? 'flex-start' : 'flex-end', padding: 10, gap: 0 }}>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', position: 'absolute', top: 6, right: 8 }}>OBS preview</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(dir === 'top' ? visibleMsgs : [...visibleMsgs].reverse()).map((m, i) => (
                  <div key={i} style={{
                    padding: bgOff ? '2px 0' : '5px 10px',
                    borderRadius: bgOff ? 0 : radius,
                    background: msgBg,
                    backdropFilter: (!bgOff && bgPreset !== 'color') ? 'blur(8px)' : 'none',
                    lineHeight: 1.4, wordBreak: 'break-word',
                    fontSize: Math.min(size, 14),
                    ...animStyle(i),
                  }}>
                    <span style={{ fontWeight: 700, color: m.color, marginRight: 5, textShadow: shadow ? '0 1px 4px rgba(0,0,0,0.9)' : 'none' }}>{m.user}:</span>
                    <span style={{ color: '#fff', textShadow: shadow ? '0 1px 4px rgba(0,0,0,0.9)' : 'none' }}>{m.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.72rem', color: S.dim }}>Fundo verde = área transparente no OBS</div>
          </div>

          {/* URL */}
          <div style={{ background: S.card, border: `1px solid rgba(155,48,255,0.2)`, borderRadius: 12, padding: 16 }}>
            {lbl('URL do overlay para OBS (Browser Source)')}
            {!channel.trim() ? (
              <div style={{ fontSize: '0.8rem', color: S.dim, padding: '8px 0' }}>Digite o canal para gerar a URL</div>
            ) : (
              <>
                <div style={{ background: '#08090d', border: `1px solid ${S.border}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.72rem', color: S.muted, wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 8 }}>
                  {overlayUrl}
                </div>
                <button onClick={copy}
                  style={{ width: '100%', padding: '9px 0', background: copied ? S.green : S.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s' }}>
                  {copied ? '✓ Copiado!' : 'Copiar URL'}
                </button>
              </>
            )}
            <div style={{ marginTop: 10, fontSize: '0.73rem', color: S.dim, lineHeight: 1.6 }}>
              Tamanho recomendado: <strong style={{ color: S.muted }}>400 × 600</strong> px.<br />
              Ative <strong style={{ color: S.muted }}>"fundo transparente"</strong> no Browser Source do OBS.
            </div>
          </div>

          {/* Info */}
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
