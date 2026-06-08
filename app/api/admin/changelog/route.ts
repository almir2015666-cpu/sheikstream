import { NextRequest, NextResponse } from 'next/server'
import { isAdminPassword } from '@/app/lib/adminAuth'

const ENTRIES = [
  { date: '2026-06-07', title: 'Ticket: histórico estilo WhatsApp', desc: 'Visualização de tickets redesenhada como chat — balões de mensagem para usuário (esquerda) e admin (direita), input de resposta no rodapé.' },
  { date: '2026-06-07', title: 'Filtros de usuário corrigidos', desc: 'Abas Todos/Ativos/Pendentes/Rejeitados agora aparecem apenas na view de Usuários, não em tickets, senhas ou outros painéis.' },
  { date: '2026-06-07', title: 'Changelog via API', desc: 'Changelog movido para API própria (/api/admin/changelog). Botão de atualizar ativo; novas entradas aparecem sem refresh da página.' },
  { date: '2026-06-07', title: 'Avisos com destinatário', desc: 'Admin pode enviar aviso para todos os usuários ou para um usuário específico via dropdown. Filtro aplicado no servidor.' },
  { date: '2026-06-07', title: 'Sistema de Avisos (Admin)', desc: 'Painel de criação de avisos com seletor de ícone, paleta de cores, preview ao vivo. Banners descartáveis no dashboard do usuário.' },
  { date: '2026-06-07', title: 'VODs / Transmissões anteriores', desc: 'Tab "Transmissões" na página Twitch exibe VODs reais via Helix API (thumbnail, título, duração, views, link externo).' },
  { date: '2026-06-07', title: 'Reordenar sidebar (Admin)', desc: 'Botão "Reordenar menu" aparece para admins autenticados. Itens movíveis com ▲/▼; ordem salva no localStorage.' },
  { date: '2026-06-07', title: 'Ícones Twitch e Livepix na sidebar', desc: 'Sub-itens das plataformas Twitch e Livepix exibem o ícone oficial da plataforma ao lado do nome.' },
  { date: '2026-06-07', title: 'Sistema de Tickets', desc: 'Formulário de ticket no chat da landing page, API pública POST /api/tickets, API admin GET/PATCH /api/admin/tickets, view completa de tickets no painel admin com status e resposta.' },
  { date: '2026-06-07', title: 'Animação de entrada na landing page', desc: 'Overlay verde com logo SheikSTREAM e efeito de scanline ao abrir o site pela primeira vez. Executado uma vez por sessão via sessionStorage.' },
  { date: '2026-06-07', title: 'Opções de cor/efeito no Banner', desc: 'Campos de cor independente para texto principal, secundário e nota. Toggle de efeito Glow (text-shadow). Preview atualizado em tempo real.' },
  { date: '2026-06-07', title: 'Avatar do canal na seção Funções', desc: 'Admin/Funções agora exibe a foto de perfil real do usuário (da coluna image_url do waitlist) em vez de iniciais.' },
  { date: '2026-06-07', title: 'IA mais direta e concisa', desc: 'System prompt do assistente atualizado: máximo 2 frases, proibido saudações e enrolação. Reduz verbosidade das respostas.' },
  { date: '2026-06-07', title: 'RULE_TAGS dinâmicas no overlay de subathon', desc: 'As tags "+2m TWITCH SUB", "+1m LIVEPIX", "+30s BITS" agora usam os valores reais do BD (seconds_per_sub, seconds_per_livepix, seconds_per_bits100).' },
  { date: '2026-06-06', title: 'Changelog do admin', desc: 'Histórico de alterações do sistema com data, título e descrição.' },
  { date: '2026-06-06', title: 'Logs de Login Admin', desc: 'Tabela admin_login_logs com IP, user-agent e resultado. API GET /api/admin/login-logs. Tab "Logins Admin" no painel de Logs.' },
  { date: '2026-06-06', title: 'Navegação categorizada com busca', desc: 'Sidebar do dashboard reorganizada em grupos. Campo de busca em tempo real para filtrar itens.' },
  { date: '2026-06-06', title: 'Auto-refresh do dashboard (60s)', desc: 'Stats do dashboard e canal Twitch atualizam automaticamente a cada 60 segundos sem interação do usuário.' },
  { date: '2026-06-06', title: 'Fix broadcaster ID Twitch', desc: 'Quando twitch_channel_id é null, auto-busca via Helix /users e salva no banco. Corrige seguidores mostrando "—" permanentemente.' },
  { date: '2026-06-05', title: 'Overlay auto-update (config do BD)', desc: 'Configuração do overlay salva no banco, overlay busca a cada 10s. Remove necessidade de recarregar URL ao mudar configurações.' },
  { date: '2026-06-05', title: 'Stats do dashboard real', desc: 'Métricas do dashboard conectadas a dados reais do banco (subscribers, arrecadação, etc).' },
  { date: '2026-06-05', title: 'Senhas admin temporárias e permanentes', desc: 'Sistema de senhas admin com validade configurável, toggle ativo/inativo e geração de senha aleatória.' },
  { date: '2026-06-04', title: 'Roles/Funções de usuário', desc: 'Tabela user_roles, API /api/admin/roles e /api/me/role, atribuição de funções (admin, moderador, vip, streamer, parceiro, editor) pelo painel admin.' },
  { date: '2026-06-03', title: 'Sync de subs Twitch (Helix API)', desc: 'Botão de sincronização busca subs reais via API Helix. Insere novos subs no banco sem duplicatas.' },
  { date: '2026-06-03', title: 'Posição do banner (topo/rodapé)', desc: 'Campo position no banner config. Banner pode ser fixado no topo ou no rodapé do dashboard.' },
]

export async function GET(req: NextRequest) {
  if (!await isAdminPassword(req.headers.get('x-admin-password') ?? ''))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(ENTRIES)
}
