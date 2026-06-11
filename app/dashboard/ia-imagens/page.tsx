'use client'
import { useEffect, useRef, useState } from 'react'

// ── types & data ────────────────────────────────────────────────────────────
type Size = '1024x1024' | '1792x1024' | '1024x1792'
type Fmt = { id: string; label: string; sub: string; size: Size; rw: number; rh: number }
type CfgData = {
  config: { enabled: boolean; cooldown_seconds: number; max_per_day: number; effective_max_per_day?: number; allowed_roles: string[] } | null
  userRole: string | null; cooldownRemaining: number; usedToday: number
}

const FORMATS: Fmt[] = [
  { id: 'banner',   label: 'Banner da Twitch',  sub: '1920 × 480',   size: '1792x1024', rw: 52, rh: 14 },
  { id: 'offline',  label: 'Tela Offline',       sub: '1920 × 1080',  size: '1792x1024', rw: 36, rh: 20 },
  { id: 'square',   label: 'Foto de Perfil',     sub: '256 × 256',    size: '1024x1024', rw: 24, rh: 24 },
  { id: 'panel',    label: 'Painel / Thumb',     sub: '320 × 100',    size: '1024x1024', rw: 42, rh: 13 },
  { id: 'portrait', label: 'Stories / Reels',    sub: '1080 × 1920',  size: '1024x1792', rw: 16, rh: 28 },
]

const HINTS = [
  { e: '⚡', l: 'Gaming intenso',  v: 'gaming intenso, cores vibrantes, épico' },
  { e: '🌌', l: 'Sci-fi espacial', v: 'sci-fi espacial, nebulosas, tecnologia futurista' },
  { e: '🌊', l: 'Anime colorido',  v: 'estilo anime japonês, colorido, vibrante' },
  { e: '🔥', l: 'Fundo de fogo',   v: 'fundo de chamas, vermelho e laranja, épico' },
  { e: '🏙', l: 'Cidade neon',     v: 'cidade neon, luzes urbanas, noite, chuva, reflexos' },
  { e: '👾', l: 'Pixel art',       v: 'pixel art retro, 16-bit, estilo clássico' },
  { e: '🐉', l: 'Fantasia épica',  v: 'fantasia épica, dragões, magia, medieval' },
  { e: '◻',  l: 'Minimalista',     v: 'design minimalista, limpo, moderno, dark' },
]

const EXAMPLES = [
  'Banner de streamer gaming com dragões, cores roxo e preto, épico e moderno',
  'Tela offline futurista, cidade neon à noite, chuva, reflexos estilo anime',
  'Foto de perfil com armadura futurista, fundo roxo vibrante, alta qualidade',
  'Painel Twitch minimalista escuro, ícone de troféu dourado, texto branco',
]

const GEN_STEPS = ['Analisando prompt...', 'Criando composição...', 'Adicionando detalhes...', 'Finalizando imagem...']

function fmtTime(s: number) { return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60 > 0 ? `${s % 60}s` : ''}`.trim() }

// ── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes ia-spin    { to { transform: rotate(360deg) } }
  @keyframes ia-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes ia-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes ia-up      { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ia-reveal  { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
  @keyframes ia-glow    { 0%,100%{box-shadow:0 0 20px rgba(155,48,255,.3)} 50%{box-shadow:0 0 40px rgba(155,48,255,.6)} }
  @keyframes ia-bar     { from{background-position:0 0} to{background-position:200% 0} }

  * { box-sizing: border-box }

  .ia-fmt {
    display:flex; align-items:center; gap:.65rem; padding:.6rem .75rem;
    border-radius:10px; border:1px solid transparent; cursor:pointer;
    width:100%; text-align:left; background:transparent;
    transition:all .18s ease; font-family:inherit;
  }
  .ia-fmt:hover  { background:rgba(155,48,255,.06); border-color:rgba(155,48,255,.2); }
  .ia-fmt.on     { background:rgba(155,48,255,.13); border-color:rgba(155,48,255,.45); box-shadow:0 0 14px rgba(155,48,255,.18); }

  .ia-qual {
    flex:1; padding:.65rem .5rem; border-radius:10px; cursor:pointer;
    border:1px solid rgba(255,255,255,.07); background:rgba(255,255,255,.03);
    transition:all .18s ease; font-family:inherit;
  }
  .ia-qual:hover { background:rgba(155,48,255,.07); border-color:rgba(155,48,255,.25); }
  .ia-qual.on    { background:rgba(155,48,255,.14); border-color:rgba(155,48,255,.5); box-shadow:0 0 12px rgba(155,48,255,.15); }

  .ia-chip {
    padding:.28rem .7rem; border-radius:99px; font-size:.72rem; cursor:pointer;
    border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04);
    color:rgba(232,230,248,.55); white-space:nowrap; transition:all .15s ease;
    font-family:inherit;
  }
  .ia-chip:hover { border-color:rgba(155,48,255,.3); color:rgba(232,230,248,.85); }
  .ia-chip.on    { background:rgba(155,48,255,.18); border-color:rgba(155,48,255,.55); color:#c084fc; }

  .ia-ex {
    text-align:left; padding:.4rem .7rem;
    background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.06);
    border-radius:8px; color:rgba(232,230,248,.4); font-size:.72rem;
    cursor:pointer; line-height:1.5; transition:all .15s; font-family:inherit;
    width:100%;
  }
  .ia-ex:hover { background:rgba(155,48,255,.07); border-color:rgba(155,48,255,.25); color:rgba(232,230,248,.8); }

  .ia-ta {
    width:100%; min-height:130px; background:rgba(0,0,0,.3);
    border:1.5px solid rgba(255,255,255,.08); border-radius:10px;
    color:#e8e6f8; font-size:.9rem; padding:.85rem 1rem;
    resize:vertical; font-family:inherit; outline:none;
    line-height:1.6; transition:border-color .2s ease, box-shadow .2s ease;
  }
  .ia-ta:focus { border-color:rgba(155,48,255,.55); box-shadow:0 0 0 3px rgba(155,48,255,.1); }
  .ia-ta::placeholder { color:rgba(232,230,248,.25); }

  .ia-drop {
    border:1.5px dashed rgba(255,255,255,.1); border-radius:10px;
    padding:1.5rem 1rem; text-align:center; cursor:pointer;
    transition:all .2s ease;
  }
  .ia-drop:hover, .ia-drop.over { border-color:rgba(155,48,255,.5); background:rgba(155,48,255,.07); }

  .ia-btn-gen {
    width:100%; padding:1.05rem 2rem; border-radius:12px; font-weight:800; font-size:1rem;
    background:rgba(155,48,255,.14); border:1px solid rgba(155,48,255,.18);
    color:rgba(155,48,255,.4); cursor:not-allowed; font-family:inherit;
    transition:all .2s ease; display:flex; align-items:center; justify-content:center; gap:.75rem;
  }
  .ia-btn-gen.ready {
    background:linear-gradient(135deg,#9b30ff,#7c3aed);
    border-color:#9b30ff; color:#fff; cursor:pointer;
    box-shadow:0 4px 28px rgba(155,48,255,.4);
  }
  .ia-btn-gen.ready:hover { transform:translateY(-2px); box-shadow:0 6px 36px rgba(155,48,255,.55); }
  .ia-btn-gen.ready:active { transform:translateY(0); }
  .ia-btn-gen.loading {
    background:linear-gradient(90deg,#6d28d9,#9b30ff,#7c3aed,#9b30ff);
    background-size:200% auto; animation:ia-shimmer 2s linear infinite;
    border-color:#9b30ff; color:#fff; cursor:wait;
  }

  .ia-notice {
    display:flex; align-items:center; gap:.65rem;
    padding:.7rem 1rem; border-radius:10px; font-size:.84rem;
    animation:ia-up .25s ease;
  }
  .ia-err  { background:rgba(239,68,68,.08);  border:1px solid rgba(239,68,68,.25);  color:#f87171; }
  .ia-warn { background:rgba(251,191,36,.07); border:1px solid rgba(251,191,36,.2);  color:#fbbf24; }

  .ia-result { animation:ia-reveal .45s ease forwards; }

  .ia-dl {
    flex:1; display:flex; align-items:center; justify-content:center; gap:.5rem;
    padding:.7rem 1.25rem; border-radius:10px; font-weight:700; font-size:.875rem;
    cursor:pointer; transition:all .15s ease; font-family:inherit;
  }
  .ia-dl-p { background:linear-gradient(135deg,#9b30ff,#7c3aed); border:1px solid #9b30ff; color:#fff; box-shadow:0 2px 14px rgba(155,48,255,.3); }
  .ia-dl-p:hover { box-shadow:0 4px 22px rgba(155,48,255,.5); transform:translateY(-1px); }
  .ia-dl-s { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); color:rgba(232,230,248,.7); }
  .ia-dl-s:hover { background:rgba(255,255,255,.08); }

  .ia-card {
    background:#0d0f18; border:1px solid rgba(255,255,255,.07);
    border-radius:14px; padding:1.1rem;
  }
  .ia-label {
    font-size:.65rem; font-weight:700; color:rgba(232,230,248,.3);
    text-transform:uppercase; letter-spacing:.08em; margin-bottom:.65rem;
  }

  .ia-prog-bar {
    height:4px; border-radius:99px; background:rgba(255,255,255,.06); overflow:hidden;
  }
  .ia-prog-fill {
    height:100%; border-radius:99px;
    background:linear-gradient(90deg,#9b30ff,#c084fc);
    transition:width .4s ease;
  }
  .ia-prog-fill.anim {
    background:linear-gradient(90deg,#6d28d9,#9b30ff,#c084fc,#9b30ff);
    background-size:200% auto; animation:ia-bar 1.8s linear infinite;
  }
`

// ── page ─────────────────────────────────────────────────────────────────────
export default function IAImagensPage() {
  const [cfg, setCfg]           = useState<CfgData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [denied, setDenied]     = useState(false)

  const [prompt, setPrompt]     = useState('')
  const [fmt, setFmt]           = useState<Fmt>(FORMATS[0])
  const [quality, setQuality]   = useState<'standard' | 'hd'>('standard')
  const [active, setActive]     = useState<Set<number>>(new Set())

  const [gen, setGen]           = useState(false)
  const [step, setStep]         = useState(0)
  const [result, setResult]     = useState<{ imageUrl: string; revisedPrompt: string; modelUsed?: string } | null>(null)
  const [err, setErr]           = useState('')
  const [cd, setCd]             = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [showEx, setShowEx]     = useState(false)

  const cdRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const taRef   = useRef<HTMLTextAreaElement>(null)
  const [refs, setRefs] = useState<string[]>([])

  // load config
  useEffect(() => {
    fetch('/api/ia-imagens/config')
      .then(r => r.json())
      .then((d: CfgData & { error?: string }) => {
        if (d.error) { setDenied(true); setLoading(false); return }
        const allowed = d.config?.allowed_roles ?? []
        const ok = allowed.includes('todos') || (d.userRole && allowed.includes(d.userRole))
        if (!ok || !d.config?.enabled) { setDenied(true); setLoading(false); return }
        setCfg(d)
        if (d.cooldownRemaining > 0) startCd(d.cooldownRemaining)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function startCd(s: number) {
    setCd(s)
    if (cdRef.current) clearInterval(cdRef.current)
    cdRef.current = setInterval(() => setCd(p => { if (p <= 1) { clearInterval(cdRef.current!); return 0 } return p - 1 }), 1000)
  }

  useEffect(() => () => { if (cdRef.current) clearInterval(cdRef.current); if (stepRef.current) clearInterval(stepRef.current) }, [])

  // paste images
  useEffect(() => {
    const h = (e: ClipboardEvent) => {
      for (const item of Array.from(e.clipboardData?.items ?? [])) {
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile()!
          const r = new FileReader()
          r.onload = () => setRefs(p => [...p, r.result as string])
          r.readAsDataURL(f)
          e.preventDefault(); break
        }
      }
    }
    document.addEventListener('paste', h)
    return () => document.removeEventListener('paste', h)
  }, [])

  function addFiles(files: File[]) {
    files.filter(f => f.type.startsWith('image/')).forEach(f => {
      const r = new FileReader()
      r.onload = () => setRefs(p => [...p, r.result as string])
      r.readAsDataURL(f)
    })
  }

  function toggleHint(i: number) {
    const h = HINTS[i]
    setActive(prev => {
      const n = new Set(prev)
      if (n.has(i)) { n.delete(i); setPrompt(p => p.replace(`, ${h.v}`, '').replace(h.v, '').trim()) }
      else { n.add(i); setPrompt(p => p ? `${p.trimEnd()}, ${h.v}` : h.v) }
      return n
    })
    taRef.current?.focus()
  }

  async function generate() {
    if (!prompt.trim() || gen || cd > 0) return
    setGen(true); setErr(''); setResult(null); setStep(0)
    let s = 0
    stepRef.current = setInterval(() => { s = Math.min(s + 1, GEN_STEPS.length - 1); setStep(s) }, 4500)
    try {
      const body: Record<string, unknown> = { prompt, size: fmt.size, quality }
      if (refs.length > 0) body.referenceImages = refs
      const res = await fetch('/api/ia-imagens/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      clearInterval(stepRef.current!)
      if (!res.ok) { setErr(data.error ?? 'Erro ao gerar imagem'); if (data.waitSeconds) startCd(data.waitSeconds) }
      else {
        setResult({ imageUrl: data.imageUrl, revisedPrompt: data.revisedPrompt, modelUsed: data.modelUsed })
        const c = cfg?.config?.cooldown_seconds ?? 0; if (c > 0) startCd(c)
        setCfg(p => p ? { ...p, usedToday: p.usedToday + 1 } : p)
      }
    } catch { clearInterval(stepRef.current!); setErr('Erro de conexão. Tente novamente.') }
    setGen(false)
  }

  function download() {
    if (!result) return
    const a = document.createElement('a'); a.href = result.imageUrl
    a.download = `sheikstream-ia-${fmt.id}-${Date.now()}.png`; a.click()
  }

  const maxDay  = cfg?.config?.effective_max_per_day ?? cfg?.config?.max_per_day ?? 10
  const used    = cfg?.usedToday ?? 0
  const usePct  = Math.min((used / maxDay) * 100, 100)
  const cdTotal = cfg?.config?.cooldown_seconds ?? 1
  const cdPct   = cd > 0 ? Math.min((cd / cdTotal) * 100, 100) : 0
  const canGen  = cd === 0 && !gen && used < maxDay && prompt.trim().length > 0

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: '1rem' }}>
      <style>{CSS}</style>
      <div style={{ fontSize: '2.5rem', animation: 'ia-spin 2s linear infinite', display: 'inline-block' }}>🎨</div>
      <span style={{ color: 'rgba(232,230,248,.45)', fontSize: '.9rem' }}>Carregando...</span>
    </div>
  )

  if (denied) return (
    <div style={{ maxWidth: 480, margin: '5rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
      <style>{CSS}</style>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(155,48,255,.1)', border: '1px solid rgba(155,48,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2.2rem' }}>🔒</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e8e6f8', marginBottom: '.6rem' }}>Acesso restrito</div>
      <div style={{ fontSize: '.9rem', color: 'rgba(232,230,248,.5)', lineHeight: 1.7 }}>
        Esta funcionalidade é liberada pelo administrador para grupos específicos.<br/>Fale com o dono do canal para solicitar acesso.
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', padding: '0 0 4rem' }}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#e8e6f8', display: 'flex', alignItems: 'center', gap: '.55rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🎨</span> IA de Imagens
          </h1>
          <p style={{ margin: '.3rem 0 0', fontSize: '.875rem', color: 'rgba(232,230,248,.45)' }}>
            Crie banners, fotos de perfil e overlays com inteligência artificial.
          </p>
        </div>

        {/* Stats badges */}
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
          {/* Usage */}
          <div style={{ background: '#0d0f18', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '.55rem .9rem', minWidth: 120 }}>
            <div style={{ fontSize: '.62rem', fontWeight: 700, color: 'rgba(232,230,248,.3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.35rem' }}>Uso hoje</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: used >= maxDay ? '#f87171' : '#e8e6f8' }}>{used}</span>
              <span style={{ fontSize: '.75rem', color: 'rgba(232,230,248,.35)', fontWeight: 600 }}>/ {maxDay}</span>
            </div>
            <div className="ia-prog-bar" style={{ marginTop: '.4rem' }}>
              <div className="ia-prog-fill" style={{ width: `${usePct}%`, background: used >= maxDay ? '#ef4444' : undefined }} />
            </div>
          </div>

          {/* Cooldown */}
          {cfg?.config?.cooldown_seconds && (
            <div style={{ background: '#0d0f18', border: `1px solid ${cd > 0 ? 'rgba(251,191,36,.25)' : 'rgba(255,255,255,.07)'}`, borderRadius: 10, padding: '.55rem .9rem', minWidth: 120, transition: 'border-color .3s' }}>
              <div style={{ fontSize: '.62rem', fontWeight: 700, color: 'rgba(232,230,248,.3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.35rem' }}>Cooldown</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: cd > 0 ? '#fbbf24' : '#22c55e' }}>{cd > 0 ? fmtTime(cd) : 'Livre'}</div>
              {cd > 0 && (
                <div className="ia-prog-bar" style={{ marginTop: '.4rem' }}>
                  <div className="ia-prog-fill" style={{ width: `${cdPct}%`, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)' }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Format selector */}
          <div className="ia-card">
            <div className="ia-label">Tipo de imagem</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
              {FORMATS.map(f => (
                <button key={f.id} className={`ia-fmt${fmt.id === f.id ? ' on' : ''}`} onClick={() => setFmt(f)}>
                  {/* Aspect ratio preview box */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 28 }}>
                    <div style={{
                      width:  Math.min(f.rw, 34),
                      height: Math.round(Math.min(f.rw, 34) * (f.rh / f.rw)),
                      maxHeight: 26,
                      borderRadius: 2,
                      background: fmt.id === f.id ? 'rgba(155,48,255,.5)' : 'rgba(255,255,255,.12)',
                      border: `1px solid ${fmt.id === f.id ? 'rgba(155,48,255,.8)' : 'rgba(255,255,255,.18)'}`,
                      transition: 'all .2s',
                    }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '.8rem', fontWeight: 700, color: fmt.id === f.id ? '#c084fc' : '#e8e6f8', lineHeight: 1.2 }}>{f.label}</div>
                    <div style={{ fontSize: '.67rem', color: 'rgba(232,230,248,.4)', marginTop: '.1rem' }}>{f.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div className="ia-card">
            <div className="ia-label">Qualidade</div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {(['standard', 'hd'] as const).map(q => (
                <button key={q} className={`ia-qual${quality === q ? ' on' : ''}`} onClick={() => setQuality(q)}>
                  <div style={{ fontWeight: 800, fontSize: '.8rem', color: quality === q ? '#c084fc' : 'rgba(232,230,248,.65)', textAlign: 'center' }}>
                    {q === 'standard' ? '⚡ Padrão' : '✨ HD'}
                  </div>
                  <div style={{ fontSize: '.65rem', color: 'rgba(232,230,248,.3)', textAlign: 'center', marginTop: '.15rem' }}>
                    {q === 'standard' ? 'Rápido' : 'Mais detalhado'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reference images */}
          <div className="ia-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.65rem' }}>
              <div className="ia-label" style={{ margin: 0 }}>Referências <span style={{ fontWeight: 400, color: 'rgba(232,230,248,.2)' }}>(opcional)</span></div>
              {refs.length > 0 && (
                <button onClick={() => { setRefs([]); if (fileRef.current) fileRef.current.value = '' }}
                  style={{ fontSize: '.65rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  limpar
                </button>
              )}
            </div>

            {refs.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.35rem', marginBottom: '.5rem' }}>
                {refs.map((img, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 7, overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button onClick={() => setRefs(p => p.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,.8)', border: 'none', borderRadius: 3, color: '#fff', fontSize: '.6rem', padding: '.1rem .3rem', cursor: 'pointer', lineHeight: 1 }}>
                      ✕
                    </button>
                  </div>
                ))}
                <button onClick={() => fileRef.current?.click()}
                  style={{ aspectRatio: '1', background: 'rgba(255,255,255,.03)', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 7, color: 'rgba(232,230,248,.3)', fontSize: '1.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  +
                </button>
              </div>
            ) : (
              <div
                className={`ia-drop${dragOver ? ' over' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)) }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '.4rem' }}>📸</div>
                <div style={{ fontSize: '.75rem', color: 'rgba(232,230,248,.45)', fontWeight: 600 }}>Arraste ou clique</div>
                <div style={{ fontSize: '.65rem', color: 'rgba(232,230,248,.25)', marginTop: '.2rem' }}>Ctrl+V também funciona</div>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={e => { addFiles(Array.from(e.target.files ?? [])); if (fileRef.current) fileRef.current.value = '' }} />

            {refs.length > 0 && (
              <div style={{ fontSize: '.63rem', color: 'rgba(232,230,248,.3)', marginTop: '.35rem' }}>
                A IA usará {refs.length === 1 ? 'esta imagem' : `estas ${refs.length} imagens`} como referência visual
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Prompt */}
          <div className="ia-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
              <div className="ia-label" style={{ margin: 0 }}>Descreva a imagem</div>
              <span style={{ fontSize: '.65rem', color: prompt.length > 800 ? '#f87171' : 'rgba(232,230,248,.25)', transition: 'color .2s' }}>{prompt.length}/1000</span>
            </div>

            <textarea
              ref={taRef}
              className="ia-ta"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={EXAMPLES[0]}
              maxLength={1000}
              rows={6}
            />

            {/* Style hint chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginTop: '.75rem' }}>
              {HINTS.map((h, i) => (
                <button key={i} className={`ia-chip${active.has(i) ? ' on' : ''}`} onClick={() => toggleHint(i)}>
                  {h.e} {h.l}
                </button>
              ))}
            </div>

            {/* Examples */}
            <div style={{ marginTop: '.85rem' }}>
              <button
                onClick={() => setShowEx(p => !p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.7rem', color: 'rgba(232,230,248,.35)', padding: '0 0 .4rem', display: 'flex', alignItems: 'center', gap: '.3rem', fontFamily: 'inherit' }}
              >
                <span style={{ transition: 'transform .2s', display: 'inline-block', transform: showEx ? 'rotate(90deg)' : 'none' }}>▶</span>
                Exemplos de prompt
              </button>
              {showEx && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', animation: 'ia-up .2s ease' }}>
                  {EXAMPLES.map((ex, i) => (
                    <button key={i} className="ia-ex" onClick={() => { setPrompt(ex); setShowEx(false) }}>
                      {ex}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notices */}
          {err && <div className="ia-notice ia-err"><span>⚠</span> {err}</div>}
          {cd > 0 && <div className="ia-notice ia-warn"><span>⏳</span> Aguarde <strong style={{ margin: '0 .15rem' }}>{fmtTime(cd)}</strong> para gerar outra imagem</div>}
          {used >= maxDay && <div className="ia-notice ia-err"><span>🚫</span> Limite de {maxDay} imagens por dia atingido. Volte amanhã!</div>}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={!canGen}
            className={`ia-btn-gen${canGen ? ' ready' : ''}${gen ? ' loading' : ''}`}
          >
            {gen ? (
              <>
                <span style={{ fontSize: '1.3rem', animation: 'ia-spin 1.5s linear infinite', display: 'inline-block' }}>✨</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800 }}>{GEN_STEPS[step]}</div>
                  <div style={{ fontSize: '.72rem', opacity: .65, marginTop: '.1rem' }}>Pode levar até 20 segundos</div>
                </div>
              </>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span>✨</span> Gerar Imagem
                {!canGen && prompt.trim().length === 0 && <span style={{ fontSize: '.72rem', opacity: .6, fontWeight: 400 }}>— descreva a imagem</span>}
              </span>
            )}
          </button>

          {/* Generation progress */}
          {gen && (
            <div className="ia-prog-bar">
              <div className="ia-prog-fill anim" style={{ width: `${((step + 1) / GEN_STEPS.length) * 100}%` }} />
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="ia-card ia-result" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ position: 'relative' }}>
                <img src={result.imageUrl} alt="Imagem gerada" style={{ width: '100%', height: 'auto', display: 'block' }} />
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,.7)', borderRadius: 6, padding: '.25rem .55rem', fontSize: '.65rem', color: '#c084fc', fontWeight: 700, backdropFilter: 'blur(8px)' }}>
                  gpt-image-1 · {fmt.sub}
                </div>
              </div>
              <div style={{ padding: '1rem' }}>
                {result.modelUsed === 'dall-e-2' && (
                  <div style={{ fontSize: '.7rem', color: '#f59e0b', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 7, padding: '.5rem .75rem', marginBottom: '.75rem' }}>
                    ⚠ Gerado com DALL-E 2 — sua chave não tem acesso ao DALL-E 3. Ative billing em platform.openai.com.
                  </div>
                )}
                {result.revisedPrompt && result.revisedPrompt !== prompt && (
                  <details style={{ marginBottom: '.75rem' }}>
                    <summary style={{ fontSize: '.68rem', color: 'rgba(232,230,248,.35)', cursor: 'pointer', userSelect: 'none' }}>Prompt revisado pela IA</summary>
                    <div style={{ fontSize: '.7rem', color: 'rgba(232,230,248,.45)', lineHeight: 1.6, marginTop: '.35rem', padding: '.5rem', background: 'rgba(255,255,255,.03)', borderRadius: 7 }}>
                      {result.revisedPrompt}
                    </div>
                  </details>
                )}
                <div style={{ display: 'flex', gap: '.6rem' }}>
                  <button className="ia-dl ia-dl-p" onClick={download}>⬇ Baixar PNG</button>
                  <button className="ia-dl ia-dl-s" onClick={generate} disabled={!canGen}
                    style={{ cursor: canGen ? 'pointer' : 'not-allowed', opacity: canGen ? 1 : .5 }}>
                    🔄 Gerar novamente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
