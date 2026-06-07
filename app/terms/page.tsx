'use client'
import { useState, useEffect } from 'react'

const G = {
  bg: '#f9fafb',
  doc: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  dim: '#9ca3af',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  accent: '#9b30ff',
  accentLight: 'rgba(155,48,255,0.08)',
  green: '#16a34a',
  greenHover: '#15803d',
  greenLight: 'rgba(22,163,74,0.1)',
  greenBorder: 'rgba(22,163,74,0.3)',
  red: '#dc2626',
  redLight: 'rgba(220,38,38,0.07)',
  heading: '#0f172a',
}

const css = `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  body { margin: 0; }
  .sk-accept-btn { transition: background 0.12s, transform 0.1s, box-shadow 0.1s; }
  .sk-accept-btn:hover:not(:disabled) { background: ${G.greenHover} !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(22,163,74,0.3) !important; }
  .sk-accept-btn:disabled { opacity: 0.45; cursor: not-allowed !important; }
  .sk-refuse-btn { transition: background 0.1s, color 0.1s; }
  .sk-refuse-btn:hover { background: ${G.redLight} !important; color: ${G.red} !important; }
  .sk-checkbox { width:18px; height:18px; border:2px solid #d1d5db; border-radius:4px; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:border-color 0.1s, background 0.1s; }
  .sk-checkbox.on { border-color:${G.green}; background:${G.green}; }
  .sk-logo-link { transition: opacity 0.1s; }
  .sk-logo-link:hover { opacity: 0.8; }
  @media (max-width: 640px) {
    .sk-bar-inner { flex-direction: column !important; align-items: stretch !important; }
    .sk-bar-checks { flex-direction: column !important; gap: 0.6rem !important; }
    .sk-bar-btns { flex-direction: column-reverse !important; }
  }
`

type Check = { termos: boolean; privacidade: boolean; news: boolean }

const SECTIONS = [
  {
    id: 'preambulo',
    title: 'Preâmbulo',
    content: [
      'Estes Termos e Condições de Uso ("Termos") regem o acesso e uso da plataforma SheikSTREAM, desenvolvida e operada pela equipe SheikSTREAM ("Plataforma", "nós", "nosso"). Ao acessar ou usar a Plataforma, você ("Usuário", "você") concorda expressamente com os presentes Termos.',
      'A SheikSTREAM é uma plataforma de gestão multi-plataforma voltada a streamers brasileiros, atualmente em fase Beta fechado. O acesso está sujeito a convite e aprovação prévia da equipe.',
    ],
  },
  {
    id: 'definicoes',
    title: '1. Definições',
    items: [
      { term: 'Plataforma', def: 'O conjunto de software, interfaces, APIs e serviços disponibilizados pela SheikSTREAM.' },
      { term: 'Usuário', def: 'Qualquer pessoa física que crie uma conta ou acesse a Plataforma, mediante aceite destes Termos.' },
      { term: 'Conta', def: 'O perfil individual criado pelo Usuário para acesso à Plataforma, vinculado a uma ou mais plataformas de streaming.' },
      { term: 'Conteúdo', def: 'Toda informação, dado, texto, imagem, vídeo ou material gerado, transmitido ou disponibilizado pelo Usuário na Plataforma.' },
      { term: 'Beta Fechado', def: 'Fase atual de acesso restrito da Plataforma, sujeita a mudanças sem aviso prévio.' },
      { term: 'Plataformas Integradas', def: 'Serviços de terceiros conectados à SheikSTREAM, incluindo Twitch, YouTube, Kick, TikTok e Facebook.' },
    ],
  },
  {
    id: 'aceitacao',
    title: '2. Aceitação dos Termos',
    content: [
      'O uso da Plataforma constitui aceitação integral e irrestrita destes Termos, bem como de nossa Política de Privacidade. Caso você não concorde com quaisquer disposições aqui contidas, não utilize a Plataforma.',
      'A SheikSTREAM reserva-se o direito de modificar estes Termos a qualquer momento. Alterações relevantes serão comunicadas por e-mail ou mediante notificação na Plataforma. O uso contínuo após a notificação implica aceitação das modificações.',
      'Para utilizar a Plataforma, você declara ter no mínimo 18 (dezoito) anos de idade ou, se menor, contar com expressa autorização dos pais ou responsáveis legais.',
    ],
  },
  {
    id: 'uso',
    title: '3. Uso da Plataforma',
    content: [
      'A SheikSTREAM concede ao Usuário uma licença limitada, não exclusiva, intransferível e revogável para acessar e usar a Plataforma exclusivamente para fins pessoais e não comerciais, observados estes Termos.',
    ],
    proibido: [
      'Usar a Plataforma para fins ilegais, fraudulentos ou contrários à ordem pública.',
      'Compartilhar credenciais de acesso com terceiros ou permitir uso não autorizado de sua Conta.',
      'Tentar acessar sistemas, dados ou áreas restritas da Plataforma sem autorização.',
      'Realizar engenharia reversa, descompilar ou desmontar qualquer componente da Plataforma.',
      'Usar bots, scrapers ou qualquer meio automatizado não autorizado para interagir com a Plataforma.',
      'Publicar, transmitir ou armazenar conteúdo que viole direitos de terceiros, seja difamatório, obsceno ou ilegal.',
      'Interferir no funcionamento da Plataforma ou sobrecarregar intencionalmente a infraestrutura.',
    ],
  },
  {
    id: 'contas',
    title: '4. Contas e Segurança',
    content: [
      'O Usuário é integralmente responsável pela segurança de suas credenciais de acesso e por todas as atividades realizadas em sua Conta. Em caso de acesso não autorizado suspeito, notifique imediatamente a SheikSTREAM.',
      'A SheikSTREAM pode suspender ou encerrar sua Conta a qualquer momento, sem aviso prévio, em caso de violação destes Termos, conduta prejudicial à Plataforma ou a outros usuários, ou por determinação legal.',
      'O Usuário pode encerrar sua Conta a qualquer tempo mediante solicitação por escrito. O encerramento não exime de obrigações anteriores assumidas durante o uso.',
    ],
  },
  {
    id: 'conteudo',
    title: '5. Conteúdo do Usuário',
    content: [
      'O Usuário mantém todos os direitos sobre o Conteúdo que publicar ou transmitir pela Plataforma, concedendo à SheikSTREAM uma licença mundial, não exclusiva, gratuita e sublicenciável para usar, reproduzir, modificar e exibir tal Conteúdo exclusivamente para fins de operação da Plataforma.',
      'O Usuário declara e garante que possui todos os direitos necessários sobre o Conteúdo publicado e que este não viola direitos de terceiros, legislação aplicável ou estes Termos.',
      'A SheikSTREAM não monitora ativamente o Conteúdo, mas reserva-se o direito de remover, sem aviso prévio, qualquer Conteúdo que viole estes Termos ou a legislação vigente.',
    ],
  },
  {
    id: 'propriedade',
    title: '6. Propriedade Intelectual',
    content: [
      'Todos os direitos de propriedade intelectual relativos à Plataforma, incluindo mas não limitado a código-fonte, design, logotipos, marcas, textos e funcionalidades, são de propriedade exclusiva da SheikSTREAM ou de seus licenciadores.',
      'Nada nestes Termos transfere qualquer direito de propriedade intelectual ao Usuário. O uso da Plataforma não concede ao Usuário qualquer direito sobre as marcas, logotipos ou demais elementos identificadores da SheikSTREAM.',
    ],
  },
  {
    id: 'responsabilidade',
    title: '7. Limitação de Responsabilidade',
    content: [
      'A PLATAFORMA É FORNECIDA "NO ESTADO EM QUE SE ENCONTRA" ("AS IS"), SEM GARANTIAS DE QUALQUER NATUREZA, EXPRESSAS OU IMPLÍCITAS, INCLUINDO MAS NÃO SE LIMITANDO A GARANTIAS DE COMERCIALIZAÇÃO, ADEQUAÇÃO A UM FIM ESPECÍFICO OU NÃO VIOLAÇÃO.',
      'A SheikSTREAM não se responsabiliza por danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes do uso ou impossibilidade de uso da Plataforma, interrupções de serviço, perda de dados ou falhas de terceiros.',
      'Dado que a Plataforma está em fase Beta, podem ocorrer instabilidades, perda de dados e interrupções. O Usuário aceita esses riscos ao utilizar a Plataforma nesta fase.',
    ],
  },
  {
    id: 'alteracoes',
    title: '8. Alterações e Encerramento do Serviço',
    content: [
      'A SheikSTREAM pode, a qualquer tempo e a seu exclusivo critério, modificar, suspender ou encerrar a Plataforma ou qualquer de suas funcionalidades, com ou sem aviso prévio.',
      'Durante o Beta, funcionalidades podem ser adicionadas, modificadas ou removidas sem aviso. A SheikSTREAM não garante a disponibilidade contínua de quaisquer recursos específicos.',
    ],
  },
  {
    id: 'legislacao',
    title: '9. Legislação Aplicável e Foro',
    content: [
      'Estes Termos são regidos pela legislação da República Federativa do Brasil. As partes elegem o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.',
      'A SheikSTREAM opera em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei n.º 13.709/2018) e demais normas aplicáveis à proteção de dados pessoais no Brasil.',
    ],
  },
  {
    id: 'contato',
    title: '10. Contato',
    content: [
      'Para dúvidas, solicitações ou notificações relacionadas a estes Termos, entre em contato com a SheikSTREAM através do e-mail: contato@sheikstream.com.br ou pelo formulário disponível na Plataforma.',
    ],
  },
]

export default function TermsPage() {
  const [check, setCheck] = useState<Check>({ termos: false, privacidade: false, news: false })
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const canAccept = check.termos && check.privacidade

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u?.id) setUserId(u.id) })
      .catch(() => {})
  }, [])

  function toggle(key: keyof Check) {
    setCheck(p => ({ ...p, [key]: !p[key] }))
  }

  async function handleAccept() {
    if (!canAccept || loading) return
    setLoading(true)
    try {
      const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const sKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (sUrl && sKey && userId) {
        await fetch(`${sUrl}/rest/v1/terms_accepted`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: sKey,
            Authorization: `Bearer ${sKey}`,
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            user_id: userId,
            accepted_at: new Date().toISOString(),
            news_opt_in: check.news,
          }),
        })
      }
    } catch {
      // prossegue mesmo sem Supabase configurado
    }
    window.location.href = '/pending'
  }

  return (
    <div style={{ fontFamily: "-apple-system,'Inter',system-ui,sans-serif", background: G.bg, minHeight: '100vh', color: G.text }}>
      <style>{css}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: '#ffffff', borderBottom: `1px solid ${G.border}`,
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.85rem 2rem',
      }}>
        <a href="/" className="sk-logo-link" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg,#9b30ff,#6b1fc2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: G.heading, letterSpacing: '0.2px' }}>
            Sheik<span style={{ color: G.accent }}>STREAM</span>
          </span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <span style={{ fontSize: '0.78rem', background: G.accentLight, border: `1px solid rgba(155,48,255,0.15)`, padding: '0.22rem 0.75rem', borderRadius: '999px', fontWeight: 600, color: G.accent }}>
            Beta Fechado
          </span>
          <a href="/" style={{ fontSize: '0.82rem', color: G.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Voltar
          </a>
        </div>
      </nav>

      {/* ── Document ── */}
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '3rem 1.5rem 10rem' }}>

        {/* Header */}
        <div style={{ borderBottom: `2px solid ${G.heading}`, paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-block', background: G.accentLight, border: `1px solid rgba(155,48,255,0.2)`, color: G.accent, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.2px', padding: '0.25rem 0.85rem', borderRadius: '4px', marginBottom: '1rem', textTransform: 'uppercase' }}>
            Documento Legal
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: G.heading, margin: '0 0 0.75rem', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
            Termos e Condições
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.82rem', color: G.muted }}>
            <span><strong style={{ color: G.text }}>Versão:</strong> 1.0</span>
            <span><strong style={{ color: G.text }}>Última atualização:</strong> 7 de junho de 2026</span>
            <span><strong style={{ color: G.text }}>Vigência:</strong> imediata</span>
          </div>
        </div>

        {/* Índice */}
        <div style={{ background: '#f3f4f6', border: `1px solid ${G.border}`, borderRadius: '8px', padding: '1.25rem 1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', color: G.muted, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Sumário</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.3rem 1.5rem' }}>
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`} style={{ fontSize: '0.82rem', color: G.accent, textDecoration: 'none', lineHeight: 1.7 }}>
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map((s, si) => (
          <section key={s.id} id={s.id} style={{ marginBottom: '2.5rem', scrollMarginTop: '80px' }}>
            <h2 style={{ fontSize: '1.12rem', fontWeight: 800, color: G.heading, margin: '0 0 1rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${G.border}` }}>
              {s.title}
            </h2>

            {s.content?.map((p, i) => (
              <p key={i} style={{ fontSize: '0.9rem', color: G.text, lineHeight: 1.85, margin: '0 0 0.9rem' }}>
                {p}
              </p>
            ))}

            {s.items && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.9rem' }}>
                {s.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem', lineHeight: 1.7 }}>
                    <span style={{ fontWeight: 700, color: G.heading, minWidth: '120px', flexShrink: 0 }}>{it.term}:</span>
                    <span style={{ color: G.text }}>{it.def}</span>
                  </div>
                ))}
              </div>
            )}

            {s.proibido && (
              <>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: G.heading, margin: '1rem 0 0.5rem' }}>É expressamente proibido ao Usuário:</p>
                <ul style={{ margin: '0 0 0.9rem', paddingLeft: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {s.proibido.map((item, i) => (
                    <li key={i} style={{ fontSize: '0.9rem', color: G.text, lineHeight: 1.7 }}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </section>
        ))}

        {/* Assinatura */}
        <div style={{ borderTop: `2px solid ${G.heading}`, paddingTop: '1.5rem', marginTop: '1rem', fontSize: '0.82rem', color: G.muted, lineHeight: 1.8 }}>
          <strong style={{ color: G.text }}>SheikSTREAM</strong> — Plataforma de gestão para streamers brasileiros.<br />
          Versão 1.0 · São Paulo, Brasil · 2026
        </div>
      </div>

      {/* ── Barra de ação (sticky bottom) ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: '#ffffff', borderTop: `1px solid ${G.borderStrong}`,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
        padding: '1rem 1.5rem',
      }}>
        <div className="sk-bar-inner" style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>

          {/* Checkboxes */}
          <div className="sk-bar-checks" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem 1.5rem', flex: 1 }}>
            {[
              { key: 'termos' as const, label: 'Li e aceito os Termos de Uso', required: true },
              { key: 'privacidade' as const, label: 'Li e aceito a Política de Privacidade', required: true },
              { key: 'news' as const, label: 'Aceito receber novidades', required: false },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => toggle(item.key)}>
                <div className={`sk-checkbox${check[item.key] ? ' on' : ''}`}>
                  {check[item.key] && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: '0.8rem', color: G.text, userSelect: 'none', lineHeight: 1.3 }}>
                  {item.label}{item.required && <span style={{ color: G.red }}> *</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Botões */}
          <div className="sk-bar-btns" style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
            <button
              onClick={() => { window.location.href = '/' }}
              className="sk-refuse-btn"
              style={{ padding: '0.7rem 1.4rem', background: 'transparent', border: `1px solid ${G.borderStrong}`, borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', color: G.muted }}
            >
              Recusar
            </button>
            <button
              onClick={handleAccept}
              disabled={!canAccept || loading}
              className="sk-accept-btn"
              style={{ padding: '0.7rem 1.8rem', background: G.green, border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: canAccept ? 'pointer' : 'not-allowed', color: '#fff', boxShadow: canAccept ? '0 2px 8px rgba(22,163,74,0.25)' : 'none' }}
            >
              {loading ? 'Salvando…' : 'Aceitar e Continuar'}
            </button>
          </div>
        </div>
        <div style={{ maxWidth: '780px', margin: '0.4rem auto 0', fontSize: '0.68rem', color: G.dim }}>
          * campos obrigatórios para continuar
        </div>
      </div>
    </div>
  )
}
