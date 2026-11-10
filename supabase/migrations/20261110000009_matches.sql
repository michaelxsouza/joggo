-- Jogos e resultados (sincronizados automaticamente da football-data.org)
create table public.matches (
  id bigint primary key,
  competition_code text not null,
  competition_name text not null,
  competition_emblem text,
  utc_date timestamptz not null,
  status text not null,
  matchday int,
  stage text,
  home_name text not null,
  home_short text,
  home_crest text,
  away_name text not null,
  away_short text,
  away_crest text,
  home_score int,
  away_score int,
  updated_at timestamptz not null default now()
);
create index on public.matches (utc_date);
create index on public.matches (competition_code, utc_date);
alter table public.matches enable row level security;
create policy "jogos visíveis a logados" on public.matches for select to authenticated using (true);

create table public.sync_state (key text primary key, last_run timestamptz, last_ok timestamptz, last_error text);
alter table public.sync_state enable row level security;

create extension if not exists pg_cron;
create extension if not exists pg_net;
-- a cada 10 minutos chama a Edge Function sync-matches (Authorization = chave anon pública)
-- select cron.schedule('sync-matches', '*/10 * * * *', $$ select net.http_post(url := 'https://<ref>.supabase.co/functions/v1/sync-matches', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <anon-key>'), body := '{}'::jsonb); $$);
