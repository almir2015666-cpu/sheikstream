import LegalDoc from '@/app/components/LegalDoc'

const SECTIONS = [
  {
    id: 'em-breve',
    title: 'Blog em construção',
    content: [
      'O blog da SheikSTREAM está em desenvolvimento e em breve trará conteúdo exclusivo para streamers brasileiros.',
      'Aqui você encontrará artigos, tutoriais, novidades da plataforma, dicas de crescimento para sua comunidade e muito mais.',
    ],
    highlight: 'Quer ser avisado quando o blog for ao ar? Envie um e-mail para contato@sheikstream.com.br com o assunto "Blog — Notificação" e entraremos em contato.',
  },
  {
    id: 'o-que-vira',
    title: 'O que está por vir',
    items: [
      { term: 'Tutoriais', def: 'Guias passo a passo para configurar a SheikSTREAM, overlays, sorteios e integrações com suas plataformas favoritas.' },
      { term: 'Novidades da plataforma', def: 'Anúncios de novas funcionalidades, integrações e melhorias baseadas no feedback da comunidade.' },
      { term: 'Dicas para streamers', def: 'Conteúdo sobre como crescer sua comunidade, monetizar sua stream e engajar sua audiência.' },
      { term: 'Atualizações de API', def: 'Informações técnicas para desenvolvedores e integradores que utilizam a plataforma.' },
      { term: 'Histórias da comunidade', def: 'Cases e depoimentos de streamers que utilizam a SheikSTREAM no seu dia a dia.' },
    ],
  },
  {
    id: 'contato',
    title: 'Sugestões de pauta',
    content: [
      'Tem uma sugestão de assunto que gostaria de ver no blog? Sua experiência como streamer pode ajudar outros criadores de conteúdo.',
    ],
    items: [
      { term: 'E-mail', def: 'blog@sheikstream.com.br' },
      { term: 'Assunto', def: 'Blog — [sugestão de pauta]' },
    ],
  },
]

export default function BlogPage() {
  return (
    <LegalDoc
      title="Blog SheikSTREAM"
      subtitle="Novidades, dicas e tutoriais para streamers brasileiros."
      version="1.0"
      updatedAt="10 de junho de 2026"
      badge="Em breve"
      sections={SECTIONS}
      backHref="/"
      backLabel="Voltar"
    />
  )
}
