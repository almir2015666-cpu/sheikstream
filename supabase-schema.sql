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
  id            uuid primary key default gen_random_uuid(),
  user_id       text references public.usuarios(id) on delete cascade,
  trigger       text not null,
  resposta      text not null,
  cooldown_s    integer default 30,
  habilitado    boolean default true,
  permissao     text default 'todos',
  platform      text default 'Twitch',
  notif_overlay boolean default false,
  last_used_at  timestamptz,
  criado_em     timestamptz default now()
);

-- Run if table already exists:
-- alter table public.comandos add column if not exists permissao text default 'todos';
-- alter table public.comandos add column if not exists platform text default 'Twitch';
-- alter table public.comandos add column if not exists last_used_at timestamptz;
-- alter table public.comandos add column if not exists notif_overlay boolean default false;
-- notify pgrst, 'reload schema';

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
-- USER_TOKENS  (OAuth tokens por usuário — Twitch bot, YouTube etc.)
-- ==========================================
create table if not exists public.user_tokens (
  user_id                text primary key,         -- Twitch user ID (numeric string)
  twitch_token           text,
  twitch_refresh_token   text,
  twitch_channel_id      text,
  twitch_username        text,
  youtube_token          text,
  spotify_token          text,
  spotify_refresh_token  text,
  spotify_username       text,
  updated_at             timestamptz default now()
);

-- Run these if the table already exists:
-- alter table public.user_tokens add column if not exists spotify_token text;
-- alter table public.user_tokens add column if not exists spotify_refresh_token text;
-- alter table public.user_tokens add column if not exists spotify_username text;
-- alter table public.user_tokens add column if not exists twitch_refresh_token text;
-- notify pgrst, 'reload schema';

alter table public.user_tokens enable row level security;

create policy "user_tokens: acesso proprio" on public.user_tokens
  for all using (auth.uid()::text = user_id);

-- ==========================================
-- WAITLIST  (fila de acesso à plataforma)
-- ==========================================
create table if not exists public.waitlist (
  id                uuid primary key default gen_random_uuid(),
  platform          text not null default 'Twitch',
  platform_username text not null,
  email             text,
  status            text not null default 'pending', -- pending | approved | rejected | banned
  invite_quota      integer default 0,
  created_at        timestamptz default now()
);

alter table public.waitlist enable row level security;

-- ==========================================
-- INVITES  (convites entre usuários aprovados)
-- ==========================================
create table if not exists public.invites (
  id            uuid primary key default gen_random_uuid(),
  inviter_id    text not null,      -- Twitch user ID de quem enviou
  invitee_email text not null,      -- Twitch username do convidado
  token         text not null unique,
  status        text not null default 'pendente', -- pendente | aceito | vetado
  created_at    timestamptz default now()
);

alter table public.invites enable row level security;

-- ==========================================
-- ADMIN_NOTIFICATIONS
-- ==========================================
create table if not exists public.admin_notifications (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  message          text,
  icon             text default '📢',
  color            text default '#9b30ff',
  active           boolean default true,
  target_username  text,           -- NULL = para todos
  max_views        integer,        -- NULL = ilimitado; N = desaparece após N aparições por usuário
  duration_seconds integer default 10,
  created_at       timestamptz default now()
);

alter table public.admin_notifications enable row level security;

-- ==========================================
-- SUPPORT_TICKETS  (tickets de suporte da landing page)
-- ==========================================
create table if not exists public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  subject     text not null,
  message     text not null,
  reply_email text,
  username    text,
  status      text not null default 'open',  -- open | in_progress | resolved | closed | archived
  admin_reply text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.support_tickets enable row level security;

-- Anyone can insert a ticket (anon + authenticated)
create policy "support_tickets: insert publico" on public.support_tickets
  for insert with check (true);

-- ==========================================
-- TWITCH_SUBS  (histórico de inscritos por streamer)
-- ==========================================
create table if not exists public.twitch_subs (
  id             uuid primary key default gen_random_uuid(),
  broadcaster_id text not null,
  username       text not null,
  tier           text not null default 'tier1',
  is_gift        boolean default false,
  gifted_by      text,
  sorteio_id     uuid,
  tickets        integer default 1,
  date           date not null default current_date,
  created_at     timestamptz default now()
);
alter table public.twitch_subs enable row level security;
create index if not exists twitch_subs_broadcaster_idx on public.twitch_subs(broadcaster_id);
create index if not exists twitch_subs_date_idx on public.twitch_subs(date);

-- ==========================================
-- TWITCH_TIER_CONFIG  (preços dos tiers por streamer)
-- ==========================================
create table if not exists public.twitch_tier_config (
  broadcaster_id text primary key,
  tier1_name     text default 'Tier 1',
  tier1_value    numeric default 9.9,
  tier2_name     text default 'Tier 2',
  tier2_value    numeric default 25.9,
  tier3_name     text default 'Tier 3',
  tier3_value    numeric default 49.9,
  updated_at     timestamptz default now()
);
alter table public.twitch_tier_config enable row level security;

-- ==========================================
-- LIVEPIX_CONFIG  (credenciais Livepix por usuário)
-- ==========================================
create table if not exists public.livepix_config (
  user_id        text primary key,
  channel_id     text,
  client_id      text,
  client_secret  text,
  slug           text,
  updated_at     timestamptz default now()
);
alter table public.livepix_config enable row level security;

-- ==========================================
-- LIVEPIX_DONORS  (doações recebidas via Livepix)
-- ==========================================
create table if not exists public.livepix_donors (
  id             uuid primary key default gen_random_uuid(),
  broadcaster_id text not null,
  username       text not null,
  amount         numeric not null default 0,
  message        text,
  is_manual      boolean default false,
  tickets        integer default 1,
  date           date not null default current_date,
  external_id    text,
  created_at     timestamptz default now()
);
-- Run these if the table already exists without the new columns:
-- alter table public.livepix_donors add column if not exists message text;
-- alter table public.livepix_donors add column if not exists is_manual boolean default false;
-- alter table public.livepix_donors add column if not exists tickets integer default 1;
-- notify pgrst, 'reload schema';
alter table public.livepix_donors enable row level security;
create index if not exists livepix_donors_broadcaster_idx on public.livepix_donors(broadcaster_id);
create index if not exists livepix_donors_date_idx on public.livepix_donors(date);

-- ==========================================
-- TWITCH_EVENTS  (log de eventos EventSub)
-- ==========================================
create table if not exists public.twitch_events (
  id             uuid primary key default gen_random_uuid(),
  broadcaster_id text not null,
  event_type     text not null,
  event_data     jsonb,
  created_at     timestamptz default now()
);
alter table public.twitch_events enable row level security;
create index if not exists twitch_events_broadcaster_idx on public.twitch_events(broadcaster_id);
create index if not exists twitch_events_type_idx on public.twitch_events(event_type);

-- ==========================================
-- TWITCH_CHEERS  (histórico de bits/cheers por streamer)
-- ==========================================
create table if not exists public.twitch_cheers (
  id             uuid primary key default gen_random_uuid(),
  broadcaster_id text not null,
  username       text,
  bits           integer not null default 0,
  message        text,
  is_anonymous   boolean default false,
  date           date not null default current_date,
  created_at     timestamptz default now()
);
alter table public.twitch_cheers enable row level security;
create index if not exists twitch_cheers_broadcaster_idx on public.twitch_cheers(broadcaster_id);
create index if not exists twitch_cheers_date_idx on public.twitch_cheers(date);

-- ==========================================
-- SORTEIO_TICKETS  (tickets de participantes em sorteios)
-- ==========================================
create table if not exists public.sorteio_tickets (
  id             uuid primary key default gen_random_uuid(),
  broadcaster_id text not null,
  sorteio_id     uuid,
  donor_name     text not null,
  amount         numeric default 0,
  platform       text default 'livepix',
  created_at     timestamptz default now()
);
alter table public.sorteio_tickets enable row level security;
create index if not exists sorteio_tickets_broadcaster_idx on public.sorteio_tickets(broadcaster_id);

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
