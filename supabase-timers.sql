-- ============================================================
-- SheikSTREAM — Timer System Schema
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Tokens OAuth dos usuários (Twitch, YouTube) + estado do overlay
CREATE TABLE IF NOT EXISTS user_tokens (
  user_id TEXT PRIMARY KEY,
  twitch_token TEXT,
  twitch_channel_id TEXT,
  youtube_token TEXT,
  youtube_live_chat_id TEXT,
  overlay_message TEXT,
  overlay_expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Timers configurados pelos streamers
CREATE TABLE IF NOT EXISTS timers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  intervalo_minutos INTEGER NOT NULL DEFAULT 30,
  min_mensagens INTEGER NOT NULL DEFAULT 0,
  plataformas JSONB NOT NULL DEFAULT '[]'::jsonb,
  tipo_saida TEXT NOT NULL DEFAULT 'chat', -- 'chat' | 'overlay' | 'both'
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_disparo TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Log de execuções dos timers
CREATE TABLE IF NOT EXISTS timer_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timer_id UUID REFERENCES timers(id) ON DELETE CASCADE,
  plataforma TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'success' | 'error' | 'pending'
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_timers_user_id ON timers(user_id);
CREATE INDEX IF NOT EXISTS idx_timers_ativo ON timers(ativo);
CREATE INDEX IF NOT EXISTS idx_timer_logs_timer_id ON timer_logs(timer_id);
CREATE INDEX IF NOT EXISTS idx_timer_logs_created_at ON timer_logs(created_at DESC);

-- Row Level Security (opcional — desative se usar service role key sempre)
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_logs ENABLE ROW LEVEL SECURITY;

-- Policies: service role bypassa RLS automaticamente
-- Para segurança adicional, as rotas API usam service role key
