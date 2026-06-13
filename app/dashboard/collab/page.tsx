'use client'
import { useEffect, useState, useCallback } from 'react'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.4)',
  vdim: 'rgba(232,230,248,0.18)', primary: '#9b30ff',
  primaryBg: 'rgba(155,48,255,0.12)', border: 'rgba(255,255,255,0.07)',
  accent: '#39ff14', green: '#22c55e',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem',
  background: '#08090d', border: `1px solid ${S.border}`,
  borderRadius: 8, color: S.text, fontSize: '0.875rem',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

const LOOKING_FOR_OPTIONS = ['Sub-only', 'Host/Raid', 'Duo stream', 'Torneio', 'Troca de raid', 'Noite de jogos', 'Parceria']
const SCHEDULE_OPTIONS = ['Seg-Sex', 'Fins de semana', 'Noturno (21h+)', 'Tarde (14-18h)', 'Madrugada', 'Variável']
const VIEWER_RANGES = ['0-50', '50-200', '200-500', '500-1k', '1k-5k', '5k+']

type Listing = {
  id: string; user_id: string; twitch_username: string; display_name: string
  avatar_url: string | null; game: string | null; description: string | null
  looking_for: string[]; schedule_tags: string[]; viewer_range: string | null
  is_active: boolean; updated_at: string
}

export default function CollabPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [myListing, setMyListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; image: string } | null>(null)

  const [form, setForm] = useState({
    game: '', description: '', looking_for: [] as string[],
    schedule_tags: [] as string[], viewer_range: '', is_active: true,
  })

  const load = useCallback(async () => {
    const [all, mine, me] = await Promise.all([
      fetch('/api/collab').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/collab?mine=1').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/me').then(r => r.ok ? r.json() : null).catch(() => null),
    ])
    setListings(Array.isArray(all) ? all : [])
    setMyListing(mine)
    if (me?.id) setCurrentUser(me)
    if (mine) {
      setForm({
        game: mine.game ?? '', description: mine.description ?? '',
        looking_for: mine.looking_for ?? [], schedule_tags: mine.schedule_tags ?? [],
        viewer_range: mine.viewer_range ?? '', is_active: mine.is_active,
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  async function save() {
    setSaving(true); setSaveMsg('')
    try {
      const r = await fetch('/api/collab', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (d.ok) { setSaveMsg('Anúncio salvo!'); setShowForm(false); load() }
      else setSaveMsg(d.error ?? 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  async function deleteListing() {
    if (!confirm('Remover seu anúncio de collab?')) return
    await fetch('/api/collab', { method: 'DELETE' })
    setMyListing(null); setShowForm(false); load()
  }

  const chipBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label} onClick={onClick}
      style={{
        padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
        cursor: 'pointer', border: `1px solid ${active ? S.primary : S.border}`,
        background: active ? S.primaryBg : 'transparent',
        color: active ? S.primary : S.muted,
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ padding: '28px 24px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: S.text, fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px' }}>
            Fila de Collab
          </h1>
          <p style={{ color: S.muted, fontSize: '0.875rem', margin: 0 }}>
            Encontre streamers para collabs, raids ou parcerias
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '9px 20px', background: S.primary, color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          {myListing ? 'Editar meu anúncio' : '+ Criar anúncio'}
        </button>
      </div>

      {/* My listing form */}
      {showForm && (
        <div style={{ background: S.card, border: `1px solid rgba(155,48,255,0.25)`, borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, color: S.text, fontSize: '1rem', marginBottom: 20 }}>
            {myListing ? 'Editar seu anúncio' : 'Criar anúncio de collab'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: S.dim, marginBottom: 6, textTransform: 'uppercase' }}>Jogo / categoria</div>
              <input style={inp} placeholder="Ex: League of Legends, Just Chatting..." value={form.game} onChange={e => setForm(f => ({ ...f, game: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: S.dim, marginBottom: 6, textTransform: 'uppercase' }}>Faixa de viewers</div>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.viewer_range} onChange={e => setForm(f => ({ ...f, viewer_range: e.target.value }))}>
                <option value="">Selecione...</option>
                {VIEWER_RANGES.map(r => <option key={r} value={r}>{r} viewers</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: S.dim, marginBottom: 6, textTransform: 'uppercase' }}>Sobre você / proposta</div>
            <textarea
              style={{ ...inp, minHeight: 80, resize: 'vertical' }}
              placeholder="Conte um pouco sobre seu estilo, o que você busca em uma collab..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: S.dim, marginBottom: 8, textTransform: 'uppercase' }}>Busco para</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LOOKING_FOR_OPTIONS.map(o => chipBtn(o, form.looking_for.includes(o), () => setForm(f => ({ ...f, looking_for: toggleArr(f.looking_for, o) }))))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: S.dim, marginBottom: 8, textTransform: 'uppercase' }}>Horários disponíveis</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SCHEDULE_OPTIONS.map(o => chipBtn(o, form.schedule_tags.includes(o), () => setForm(f => ({ ...f, schedule_tags: toggleArr(f.schedule_tags, o) }))))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={save} disabled={saving} style={{ padding: '9px 24px', background: S.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando...' : 'Publicar anúncio'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '9px 18px', background: 'transparent', color: S.muted, border: `1px solid ${S.border}`, borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              Cancelar
            </button>
            {myListing && (
              <button onClick={deleteListing} style={{ padding: '9px 18px', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', marginLeft: 'auto' }}>
                Remover anúncio
              </button>
            )}
          </div>
          {saveMsg && <div style={{ marginTop: 10, fontSize: '0.82rem', color: saveMsg === 'Anúncio salvo!' ? S.green : '#ef4444' }}>{saveMsg}</div>}
        </div>
      )}

      {/* Listings grid */}
      {loading ? (
        <div style={{ color: S.dim, textAlign: 'center', padding: '40px 0' }}>Carregando...</div>
      ) : listings.length === 0 ? (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🤝</div>
          <div style={{ color: S.text, fontWeight: 700, marginBottom: 8 }}>Nenhum anúncio ainda</div>
          <div style={{ color: S.dim, fontSize: '0.875rem' }}>Seja o primeiro a criar um anúncio de collab!</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {listings.map(l => {
            const isMe = l.user_id === currentUser?.id
            return (
              <div key={l.id} style={{
                background: S.card, border: `1px solid ${isMe ? 'rgba(155,48,255,0.3)' : S.border}`,
                borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {l.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.avatar_url} alt={l.display_name} width={44} height={44} style={{ borderRadius: '50%', border: `2px solid ${isMe ? S.primary : 'rgba(255,255,255,0.1)'}` }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: S.primaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🎮</div>
                  )}
                  <div>
                    <div style={{ fontWeight: 800, color: S.text, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {l.display_name}
                      {isMe && <span style={{ fontSize: '0.62rem', fontWeight: 700, color: S.primary, background: S.primaryBg, padding: '1px 6px', borderRadius: 4 }}>Você</span>}
                    </div>
                    <div style={{ color: S.dim, fontSize: '0.78rem' }}>twitch.tv/{l.twitch_username}</div>
                  </div>
                </div>

                {/* Game + viewers */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {l.game && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: S.muted, background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, padding: '3px 10px', borderRadius: 6 }}>🎮 {l.game}</span>}
                  {l.viewer_range && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: S.muted, background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, padding: '3px 10px', borderRadius: 6 }}>👁 {l.viewer_range}</span>}
                </div>

                {/* Description */}
                {l.description && (
                  <div style={{ fontSize: '0.82rem', color: S.muted, lineHeight: 1.55 }}>
                    {l.description.length > 120 ? l.description.slice(0, 120) + '…' : l.description}
                  </div>
                )}

                {/* Tags */}
                {l.looking_for.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {l.looking_for.map(tag => (
                      <span key={tag} style={{ fontSize: '0.7rem', fontWeight: 600, color: S.primary, background: S.primaryBg, padding: '2px 8px', borderRadius: 5 }}>{tag}</span>
                    ))}
                  </div>
                )}
                {l.schedule_tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {l.schedule_tags.map(tag => (
                      <span key={tag} style={{ fontSize: '0.7rem', fontWeight: 600, color: S.accent, background: 'rgba(57,255,20,0.08)', padding: '2px 8px', borderRadius: 5 }}>{tag}</span>
                    ))}
                  </div>
                )}

                {/* DM button */}
                {!isMe && (
                  <button
                    style={{ marginTop: 'auto', padding: '8px 0', width: '100%', background: 'rgba(155,48,255,0.1)', border: `1px solid rgba(155,48,255,0.25)`, color: S.primary, borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                    onClick={() => {
                      // Trigger ChatWidget by dispatching a custom event
                      window.dispatchEvent(new CustomEvent('openDM', { detail: { id: l.user_id, name: l.display_name, image: l.avatar_url } }))
                    }}
                  >
                    💬 Enviar mensagem
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
