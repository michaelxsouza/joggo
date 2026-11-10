-- Bilhete só pode ser excluído pelo autor nos primeiros 10 min e enquanto pendente
create or replace function public.guard_bilhete_delete()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.kind = 'bilhete' and not public.is_admin()
     and (old.bet_result <> 'pendente' or old.created_at < now() - interval '10 minutes') then
    raise exception 'Bilhetes não podem ser excluídos: o histórico é travado. Se houver um problema, denuncie para a moderação.';
  end if;
  return old;
end $$;
revoke execute on function public.guard_bilhete_delete() from public, anon, authenticated;
create trigger posts_guard_delete before delete on public.posts
  for each row execute function public.guard_bilhete_delete();
