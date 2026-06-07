-- Sheikstream — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ==========================================
-- USUARIOS
-- ==========================================
create table if not exists public.usuarios (
  id          text primary key,           -- Twitch user ID
  nome        text not null,
  email       text,
  imagem      text,
  bio         text,
  criado_em   timestamptz default now(),
  atualizado_em timestamptz default now()
);

alter table public.usuarios enable row level security;

-- ==========================================
-- TERMS_ACCEPTED
-- ==========================================
create table if not exists public.terms_accepted (
  id          uuid primary key default gen_random_uuid(),
  user_id     text references public.usuarios(id) on delete cascade,
  aceito_em   timestamptz default now(),
  versao      text default '1.0'
);

alter table public.terms_accepted enable row level security;

-- ==========================================
-- SORTEIOS
-- ==========================================
create table if not exists public.sorteios (
  id            uuid primary key default gen_random_uuid(),
  user_id       text references public.usuarios(id) on delete cascade,
  titulo        text not null,
  premio        text,
  tipo          text not null default 'livepix',  -- livepix | sub_twitch | membro_youtube | sub_kick | sub_tiktok | paypal | unificado
  status        text not null default 'rascunho', -- rascunho | ativo | encerrado
  valor_ticket  numeric(10,2) default 0,
  meta_inicial  numeric(10,2) default 0,
  meta_total    numeric(10,2) default 0,
  mensagem      text,
  data_encerra  timestamptz,
  contagem_auto boolean default false,
  pagina_publica boolean default true,
  mostrar_valor boolean default true,
  links_doacao  boolean default true,
  criado_em     timestamptz default now(),
  atualizado_em timestamptz default now()
);

alter table public.sorteios enable row level security;

create index if not exists sorteios_user_id_idx on public.sorteios(user_id);
create index if not exists sorteios_status_idx on public.sorteios(status);

-- ==========================================
-- TICKETS
-- ==========================================
create table if not exists public.tickets (
  id          uuid primary key default gen_random_uuid(),
  sorteio_id  uuid references public.sorteios(id) on delete cascade,
  user_id     text references public.usuarios(id) on delete cascade,
  participante text not null,              -- nome do doador/sub
  plataforma  text not null default 'twitch',
  quantidade  integer not null default 1,
  valor       numeric(10,2) default 0,
  criado_em   timestamptz default now()
);

alter table public.tickets enable row level security;

create index if not exists tickets_sorteio_id_idx on public.tickets(sorteio_id);

-- ==========================================
-- METAS
-- ==========================================
create table if not exists public.metas (
  id           uuid primary key default gen_random_uuid(),
  user_id      text references public.usuarios(id) on delete cascade,
  titulo       text not null,
  tipo         text not null default 'valor',  -- valor | subs_twitch | membros_youtube | subs_kick | subs_tiktok | seguidores
  valor_atual  numeric(10,2) default 0,
  valor_alvo   numeric(10,2) not null,
  ativo        boolean default true,
  criado_em    timestamptz default now(),
  atualizado_em timestamptz default now()
);

alter table public.metas enable row level security;

create index if not exists metas_user_id_idx on public.metas(user_id);

-- ==========================================
-- BANNERS
-- ==========================================
create table if not exists public.banners (
  id              uuid primary key default gen_random_uuid(),
  user_id         text references public.usuarios(id) on delete cascade,
  nome            text not null,
  habilitado      boolean default true,
  etiqueta        boolean default false,
  cooldown_min    integer default 5,
  transicao_saida text default 'Fade Out',
  intervalo_aleatorio boolean default false,
  vis_meta        boolean default true,
  vis_sorteio     boolean default true,
  vis_meta_subs   boolean default false,
  vis_subathon    boolean default false,
  vis_patrocinadores boolean default true,
  criado_em       timestamptz default now(),
  atualizado_em   timestamptz default now()
);

alter table public.banners enable row level security;

create index if not exists banners_user_id_idx on public.banners(user_id);

-- ==========================================
-- BANNER_IMAGENS
-- ==========================================
create table if not exists public.banner_imagens (
  id                uuid primary key default gen_random_uuid(),
  banner_id         uuid references public.banners(id) on delete cascade,
  url               text not null,
  ativa             boolean default true,
  cor_fundo         integer default 50,
  duracao_seg       integer default 10,
  transicao_entrada text default 'Fade In',
  ordem             integer default 0
);

alter table public.banner_imagens enable row level security;

-- ==========================================
-- COMANDOS
-- ==========================================
create table if not exists public.comandos (
  id          uuid primary key default gen_random_uuid(),
  user_id     text references public.usuarios(id) on delete cascade,
  trigger     text not null,
  resposta    text not null,
  cooldown_s  integer default 30,
  habilitado  boolean default true,
  criado_em   timestamptz default now()
);

alter table public.comandos enable row level security;

create index if not exists comandos_user_id_idx on public.comandos(user_id);

-- ==========================================
-- TIMERS
-- ==========================================
create table if not exists public.timers (
  id          uuid primary key default gen_random_uuid(),
  user_id     text references public.usuarios(id) on delete cascade,
  nome        text not null,
  duracao_seg integer not null,
  mensagem    text,
  habilitado  boolean default false,
  criado_em   timestamptz default now()
);

alter table public.timers enable row level security;

create index if not exists timers_user_id_idx on public.timers(user_id);

-- ==========================================
-- CONVITES
-- ==========================================
create table if not exists public.convites (
  id          uuid primary key default gen_random_uuid(),
  user_id     text references public.usuarios(id) on delete cascade,  -- streamer dono
  sorteio_id  uuid references public.sorteios(id) on delete set null,
  participante text not null,
  email       text,
  tickets     integer default 1,
  status      text not null default 'pendente',  -- pendente | aprovado | rejeitado
  criado_em   timestamptz default now()
);

alter table public.convites enable row level security;

create index if not exists convites_user_id_idx on public.convites(user_id);

-- ==========================================
-- RLS POLICIES (permissiva — ajuste conforme auth)
-- ==========================================
-- Usuários lêem/escrevem apenas seus próprios dados

create policy "usuarios: acesso proprio" on public.usuarios
  for all using (auth.uid()::text = id);

create policy "sorteios: acesso proprio" on public.sorteios
  for all using (auth.uid()::text = user_id);

create policy "tickets: acesso proprio" on public.tickets
  for all using (auth.uid()::text = user_id);

create policy "metas: acesso proprio" on public.metas
  for all using (auth.uid()::text = user_id);

create policy "banners: acesso proprio" on public.banners
  for all using (auth.uid()::text = user_id);

create policy "banner_imagens: via banner" on public.banner_imagens
  for all using (
    exists (select 1 from public.banners b where b.id = banner_id and auth.uid()::text = b.user_id)
  );

create policy "comandos: acesso proprio" on public.comandos
  for all using (auth.uid()::text = user_id);

create policy "timers: acesso proprio" on public.timers
  for all using (auth.uid()::text = user_id);

create policy "convites: acesso proprio" on public.convites
  for all using (auth.uid()::text = user_id);

create policy "terms_accepted: acesso proprio" on public.terms_accepted
  for all using (auth.uid()::text = user_id);
