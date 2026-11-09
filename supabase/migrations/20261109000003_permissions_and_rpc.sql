-- Verifica se um @usuário está livre (usado no cadastro, antes do login)
create or replace function public.handle_available(h text)
returns boolean language sql stable security definer set search_path = '' as $$
  select h ~ '^[a-z0-9._]{3,24}$'
     and not exists (select 1 from public.profiles where handle = lower(h));
$$;

-- funções internas não podem ser chamadas pela API
revoke execute on function public.notify() from public, anon, authenticated;
revoke execute on function public.on_message_insert() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_fields() from public, anon, authenticated;
revoke execute on function public.rate_limit_posts() from public, anon, authenticated;
revoke execute on function public.rate_limit_comments() from public, anon, authenticated;
revoke execute on function public.guard_post_update() from public, anon, authenticated;

-- usadas pelas políticas RLS (só informam sobre o próprio usuário)
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_conversation_member(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;

revoke execute on function public.start_conversation(uuid) from public, anon;
grant execute on function public.start_conversation(uuid) to authenticated;

revoke execute on function public.handle_available(text) from public;
grant execute on function public.handle_available(text) to anon, authenticated;
