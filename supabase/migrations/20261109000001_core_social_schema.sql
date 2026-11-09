-- Joggo: esquema social principal
create type public.category as enum ('esportes','poker','roleta','slots','cassino');
create type public.post_kind as enum ('post','bilhete');
create type public.bet_result as enum ('pendente','green','red','anulado');
create type public.user_role as enum ('user','moderator','admin');

-- PERFIS ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  handle text not null unique check (handle ~ '^[a-z0-9._]{3,24}$'),
  bio text not null default '' check (char_length(bio) <= 280),
  location text check (char_length(location) <= 60),
  avatar_url text,
  cover_url text,
  avatar_color text not null default '#B0FF35',
  interests public.category[] not null default '{}',
  birth_date date not null check (birth_date <= (current_date - interval '18 years')),
  role public.user_role not null default 'user',
  founder boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin','moderator'));
$$;

-- impede que o usuário mude o próprio papel/selo de fundador/nascimento
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null and not exists (
       select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin') then
    new.role := old.role;
    new.founder := old.founder;
    new.birth_date := old.birth_date;
  end if;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- cria o perfil a partir dos metadados do cadastro
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, handle, birth_date)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Jogador'),
    lower(coalesce(new.raw_user_meta_data->>'handle', 'user' || substr(replace(new.id::text,'-',''),1,10))),
    (new.raw_user_meta_data->>'birth_date')::date
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- COMUNIDADES ----------------------------------------------------------
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  name text not null check (char_length(name) between 3 and 60),
  category public.category not null,
  description text not null default '' check (char_length(description) <= 500),
  cover_url text,
  rules text[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.communities (created_by);

create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index on public.community_members (user_id);

-- POSTS ----------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  category public.category not null,
  kind public.post_kind not null default 'post',
  text text not null default '' check (char_length(text) <= 2000),
  image_url text,
  bet_event text check (char_length(bet_event) <= 120),
  bet_pick text check (char_length(bet_pick) <= 200),
  bet_odd numeric(8,2) check (bet_odd is null or bet_odd >= 1.01),
  bet_result public.bet_result,
  bet_resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint post_has_content check (char_length(text) > 0 or image_url is not null),
  constraint bilhete_fields check (
    kind = 'post' or (bet_pick is not null and bet_odd is not null and bet_result is not null))
);
create index on public.posts (created_at desc);
create index on public.posts (author_id, created_at desc);
create index on public.posts (community_id, created_at desc);

-- autor só pode mudar o resultado do bilhete uma vez (de pendente para green/red/anulado)
create or replace function public.guard_post_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if public.is_admin() then return new; end if;
  if new.kind <> old.kind or new.bet_pick is distinct from old.bet_pick
     or new.bet_odd is distinct from old.bet_odd or new.bet_event is distinct from old.bet_event then
    raise exception 'Não é possível alterar os dados do bilhete depois de publicado';
  end if;
  if new.bet_result is distinct from old.bet_result then
    if old.bet_result <> 'pendente' then
      raise exception 'O resultado deste bilhete já foi marcado';
    end if;
    new.bet_resolved_at := now();
  end if;
  return new;
end $$;
create trigger posts_guard before update on public.posts
  for each row execute function public.guard_post_update();

-- limite anti-spam: 15 posts por hora
create or replace function public.rate_limit_posts()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.posts where author_id = new.author_id
      and created_at > now() - interval '1 hour') >= 15 then
    raise exception 'Limite de publicações atingido. Tente novamente mais tarde.';
  end if;
  return new;
end $$;
create trigger posts_rate_limit before insert on public.posts
  for each row execute function public.rate_limit_posts();

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index on public.comments (post_id, created_at);
create index on public.comments (author_id);

create or replace function public.rate_limit_comments()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.comments where author_id = new.author_id
      and created_at > now() - interval '5 minutes') >= 20 then
    raise exception 'Você está comentando rápido demais. Aguarde um pouco.';
  end if;
  return new;
end $$;
create trigger comments_rate_limit before insert on public.comments
  for each row execute function public.rate_limit_comments();

create table public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index on public.likes (user_id);

create table public.saves (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index on public.saves (user_id);

create table public.hidden_posts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);
create index on public.hidden_posts (user_id);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index on public.follows (following_id);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index on public.blocks (blocked_id);

create type public.report_target as enum ('post','user','comment','ad');
create type public.report_status as enum ('aberta','resolvida','descartada');
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target public.report_target not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 2 and 100),
  details text check (char_length(details) <= 1000),
  status public.report_status not null default 'aberta',
  created_at timestamptz not null default now()
);
create index on public.reports (reporter_id);
create index on public.reports (status, created_at);

-- RLS ------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
alter table public.hidden_posts enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

-- leitura: apenas usuários logados (rede fechada 18+)
create policy "perfis visíveis a logados" on public.profiles for select to authenticated using (true);
create policy "editar o próprio perfil" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "comunidades visíveis" on public.communities for select to authenticated using (true);
create policy "admin cria comunidades" on public.communities for insert to authenticated with check ((select public.is_admin()));
create policy "admin edita comunidades" on public.communities for update to authenticated using ((select public.is_admin()));
create policy "admin apaga comunidades" on public.communities for delete to authenticated using ((select public.is_admin()));

create policy "membros visíveis" on public.community_members for select to authenticated using (true);
create policy "entrar em comunidade" on public.community_members for insert to authenticated with check (user_id = (select auth.uid()));
create policy "sair de comunidade" on public.community_members for delete to authenticated using (user_id = (select auth.uid()));

create policy "posts visíveis" on public.posts for select to authenticated using (true);
create policy "criar post próprio" on public.posts for insert to authenticated
  with check (author_id = (select auth.uid()) and (kind = 'post' or bet_result = 'pendente'));
create policy "editar post próprio" on public.posts for update to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()))
  with check (author_id = (select auth.uid()) or (select public.is_admin()));
create policy "apagar post próprio" on public.posts for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));

create policy "comentários visíveis" on public.comments for select to authenticated using (true);
create policy "comentar" on public.comments for insert to authenticated with check (author_id = (select auth.uid()));
create policy "apagar comentário" on public.comments for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));

create policy "curtidas visíveis" on public.likes for select to authenticated using (true);
create policy "curtir" on public.likes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "descurtir" on public.likes for delete to authenticated using (user_id = (select auth.uid()));

create policy "ver meus salvos" on public.saves for select to authenticated using (user_id = (select auth.uid()));
create policy "salvar" on public.saves for insert to authenticated with check (user_id = (select auth.uid()));
create policy "remover salvo" on public.saves for delete to authenticated using (user_id = (select auth.uid()));

create policy "ver meus ocultos" on public.hidden_posts for select to authenticated using (user_id = (select auth.uid()));
create policy "ocultar" on public.hidden_posts for insert to authenticated with check (user_id = (select auth.uid()));
create policy "reexibir" on public.hidden_posts for delete to authenticated using (user_id = (select auth.uid()));

create policy "seguidores visíveis" on public.follows for select to authenticated using (true);
create policy "seguir" on public.follows for insert to authenticated with check (follower_id = (select auth.uid()));
create policy "deixar de seguir" on public.follows for delete to authenticated using (follower_id = (select auth.uid()));

create policy "ver meus bloqueios" on public.blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy "bloquear" on public.blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "desbloquear" on public.blocks for delete to authenticated using (blocker_id = (select auth.uid()));

create policy "ver minhas denúncias ou moderar" on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));
create policy "denunciar" on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'aberta');
create policy "moderar denúncias" on public.reports for update to authenticated using ((select public.is_admin()));

-- VIEWS ----------------------------------------------------------------
create view public.post_feed with (security_invoker = true) as
select p.*,
  pr.name as author_name, pr.handle as author_handle, pr.avatar_url as author_avatar_url,
  pr.avatar_color as author_avatar_color, pr.founder as author_founder,
  (select count(*) from public.likes l where l.post_id = p.id)::int as like_count,
  (select count(*) from public.comments c where c.post_id = p.id)::int as comment_count
from public.posts p join public.profiles pr on pr.id = p.author_id;

-- estatística de bilhetes por usuário (base do ranking)
create view public.tipster_stats with (security_invoker = true) as
select author_id,
  count(*) filter (where bet_result = 'green')::int as greens,
  count(*) filter (where bet_result = 'red')::int as reds,
  count(*) filter (where bet_result = 'pendente')::int as pendentes,
  round(100.0 * count(*) filter (where bet_result = 'green')
        / nullif(count(*) filter (where bet_result in ('green','red')),0), 1) as taxa_acerto
from public.posts where kind = 'bilhete' group by author_id;
