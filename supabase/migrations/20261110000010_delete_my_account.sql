-- Exclusão da própria conta (LGPD). Apaga o usuário e, em cascata, perfil, posts, comentários,
-- curtidas, seguidores, mensagens e notificações. A trava de bilhetes não bloqueia esta exclusão.
create or replace function public.guard_bilhete_delete()
returns trigger language plpgsql set search_path = '' as $$
begin
  if coalesce(current_setting('joggo.deleting_account', true), '') = 'on' then return old; end if;
  if old.kind = 'bilhete' and not public.is_admin()
     and (old.bet_result <> 'pendente' or old.created_at < now() - interval '10 minutes') then
    raise exception 'Bilhetes não podem ser excluídos: o histórico é travado. Se houver um problema, denuncie para a moderação.';
  end if;
  return old;
end $$;

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid());
begin
  if me is null then raise exception 'Não autenticado'; end if;
  perform set_config('joggo.deleting_account', 'on', true);
  delete from public.reports where target = 'user' and target_id = me;
  delete from auth.users where id = me;
end $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
