import LegalDoc from '@/app/components/LegalDoc'

const SECTIONS = [
  {
    id: 'quem-somos',
    title: 'Quem somos',
    content: [
      'A SheikSTREAM é uma plataforma brasileira de gestão para streamers, criada para facilitar o controle de inscrições, doações, sorteios e overlays em um único lugar.',
      'Desenvolvida por streamers, para streamers — entendemos na prática os desafios de gerir uma comunidade e transformamos isso em ferramentas que realmente fazem diferença ao vivo.',
    ],
  },
  {
    id: 'missao',
    title: 'Nossa missão',
    content: [
      'Nossa missão é empoderar streamers brasileiros com ferramentas profissionais e acessíveis, para que possam se concentrar no que importa: criar conteúdo de qualidade e se conectar com sua comunidade.',
      'Acreditamos que tecnologia deve ser transparente e trabalhar em segundo plano — deixando o streamer no centro das atenções.',
    ],
  },
  {
    id: 'o-que-oferecemos',
    title: 'O que oferecemos',
    items: [
      { term: 'Dashboard unificado', def: 'Visualize em tempo real dados de Twitch, Kick, Livepix, YouTube e outras plataformas em um único painel.' },
      { term: 'Overlays personalizáveis', def: 'Adicione alertas, contadores de inscritos, metas e muito mais diretamente na sua transmissão.' },
      { term: 'Sorteios integrados', def: 'Realize sorteios com tickets automatizados para seus inscritos, membros e doadores.' },
      { term: 'Gestão de eventos', def: 'Registre e acompanhe inscrições, doações, bits, follows e giftsubs de todas as plataformas.' },
      { term: 'Segurança', def: 'Seus dados ficam protegidos com criptografia em trânsito e controle de acesso rigoroso.' },
    ],
  },
  {
    id: 'valores',
    title: 'Nossos valores',
    items: [
      { term: 'Transparência', def: 'Somos diretos sobre como funciona a plataforma, quais dados coletamos e como os usamos.' },
      { term: 'Comunidade', def: 'Ouvimos ativamente nossos usuários e desenvolvemos baseados em feedback real.' },
      { term: 'Acessibilidade', def: 'Queremos que qualquer streamer, independente do tamanho, tenha acesso a ferramentas de qualidade.' },
      { term: 'Inovação', def: 'Estamos em constante evolução, trazendo novas integrações e funcionalidades para o ecossistema brasileiro de streaming.' },
    ],
  },
  {
    id: 'contato',
    title: 'Fale com a gente',
    content: [
      'Tem dúvidas sobre a plataforma, quer dar um feedback ou explorar uma parceria? Ficamos felizes em ouvir.',
    ],
    items: [
      { term: 'E-mail geral', def: 'contato@sheikstream.com.br' },
      { term: 'Suporte técnico', def: 'suporte@sheikstream.com.br' },
      { term: 'Parcerias', def: 'parcerias@sheikstream.com.br' },
    ],
    highlight: 'Estamos em Beta Fechado. Se você é streamer e quer acesso antecipado, entre em contato pelo e-mail contato@sheikstream.com.br.',
  },
]

export default function SobrePage() {
  return (
    <LegalDoc
      title="SheikSTREAM"
      subtitle="A plataforma de gestão para streamers brasileiros."
      version="1.0"
      updatedAt="10 de junho de 2026"
      badge="Sobre nós"
      sections={SECTIONS}
      backHref="/"
      backLabel="Voltar"
    />
  )
}
