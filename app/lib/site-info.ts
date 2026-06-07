// Single source of truth for site information.
// Update this file whenever site details change — the AI chat picks it up automatically.

export const SITE = {
  name: 'SheikSTREAM',
  url: 'sheikstream.com.br',
  urlAlt: 'sheikstream.vercel.app',
  description: 'Hub gratuito para streamers brasileiros gerenciarem todas as plataformas de streaming num só lugar.',
  status: 'BETA fechado — acesso mediante aprovação manual do administrador',

  streamers: ['sheikfabio', 'thierry0800'] as string[],

  platforms: {
    supported: ['Twitch', 'YouTube'],
    comingSoon: ['Kick', 'TikTok', 'Facebook', 'Instagram', 'Discord'],
    loginDirect: ['Twitch', 'YouTube'],
  },

  access: {
    twitch: `Login via OAuth da Twitch.
      - Primeira vez: o usuário é registrado como PENDENTE e redirecionado para a página de espera (/pending).
      - O administrador aprova ou rejeita no painel admin em sheikstream.com.br/admin.
      - Quando aprovado, o usuário recebe um e-mail de confirmação e pode entrar normalmente.
      - Após aprovado uma vez, o acesso futuro é direto — sem nova aprovação.
      - Usuários banidos são bloqueados mesmo com conta aprovada anteriormente.`,
    youtube: 'Login via OAuth do Google. Acesso direto ao dashboard após autenticar — sem necessidade de aprovação.',
    pendingPage: 'Usuários Twitch não aprovados são redirecionados para /pending com a mensagem "Acesso pendente — aguarda aprovação manual".',
    approvalEmail: 'Ao ser aprovado, o usuário recebe um e-mail automático com link para entrar.',
    banned: 'Usuários banidos são redirecionados para /login?error=banned se tentarem entrar.',
  },

  dashboard: {
    note: 'O dashboard é funcional para navegação e visualização. A maioria das funcionalidades está em desenvolvimento ativo — os dados exibidos são demonstrativos.',
    sections: [
      {
        name: 'Dashboard (início)',
        href: '/dashboard',
        status: 'demo',
        desc: 'Visão geral com estatísticas: total arrecadado, tickets, participantes, subs, receita por plataforma (Livepix, Twitch, YouTube, Kick, TikTok, PayPal), sorteios ativos. Filtros de período: 7 dias, 30 dias, 90 dias. Dados demonstrativos por enquanto.',
      },
      {
        name: 'Plataformas',
        href: '/dashboard/plataformas',
        status: 'parcial',
        desc: 'Lista todas as plataformas. Twitch aparece como "Conectado" quando o usuário está logado. YouTube, Kick, TikTok mostram botão de conectar. Kick e TikTok estão "Em breve — integração em desenvolvimento".',
      },
      {
        name: 'Plataformas → Twitch',
        href: '/dashboard/plataformas/twitch',
        status: 'conectado',
        desc: 'Mostra a conta Twitch conectada com nome e foto do usuário autenticado.',
      },
      {
        name: 'Plataformas → YouTube',
        href: '/dashboard/plataformas/youtube',
        status: 'em breve',
        desc: 'Integração com YouTube em desenvolvimento.',
      },
      {
        name: 'Plataformas → Kick',
        href: '/dashboard/plataformas/kick',
        status: 'em breve',
        desc: 'Integração com Kick em desenvolvimento.',
      },
      {
        name: 'Plataformas → TikTok',
        href: '/dashboard/plataformas/tiktok',
        status: 'em breve',
        desc: 'Integração com TikTok em desenvolvimento.',
      },
      {
        name: 'Sorteios',
        href: '/dashboard/sorteios',
        status: 'funcional',
        desc: 'Sorteios reais com integração Twitch EventSub. Tipos: Todos (subs+follows+bits), apenas Subs (2 tickets cada), apenas Seguidores, ou Palavra-chave (adição manual). Participantes adicionados automaticamente em tempo real quando alguém faz sub/follow/bits durante o sorteio ativo. Botão "Sortear vencedor" com sorteio ponderado por tickets. URL de overlay para OBS. Dados persistidos no banco.',
      },
      {
        name: 'Sorteios → Tickets',
        href: '/dashboard/sorteios/tickets',
        status: 'demo',
        desc: 'Controle de tickets de participação. Funcionalidade em desenvolvimento.',
      },
      {
        name: 'Subathon',
        href: '/dashboard/subathon',
        status: 'funcional',
        desc: 'Timer de subathon em tempo real. Cada novo sub adiciona X segundos (configurável), cada 100 bits adiciona Y segundos (configurável). Controles: Iniciar, Pausar, Retomar, Parar, Adicionar tempo manualmente. Overlay para OBS com countdown colorido (verde → amarelo → vermelho conforme o tempo diminui). Timer calculado no cliente com base no end_time do banco — serverless-friendly.',
      },
      {
        name: 'Banners',
        href: '/dashboard/banners',
        status: 'demo',
        desc: 'Banners de patrocinadores para exibir nos overlays do OBS. Formulário para criar banner com imagens, transições, cooldown e visibilidade. Dados em estado local.',
      },
      {
        name: 'Metas',
        href: '/dashboard/metas',
        status: 'funcional',
        desc: 'Metas reais com integração Twitch EventSub. Tipos: Subs Twitch, Gift Subs, Seguidores, Bits, Valor (R$). Quando alguém faz sub/gift/bits/follow no canal, a meta é incrementada automaticamente em tempo real. Edição inline de valor atual e alvo. Botão OBS em cada meta copia a URL do overlay. Overlay mostra barra de progresso com gradiente e percentual. Dados persistidos no banco.',
      },
      {
        name: 'Comandos',
        href: '/dashboard/comandos',
        status: 'demo',
        desc: 'Comandos automáticos do chat (!sorteio, !meta, !discord etc). Trigger, resposta, cooldown e on/off. 3 comandos de exemplo já incluídos.',
      },
      {
        name: 'Timers',
        href: '/dashboard/timers',
        status: 'demo',
        desc: 'Mensagens automáticas enviadas ao chat em intervalos configuráveis.',
      },
      {
        name: 'Overlays',
        href: '/dashboard/overlays',
        status: 'funcional',
        desc: 'URLs de overlay reais para OBS Browser Source. Overlay de Meta (/overlay/meta): barra de progresso com título, valor atual/alvo e percentual — atualiza a cada 4s. Overlay de Sorteio (/overlay/sorteio): mostra sorteio ativo com contagem de participantes; quando o vencedor é sorteado, exibe uma tela de destaque por 8s. Overlay de Subathon (/overlay/subathon): countdown em tempo real com cor que muda (verde→amarelo→vermelho). Todos os overlays têm fundo transparente (ideal para OBS). URLs: /overlay/meta?uid=SEU_ID, /overlay/sorteio?uid=SEU_ID, /overlay/subathon?uid=SEU_ID.',
      },
      {
        name: 'Conexões',
        href: '/dashboard/conexoes',
        status: 'parcial',
        desc: 'Conecte/desconecte plataformas. Twitch aparece como conectada automaticamente. YouTube, Kick, TikTok, Discord têm botões de conexão (em desenvolvimento). Necessário conectar para receber dados em tempo real.',
      },
      {
        name: 'Meu Perfil',
        href: '/dashboard/perfil',
        status: 'funcional',
        desc: 'Exibe foto, nome e e-mail da conta conectada. Formulário para editar nome, e-mail e bio.',
      },
      {
        name: 'Convites',
        href: '/dashboard/convites',
        status: 'demo',
        desc: 'Link de convite exclusivo para convidar outros streamers. Lista de convidados com status (pendente, aprovado, rejeitado).',
      },
    ],
  },

  plans: [
    {
      name: 'Gratuito',
      price: 'R$0/mês para sempre',
      features: 'Disponível agora. Até 3 plataformas, painel unificado, sorteios ilimitados, metas, notificações, comandos, timers, overlays.',
    },
    {
      name: 'Pro',
      price: 'R$19/mês (em breve)',
      features: 'Plataformas ilimitadas, analytics avançado com histórico, bot avançado, integração OBS/StreamElements, acesso à API, suporte prioritário.',
    },
  ],

  faq: [
    { q: 'É realmente gratuito?', a: 'Sim, 100% gratuito durante o beta. Sem cartão de crédito, sem taxa de setup.' },
    { q: 'Quais plataformas têm login?', a: 'Twitch e YouTube/Google têm login direto. Kick, TikTok e outras estão em desenvolvimento.' },
    { q: 'Por que meu acesso Twitch está pendente?', a: 'O SheikSTREAM está em beta fechado. O administrador precisa aprovar seu cadastro manualmente. Você receberá um e-mail quando for aprovado.' },
    { q: 'Preciso ser aprovado toda vez que entrar?', a: 'Não. A aprovação é feita uma única vez. Depois disso, basta fazer login com a Twitch normalmente.' },
    { q: 'Posso usar com YouTube sem aprovação?', a: 'Sim. Login com Google/YouTube tem acesso direto ao dashboard, sem necessidade de aprovação.' },
    { q: 'Preciso ter CNPJ ou empresa?', a: 'Não. Qualquer streamer pessoa física pode se cadastrar.' },
    { q: 'Vou perder meu acesso quando sair do beta?', a: 'Não. Usuários do beta têm acesso garantido e ficam no plano gratuito para sempre.' },
    { q: 'Como adiciono um overlay no OBS?', a: 'Vá em Dashboard → Overlays, copie a URL desejada, no OBS adicione uma Fonte → Browser e cole a URL. Largura recomendada: 1920px.' },
  ],

  commonIssues: [
    { issue: 'Estou na página de espera (/pending)', fix: 'Seu acesso Twitch ainda não foi aprovado pelo administrador. Aguarde o e-mail de confirmação no endereço cadastrado.' },
    { issue: 'Recebi "acesso negado" ou "banido"', fix: 'Sua conta foi banida pelo administrador da plataforma. Entre em contato para mais informações.' },
    { issue: 'Plataforma não conectada', fix: 'Vá em Dashboard → Conexões e tente reconectar a plataforma.' },
    { issue: 'Overlay não aparece no OBS', fix: 'Use a fonte "Browser" (não "Janela" nem "Captura de tela"). Cole a URL do overlay. Largura: 1920px, altura: 120–400px. Desmarque "Controlar áudio via OBS".' },
    { issue: 'Dados do dashboard estão zerados', fix: 'Os dados do dashboard ainda são demonstrativos. A integração em tempo real está em desenvolvimento.' },
    { issue: 'Não recebi o e-mail de aprovação', fix: 'Verifique a caixa de spam. O e-mail vem de SheikSTREAM com o assunto "Seu acesso ao SheikSTREAM foi aprovado!".' },
  ],

  admin: {
    url: '/admin',
    features: [
      'Ver todos os usuários (pendentes, ativos, rejeitados, banidos)',
      'Aprovar, rejeitar ou banir usuários',
      'Enviar e-mail automático ao aprovar',
      'Ver logs de ações admin (aprovar/rejeitar/banir)',
      'Ver logs de autenticação (login/logout com data e hora)',
      'Ver logs de navegação (quais páginas cada usuário visitou)',
      'Resetar sessões Twitch (força re-aprovação de todos)',
    ],
  },
}

export const STREAMERS_USERNAMES: string[] = SITE.streamers

export function buildSystemPrompt(): string {
  const s = SITE

  const sections = s.dashboard.sections.map(sec => {
    const statusLabel = { demo: '[DEMO]', 'em breve': '[EM BREVE]', parcial: '[PARCIAL]', funcional: '[FUNCIONAL]', disponível: '[DISPONÍVEL]', conectado: '[CONECTADO]' }[sec.status] ?? ''
    return `  • ${sec.name} ${statusLabel}: ${sec.desc}`
  }).join('\n')

  const plans = s.plans.map(p => `  • ${p.name} — ${p.price}. ${p.features}`).join('\n')

  const faq = s.faq.map(f => `  P: ${f.q}\n  R: ${f.a}`).join('\n\n')

  const issues = s.commonIssues.map(i => `  - "${i.issue}": ${i.fix}`).join('\n')

  return `Você é o assistente virtual do ${s.name}. Responda dúvidas sobre a plataforma e ensine como usá-la.

═══ SOBRE O ${s.name.toUpperCase()} ═══
${s.description}
Status atual: ${s.status}.
Site principal: ${s.url} (também acessível via ${s.urlAlt}).
Criadores em destaque: ${s.streamers.join(', ')} (ambos no Twitch).
Plataformas com login funcionando: ${s.platforms.loginDirect.join(', ')}.
Plataformas em desenvolvimento: ${s.platforms.comingSoon.join(', ')}.

═══ COMO ACESSAR A PLATAFORMA ═══
1. Acesse ${s.url}
2. Clique em "Começar grátis" ou "Entrar"
3. Escolha Twitch ou YouTube para autenticar

Via TWITCH:
${s.access.twitch}

Via YOUTUBE/GOOGLE:
${s.access.youtube}

Página de espera: ${s.access.pendingPage}
E-mail de aprovação: ${s.access.approvalEmail}
Usuários banidos: ${s.access.banned}

═══ ESTADO ATUAL DO DASHBOARD ═══
Nota importante: ${s.dashboard.note}

${sections}

═══ PLANOS ═══
${plans}

═══ PAINEL ADMIN ═══
Acessível em ${s.url}/admin (senha necessária, somente para o administrador do site).
Funcionalidades:
${s.admin.features.map(f => `  • ${f}`).join('\n')}

═══ PERGUNTAS FREQUENTES ═══
${faq}

═══ PROBLEMAS COMUNS ═══
${issues}

═══ REGRAS PARA RESPOSTAS ═══
- Responda SEMPRE em português brasileiro
- Seja amigável, direto e ensine passo a passo quando perguntado sobre como usar algo
- Máximo 4-5 frases por resposta (seja conciso)
- Se uma funcionalidade está marcada como [DEMO] ou [EM BREVE], diga isso claramente
- Se não souber algo específico, diga honestamente
- Use as informações acima como verdade absoluta sobre o site`
}
