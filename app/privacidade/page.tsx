import LegalDoc from '@/app/components/LegalDoc'

const SECTIONS = [
  {
    id: 'intro',
    title: 'Introdução',
    content: [
      'A SheikSTREAM ("nós", "nosso") valoriza a privacidade dos seus usuários e está comprometida em proteger as informações pessoais que você nos confia. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e compartilhamos suas informações quando você utiliza a plataforma SheikSTREAM.',
      'Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei n.º 13.709/2018). Ao utilizar a Plataforma, você concorda com os termos desta Política de Privacidade.',
    ],
  },
  {
    id: 'definicoes',
    title: '1. Definições',
    items: [
      { term: 'Dados Pessoais', def: 'Qualquer informação relacionada a pessoa natural identificada ou identificável.' },
      { term: 'Tratamento', def: 'Toda operação realizada com dados pessoais, como coleta, produção, recepção, classificação, utilização, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, avaliação ou controle da informação, modificação, comunicação, transferência, difusão ou extração.' },
      { term: 'Titular', def: 'Você, a pessoa natural a quem se referem os dados pessoais que são objeto de tratamento.' },
      { term: 'Controlador', def: 'A SheikSTREAM, responsável pelas decisões referentes ao tratamento de dados pessoais.' },
      { term: 'Operador', def: 'Pessoa natural ou jurídica que realiza o tratamento de dados pessoais em nome do Controlador.' },
    ],
  },
  {
    id: 'coleta',
    title: '2. Dados que Coletamos',
    content: [
      'Coletamos os seguintes tipos de dados pessoais:',
    ],
    items: [
      { term: 'Dados de Conta', def: 'Nome de usuário, endereço de e-mail e foto de perfil fornecidos pelas plataformas de streaming conectadas (Twitch, YouTube, Kick, TikTok).' },
      { term: 'Dados de Plataformas', def: 'Métricas públicas de streaming como contagem de seguidores, visualizações, inscritos e informações de transmissão ao vivo, obtidas por meio das APIs das respectivas plataformas com sua autorização.' },
      { term: 'Dados de Uso', def: 'Informações sobre como você utiliza a Plataforma, incluindo funcionalidades acessadas, configurações definidas, sorteios criados e histórico de ações.' },
      { term: 'Dados Técnicos', def: 'Endereço IP, tipo e versão do navegador, sistema operacional, páginas visitadas, tempo de sessão e outros dados de diagnóstico coletados automaticamente.' },
      { term: 'Dados de Comunicação', def: 'Mensagens enviadas ao suporte, feedback e sugestões que você nos encaminhar voluntariamente.' },
    ],
  },
  {
    id: 'finalidade',
    title: '3. Finalidade do Tratamento',
    content: [
      'Utilizamos seus dados pessoais para as seguintes finalidades:',
    ],
    items: [
      { term: 'Prestação do Serviço', def: 'Criar e gerenciar sua conta, autenticar seu acesso e fornecer as funcionalidades da Plataforma.' },
      { term: 'Melhoria Contínua', def: 'Analisar o uso da Plataforma para identificar problemas, otimizar funcionalidades e desenvolver novas features com base no comportamento dos usuários.' },
      { term: 'Comunicação', def: 'Enviar notificações essenciais sobre sua conta, atualizações de termos e, com seu consentimento, novidades e promoções da SheikSTREAM.' },
      { term: 'Segurança', def: 'Detectar, investigar e prevenir atividades fraudulentas, abusos e outras ameaças à integridade da Plataforma e dos usuários.' },
      { term: 'Obrigações Legais', def: 'Cumprir obrigações legais e regulatórias aplicáveis, incluindo a LGPD e demais normas vigentes.' },
    ],
  },
  {
    id: 'compartilhamento',
    title: '4. Compartilhamento de Dados',
    content: [
      'A SheikSTREAM não vende, aluga ou comercializa seus dados pessoais. Compartilhamos informações apenas nas seguintes situações:',
    ],
    items: [
      { term: 'Provedores de Serviço', def: 'Parceiros que nos auxiliam na operação da Plataforma, como hospedagem em nuvem (Supabase), serviços de e-mail transacional e análise de logs. Esses parceiros processam dados estritamente conforme nossas instruções e não os utilizam para outros fins.' },
      { term: 'Plataformas Integradas', def: 'Dados são compartilhados com as APIs das plataformas de streaming (Twitch, YouTube, Kick, TikTok) exclusivamente para a funcionalidade de integração que você autorizou.' },
      { term: 'Cumprimento Legal', def: 'Autoridades governamentais ou judiciais competentes, quando exigido por lei, ordem judicial ou processo legal válido.' },
      { term: 'Proteção de Direitos', def: 'Em caso de investigação de fraude, violação de segurança ou proteção dos direitos e propriedade da SheikSTREAM, de seus usuários ou do público em geral.' },
    ],
  },
  {
    id: 'retencao',
    title: '5. Retenção de Dados',
    content: [
      'Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta Política, incluindo o cumprimento de obrigações legais, resolução de disputas e execução de nossos acordos.',
      'Após o encerramento da sua conta, os dados são anonimizados ou removidos em até 30 (trinta) dias úteis, salvo quando a retenção for exigida por lei ou regulamentação específica.',
    ],
  },
  {
    id: 'direitos',
    title: '6. Seus Direitos (LGPD)',
    content: [
      'Nos termos da Lei Geral de Proteção de Dados (LGPD), você possui os seguintes direitos como titular dos dados:',
    ],
    items: [
      { term: 'Confirmação e Acesso', def: 'Saber se tratamos seus dados e, em caso afirmativo, acessar uma cópia das informações.' },
      { term: 'Correção', def: 'Solicitar a correção de dados incompletos, inexatos ou desatualizados.' },
      { term: 'Anonimização, Bloqueio ou Eliminação', def: 'Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD.' },
      { term: 'Portabilidade', def: 'Receber seus dados em formato estruturado para transferência a outro fornecedor de serviço ou produto.' },
      { term: 'Revogação do Consentimento', def: 'Revogar o consentimento a qualquer momento, sem prejuízo da licitude do tratamento realizado anteriormente.' },
      { term: 'Oposição', def: 'Opor-se a tratamento realizado com fundamento em legítimo interesse, em caso de descumprimento.' },
    ],
    highlight: 'Para exercer qualquer um desses direitos, entre em contato pelo e-mail: privacidade@sheikstream.com.br. Responderemos em até 15 dias úteis.',
  },
  {
    id: 'cookies',
    title: '7. Cookies e Tecnologias Similares',
    content: [
      'Utilizamos cookies e tecnologias similares para melhorar sua experiência na Plataforma. Para informações detalhadas sobre como utilizamos cookies, consulte nossa Política de Cookies disponível em /cookies.',
    ],
    items: [
      { term: 'Cookies Essenciais', def: 'Necessários para o funcionamento da Plataforma. Incluem autenticação de sessão e preferências de tema. Não podem ser desativados.' },
      { term: 'Cookies Analíticos', def: 'Utilizados para entender como a Plataforma é usada, sempre com dados anonimizados. Podem ser recusados sem impacto nas funcionalidades principais.' },
    ],
  },
  {
    id: 'seguranca',
    title: '8. Segurança dos Dados',
    content: [
      'Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui criptografia em trânsito (HTTPS/TLS), armazenamento seguro com controle de acesso e monitoramento contínuo de segurança.',
      'Embora nos esforcemos para proteger suas informações, nenhum sistema de segurança é impenetrável. Em caso de incidente de segurança que possa afetar seus dados, notificaremos você e a Autoridade Nacional de Proteção de Dados (ANPD) conforme exigido pela LGPD.',
    ],
  },
  {
    id: 'menores',
    title: '9. Menores de Idade',
    content: [
      'A Plataforma não é destinada a menores de 18 (dezoito) anos. Não coletamos intencionalmente dados pessoais de menores de idade. Caso você seja menor de 18 anos, não utilize a Plataforma sem a expressa autorização e supervisão dos seus pais ou responsáveis legais.',
      'Se tomarmos conhecimento de que coletamos dados de um menor sem o consentimento adequado, tomaremos medidas imediatas para excluir essas informações.',
    ],
  },
  {
    id: 'alteracoes',
    title: '10. Alterações desta Política',
    content: [
      'Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas, na legislação ou nos serviços prestados. A data de "Última atualização" no cabeçalho deste documento indica quando esta versão entrou em vigor.',
      'Notificaremos você sobre alterações materiais por e-mail ou mediante aviso visível na Plataforma com antecedência razoável. O uso contínuo da Plataforma após a notificação implica aceitação da política atualizada.',
    ],
  },
  {
    id: 'contato',
    title: '11. Contato e Encarregado (DPO)',
    content: [
      'Para dúvidas, solicitações relacionadas a esta Política de Privacidade ou para exercer seus direitos como titular, entre em contato com nosso Encarregado de Proteção de Dados (DPO):',
    ],
    items: [
      { term: 'E-mail', def: 'privacidade@sheikstream.com.br' },
      { term: 'Assunto', def: 'LGPD — [Tipo de solicitação]' },
      { term: 'Prazo de resposta', def: 'Até 15 dias úteis' },
    ],
  },
]

export default function PrivacidadePage() {
  return (
    <LegalDoc
      title="Política de Privacidade"
      subtitle="Como coletamos, usamos e protegemos seus dados pessoais."
      version="1.0"
      updatedAt="7 de junho de 2026"
      badge="Documento Legal · LGPD"
      sections={SECTIONS}
      backHref="/"
      backLabel="Voltar"
    />
  )
}
