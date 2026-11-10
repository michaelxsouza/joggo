-- Suspensão de contas pela moderação
alter table public.profiles add column banned_at timestamptz;
alter table public.profiles add column ban_reason text check (char_length(ban_reason) <= 300);

-- o próprio usuário nunca altera papel, selo, nascimento ou suspensão
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null and not exists (
       select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin') then
    new.role := old.role;
    new.founder := old.founder;
    new.birth_date := old.birth_date;
    new.banned_at := old.banned_at;
    new.ban_reason := old.ban_reason;
  end if;
  return new;
end $$;

create or replace function public.is_banned()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and banned_at is not null);
$$;
revoke execute on function public.is_banned() from public, anon;
grant execute on function public.is_banned() to authenticated;

-- conta suspensa não publica, comenta, curte, segue, entra em comunidade nem manda mensagem
create or replace function public.block_banned_writes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.is_banned() then
    raise exception 'Sua conta está suspensa pela moderação da Joggo.';
  end if;
  return new;
end $$;
revoke execute on function public.block_banned_writes() from public, anon, authenticated;
create trigger posts_block_banned before insert on public.posts for each row execute function public.block_banned_writes();
create trigger comments_block_banned before insert on public.comments for each row execute function public.block_banned_writes();
create trigger likes_block_banned before insert on public.likes for each row execute function public.block_banned_writes();
create trigger follows_block_banned before insert on public.follows for each row execute function public.block_banned_writes();
create trigger members_block_banned before insert on public.community_members for each row execute function public.block_banned_writes();
create trigger messages_block_banned before insert on public.messages for each row execute function public.block_banned_writes();
create trigger reports_block_banned before insert on public.reports for each row execute function public.block_banned_writes();

-- moderação: suspender / reativar (somente admin ou moderador; ninguém suspende admin)
create or replace function public.mod_set_ban(target uuid, banned boolean, reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Apenas a moderação pode fazer isso'; end if;
  if exists (select 1 from public.profiles where id = target and role in ('admin','moderator')) then
    raise exception 'Não é possível suspender um moderador';
  end if;
  update public.profiles
     set banned_at = case when banned then now() else null end,
         ban_reason = case when banned then left(reason, 300) else null end
   where id = target;
end $$;
revoke execute on function public.mod_set_ban(uuid, boolean, text) from public, anon;
grant execute on function public.mod_set_ban(uuid, boolean, text) to authenticated;

-- resolver todas as denúncias de um mesmo alvo de uma vez
create or replace function public.mod_resolve_reports(t public.report_target, tid uuid, new_status public.report_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Apenas a moderação pode fazer isso'; end if;
  update public.reports set status = new_status where target = t and target_id = tid and status = 'aberta';
end $$;
revoke execute on function public.mod_resolve_reports(public.report_target, uuid, public.report_status) from public, anon;
grant execute on function public.mod_resolve_reports(public.report_target, uuid, public.report_status) to authenticated;
