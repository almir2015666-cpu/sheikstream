'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { notify } from '@/app/lib/notify'
import { useLang } from '@/lib/i18n'

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG   = '#08090d'
const CARD  = '#0f1018'
const CARD2 = '#111219'
const TEXT  = '#e8e6f8'
const MUTED = 'rgba(232,230,248,0.5)'
const DIM   = 'rgba(232,230,248,0.3)'
const VDIM  = 'rgba(232,230,248,0.12)'
const VVDIM = 'rgba(232,230,248,0.06)'
const BORDER = 'rgba(255,255,255,0.07)'
const BORDER2 = 'rgba(155,48,255,0.22)'
const PRIMARY = '#9b30ff'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.62rem 0.9rem',
  background: BG, border: `1px solid ${BORDER2}`,
  borderRadius: '8px', color: TEXT, fontSize: '0.86rem',
  outline: 'none', boxSizing: 'border-box',
}
const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(232,230,248,0.4)' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  paddingRight: '2.2rem',
}

// ─── Transition options ────────────────────────────────────────────────────────
const ENTRY_TRANSITIONS = [
  'Fade In',
  'Ricochete — entrada', 'Entrada com ricochete',
  'Ricochete entrada — para cima', 'Ricochete entrada — para direita',
  'Ricochete entrada — para esquerda', 'Ricochete entrada — para baixo',
  'Fade In — para cima', 'Fade In — para cima (grande)',
  'Fade In — para direita', 'Fade In — para direita (grande)',
  'Fade In — para esquerda', 'Fade In — para esquerda (grande)',
  'Fade In — para baixo', 'Fade In — para baixo (grande)',
  'Alta velocidade — entrada', 'Flash — entrada', 'Pulso — entrada',
  'Elástico — entrada', 'Tremor — entrada', 'Balanço — entrada',
  'Tada — entrada', 'Oscilação — entrada', 'Gelatina',
  'Dobradiça — entrada', 'Rolagem',
  'Rotação entrada — canto superior direito', 'Rotação entrada — canto superior esquerdo',
  'Deslizar entrada — para baixo', 'Deslizar entrada — para cima',
  'Deslizar entrada — para direita', 'Deslizar entrada — para esquerda',
  'Zoom In', 'Zoom In — para cima', 'Zoom In — para direita',
  'Zoom In — para esquerda', 'Zoom In — para baixo',
  'Nenhuma',
]

const EXIT_TRANSITIONS = [
  'Fade Out',
  'Ricochete — saída', 'Saída com ricochete',
  'Saída ricochete — para cima', 'Saída ricochete — para direita',
  'Saída ricochete — para esquerda', 'Saída ricochete — para baixo',
  'Fade Out — para cima', 'Fade Out — para cima (grande)',
  'Fade Out — para direita', 'Fade Out — para direita (grande)',
  'Fade Out — para esquerda', 'Fade Out — para esquerda (grande)',
  'Fade Out — para baixo', 'Fade Out — para baixo (grande)',
  'Alta velocidade — saída', 'Flash — saída', 'Pulso — saída',
  'Elástico — saída', 'Tremor — saída', 'Balanço — saída',
  'Tada — saída', 'Oscilação — saída', 'Gelatina — saída',
  'Dobradiça — saída', 'Rolagem — saída',
  'Rotação saída — canto superior direito', 'Rotação saída — canto superior esquerdo',
  'Deslizar saída — para baixo', 'Deslizar saída — para cima',
  'Deslizar saída — para direita', 'Deslizar saída — para esquerda',
  'Zoom Out', 'Zoom Out — para cima', 'Zoom Out — para direita',
  'Zoom Out — para esquerda', 'Zoom Out — para baixo',
  'Nenhuma',
]

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ label, desc, checked, onChange }: {
  label: string; desc?: string; checked: boolean; onChange: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.7rem 0', borderBottom: `1px solid ${VVDIM}`,
    }}>
      <div>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: TEXT }}>{label}</div>
        {desc && <div style={{ fontSize: '0.75rem', color: DIM, marginTop: '0.18rem' }}>{desc}</div>}
      </div>
      <div onClick={onChange} style={{
        width: '40px', height: '22px', borderRadius: '999px',
        background: checked ? PRIMARY : 'rgba(255,255,255,0.12)',
        cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0,
        marginLeft: '1rem',
      }}>
        <div style={{
          position: 'absolute', top: '3px', left: checked ? '21px' : '3px',
          width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
          transition: 'left 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  )
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '0.7rem', fontWeight: 800, color: DIM, letterSpacing: '1.2px',
      textTransform: 'uppercase' as const, marginBottom: '0.7rem', marginTop: '0.25rem',
    }}>{children}</div>
  )
}

// ─── Checkerboard ─────────────────────────────────────────────────────────────
function Checkerboard({ opacity }: { opacity: number }) {
  return (
    <div style={{
      width: '24px', height: '24px', borderRadius: '4px',
      flexShrink: 0, position: 'relative', overflow: 'hidden',
      backgroundImage:
        'linear-gradient(45deg, #888 25%, transparent 25%),' +
        'linear-gradient(-45deg, #888 25%, transparent 25%),' +
        'linear-gradient(45deg, transparent 75%, #888 75%),' +
        'linear-gradient(-45deg, transparent 75%, #888 75%)',
      backgroundSize: '6px 6px',
      backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `rgba(155,48,255,${opacity / 100})`,
      }} />
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Img = {
  url: string; ativa: boolean; corFundo: number; duracao: number; transicaoEntrada: string
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NovoBannerPage() {
  const { t } = useLang()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [nome, setNome] = useState('')
  const [imgs, setImgs] = useState<Img[]>([
    { url: '', ativa: true, corFundo: 0, duracao: 5, transicaoEntrada: 'Fade In' },
  ])
  const [etiqueta, setEtiqueta] = useState(false)
  const [cooldown, setCooldown] = useState(3)
  const [intervaloAleatorio, setIntervaloAleatorio] = useState(false)
  const [transicaoSaida, setTransicaoSaida] = useState('Fade Out')
  const [vis, setVis] = useState({
    habilitado: true, meta: false, sorteio: false,
    metaSubs: false, subathon: false, patrocinadores: true,
  })

  function addImg() {
    setImgs(p => [...p, { url: '', ativa: true, corFundo: 0, duracao: 5, transicaoEntrada: 'Fade In' }])
  }
  function updateImg(i: number, patch: Partial<Img>) {
    setImgs(p => p.map((img, idx) => idx === i ? { ...img, ...patch } : img))
  }
  function moveImg(i: number, dir: -1 | 1) {
    setImgs(p => {
      const next = [...p]
      const j = i + dir
      if (j < 0 || j >= next.length) return p;
      [next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }
  function removeImg(i: number) {
    setImgs(p => p.filter((_, idx) => idx !== i))
  }

  async function salvar() {
    if (!nome.trim()) { notify('Nome do banner é obrigatório', 'error'); return }
    const imgsSalvas = imgs.filter(i => i.url.trim())
    if (imgsSalvas.length === 0) { notify('Adicione pelo menos uma imagem com URL', 'error'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(), imgs: imgsSalvas, etiqueta,
          cooldown, intervalo_aleatorio: intervaloAleatorio,
          transicao_saida: transicaoSaida, vis,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        notify(err.error || 'Erro ao salvar banner', 'error')
      } else {
        notify('Banner criado com sucesso!', 'success')
        router.push('/dashboard/banners')
      }
    } catch {
      notify('Erro ao salvar banner', 'error')
    } finally {
      setSaving(false)
    }
  }

  const previewUrl = imgs.find(i => i.url.trim())?.url ?? ''

  return (
    <div style={{
      background: BG, minHeight: '100vh',
      padding: '1.5rem 2rem 3rem',
      fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: TEXT,
    }}>
      <style>{`
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${PRIMARY}; cursor: pointer; box-shadow: 0 0 0 3px rgba(155,48,255,0.2); }
        select option { background: #0f1018; color: ${TEXT}; }
        input::placeholder { color: ${DIM}; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.8rem' }}>
        <Link href="/dashboard/banners" style={{
          color: DIM, textDecoration: 'none', fontSize: '0.82rem',
          display: 'flex', alignItems: 'center', gap: '0.25rem',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          {t('pt_banners') ?? 'Voltar'}
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: TEXT }}>
          {t('banner_new_page_title') ?? 'Novo banner'}
        </h2>
        <span style={{
          fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.8px',
          background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
          border: '1px solid rgba(251,191,36,0.2)', borderRadius: '4px',
          padding: '0.18rem 0.55rem', textTransform: 'uppercase' as const,
        }}>ATUALIZADO</span>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── LEFT FORM ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

          {/* Nome */}
          <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '1.4rem 1.5rem', marginBottom: '1rem' }}>
            <SectionLabel>Nome do Patrocinador / Campanha</SectionLabel>
            <input
              value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Ex: Marca XYZ" style={inputStyle}
            />
            <div style={{ fontSize: '0.72rem', color: DIM, marginTop: '0.55rem', lineHeight: 1.5 }}>
              Várias imagens rodam em sequência dentro do mesmo banner (ordem definida abaixo).
            </div>
          </div>

          {/* Imagens */}
          <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '1.4rem 1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <SectionLabel>Imagens do Banner</SectionLabel>
              <button onClick={addImg} style={{
                padding: '0.42rem 0.9rem', background: 'rgba(155,48,255,0.1)',
                border: `1px solid rgba(155,48,255,0.3)`, color: PRIMARY,
                borderRadius: '7px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '-0.25rem',
              }}>
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> Adicionar imagem
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: DIM, marginBottom: '1rem', lineHeight: 1.5 }}>
              Faça upload da imagem em Imgur, Google Drive (link público), Discord ou similar e cole a URL HTTPS aqui.
            </div>

            {imgs.map((img, i) => (
              <div key={i} style={{
                background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: '10px', padding: '1.1rem 1.2rem', marginBottom: '0.75rem',
              }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: MUTED, flex: 1 }}>
                    Imagem {i + 1}
                  </span>
                  {/* Up/down */}
                  {imgs.length > 1 && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => moveImg(i, -1)} disabled={i === 0}
                        style={{ background: 'transparent', border: 'none', color: i === 0 ? VDIM : DIM, cursor: i === 0 ? 'default' : 'pointer', padding: '0.2rem 0.3rem', fontSize: '0.7rem' }}>
                        ▲
                      </button>
                      <button onClick={() => moveImg(i, 1)} disabled={i === imgs.length - 1}
                        style={{ background: 'transparent', border: 'none', color: i === imgs.length - 1 ? VDIM : DIM, cursor: i === imgs.length - 1 ? 'default' : 'pointer', padding: '0.2rem 0.3rem', fontSize: '0.7rem' }}>
                        ▼
                      </button>
                    </div>
                  )}
                  {/* Active toggle */}
                  <span style={{ fontSize: '0.72rem', color: DIM }}>Ativa</span>
                  <div onClick={() => updateImg(i, { ativa: !img.ativa })} style={{
                    width: '36px', height: '20px', borderRadius: '999px',
                    background: img.ativa ? PRIMARY : 'rgba(255,255,255,0.12)',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0,
                  }}>
                    <div style={{
                      position: 'absolute', top: '2px', left: img.ativa ? '18px' : '2px',
                      width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                      transition: 'left 0.15s',
                    }} />
                  </div>
                  {/* Delete */}
                  {imgs.length > 1 && (
                    <button onClick={() => removeImg(i)} style={{
                      background: 'transparent', border: 'none', color: 'rgba(255,68,68,0.6)',
                      cursor: 'pointer', padding: '0.2rem', fontSize: '0.85rem', lineHeight: 1,
                    }}>
                      🗑
                    </button>
                  )}
                </div>

                {/* URL input */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0',
                  background: BG, border: `1px solid ${BORDER2}`, borderRadius: '8px',
                  marginBottom: '1rem', overflow: 'hidden',
                }}>
                  <span style={{ padding: '0 0.75rem', color: DIM, fontSize: '0.88rem', flexShrink: 0 }}>🔗</span>
                  <input
                    value={img.url} onChange={e => updateImg(i, { url: e.target.value })}
                    placeholder="https://i.imgur.com/exemplo.png"
                    style={{ ...inputStyle, border: 'none', borderRadius: 0, paddingLeft: 0 }}
                  />
                </div>

                {/* BG color */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: DIM, letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: '0.5rem' }}>
                    Cor de Fundo — {img.corFundo}%
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <Checkerboard opacity={img.corFundo} />
                    <input type="range" min={0} max={100} value={img.corFundo}
                      onChange={e => updateImg(i, { corFundo: Number(e.target.value) })}
                      style={{ flex: 1, accentColor: PRIMARY }}
                    />
                  </div>
                </div>

                {/* Entry transition */}
                <div style={{ marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: DIM, letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: '0.5rem' }}>
                    Transição de Entrada
                  </div>
                  <select value={img.transicaoEntrada}
                    onChange={e => updateImg(i, { transicaoEntrada: e.target.value })}
                    style={selectStyle}>
                    {ENTRY_TRANSITIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <div style={{ fontSize: '0.7rem', color: DIM, marginTop: '0.4rem', lineHeight: 1.5 }}>
                    Efeito ao exibir esta imagem no carrossel. Ideal para PNG sem fundo com cor de fundo acima.
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: DIM, letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: '0.5rem' }}>
                    Duração — {img.duracao}S
                  </div>
                  <input type="range" min={3} max={60} value={img.duracao}
                    onChange={e => updateImg(i, { duracao: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: PRIMARY }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Etiqueta + Cooldown */}
          <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '1.4rem 1.5rem', marginBottom: '1rem' }}>
            <Toggle
              label="Etiqueta de apoio (flag)"
              checked={etiqueta}
              onChange={() => setEtiqueta(p => !p)}
            />
            <div style={{
              background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: '10px', padding: '1.1rem 1.2rem', marginTop: '0.75rem',
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: DIM, letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: '0.5rem' }}>
                Cooldown Entre Ciclos — {cooldown} MIN
              </div>
              <input type="range" min={0} max={60} value={cooldown}
                onChange={e => setCooldown(Number(e.target.value))}
                style={{ width: '100%', accentColor: PRIMARY, marginBottom: '0.5rem' }}
              />
              <div style={{ fontSize: '0.72rem', color: DIM, lineHeight: 1.5, marginBottom: '0.9rem' }}>
                Tempo de espera após exibir todos os banners antes de reiniciar o carrossel (0 = imediato).
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: TEXT }}>Intervalo aleatório</div>
                  <div style={{ fontSize: '0.73rem', color: DIM, marginTop: '0.15rem' }}>Reinicia sempre após o cooldown fixo acima.</div>
                </div>
                <div onClick={() => setIntervaloAleatorio(p => !p)} style={{
                  width: '40px', height: '22px', borderRadius: '999px',
                  background: intervaloAleatorio ? PRIMARY : 'rgba(255,255,255,0.12)',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute', top: '3px', left: intervaloAleatorio ? '21px' : '3px',
                    width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.15s',
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Exit transition */}
          <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '1.4rem 1.5rem', marginBottom: '1rem' }}>
            <SectionLabel>Transição de Saída do Banner</SectionLabel>
            <select value={transicaoSaida} onChange={e => setTransicaoSaida(e.target.value)} style={selectStyle}>
              {EXIT_TRANSITIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div style={{ fontSize: '0.72rem', color: DIM, marginTop: '0.5rem', lineHeight: 1.5 }}>
              Efeito ao encerrar a última imagem do banner, antes do cooldown. Entre imagens do mesmo banner usa a transição de entrada de cada slide.
            </div>
          </div>

          {/* Visibility toggles */}
          <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '1.4rem 1.5rem', marginBottom: '1.5rem' }}>
            <Toggle label="Banner habilitado" checked={vis.habilitado} onChange={() => setVis(p => ({ ...p, habilitado: !p.habilitado }))} />
            <Toggle label="Exibir no overlay de meta" desc="Sobrepõe o conteúdo dentro da borda do overlay" checked={vis.meta} onChange={() => setVis(p => ({ ...p, meta: !p.meta }))} />
            <Toggle label="Exibir no overlay de sorteio" desc="Sobrepõe o conteúdo dentro da borda do overlay" checked={vis.sorteio} onChange={() => setVis(p => ({ ...p, sorteio: !p.sorteio }))} />
            <Toggle label="Exibir no overlay de Meta de Subs" desc="Sobrepõe o banner na meta de assinaturas" checked={vis.metaSubs} onChange={() => setVis(p => ({ ...p, metaSubs: !p.metaSubs }))} />
            <Toggle label="Exibir no overlay de Subathon" desc="Sobrepõe o banner no cronômetro do subathon" checked={vis.subathon} onChange={() => setVis(p => ({ ...p, subathon: !p.subathon }))} />
            <div style={{ borderBottom: 'none' }}>
              <Toggle label="Incluir no Overlay patrocinadores" checked={vis.patrocinadores} onChange={() => setVis(p => ({ ...p, patrocinadores: !p.patrocinadores }))} />
            </div>
          </div>

          {/* Bottom action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={salvar} disabled={saving} style={{
              padding: '0.7rem 2rem', background: saving ? 'rgba(155,48,255,0.5)' : PRIMARY,
              color: '#fff', border: 'none', borderRadius: '9px',
              fontSize: '0.88rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(155,48,255,0.35)',
            }}>
              {saving ? 'Salvando...' : 'Salvar banners'}
            </button>
            <Link href="/dashboard/banners" style={{
              padding: '0.7rem 1.5rem', background: 'transparent',
              border: `1px solid ${BORDER}`, color: MUTED,
              borderRadius: '9px', fontSize: '0.88rem', fontWeight: 600,
              cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
            }}>
              {t('action_cancel') ?? 'Cancelar'}
            </Link>
          </div>
        </div>

        {/* ── RIGHT PREVIEW PANEL ── */}
        <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
            {/* Panel header */}
            <div style={{
              padding: '0.85rem 1.2rem', borderBottom: `1px solid ${BORDER}`,
              fontSize: '0.7rem', fontWeight: 800, color: DIM,
              letterSpacing: '1.2px', textTransform: 'uppercase' as const,
            }}>
              Pré-Visualização ao Vivo
            </div>

            <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Overlay Meta */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: DIM, letterSpacing: '1px', textTransform: 'uppercase' as const }}>Overlay Meta</span>
                  <a href="/dashboard/overlays/meta" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.7rem', color: MUTED, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Abrir
                  </a>
                </div>
                <div style={{
                  background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px',
                  padding: '0.9rem', minHeight: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {vis.meta && previewUrl ? (
                    <img src={previewUrl} alt="" style={{ maxWidth: '100%', maxHeight: '70px', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: VDIM, textAlign: 'center', lineHeight: 1.5 }}>
                      Ative &quot;Exibir no overlay de meta&quot; para ver o live view.
                    </span>
                  )}
                </div>
              </div>

              {/* Overlay Sorteio */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: DIM, letterSpacing: '1px', textTransform: 'uppercase' as const }}>Overlay Sorteio</span>
                  <a href="/dashboard/overlays/sorteio" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.7rem', color: MUTED, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Abrir
                  </a>
                </div>
                <div style={{
                  background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px',
                  padding: '0.9rem', minHeight: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {vis.sorteio && previewUrl ? (
                    <img src={previewUrl} alt="" style={{ maxWidth: '100%', maxHeight: '70px', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: VDIM, textAlign: 'center', lineHeight: 1.5 }}>
                      Ative &quot;Exibir no overlay de sorteio&quot; para ver o live view.
                    </span>
                  )}
                </div>
              </div>

              {/* Overlay Patrocinadores */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: DIM, letterSpacing: '1px', textTransform: 'uppercase' as const }}>Overlay Patrocinadores</span>
                  <a href="/dashboard/overlays/patrocinadores" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.7rem', color: MUTED, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Abrir
                  </a>
                </div>
                <div style={{
                  background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '0.5rem 0.8rem', borderBottom: `1px solid ${BORDER}`,
                    fontSize: '0.6rem', fontWeight: 800, color: DIM, letterSpacing: '0.8px', textTransform: 'uppercase' as const,
                  }}>
                    Live View — Overlay Patrocinadores
                  </div>
                  <div style={{
                    margin: '0.75rem', border: `1px dashed rgba(255,255,255,0.12)`,
                    borderRadius: '6px', minHeight: '90px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {vis.patrocinadores && previewUrl ? (
                      <img src={previewUrl} alt="" style={{ maxWidth: '100%', maxHeight: '88px', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: VDIM }}>Adicione uma URL</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '0.67rem', color: VDIM, marginTop: '0.5rem', lineHeight: 1.55 }}>
                  Dimensões e fundo do widget conforme salvo em Overlays → Patrocinadores (320×120px).
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
