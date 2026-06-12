'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n'

const C = {
  card: '#111219', cardB: 'rgba(255,255,255,0.05)', cardAlt: '#0f1018',
  text: '#e8e6f8', muted: 'rgba(232,230,248,0.48)', dim: 'rgba(232,230,248,0.28)',
  vdim: 'rgba(232,230,248,0.12)',
  primary: '#9b30ff', primaryBg: 'rgba(155,48,255,0.1)',
  accent: '#39ff14',
  border: 'rgba(155,48,255,0.2)', input: 'rgba(155,48,255,0.25)',
}

const TIPOS = [
  { id: 'livepix',   label: 'Livepix',   desc: 'Tickets por doação', color: '#ff4d6d', sym: '♥' },
  { id: 'twitch',    label: 'Sub Twitch', desc: 'Inscrição Twitch',   color: '#9147ff', sym: '◈' },
  { id: 'youtube',   label: 'Membro YouTube', desc: 'Membro do canal', color: '#ff0000', sym: '▶' },
  { id: 'kick',      label: 'Sub Kick',   desc: 'Inscrição Kick',     color: '#53fc18', sym: '⊡' },
  { id: 'tiktok',    label: 'Sub TikTok', desc: 'Inscrição TikTok',   color: '#69c9d0', sym: '♪' },
  { id: 'paypal',    label: 'PayPal',     desc: 'Doação via PayPal',  color: '#009cde', sym: '⊞' },
  { id: 'unificado', label: 'Unificado',  desc: 'Múltiplas plataformas', color: '#9b30ff', sym: '⋈' },
]

const VARIAVEIS = ['$user', '$premio', '$ticket', '$data', '$total_tickets', '$titulo']

const inputStyle = {
  width: '100%', padding: '0.7rem 1rem', background: '#08090d',
  border: `1px solid rgba(155,48,255,0.25)`, borderRadius: '8px',
  color: '#e8e6f8', fontSize: '0.88rem', outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: 'rgba(232,230,248,0.6)', marginBottom: '0.4rem', display: 'block' as const }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.cardB}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
      <div style={{ padding: '0.9rem 1.3rem', borderBottom: `1px solid rgba(255,255,255,0.04)`, fontSize: '0.78rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
        {title}
      </div>
      <div style={{ padding: '1.3rem' }}>
        {children}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: '36px', height: '20px', borderRadius: '999px', background: checked ? C.primary : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: checked ? '19px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
    </div>
  )
}

export default function NovoSorteioPage() {
  const { t } = useLang()
  const [tipo, setTipo] = useState('livepix')
  const [form, setForm] = useState({ titulo: '', premio: '', data: '', contagem: '' })
  const [config, setConfig] = useState({ valorTicket: '', metaInicial: '', metaTotal: '' })
  const [mensagem, setMensagem] = useState('Parabéns $user! Você ganhou o sorteio "$titulo" com o ticket #$ticket!')
  const [vis, setVis] = useState({ publica: true, valorDoado: false, linksDoacao: true, mensagemConvite: false })

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [key]: e.target.value }))
  }

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', padding: '1.5rem 2rem', fontFamily: "-apple-system,'Inter',system-ui,sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/dashboard/sorteios" style={{ color: C.dim, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            {t('pt_raffles')}
          </Link>
          <span style={{ color: C.vdim }}>/</span>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{t('raffle_new_page_title')}</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link href="/dashboard/sorteios" style={{ padding: '0.5rem 1.2rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: C.dim, borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            {t('action_cancel')}
          </Link>
          <button style={{ padding: '0.5rem 1.5rem', background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
            {t('raffle_create_submit')}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '820px' }}>

        {/* Tipo de sorteio */}
        <Section title="Tipo de sorteio">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.65rem' }}>
            {TIPOS.map(ti => (
              <div key={ti.id} onClick={() => setTipo(ti.id)} style={{ padding: '0.9rem', borderRadius: '10px', border: `1px solid ${tipo === ti.id ? ti.color + '55' : 'rgba(255,255,255,0.06)'}`, background: tipo === ti.id ? ti.color + '12' : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.08s' }}>
                <div style={{ fontSize: '1.4rem', color: ti.color, marginBottom: '0.35rem' }}>{ti.sym}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: C.text, marginBottom: '0.2rem' }}>{ti.label}</div>
                <div style={{ fontSize: '0.68rem', color: C.dim }}>{ti.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Informações */}
        <Section title="Informações do sorteio">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Título do sorteio *</label>
              <input value={form.titulo} onChange={field('titulo')} placeholder="Ex: Sorteio de Natal 2026" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Prêmio</label>
              <input value={form.premio} onChange={field('premio')} placeholder="Ex: Gift Card R$ 100" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data do sorteio</label>
              <input type="date" value={form.data} onChange={field('data')} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Contagem a partir de</label>
              <input value={form.contagem} onChange={field('contagem')} placeholder="Ex: início da live, R$ 0,00..." style={inputStyle} />
            </div>
          </div>
        </Section>

        {/* Configuração */}
        <Section title="Configuração">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Valor por ticket (R$)</label>
              <input value={config.valorTicket} onChange={e => setConfig(p => ({ ...p, valorTicket: e.target.value }))} placeholder="Ex: 5,00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Meta inicial</label>
              <input value={config.metaInicial} onChange={e => setConfig(p => ({ ...p, metaInicial: e.target.value }))} placeholder="Ex: 0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Meta total</label>
              <input value={config.metaTotal} onChange={e => setConfig(p => ({ ...p, metaTotal: e.target.value }))} placeholder="Ex: 1000" style={inputStyle} />
            </div>
          </div>
        </Section>

        {/* Mensagem de parabéns */}
        <Section title="Mensagem de parabéns">
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Variáveis disponíveis (clique para inserir)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {VARIAVEIS.map(v => (
                <button key={v} onClick={() => setMensagem(p => p + ' ' + v)} style={{ padding: '0.25rem 0.65rem', background: C.primaryBg, border: `1px solid rgba(155,48,255,0.25)`, color: C.primary, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace' }}>
                  {v}
                </button>
              ))}
            </div>
            <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ background: C.cardAlt, border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.66rem', color: C.vdim, marginBottom: '0.35rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview</div>
            <div style={{ fontSize: '0.84rem', color: C.muted, lineHeight: 1.6 }}>
              {mensagem
                .replace('$user', 'StreamerFã123')
                .replace('$titulo', form.titulo || 'Sorteio')
                .replace('$ticket', '#42')
                .replace('$data', '07/06/2026')
                .replace('$total_tickets', '247')
                .replace('$premio', form.premio || 'Prêmio')}
            </div>
          </div>
        </Section>

        {/* Visibilidade */}
        <Section title="Visibilidade">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {([
              { key: 'publica',         label: 'Página pública ativa',     desc: 'Exibe uma página pública do sorteio' },
              { key: 'valorDoado',      label: 'Mostrar valor doado',      desc: 'Exibe o valor de cada doação nos tickets' },
              { key: 'linksDoacao',     label: 'Exibir links de doação',   desc: 'Mostra links de Livepix, PayPal etc. na página' },
              { key: 'mensagemConvite', label: 'Mensagem de convite',      desc: 'Exibe mensagem de convite para o sorteio' },
            ] as const).map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: C.text }}>{item.label}</div>
                  <div style={{ fontSize: '0.72rem', color: C.dim, marginTop: '0.15rem' }}>{item.desc}</div>
                </div>
                <Toggle checked={vis[item.key]} onChange={() => setVis(p => ({ ...p, [item.key]: !p[item.key] }))} />
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  )
}
