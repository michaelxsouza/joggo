import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SearchX, X } from 'lucide-react';
import { sel, useSocial } from '@/services/socialService';
import { CATEGORIES, categoryLabel, type Category } from '@/types/social';
import { Avatar, Chip, EmptyState, Tabs } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { FollowButton } from '@/components/social/Buttons';
import { PostCard } from '@/components/posts/PostCard';
import { CommunityCard } from '@/components/communities/CommunityCard';
import { PageHeader } from '@/components/layout/AppShell';
import { useDocumentTitle } from '@/lib/hooks';

type Kind = 'tudo' | 'pessoas' | 'publicacoes' | 'comunidades';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function ExplorePage() {
  useDocumentTitle('Explorar');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);
  const [kind, setKind] = useState<Kind>('tudo');
  const [category, setCategory] = useState<Category | null>(null);
  const state = useSocial((s) => s);

  const results = useMemo(() => {
    const term = norm(q.trim());
    const match = (...fields: (string | undefined)[]) => !term || fields.some((f) => f && norm(f).includes(term));
    const meId = state.currentUserId;
    const people = state.users.filter(
      (u) => u.id !== meId && !state.blockedUserIds.includes(u.id) && match(u.name, u.handle, u.bio, u.location) && (!category || u.interests.includes(category)),
    );
    const posts = sel.visiblePosts(state).filter((p) => {
      const a = sel.user(state, p.authorId);
      return match(p.text, a?.name, a?.handle) && (!category || p.category === category);
    });
    const communities = state.communities.filter((c) => match(c.name, c.description) && (!category || c.category === category));
    return { people, posts, communities };
  }, [state, q, category]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    setParams(v ? { q: v } : {});
  };

  const total = results.people.length + results.posts.length + results.communities.length;
  const shown = {
    pessoas: kind === 'tudo' || kind === 'pessoas',
    publicacoes: kind === 'tudo' || kind === 'publicacoes',
    comunidades: kind === 'tudo' || kind === 'comunidades',
  };
  const visibleCount =
    (shown.pessoas ? results.people.length : 0) + (shown.publicacoes ? results.posts.length : 0) + (shown.comunidades ? results.communities.length : 0);

  return (
    <div>
      <PageHeader title="Explorar" subtitle="Encontre pessoas, publicações e comunidades" />
      <div className="px-4 lg:px-0 space-y-3">
        <form role="search" onSubmit={submit} className="relative">
          <label htmlFor="explore-q" className="sr-only">
            Buscar
          </label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-muted pointer-events-none" aria-hidden />
          <input
            id="explore-q"
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar por nome, @usuário, assunto…"
            className="field pl-11 pr-24 h-12 rounded-full"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {input && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setInput('');
                  setParams({});
                }}
                className="h-9 w-9 inline-flex items-center justify-center text-ink-muted hover:text-ink rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button type="submit" size="sm" className="rounded-full">
              Buscar
            </Button>
          </div>
        </form>
        <div className="flex gap-2 overflow-x-auto scrollbar-none py-1" role="group" aria-label="Filtrar por categoria">
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setCategory(category === c.id ? null : c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <Tabs
        label="Tipo de resultado"
        className="mt-2"
        value={kind}
        onChange={setKind}
        tabs={[
          { id: 'tudo', label: 'Tudo' },
          { id: 'pessoas', label: `Pessoas` },
          { id: 'publicacoes', label: 'Posts' },
          { id: 'comunidades', label: 'Grupos' },
        ]}
      />

      <div className="px-3 lg:px-0 py-4 space-y-6" aria-live="polite">
        {(q || category) && (
          <p className="text-sm text-ink-muted px-1">
            {total} resultado(s){q && <> para “<span className="text-ink">{q}</span>”</>}
            {category && <> em {categoryLabel(category)}</>}
          </p>
        )}

        {visibleCount === 0 ? (
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="Nenhum resultado encontrado"
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setInput('');
                  setParams({});
                  setCategory(null);
                  setKind('tudo');
                }}
              >
                Limpar filtros
              </Button>
            }
          >
            Tente outro termo, remova o filtro de categoria ou procure em outra aba.
          </EmptyState>
        ) : (
          <>
            {shown.pessoas && results.people.length > 0 && (
              <section aria-labelledby="ex-people">
                <h2 id="ex-people" className="font-bold px-1 mb-2">
                  Pessoas
                </h2>
                <ul className="card divide-y divide-line">
                  {(kind === 'tudo' ? results.people.slice(0, 4) : results.people).map((u) => (
                    <li key={u.id} className="flex items-center gap-3 p-3.5">
                      <Link to={`/perfil/${u.handle}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                        <Avatar user={u} />
                        <div className="min-w-0">
                          <p className="font-bold truncate group-hover:underline">{u.name}</p>
                          <p className="text-sm text-ink-muted truncate">@{u.handle} · {u.interests.map(categoryLabel).join(', ')}</p>
                          <p className="text-sm text-ink-muted line-clamp-1 mt-0.5">{u.bio}</p>
                        </div>
                      </Link>
                      <FollowButton user={u} />
                    </li>
                  ))}
                </ul>
                {kind === 'tudo' && results.people.length > 4 && (
                  <button className="mt-2 text-sm font-semibold text-lime hover:underline px-1" onClick={() => setKind('pessoas')}>
                    Ver todas as {results.people.length} pessoas
                  </button>
                )}
              </section>
            )}

            {shown.comunidades && results.communities.length > 0 && (
              <section aria-labelledby="ex-comm">
                <h2 id="ex-comm" className="font-bold px-1 mb-2">
                  Comunidades
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(kind === 'tudo' ? results.communities.slice(0, 4) : results.communities).map((c) => (
                    <CommunityCard key={c.id} community={c} />
                  ))}
                </div>
                {kind === 'tudo' && results.communities.length > 4 && (
                  <button className="mt-2 text-sm font-semibold text-lime hover:underline px-1" onClick={() => setKind('comunidades')}>
                    Ver todas as {results.communities.length} comunidades
                  </button>
                )}
              </section>
            )}

            {shown.publicacoes && results.posts.length > 0 && (
              <section aria-labelledby="ex-posts">
                <h2 id="ex-posts" className="font-bold px-1 mb-2">
                  Publicações
                </h2>
                <div className="space-y-3">
                  {results.posts.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
