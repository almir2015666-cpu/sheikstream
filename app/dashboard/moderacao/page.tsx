'use client'
import { useEffect, useState, useCallback } from 'react'
import { useLang } from '@/lib/i18n'

const S = {
  bg: '#08090d', card: '#111219', text: '#e8e6f8',
  muted: 'rgba(232,230,248,0.65)', dim: 'rgba(232,230,248,0.45)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.12)',
  border: 'rgba(255,255,255,0.06)', borderP: 'rgba(155,48,255,0.2)',
  red: '#ef4444', green: '#22c55e',
}

type Tab = 'words' | 'slowmode' | 'banned'

type ModConfig = {
  banned_words: string[]
  banned_users: string[]
  slow_mode_twitch: number
  slow_mode_kick: number
  slow_mode_youtube: number
  timeout_violations: number
  is_active: boolean
}

const DEFAULT_CONFIG: ModConfig = {
  banned_words: [], banned_users: [],
  slow_mode_twitch: 0, slow_mode_kick: 0, slow_mode_youtube: 0,
  timeout_violations: 3, is_active: false,
}

const PLATFORM_COLORS: Record<string, string> = {
  Twitch: '#9b30ff', Kick: '#22c55e', YouTube: '#ef4444',
}

export default function ModeracaoPage() {
  const { t } = useLang()
  const [tab, setTab] = useState<Tab>('words')
  const [config, setConfig] = useState<ModConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newWord, setNewWord] = useState('')
  const [newUser, setNewUser] = useState('')

  const LS_KEY = 'sk-moderacao'

  function lsLoad(): ModConfig | null {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { return null }
  }
  function lsSave(data: ModConfig) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/moderacao')
      if (r.ok) {
        const data = await r.json()
        setConfig(data)
        lsSave(data)
      } else {
        const saved = lsLoad()
        if (saved) setConfig(saved)
      }
    } catch {
      const saved = lsLoad()
      if (saved) setConfig(saved)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      lsSave(config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      fetch('/api/moderacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }).catch(() => {})
    } finally {
      setSaving(false)
    }
  }

  function addWord() {
    const w = newWord.trim().toLowerCase()
    if (!w || config.banned_words.includes(w)) return
    setConfig(c => ({ ...c, banned_words: [...c.banned_words, w] }))
    setNewWord('')
  }

  function removeWord(w: string) {
    setConfig(c => ({ ...c, banned_words: c.banned_words.filter(x => x !== w) }))
  }

  function addUser() {
    const u = newUser.trim().toLowerCase()
    if (!u || config.banned_users.includes(u)) return
    setConfig(c => ({ ...c, banned_users: [...c.banned_users, u] }))
    setNewUser('')
  }

  function removeUser(u: string) {
    setConfig(c => ({ ...c, banned_users: c.banned_users.filter(x => x !== u) }))
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'words', label: t('mod_tab_words') },
    { id: 'slowmode', label: t('mod_tab_slowmode') },
    { id: 'banned', label: t('mod_tab_banned') },
  ]

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: S.text, fontWeight: 700, fontSize: '1.3rem', margin: 0 }}>{t('pt_moderacao')}</h1>
          <p style={{ color: S.muted, fontSize: '0.82rem', margin: '0.25rem 0 0' }}>
            {config.banned_words.length} palavras · {config.banned_users.length} usuários banidos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={() => setConfig(c => ({ ...c, is_active: !c.is_active }))} style={{
            padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem',
            cursor: 'pointer', border: 'none',
            background: config.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
            color: config.is_active ? S.green : S.muted,
          }}>
            {config.is_active ? `✓ ${t('mod_active')}` : t('mod_inactive')}
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            background: S.primary, color: '#fff', border: 'none', borderRadius: '10px',
            padding: '0.6rem 1.25rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            opacity: saving ? 0.7 : 1,
          }}>
            {saved ? '✓ Salvo!' : saving ? '...' : t('mod_save')}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: S.dim, padding: '3rem' }}>Carregando...</div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.25rem', marginBottom: '1.25rem', width: 'fit-content' }}>
            {tabs.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{
                padding: '0.45rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem',
                cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: tab === tb.id ? S.primary : 'transparent',
                color: tab === tb.id ? '#fff' : S.muted,
              }}>{tb.label}</button>
            ))}
          </div>

          {/* Words tab */}
          {tab === 'words' && (
            <div>
              <div style={{ background: S.card, borderRadius: '12px', border: `1px solid ${S.border}`, padding: '1.25rem', marginBottom: '1rem' }}>
                <SectionTitle>Adicionar palavra ou frase</SectionTitle>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={newWord}
                    onChange={e => setNewWord(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addWord()}
                    placeholder={t('mod_word_ph')}
                    style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                  />
                  <button onClick={addWord} style={{ background: S.primary, color: '#fff', border: 'none', borderRadius: '9px', padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', flexShrink: 0 }}>
                    {t('mod_add_word')}
                  </button>
                </div>
              </div>

              <div style={{ background: S.card, borderRadius: '12px', border: `1px solid ${S.border}`, padding: '1rem 1.25rem' }}>
                <SectionTitle>{t('mod_tab_words')} ({config.banned_words.length})</SectionTitle>
                {config.banned_words.length === 0 ? (
                  <div style={{ color: S.dim, fontSize: '0.83rem', padding: '1rem 0', textAlign: 'center' }}>{t('mod_no_words')}</div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {config.banned_words.map(w => (
                      <span key={w} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '99px', padding: '0.25rem 0.65rem', fontSize: '0.78rem', color: '#fca5a5' }}>
                        {w}
                        <button onClick={() => removeWord(w)} style={{ background: 'transparent', border: 'none', color: S.red, cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '0.85rem' }}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: S.card, borderRadius: '12px', border: `1px solid ${S.border}`, padding: '1rem 1.25rem', marginTop: '1rem' }}>
                <SectionTitle>{t('mod_timeout_label')}</SectionTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="number" min={1} max={10}
                    value={config.timeout_violations}
                    onChange={e => setConfig(c => ({ ...c, timeout_violations: Number(e.target.value) }))}
                    style={{ ...inputStyle, marginBottom: 0, width: 80 }}
                  />
                  <span style={{ color: S.muted, fontSize: '0.83rem' }}>violações → timeout automático</span>
                </div>
              </div>
            </div>
          )}

          {/* Slow mode tab */}
          {tab === 'slowmode' && (
            <div style={{ background: S.card, borderRadius: '12px', border: `1px solid ${S.border}`, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {(['twitch', 'kick', 'youtube'] as const).map(p => {
                const key = `slow_mode_${p}` as 'slow_mode_twitch' | 'slow_mode_kick' | 'slow_mode_youtube'
                const val = config[key]
                const pName = p.charAt(0).toUpperCase() + p.slice(1)
                return (
                  <div key={p}>
                    <SectionTitle style={{ color: PLATFORM_COLORS[pName], marginBottom: '0.5rem' }}>{pName}</SectionTitle>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input type="range" min={0} max={120} step={5} value={val}
                        onChange={e => setConfig(c => ({ ...c, [key]: Number(e.target.value) }))}
                        style={{ flex: 1, accentColor: PLATFORM_COLORS[pName] }} />
                      <span style={{ color: S.text, fontWeight: 700, fontSize: '0.9rem', minWidth: 52, textAlign: 'right' }}>
                        {val === 0 ? t('mod_slowmode_off') : `${val}s`}
                      </span>
                    </div>
                    <div style={{ color: S.dim, fontSize: '0.72rem', marginTop: '0.2rem' }}>{t('mod_slowmode_label')}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Banned users tab */}
          {tab === 'banned' && (
            <div>
              <div style={{ background: S.card, borderRadius: '12px', border: `1px solid ${S.border}`, padding: '1.25rem', marginBottom: '1rem' }}>
                <SectionTitle>Banir usuário</SectionTitle>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={newUser}
                    onChange={e => setNewUser(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addUser()}
                    placeholder="Username..."
                    style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                  />
                  <button onClick={addUser} style={{ background: S.red, color: '#fff', border: 'none', borderRadius: '9px', padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', flexShrink: 0 }}>
                    Banir
                  </button>
                </div>
              </div>

              <div style={{ background: S.card, borderRadius: '12px', border: `1px solid ${S.border}`, padding: '1rem 1.25rem' }}>
                <SectionTitle>{t('mod_tab_banned')} ({config.banned_users.length})</SectionTitle>
                {config.banned_users.length === 0 ? (
                  <div style={{ color: S.dim, fontSize: '0.83rem', padding: '1rem 0', textAlign: 'center' }}>{t('mod_no_banned')}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {config.banned_users.map(u => (
                      <div key={u} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: S.red }}>🚫</div>
                          <span style={{ color: S.text, fontSize: '0.85rem' }}>@{u}</span>
                        </div>
                        <button onClick={() => removeUser(u)} style={{ background: 'transparent', border: `1px solid rgba(239,68,68,0.25)`, color: S.red, borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', cursor: 'pointer' }}>
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ color: 'rgba(232,230,248,0.55)', fontSize: '0.73rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', ...style }}>{children}</div>
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '9px', padding: '0.55rem 0.85rem', color: '#e8e6f8', fontSize: '0.85rem',
  marginBottom: '1rem', outline: 'none', boxSizing: 'border-box',
}
