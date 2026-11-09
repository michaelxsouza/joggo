-- Várias imagens (até 4) e vídeo por link
alter table public.posts add column images text[] not null default '{}';
alter table public.posts add column video_url text;
update public.posts set images = array[image_url] where image_url is not null;
alter table public.posts add constraint posts_images_max check (cardinality(images) <= 4);
alter table public.posts add constraint posts_video_url_https check (video_url is null or (video_url ~ '^https://' and char_length(video_url) <= 300));
alter table public.posts drop constraint post_has_content;
alter table public.posts add constraint post_has_content check (
  char_length(text) > 0 or image_url is not null or cardinality(images) > 0 or video_url is not null or kind = 'bilhete');

-- recria a view para incluir as colunas novas
drop view public.post_feed;
create view public.post_feed with (security_invoker = true) as
select p.*,
  pr.name as author_name, pr.handle as author_handle, pr.avatar_url as author_avatar_url,
  pr.avatar_color as author_avatar_color, pr.founder as author_founder,
  (select count(*) from public.likes l where l.post_id = p.id)::int as like_count,
  (select count(*) from public.comments c where c.post_id = p.id)::int as comment_count
from public.posts p join public.profiles pr on pr.id = p.author_id;
