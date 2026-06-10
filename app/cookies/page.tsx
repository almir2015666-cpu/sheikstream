import LegalDoc from '@/app/components/LegalDoc'

const SECTIONS = [
  {
    id: 'intro',
    title: 'Introdução',
    content: [
      'Esta Política de Cookies explica como a SheikSTREAM utiliza cookies e tecnologias similares de rastreamento quando você acessa e usa nossa Plataforma.',
      'Ao continuar utilizando a SheikSTREAM, você consente com o uso de cookies conforme descrito nesta política. Você pode gerenciar suas preferências a qualquer momento através das configurações do seu navegador.',
    ],
  },
  {
    id: 'o-que-sao',
    title: '1. O que são Cookies?',
    content: [
      'Cookies são pequenos arquivos de texto armazenados no seu dispositivo (computador, tablet ou smartphone) pelo navegador quando você visita um site. Eles permitem que a Plataforma reconheça seu dispositivo em visitas subsequentes e mantenha informações sobre suas preferências e ações.',
      'Além de cookies tradicionais, podemos utilizar tecnologias similares como armazenamento local (localStorage), armazenamento de sessão (sessionStorage) e identificadores de dispositivo para finalidades semelhantes.',
    ],
  },
  {
    id: 'tipos',
    title: '2. Tipos de Cookies que Utilizamos',
    content: ['Classificamos os cookies que utilizamos nas seguintes categorias:'],
    items: [
      { term: 'Cookies Essenciais', def: 'Necessários para o funcionamento básico da Plataforma. Sem eles, partes essenciais do serviço não funcionariam corretamente. Não requerem consentimento e não podem ser desativados.' },
      { term: 'Cookies de Preferência', def: 'Permitem que a Plataforma lembre de suas escolhas (como tema claro/escuro) e forneça uma experiência personalizada. Persistem entre sessões.' },
      { term: 'Cookies Analíticos', def: 'Utilizados para entender como os usuários interagem com a Plataforma. Todos os dados são anonimizados e agregados — nenhuma informação pessoal identificável é coletada neste contexto.' },
    ],
  },
  {
    id: 'lista',
    title: '3. Cookies Utilizados',
    items: [
      { term: 'sk-s2', def: 'Cookie de sessão autenticada. Mantém você logado na Plataforma. Duração: 7 dias. Essencial.' },
      { term: 'sk-theme', def: 'Preferência de tema (claro/escuro). Armazenado via localStorage. Duração: persistente. Preferência.' },
      { term: 'sk-tpending', def: 'Cookie temporário de aceitação de termos durante o fluxo de autenticação. Duração: 10 minutos. Essencial.' },
    ],
  },
  {
    id: 'nao-usamos',
    title: '4. O que NÃO Fazemos',
    content: [
      'A SheikSTREAM não utiliza cookies para as seguintes finalidades:',
    ],
    proibido: [
      'Publicidade direcionada ou rastreamento de comportamento para fins comerciais.',
      'Compartilhamento de dados com redes de anúncios ou plataformas de marketing de terceiros.',
      'Criação de perfis de usuário para venda a terceiros.',
      'Rastreamento de suas atividades em outros sites fora da Plataforma.',
    ],
  },
  {
    id: 'gerenciar',
    title: '5. Como Gerenciar Cookies',
    content: [
      'Você pode controlar e gerenciar cookies de várias formas:',
    ],
    items: [
      { term: 'Configurações do Navegador', def: 'A maioria dos navegadores permite visualizar, excluir e bloquear cookies. Consulte a seção de ajuda do seu navegador para instruções específicas (Chrome, Firefox, Safari, Edge).' },
      { term: 'Cookies Essenciais', def: 'Não podem ser desativados pois são necessários para que a Plataforma funcione. Desativá-los manualmente pelo navegador pode impedir o login e outras funcionalidades críticas.' },
      { term: 'Impacto da Desativação', def: 'Desativar cookies analíticos e de preferência não afeta as funcionalidades principais da Plataforma, mas pode resultar em uma experiência menos personalizada.' },
    ],
  },
  {
    id: 'atualizacoes',
    title: '6. Atualizações desta Política',
    content: [
      'Esta Política de Cookies pode ser atualizada periodicamente para refletir mudanças nos cookies utilizados ou na legislação aplicável. A data de "Última atualização" no cabeçalho indica quando a versão vigente entrou em vigor.',
      'Recomendamos que você revise esta política regularmente. Alterações significativas serão comunicadas por e-mail ou mediante aviso na Plataforma.',
    ],
  },
  {
    id: 'contato',
    title: '7. Contato',
    content: [
      'Para dúvidas sobre o uso de cookies na Plataforma, entre em contato:',
    ],
    items: [
      { term: 'E-mail', def: 'cookies@sheikstream.com.br' },
      { term: 'Assunto', def: 'Política de Cookies — [Dúvida]' },
      { term: 'Prazo', def: 'Respondemos em até 5 dias úteis' },
    ],
  },
]

export default function CookiesPage() {
  return (
    <LegalDoc
      title="Política de Cookies"
      subtitle="Como utilizamos cookies e tecnologias similares para melhorar sua experiência."
      version="1.0"
      updatedAt="7 de junho de 2026"
      badge="Documento Legal"
      sections={SECTIONS}
      backHref="/"
      backLabel="Voltar"
    />
  )
}
