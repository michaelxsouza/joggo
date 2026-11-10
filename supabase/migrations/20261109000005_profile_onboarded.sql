
-- 2026-11-09: boas-vindas
alter table public.profiles add column onboarded boolean not null default false;
