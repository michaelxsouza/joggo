alter type public.notification_type add value if not exists 'mention';

-- Marcações com @usuário em posts e comentários geram notificação para quem foi marcado
create or replace function public.notify_mentions()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid; pid uuid; h text; target uuid;
begin
  if tg_table_name = 'posts' then actor := new.author_id; pid := new.id;
  else actor := new.author_id; pid := new.post_id; end if;
  for h in
    select distinct lower(m[1]) from regexp_matches(coalesce(new.text, ''), '@([A-Za-z0-9._]{3,24})', 'g') as m limit 10
  loop
    select id into target from public.profiles where handle = rtrim(h, '.');
    if target is not null and target <> actor
       and not exists (select 1 from public.blocks where blocker_id = target and blocked_id = actor) then
      insert into public.notifications (user_id, type, actor_id, post_id) values (target, 'mention', actor, pid);
    end if;
  end loop;
  return new;
end $$;
revoke execute on function public.notify_mentions() from public, anon, authenticated;
create trigger posts_notify_mentions after insert on public.posts for each row execute function public.notify_mentions();
create trigger comments_notify_mentions after insert on public.comments for each row execute function public.notify_mentions();
