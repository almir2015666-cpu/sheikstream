'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

type Note = { id: string; title: string; content: string; updatedAt: string }

const mk = (): Note => ({ id: crypto.randomUUID(), title: '', content: '', updatedAt: new Date().toISOString() })

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const CSS = `
.nota-ta { background: transparent; border: none; outline: none; resize: none; width: 100%; font-family: inherit; color: inherit; }
.nota-ta::placeholder { color: rgba(232,230,248,.2); }
.nota-item { cursor: pointer; border-radius: 10px; padding: .55rem .75rem; transition: background .15s; border: 1px solid transparent; }
.nota-item:hover { background: rgba(155,48,255,.07); }
.nota-item.active { background: rgba(155,48,255,.12); border-color: rgba(155,48,255,.25); }
.nota-del { opacity: 0; transition: opacity .15s; background: transparent; border: none; cursor: pointer; padding: 2px 5px; border-radius: 4px; color: rgba(232,230,248,.4); font-size: .75rem; }
.nota-item:hover .nota-del { opacity: 1; }
.nota-del:hover { background: rgba(239,68,68,.15); color: #ef4444; }
.nota-scroll::-webkit-scrollbar { width: 4px; }
.nota-scroll::-webkit-scrollbar-track { background: transparent; }
.nota-scroll::-webkit-scrollbar-thumb { background: rgba(155,48,255,.25); border-radius: 4px; }
@media (max-width: 640px) { .nota-sidebar { display: none !important; } }
`

export default function NotasPage() {
  const [notes, setNotes]       = useState<Note[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [status, setStatus]     = useState<'saved' | 'saving' | 'error'>('saved')
  const [loaded, setLoaded]     = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const active = notes.find(n => n.id === activeId) ?? null

  useEffect(() => {
    fetch('/api/notas')
      .then(r => r.ok ? r.json() : { notes: [] })
      .then(d => {
        const list: Note[] = d.notes?.length ? d.notes : [mk()]
        setNotes(list)
        setActiveId(list[0].id)
        setLoaded(true)
      })
      .catch(() => { const n = mk(); setNotes([n]); setActiveId(n.id); setLoaded(true) })
  }, [])

  const persist = useCallback((list: Note[]) => {
    setStatus('saving')
    fetch('/api/notas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: list }) })
      .then(r => setStatus(r.ok ? 'saved' : 'error'))
      .catch(() => setStatus('error'))
  }, [])

  const schedule = useCallback((list: Note[]) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => persist(list), 1500)
  }, [persist])

  const update = (id: string, patch: Partial<Note>) => {
    const next = notes.map(n => n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)
    setNotes(next); schedule(next)
  }

  const addNote = () => {
    const n = mk()
    const next = [n, ...notes]
    setNotes(next); setActiveId(n.id); schedule(next)
    setTimeout(() => taRef.current?.focus(), 50)
  }

  const deleteNote = (id: string) => {
    const next = notes.filter(n => n.id !== id)
    const list = next.length ? next : [mk()]
    setNotes(list)
    if (activeId === id) setActiveId(list[0].id)
    schedule(list)
  }

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'rgba(232,230,248,.35)', fontSize: '.9rem' }}>
      <style>{CSS}</style>
      Carregando...
    </div>
  )

  return (
    <div style={{ height: 'calc(100vh - 56px)', display: 'flex', overflow: 'hidden' }}>
      <style>{CSS}</style>

      {/* ── Sidebar ── */}
      <div className="nota-sidebar" style={{ width: 230, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '.9rem 1rem .6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'rgba(232,230,248,.35)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Notas ({notes.length})</span>
          <button onClick={addNote} title="Nova nota"
            style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(155,48,255,.12)', border: '1px solid rgba(155,48,255,.25)', color: '#9b30ff', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            +
          </button>
        </div>

        {/* List */}
        <div className="nota-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 .5rem .5rem' }}>
          {notes.map(n => (
            <div key={n.id} className={`nota-item${n.id === activeId ? ' active' : ''}`}
              onClick={() => setActiveId(n.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.25rem' }}>
                <div style={{ fontSize: '.82rem', fontWeight: n.id === activeId ? 700 : 500, color: n.id === activeId ? '#c084fc' : 'rgba(232,230,248,.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {n.title || <span style={{ opacity: .4 }}>Sem título</span>}
                </div>
                <button className="nota-del" onClick={e => { e.stopPropagation(); deleteNote(n.id) }} title="Excluir">✕</button>
              </div>
              <div style={{ fontSize: '.67rem', color: 'rgba(232,230,248,.3)', marginTop: '.15rem', display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                <span>{fmtDate(n.updatedAt)}</span>
                {n.content && <span style={{ opacity: .5 }}>· {n.content.slice(0, 30).replace(/\n/g, ' ')}{n.content.length > 30 ? '…' : ''}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Editor ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {active ? (
          <>
            {/* Top bar */}
            <div style={{ padding: '.75rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <input
                value={active.title}
                onChange={e => update(active.id, { title: e.target.value })}
                placeholder="Título da nota..."
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '1rem', fontWeight: 700, color: 'rgba(232,230,248,.9)', flex: 1, fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0, marginLeft: '1rem' }}>
                <span style={{ fontSize: '.67rem', color: 'rgba(232,230,248,.25)', fontStyle: 'italic' }}>
                  {status === 'saving' ? '💾 salvando...' : status === 'error' ? '⚠️ erro ao salvar' : `✓ salvo · ${fmtDate(active.updatedAt)}`}
                </span>
                <button onClick={addNote}
                  style={{ padding: '.3rem .7rem', borderRadius: 7, background: 'rgba(155,48,255,.1)', border: '1px solid rgba(155,48,255,.25)', color: '#9b30ff', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700 }}>
                  + Nova
                </button>
              </div>
            </div>

            {/* Content */}
            <textarea
              ref={taRef}
              className="nota-ta nota-scroll"
              value={active.content}
              onChange={e => update(active.id, { content: e.target.value })}
              placeholder={`Escreva sua nota aqui...\n\nDica: Ctrl+Enter para salvar, Tab para indentar.`}
              style={{ flex: 1, padding: '1.25rem 1.5rem', fontSize: '.9rem', lineHeight: 1.75, color: 'rgba(232,230,248,.85)', overflowY: 'auto' }}
              onKeyDown={e => {
                if (e.key === 'Tab') { e.preventDefault(); const s = e.currentTarget; const start = s.selectionStart; const end = s.selectionEnd; const val = s.value; s.value = val.slice(0, start) + '  ' + val.slice(end); s.selectionStart = s.selectionEnd = start + 2; update(active.id, { content: s.value }) }
              }}
            />

            {/* Footer */}
            <div style={{ padding: '.45rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
              <span style={{ fontSize: '.65rem', color: 'rgba(232,230,248,.2)' }}>
                {active.content.length} caracteres · {active.content.split(/\s+/).filter(Boolean).length} palavras · {active.content.split('\n').length} linhas
              </span>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: .4 }}>
            <div style={{ fontSize: '3rem' }}>📝</div>
            <div style={{ fontSize: '.9rem', color: 'rgba(232,230,248,.6)' }}>Selecione ou crie uma nota</div>
            <button onClick={addNote} style={{ padding: '.5rem 1.2rem', borderRadius: 9, background: 'rgba(155,48,255,.12)', border: '1px solid rgba(155,48,255,.3)', color: '#9b30ff', cursor: 'pointer', fontWeight: 700, fontSize: '.85rem' }}>+ Nova nota</button>
          </div>
        )}
      </div>
    </div>
  )
}
