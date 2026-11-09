-- MENSAGENS ------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index on public.conversation_members (user_id);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index on public.messages (conversation_id, created_at);
create index on public.messages (author_id);

create or replace function public.is_conversation_member(conv uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.conversation_members
                 where conversation_id = conv and user_id = (select auth.uid()));
$$;

-- abre (ou reaproveita) conversa 1:1, respeitando bloqueios
create or replace function public.start_conversation(other uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); conv uuid;
begin
  if me is null or other = me then raise exception 'Conversa inválida'; end if;
  if exists (select 1 from public.blocks where (blocker_id = me and blocked_id = other)
                                            or (blocker_id = other and blocked_id = me)) then
    raise exception 'Não é possível conversar com este usuário';
  end if;
  select a.conversation_id into conv from public.conversation_members a
    join public.conversation_members b on a.conversation_id = b.conversation_id
   where a.user_id = me and b.user_id = other limit 1;
  if conv is null then
    insert into public.conversations default values returning id into conv;
    insert into public.conversation_members (conversation_id, user_id) values (conv, me), (conv, other);
  end if;
  return conv;
end $$;

create or replace function public.on_message_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.messages where author_id = new.author_id
      and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Muitas mensagens em pouco tempo. Aguarde um pouco.';
  end if;
  if exists (select 1 from public.conversation_members m join public.blocks b
               on b.blocker_id = m.user_id and b.blocked_id = new.author_id
             where m.conversation_id = new.conversation_id) then
    raise exception 'Você não pode enviar mensagens para este usuário';
  end if;
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end $$;
create trigger messages_before_insert before insert on public.messages
  for each row execute function public.on_message_insert();

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "ver minhas conversas" on public.conversations for select to authenticated
  using ((select public.is_conversation_member(id)));
create policy "ver participantes" on public.conversation_members for select to authenticated
  using ((select public.is_conversation_member(conversation_id)));
create policy "marcar como lida" on public.conversation_members for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "ler mensagens" on public.messages for select to authenticated
  using ((select public.is_conversation_member(conversation_id)));
create policy "enviar mensagem" on public.messages for insert to authenticated
  with check (author_id = (select auth.uid()) and (select public.is_conversation_member(conversation_id)));

-- NOTIFICAÇÕES ---------------------------------------------------------
create type public.notification_type as enum ('like','comment','follow','community','system');
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  actor_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  community_id uuid references public.communities(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);
create index on public.notifications (actor_id);
create index on public.notifications (post_id);
create index on public.notifications (community_id);

alter table public.notifications enable row level security;
create policy "ver minhas notificações" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "marcar notificações" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "apagar notificações" on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

create table public.notification_prefs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  likes boolean not null default true,
  comments boolean not null default true,
  follows boolean not null default true,
  messages boolean not null default true,
  communities boolean not null default true,
  email_digest boolean not null default false
);
alter table public.notification_prefs enable row level security;
create policy "ver prefs" on public.notification_prefs for select to authenticated using (user_id = (select auth.uid()));
create policy "criar prefs" on public.notification_prefs for insert to authenticated with check (user_id = (select auth.uid()));
create policy "editar prefs" on public.notification_prefs for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.notify()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target uuid; actor uuid; pid uuid; t public.notification_type;
begin
  if tg_table_name = 'likes' then
    select author_id into target from public.posts where id = new.post_id;
    actor := new.user_id; pid := new.post_id; t := 'like';
  elsif tg_table_name = 'comments' then
    select author_id into target from public.posts where id = new.post_id;
    actor := new.author_id; pid := new.post_id; t := 'comment';
  elsif tg_table_name = 'follows' then
    target := new.following_id; actor := new.follower_id; t := 'follow';
  end if;
  if target is not null and target <> actor
     and not exists (select 1 from public.blocks where blocker_id = target and blocked_id = actor) then
    insert into public.notifications (user_id, type, actor_id, post_id) values (target, t, actor, pid);
  end if;
  return new;
end $$;
create trigger likes_notify after insert on public.likes for each row execute function public.notify();
create trigger comments_notify after insert on public.comments for each row execute function public.notify();
create trigger follows_notify after insert on public.follows for each row execute function public.notify();

-- realtime para chat e notificações
alter publication supabase_realtime add table public.messages, public.notifications;

-- STORAGE: imagens (máx. 5 MB, só imagem, cada um na própria pasta) ------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']);

create policy "upload na própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "atualizar próprio arquivo" on storage.objects for update to authenticated
  using (bucket_id = 'media' and owner_id = (select auth.uid())::text);
create policy "apagar próprio arquivo" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and owner_id = (select auth.uid())::text);
