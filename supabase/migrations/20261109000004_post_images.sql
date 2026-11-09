-- Até 4 imagens por post
alter table public.posts add column images text[] not null default '{}';
alter table public.posts add constraint posts_images_max check (cardinality(images) <= 4);
alter table public.posts drop constraint post_has_content;
alter table public.posts add constraint post_has_content check (
  char_length(text) > 0 or image_url is not null or cardinality(images) > 0 or kind = 'bilhete');

-- inclui a coluna nova no fim da view do feed (sem recriar)
create or replace view public.post_feed with (security_invoker = true) as
select p.id, p.author_id, p.community_id, p.category, p.kind, p.text, p.image_url,
  p.bet_event, p.bet_pick, p.bet_odd, p.bet_result, p.bet_resolved_at, p.created_at,
  pr.name as author_name, pr.handle as author_handle, pr.avatar_url as author_avatar_url,
  pr.avatar_color as author_avatar_color, pr.founder as author_founder,
  (select count(*) from public.likes l where l.post_id = p.id)::int as like_count,
  (select count(*) from public.comments c where c.post_id = p.id)::int as comment_count,
  p.images
from public.posts p join public.profiles pr on pr.id = p.author_id;
