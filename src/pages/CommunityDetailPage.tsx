import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Inbox, Link2, ScrollText, Users } from 'lucide-react';
import { sel, useSocial } from '@/services/socialService';
import { categoryLabel } from '@/types/social';
import { Avatar, EmptyState, Tabs } from '@/components/ui/misc';
import { Button, IconButton } from '@/components/ui/Button';
import { JoinButton, FollowButton } from '@/components/social/Buttons';
import { PostList } from '@/components/posts/PostList';
import { useUI } from '@/app/UIContext';
import { useToast } from '@/components/ui/Toast';
import { compact, copyText } from '@/lib/utils';
import NotFound from './NotFound';
import { AdSlot } from '@/components/ads/AdUnits';
import { useDocumentTitle, useIsMobile } from '@/lib/hooks';

export default function CommunityDetailPage() {
  const { slug } = useParams();
  const state = useSocial((s) => s);
  const c = state.communities.find((x) => x.slug === slug);
  useDocumentTitle(c?.name ?? 'Comunidade');
  const [tab, setTab] = useState<'posts' | 'regras' | 'membros'>('posts');
  const navigate = useNavigate();
  const ui = useUI();
  const toast = useToast();
  const isMobile = useIsMobile();

  const posts = useMemo(() => (c ? sel.visiblePosts(state).filter((p) => p.communityId === c.id) : []), [state, c]);
  if (!c) return <NotFound what="Comunidade" />;

  const joined = state.joinedCommunityIds.includes(c.id);
  const members = state.users.filter(
    (u) => (c.memberIds.includes(u.id) && u.id !== state.currentUserId) || (u.id === state.currentUserId && joined),
  );

  return (
    <div>
      <div className="relative">
        <img src={c.cover} alt="" className="h-40 sm:h-52 w-full object-cover lg:rounded-b-3xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/10 to-transparent lg:rounded-b-3xl" />
        <IconButton label="Voltar" onClick={() => navigate(-1)} className="absolute top-3 left-3 bg-black/50 text-ink hover:bg-black/70">
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="px-4 lg:px-1 -mt-8 relative">
        <p className="text-xs font-bold uppercase tracking-wider text-lime">{categoryLabel(c.category)}</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">{c.name}</h1>
        <p className="text-ink-muted mt-2 text-[15px] leading-relaxed">{c.description}</p>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span className="text-sm text-ink-muted">
            <strong className="text-ink">{compact(sel.memberCount(state, c))}</strong> membros
          </span>
          {joined && (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-lime">
              <Check className="h-4 w-4" /> Você participa
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <IconButton
              label="Copiar link da comunidade"
              size="sm"
              className="border border-line"
              onClick={async () => {
                const ok = await copyText(`${location.origin}${location.pathname}#/comunidades/${c.slug}`);
                ok ? toast.success('Link da comunidade copiado.') : toast.error('Não foi possível copiar o link.');
              }}
            >
              <Link2 className="h-4 w-4" />
            </IconButton>
            <JoinButton community={c} size="md" />
          </div>
        </div>
      </div>

      <Tabs
        label="Seções da comunidade"
        className="mt-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'posts', label: 'Publicações' },
          { id: 'regras', label: 'Regras' },
          { id: 'membros', label: 'Membros' },
        ]}
      />

      <div className="px-3 lg:px-0 py-4">
        {tab === 'posts' && (
          <div className="space-y-3 sm:space-y-4">
            {joined ? (
              <button onClick={() => ui.openComposer({ communityId: c.id })} className="card w-full p-4 flex items-center gap-3 text-left hover:border-ink-faint/50 transition-colors">
                <Avatar user={sel.me(state)} />
                <span className="text-ink-faint flex-1">Publicar em {c.name}…</span>
                <span className="text-sm font-bold text-lime">Publicar</span>
              </button>
            ) : (
              <div className="card p-4 text-sm text-ink-muted">Entre na comunidade para publicar aqui.</div>
            )}
            {posts.length === 0 ? (
              <EmptyState icon={<Inbox className="h-6 w-6" />} title="Nenhuma publicação ainda">
                Seja a primeira pessoa a publicar nesta comunidade.
              </EmptyState>
            ) : (
              <PostList posts={posts} adCategories={[c.category]} withAds={false} />
            )}
            {/* Um único anúncio por página de comunidade, sempre do mesmo tema. */}
            <AdSlot placement="community" categories={[c.category]} seed={c.slug.length} variant={isMobile ? 'mobile' : 'feed'} context={`comunidade ${c.name}`} />
          </div>
        )}

        {tab === 'regras' && (
          <section className="card p-5">
            <h2 className="font-bold flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-lime" /> Regras de {c.name}
            </h2>
            <ol className="mt-4 space-y-3">
              {c.rules.map((r, i) => (
                <li key={r} className="flex gap-3">
                  <span className="h-7 w-7 shrink-0 rounded-full bg-surface border border-line text-sm font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-[15px] pt-0.5">{r}</span>
                </li>
              ))}
            </ol>
            <p className="text-sm text-ink-muted mt-5">
              Estas regras complementam as{' '}
              <Link to="/regras" className="text-lime hover:underline">
                regras gerais da Joggo
              </Link>
              .
            </p>
          </section>
        )}

        {tab === 'membros' &&
          (members.length === 0 ? (
            <EmptyState icon={<Users className="h-6 w-6" />} title="Nenhum membro visível" />
          ) : (
            <ul className="card divide-y divide-line">
              {members.map((u) => (
                <li key={u.id} className="flex items-center gap-3 p-3.5">
                  <Link to={`/perfil/${u.handle}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                    <Avatar user={u} />
                    <div className="min-w-0">
                      <p className="font-bold truncate group-hover:underline">{u.name}</p>
                      <p className="text-sm text-ink-muted truncate">@{u.handle}</p>
                    </div>
                  </Link>
                  {u.id !== state.currentUserId ? <FollowButton user={u} /> : <span className="text-sm text-ink-muted">Você</span>}
                </li>
              ))}
              <li className="p-3.5 text-xs text-ink-faint">Mostrando membros de demonstração. A lista completa dependerá do backend.</li>
            </ul>
          ))}
        {tab !== 'posts' && (
          <div className="mt-4">
            <Button variant="ghost" size="sm" onClick={() => setTab('posts')}>
              Voltar às publicações
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
