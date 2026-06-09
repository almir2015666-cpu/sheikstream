'use client'
import { useEffect, useRef, useState } from 'react'

const C = {
  page: '#08090d', card: '#0d0f18', border: 'rgba(255,255,255,0.07)',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.55)', dim: 'rgba(232,230,248,0.28)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)', primaryBd: 'rgba(155,48,255,0.25)',
  green: '#22c55e', red: '#ef4444', cyan: '#22d3ee',
}

type Format = { id: string; label: string; desc: string; size: '1024x1024' | '1792x1024' | '1024x1792'; icon: string }
const FORMATS: Format[] = [
  { id: 'banner',  label: 'Banner da Twitch',  desc: '1920×480 · Recorte horizontal', size: '1792x1024', icon: '🖼' },
  { id: 'offline', label: 'Tela Offline',       desc: '1920×1080 · Landscape',        size: '1792x1024', icon: '💤' },
  { id: 'square',  label: 'Foto de Perfil',     desc: '256×256 · Quadrado',           size: '1024x1024', icon: '👤' },
  { id: 'panel',   label: 'Painel/Thumb',       desc: '320×100 · Recorte livre',      size: '1024x1024', icon: '📌' },
  { id: 'portrait',label: 'Vertical',           desc: '1080×1920 · Stories/Reels',    size: '1024x1792', icon: '📱' },
]

const STYLE_HINTS = [
  '⚡ Gaming intenso', '🌌 Sci-fi espacial', '🌊 Anime colorido',
  '🔥 Fundo de fogo', '🌿 Natureza serena', '🏙 Cidade neon',
  '👾 Pixel art retro', '🎨 Arte digital', '🐉 Fantasia épica',
]

const PROMPT_EXAMPLES = [
  'Banner de streamer de gaming com temática de dragões e cores roxo e preto, estilo moderno e épico',
  'Tela offline com paisagem futurista à noite, cidade neon refletida em água, estilo anime',
  'Foto de perfil de personagem gamer com armadura futurista, fundo roxo vibrante, alta qualidade',
  'Painel para Twitch com estilo minimalista escuro, ícone de troféu dourado e texto branco',
]

type CfgData = {
  config: { enabled: boolean; cooldown_seconds: number; max_per_day: number; allowed_roles: string[] } | null
  userRole: string | null
  cooldownRemaining: number
  usedToday: number
}

function formatTime(sec: number) {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}m${s > 0 ? ` ${s}s` : ''}`
}

export default function IAImagensPage() {
  const [cfg, setCfg] = useState<CfgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  const [prompt, setPrompt] = useState('')
  const [format, setFormat] = useState<Format>(FORMATS[0])
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')

  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ imageUrl: string; revisedPrompt: string; modelUsed?: string } | null>(null)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [refImage, setRefImage] = useState<string | null>(null)
  const refInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/ia-imagens/config')
      .then(r => r.json())
      .then((d: CfgData & { error?: string }) => {
        if (d.error) { setAccessDenied(true); setLoading(false); return }
        const allowed = d.config?.allowed_roles ?? []
        const hasAccess = allowed.includes('todos') || (d.userRole && allowed.includes(d.userRole))
        if (!hasAccess || !d.config?.enabled) { setAccessDenied(true); setLoading(false); return }
        setCfg(d)
        if (d.cooldownRemaining > 0) startCooldown(d.cooldownRemaining)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function startCooldown(sec: number) {
    setCooldown(sec)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  async function generate() {
    if (!prompt.trim() || generating || cooldown > 0) return
    setGenerating(true)
    setError('')
    setResult(null)
    try {
      const body: Record<string, unknown> = { prompt, size: format.size, quality }
      if (refImage) body.referenceImage = refImage
      const res = await fetch('/api/ia-imagens/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao gerar imagem')
        if (data.waitSeconds) startCooldown(data.waitSeconds)
      } else {
        setResult({ imageUrl: data.imageUrl, revisedPrompt: data.revisedPrompt, modelUsed: data.modelUsed })
        const cd = cfg?.config?.cooldown_seconds ?? 0
        if (cd > 0) startCooldown(cd)
        setCfg(prev => prev ? { ...prev, usedToday: prev.usedToday + 1 } : prev)
      }
    } catch { setError('Erro de conexão') }
    setGenerating(false)
  }

  function download() {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.imageUrl
    a.download = `sheikstream-ia-${Date.now()}.png`
    a.click()
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: C.muted }}>
      Carregando...
    </div>
  )

  if (accessDenied) return (
    <div style={{ maxWidth: 480, margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: C.text, marginBottom: '0.5rem' }}>Acesso restrito</div>
      <div style={{ fontSize: '0.9rem', color: C.muted, lineHeight: 1.6 }}>
        Esta funcionalidade é liberada pelo administrador para grupos específicos (admin, moderador, vip).<br/>
        Fale com o dono do canal para solicitar acesso.
      </div>
    </div>
  )

  const maxPerDay = cfg?.config?.max_per_day ?? 10
  const usedToday = cfg?.usedToday ?? 0
  const canGenerate = cooldown === 0 && !generating && usedToday < maxPerDay && prompt.trim().length > 0

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.6rem' }}>🎨</span> IA de Imagens
        </h1>
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.88rem', color: C.muted }}>
          Crie banners, fotos de perfil e overlays para a Twitch com inteligência artificial.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Left: config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Format */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>Tipo de imagem</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => setFormat(f)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.55rem 0.75rem',
                  background: format.id === f.id ? C.primaryBg : 'transparent',
                  border: `1px solid ${format.id === f.id ? C.primaryBd : 'transparent'}`,
                  borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: format.id === f.id ? C.primary : C.text }}>{f.label}</div>
                    <div style={{ fontSize: '0.68rem', color: C.muted }}>{f.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.55rem' }}>Qualidade</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['standard', 'hd'] as const).map(q => (
                <button key={q} onClick={() => setQuality(q)} style={{
                  flex: 1, padding: '0.5rem', borderRadius: 8,
                  background: quality === q ? C.primaryBg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${quality === q ? C.primaryBd : C.border}`,
                  color: quality === q ? C.primary : C.muted, fontWeight: 700,
                  fontSize: '0.8rem', cursor: 'pointer',
                }}>
                  {q === 'standard' ? '⚡ Padrão' : '✨ HD'}
                  <div style={{ fontSize: '0.65rem', fontWeight: 400, marginTop: '0.15rem', color: C.dim }}>
                    {q === 'standard' ? 'Rápido' : 'Mais detalhado'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Usage info */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Uso hoje</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: usedToday >= maxPerDay ? C.red : C.text, marginTop: '0.1rem' }}>
                {usedToday} / {maxPerDay}
              </div>
            </div>
            {cfg?.config?.cooldown_seconds && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Delay entre gerações</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: C.muted, marginTop: '0.1rem' }}>
                  {formatTime(cfg.config.cooldown_seconds)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: prompt + result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Prompt */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Descreva a imagem</div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={PROMPT_EXAMPLES[0]}
              rows={5}
              maxLength={1000}
              style={{
                width: '100%', background: '#08090d', border: `1px solid ${C.border}`,
                borderRadius: 8, color: C.text, fontSize: '0.875rem', padding: '0.7rem 0.85rem',
                resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                lineHeight: 1.55,
              }}
            />
            <div style={{ fontSize: '0.65rem', color: C.dim, textAlign: 'right', marginTop: '0.2rem' }}>{prompt.length}/1000</div>

            {/* Style chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
              {STYLE_HINTS.map(h => (
                <button key={h} onClick={() => setPrompt(p => p ? `${p}, ${h.replace(/^[^ ]+ /, '')}` : h.replace(/^[^ ]+ /, ''))}
                  style={{ padding: '0.22rem 0.6rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 99, color: C.muted, fontSize: '0.7rem', cursor: 'pointer' }}>
                  {h}
                </button>
              ))}
            </div>

            {/* Example prompts */}
            <div style={{ marginTop: '0.65rem' }}>
              <div style={{ fontSize: '0.63rem', color: C.dim, marginBottom: '0.3rem' }}>Exemplos de prompt:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {PROMPT_EXAMPLES.map((ex, i) => (
                  <button key={i} onClick={() => setPrompt(ex)} style={{ textAlign: 'left', padding: '0.3rem 0.55rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 6, color: C.dim, fontSize: '0.7rem', cursor: 'pointer', lineHeight: 1.4 }}>
                    {ex.slice(0, 80)}{ex.length > 80 ? '…' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference image */}
            <div style={{ marginTop: '0.75rem', borderTop: `1px solid ${C.border}`, paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.63rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>
                Print de referência (opcional)
              </div>
              {refImage ? (
                <div style={{ position: 'relative' }}>
                  <img src={refImage} alt="Referência" style={{ width: '100%', maxHeight: 110, objectFit: 'cover', borderRadius: 7, border: `1px solid ${C.border}`, display: 'block' }} />
                  <button onClick={() => { setRefImage(null); if (refInputRef.current) refInputRef.current.value = '' }}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.75)', border: 'none', borderRadius: 4, color: '#fff', fontSize: '0.7rem', padding: '0.15rem 0.45rem', cursor: 'pointer' }}>
                    ✕
                  </button>
                  <div style={{ fontSize: '0.62rem', color: C.dim, marginTop: '0.3rem' }}>A IA vai usar este print como referência visual</div>
                </div>
              ) : (
                <button onClick={() => refInputRef.current?.click()} style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', border: `1px dashed ${C.border}`, borderRadius: 7, color: C.dim, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  📸 Enviar print de referência
                </button>
              )}
              <input ref={refInputRef} type="file" accept="image/*" onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => setRefImage(reader.result as string)
                reader.readAsDataURL(file)
              }} style={{ display: 'none' }} />
            </div>
          </div>

          {/* Generate button */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#f87171', fontSize: '0.84rem' }}>
              {error}
            </div>
          )}

          {cooldown > 0 && (
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '0.6rem 0.85rem', color: '#fbbf24', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⏳ Aguarde <strong>{formatTime(cooldown)}</strong> para gerar outra imagem
            </div>
          )}

          {usedToday >= maxPerDay && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.6rem 0.85rem', color: '#f87171', fontSize: '0.84rem' }}>
              Limite diário de {maxPerDay} imagens atingido. Volta amanhã!
            </div>
          )}

          <button
            onClick={generate}
            disabled={!canGenerate}
            style={{
              padding: '0.85rem', borderRadius: 10, fontWeight: 800, fontSize: '0.95rem',
              background: canGenerate ? C.primary : 'rgba(155,48,255,0.2)',
              border: `1px solid ${canGenerate ? C.primary : 'rgba(155,48,255,0.2)'}`,
              color: canGenerate ? '#fff' : 'rgba(155,48,255,0.5)',
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {generating ? (
              <>
                <span style={{ display: 'inline-block', animation: 'ia-spin 1s linear infinite' }}>✨</span>
                Gerando com DALL-E 3...
              </>
            ) : (
              '✨ Gerar Imagem'
            )}
          </button>
          <style>{`@keyframes ia-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

          {/* Result */}
          {result && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <img src={result.imageUrl} alt="Imagem gerada"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              <div style={{ padding: '0.85rem' }}>
                {result.modelUsed === 'dall-e-2' && (
                  <div style={{ fontSize: '0.68rem', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 6, padding: '0.4rem 0.6rem', marginBottom: '0.5rem' }}>
                    Gerado com DALL-E 2 (1024×1024) — sua chave da OpenAI não tem acesso ao DALL-E 3. Ative o billing em platform.openai.com para usar o DALL-E 3.
                  </div>
                )}
                {result.revisedPrompt && result.revisedPrompt !== prompt && (
                  <div style={{ fontSize: '0.7rem', color: C.dim, marginBottom: '0.6rem', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700 }}>Prompt revisado pela IA:</span> {result.revisedPrompt.slice(0, 200)}{result.revisedPrompt.length > 200 ? '…' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={download} style={{ flex: 1, padding: '0.6rem', background: C.primaryBg, border: `1px solid ${C.primaryBd}`, borderRadius: 8, color: C.primary, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                    ⬇ Baixar PNG
                  </button>
                </div>
                <div style={{ fontSize: '0.65rem', color: C.dim, marginTop: '0.45rem' }}>
                  Imagem gerada com gpt-image-1. Clique em Baixar para salvar no computador.
                </div>
              </div>
            </div>
          )}

          {generating && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', animation: 'ia-spin 2s linear infinite', display: 'inline-block', marginBottom: '0.75rem' }}>🎨</div>
              <div style={{ fontSize: '0.9rem', color: C.muted, fontWeight: 600 }}>Criando sua imagem com gpt-image-1...</div>
              <div style={{ fontSize: '0.75rem', color: C.dim, marginTop: '0.35rem' }}>Pode levar até 20 segundos</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
