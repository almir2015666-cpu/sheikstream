import LegalDoc from '@/app/components/LegalDoc'

const SECTIONS = [
  {
    id: 'suporte',
    title: 'Suporte técnico',
    content: [
      'Para dúvidas sobre o funcionamento da plataforma, problemas de acesso, bugs ou erros, entre em contato com nossa equipe de suporte.',
    ],
    items: [
      { term: 'E-mail', def: 'suporte@sheikstream.com.br' },
      { term: 'Assunto', def: 'Suporte — [breve descrição do problema]' },
      { term: 'Prazo de resposta', def: 'Até 2 dias úteis' },
    ],
    highlight: 'Para agilizar o atendimento, inclua no e-mail seu nome de usuário na plataforma e uma descrição detalhada do problema, com capturas de tela se possível.',
  },
  {
    id: 'feedback',
    title: 'Feedback e sugestões',
    content: [
      'Sua opinião é fundamental para o desenvolvimento da SheikSTREAM. Se você tem ideias de novas funcionalidades, melhorias ou identificou algo que poderia ser diferente, adoraríamos ouvir.',
    ],
    items: [
      { term: 'E-mail', def: 'feedback@sheikstream.com.br' },
      { term: 'Assunto', def: 'Feedback — [funcionalidade ou área]' },
      { term: 'Prazo de resposta', def: 'Até 5 dias úteis' },
    ],
  },
  {
    id: 'parcerias',
    title: 'Parcerias e integrações',
    content: [
      'Quer integrar sua plataforma com a SheikSTREAM ou propor uma parceria comercial? Entre em contato com nossa equipe de negócios.',
    ],
    items: [
      { term: 'E-mail', def: 'parcerias@sheikstream.com.br' },
      { term: 'Assunto', def: 'Parceria — [nome da empresa/plataforma]' },
      { term: 'Prazo de resposta', def: 'Até 5 dias úteis' },
    ],
  },
  {
    id: 'imprensa',
    title: 'Imprensa e mídia',
    content: [
      'Jornalistas, criadores de conteúdo e veículos de comunicação que desejem informações sobre a SheikSTREAM, entrevistas ou materiais de divulgação podem entrar em contato com nossa assessoria.',
    ],
    items: [
      { term: 'E-mail', def: 'imprensa@sheikstream.com.br' },
      { term: 'Assunto', def: 'Imprensa — [veículo/publicação]' },
    ],
  },
  {
    id: 'privacidade',
    title: 'Privacidade e dados pessoais',
    content: [
      'Para exercer seus direitos como titular de dados pessoais nos termos da LGPD — como acesso, correção, portabilidade ou exclusão — entre em contato com nosso Encarregado de Proteção de Dados (DPO).',
    ],
    items: [
      { term: 'E-mail', def: 'privacidade@sheikstream.com.br' },
      { term: 'Assunto', def: 'LGPD — [tipo de solicitação]' },
      { term: 'Prazo de resposta', def: 'Até 15 dias úteis' },
    ],
  },
]

export default function ContatoPage() {
  return (
    <LegalDoc
      title="Fale com a gente"
      subtitle="Canais oficiais de contato da equipe SheikSTREAM."
      version="1.0"
      updatedAt="10 de junho de 2026"
      badge="Contato"
      sections={SECTIONS}
      backHref="/"
      backLabel="Voltar"
    />
  )
}
