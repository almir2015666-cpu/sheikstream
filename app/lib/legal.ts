export type LegalEntry = { title: string; category: string; desc: string; content: string }

export const LEGAL: Record<string, LegalEntry> = {
  'termos-e-condicoes': {
    title: 'Termos e Condições',
    category: 'Legal',
    desc: 'Leia os termos de uso da plataforma Sheikstream.',
    content: `Última atualização: junho de 2025

Ao acessar e usar o Sheikstream, você concorda com estes Termos e Condições. Leia com atenção antes de continuar.

1. ACEITAÇÃO
Ao criar uma conta ou utilizar a plataforma, você aceita integralmente estes termos. Se não concordar com algum ponto, não utilize o serviço.

2. DESCRIÇÃO DO SERVIÇO
O Sheikstream é um hub de gerenciamento para streamers brasileiros, permitindo conectar e gerenciar múltiplas plataformas de streaming em um só lugar. A plataforma está atualmente em fase beta fechado.

3. CONTA E SEGURANÇA
Você é responsável por manter a confidencialidade das suas credenciais de acesso. Notifique-nos imediatamente caso identifique qualquer uso não autorizado da sua conta.

4. USO ACEITÁVEL
É estritamente proibido usar o Sheikstream para atividades ilegais, envio de spam, violação de direitos autorais ou qualquer forma de abuso que prejudique outros usuários ou a plataforma.

5. PROPRIEDADE INTELECTUAL
Todo o conteúdo da plataforma — incluindo código-fonte, design, logotipo e marca — é propriedade exclusiva do Sheikstream e protegido pelas leis de propriedade intelectual vigentes no Brasil.

6. LIMITAÇÃO DE RESPONSABILIDADE
O Sheikstream não se responsabiliza por perdas ou danos indiretos resultantes do uso ou da impossibilidade de uso da plataforma.

7. ALTERAÇÕES
Podemos atualizar estes termos a qualquer momento. Usuários serão notificados por e-mail sobre mudanças significativas.

8. CONTATO
Dúvidas sobre estes termos? Entre em contato: contato@sheikstream.com.br`,
  },

  privacidade: {
    title: 'Política de Privacidade',
    category: 'Legal',
    desc: 'Saiba como coletamos, usamos e protegemos seus dados.',
    content: `Última atualização: junho de 2025

O Sheikstream valoriza sua privacidade. Esta política explica como coletamos, usamos e protegemos suas informações pessoais.

1. DADOS COLETADOS
• Informações de conta: e-mail, nome de usuário
• Dados de plataformas conectadas: métricas públicas de streaming
• Dados de uso: como você interage com a plataforma
• Dados técnicos: endereço IP, tipo de navegador, sistema operacional

2. COMO USAMOS OS DADOS
• Para fornecer e melhorar continuamente os serviços
• Para enviar notificações relevantes sobre sua conta
• Para análises internas de produto (sempre anonimizadas)
• Para cumprir obrigações legais aplicáveis

3. COMPARTILHAMENTO DE DADOS
Não vendemos seus dados a terceiros. Compartilhamos informações apenas com:
• Provedores de serviço essenciais (hospedagem, e-mail transacional)
• Autoridades competentes, quando exigido por lei

4. SEUS DIREITOS (LGPD)
Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito de acessar, corrigir, excluir ou exportar seus dados pessoais. Para exercer esses direitos, entre em contato conosco.

5. COOKIES
Utilizamos cookies essenciais para o funcionamento da plataforma e cookies analíticos para melhorar a experiência do usuário. Consulte nossa Política de Cookies para mais detalhes.

6. RETENÇÃO DE DADOS
Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta, os dados são removidos em até 30 dias úteis.

7. CONTATO
privacidade@sheikstream.com.br`,
  },

  cookies: {
    title: 'Política de Cookies',
    category: 'Legal',
    desc: 'Entenda como utilizamos cookies e tecnologias de rastreamento.',
    content: `Última atualização: junho de 2025

Esta política explica como o Sheikstream utiliza cookies e tecnologias similares de rastreamento.

O QUE SÃO COOKIES?
Cookies são pequenos arquivos de texto armazenados no seu dispositivo pelo navegador. Eles nos ajudam a oferecer uma experiência personalizada e a entender como a plataforma é utilizada.

TIPOS DE COOKIES QUE USAMOS

Cookies Essenciais (sempre ativos)
• Sessão de autenticação — mantém você logado entre visitas
• Preferências de tema — salva sua escolha entre modo claro e escuro
• Proteção CSRF — segurança contra ataques entre sites

Cookies Analíticos (requerem consentimento)
• Contagem de visitantes únicos (dados anonimizados)
• Páginas e recursos mais acessados
• Origem do tráfego e comportamento de navegação

Não utilizamos cookies de publicidade, rastreamento de terceiros ou qualquer tecnologia que compartilhe dados com redes de anúncios.

COMO GERENCIAR COOKIES
Você pode bloquear ou excluir cookies nas configurações do seu navegador. Atenção: desativar cookies essenciais pode impedir o funcionamento correto de partes da plataforma.

ATUALIZAÇÕES
Esta política pode ser atualizada periodicamente. A data de "última atualização" no topo indica a versão vigente.

CONTATO
cookies@sheikstream.com.br`,
  },

  sobre: {
    title: 'Sobre o Sheikstream',
    category: 'Empresa',
    desc: 'Conheça a história e a missão por trás do Sheikstream.',
    content: `O Sheikstream nasceu de uma necessidade real: streamers brasileiros precisavam alternar entre dezenas de abas, aplicativos e ferramentas para gerenciar suas lives em múltiplas plataformas simultaneamente.

Nossa missão é simples — dar ao streamer brasileiro uma ferramenta poderosa, gratuita e feita para a nossa realidade.

POR QUE CRIAMOS O SHEIKSTREAM?
O mercado de streaming cresceu exponencialmente no Brasil nos últimos anos. Streamers sérios transmitem simultaneamente no Twitch, YouTube, Kick, TikTok e Facebook — mas as ferramentas existentes são caras, em inglês ou simplesmente não atendem ao ecossistema e à cultura do criador de conteúdo brasileiro.

O QUE NOS DIFERENCIA
• 100% focado no streamer brasileiro e na comunidade BR
• Gratuito por padrão — monetizamos apenas com features pro avançadas
• Construído com feedback direto da comunidade desde o primeiro dia
• Sem dados vendidos para anunciantes, sem rastreamento invasivo

FASE ATUAL
Estamos em beta fechado, trabalhando lado a lado com streamers selecionados para refinar cada detalhe da experiência antes do lançamento público.

NOSSA EQUIPE
Somos um time apaixonado por streaming e pela comunidade brasileira de criadores. Muitos de nós somos streamers também — então sabemos exatamente qual é a dor.

ENTRE EM CONTATO
Tem sugestões, quer fazer parte do beta ou simplesmente quer bater um papo?
contato@sheikstream.com.br`,
  },

  roadmap: {
    title: 'Roadmap',
    category: 'Produto',
    desc: 'Veja o que estamos construindo e o que vem por aí.',
    content: `Aqui está o que estamos construindo para você. Atualizado mensalmente com base no feedback da comunidade.

✅ CONCLUÍDO
• Painel unificado de métricas em tempo real
• Conexão com Twitch, YouTube, Kick, TikTok e Facebook
• Sistema de sorteios automáticos
• Metas de seguidores, subs e doações
• Notificações ao vivo para a comunidade
• Lista de espera com posição numerada e sistema de indicações
• Assistente IA integrado ao site
• Modo escuro e claro com transição animada
• Páginas dedicadas para termos, privacidade e conteúdo institucional

🔨 EM DESENVOLVIMENTO — Q3 2025
• Dashboard ao vivo com widgets customizáveis por plataforma
• Bot de moderação básico com comandos personalizados
• Integração nativa com OBS Studio
• Analytics de retenção de audiência com gráficos detalhados
• Alertas sonoros e visuais personalizáveis

📋 PLANEJADO — Q4 2025
• Plano Pro com recursos avançados (R$19/mês)
• Histórico completo de analytics (90 dias)
• Bot de automação avançado
• Integração com StreamElements e Streamlabs
• API pública para desenvolvedores
• App mobile para iOS e Android

💡 IDEIAS FUTURAS (votadas pela comunidade)
• Clipagem automática dos melhores momentos da live
• IA para sugestão dos melhores horários para fazer live
• Marketplace de overlays, alertas e comandos

Tem uma sugestão? Manda pra: contato@sheikstream.com.br`,
  },

  changelog: {
    title: 'Changelog',
    category: 'Produto',
    desc: 'Registro completo de todas as mudanças e melhorias da plataforma.',
    content: `Registro completo de mudanças, melhorias e correções da plataforma.

v0.4.0 — junho 2025
• Páginas dedicadas para Sobre, Blog, Contato, Roadmap, Changelog e políticas legais
• Transição de tema dark/light mais fluida e lenta
• Seção "Como funciona" na landing page
• Animação marquee com logos das plataformas
• Persistência de tema via localStorage entre páginas

v0.3.0 — junho 2025
• Layout profissional completo com mockup do dashboard
• Modo escuro e claro com transição circular animada
• Chat com assistente IA integrado (powered by Claude)
• Links do rodapé funcionais com conteúdo real
• Newsletter no rodapé com 4 colunas e seção de Links Rápidos
• Melhorias gerais de performance e acessibilidade

v0.2.0 — maio 2025
• Ícones SVG oficiais de todas as plataformas
• Lista de espera com posição numerada (#247)
• Sistema de indicações para avançar na fila
• Login com OAuth (Twitch, YouTube, Kick, Discord, Google)
• Rodapé com links de redes sociais
• Seção de preços com plano grátis e pro

v0.1.0 — abril 2025
• Lançamento inicial da landing page
• Sistema de lista de espera
• Página de login
• Deploy no Vercel com domínio sheikstream.vercel.app

---
Acompanhe todas as novidades: @sheikstream no X/Twitter`,
  },

  contato: {
    title: 'Contato',
    category: 'Empresa',
    desc: 'Fale com a equipe Sheikstream pelo canal que preferir.',
    content: `Estamos sempre disponíveis para ouvir você. Escolha o canal que preferir:

📧 E-MAIL GERAL
contato@sheikstream.com.br
Respondemos em até 48 horas úteis.

🐛 REPORTAR BUGS
bugs@sheikstream.com.br
Inclua: descrição do problema, navegador e sistema operacional.

💼 PARCERIAS E IMPRENSA
parceria@sheikstream.com.br

🔒 PRIVACIDADE E DADOS (LGPD)
privacidade@sheikstream.com.br

💬 COMUNIDADE
Nossa comunidade no Discord está chegando em breve! Enquanto isso, nos siga nas redes sociais:
• Twitter / X: @sheikstream
• Instagram: @sheikstream
• TikTok: @sheikstream

⚡ SUPORTE RÁPIDO
Para dúvidas rápidas, use o chat com nosso assistente IA direto no site — disponível 24/7 no canto inferior direito da tela.`,
  },

  blog: {
    title: 'Blog',
    category: 'Conteúdo',
    desc: 'Conteúdo para streamers brasileiros — em breve.',
    content: `Nosso blog está chegando! 🚀

Em breve você vai encontrar aqui conteúdo de qualidade para streamers brasileiros:

📚 CONTEÚDO PLANEJADO
• Guias completos para crescer no Twitch, YouTube e Kick em 2025
• Como configurar transmissões simultâneas em múltiplas plataformas
• Melhores horários para fazer live em cada plataforma (dados reais)
• Comparativo aprofundado: Twitch vs Kick vs YouTube em 2025
• Como usar bots para automatizar sua live sem perder autenticidade
• Histórias de streamers brasileiros que escalaram com o hub
• Novidades e atualizações do Sheikstream explicadas em detalhes

📬 SEJA O PRIMEIRO A SABER
Assine nossa newsletter no rodapé do site e você será notificado assim que publicarmos o primeiro artigo.

✍️ QUER ESCREVER PARA NÓS?
Somos um produto da comunidade. Se você é streamer e quer compartilhar sua experiência, manda uma mensagem:
blog@sheikstream.com.br`,
  },
}
