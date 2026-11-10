import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShieldAlert, Ban, Bookmark, CalendarDays, Flag, Inbox, Link2, Lock, Mail, MapPin, Pencil, Settings } from 'lucide-react';
import { sel, social, useSocial } from '@/services/socialService';
import { categoryLabel } from '@/types/social';
import { Avatar, EmptyState, Menu, Tabs } from '@/components/ui/misc';
import { Button, IconButton } from '@/components/ui/Button';
import { FollowButton } from '@/components/social/Buttons';
import { PostList } from '@/components/posts/PostList';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { FollowListModal, type FollowTab } from '@/components/profile/FollowListModal';
import { TipsterStatsCard } from '@/components/profile/TipsterStats';
import { useUI } from '@/app/UIContext';
import { useToast } from '@/components/ui/Toast';
import { compact, copyText } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import NotFound from './NotFound';
import { moderation } from '@/services/moderationService';

export default function ProfilePage() {
  const { handle = '' } = useParams();
  const state = useSocial((s) => s);
  const user = sel.userByHandle(state, handle);
  useDocumentTitle(user ? `${user.name} (@${user.handle})` : 'Perfil');
  const [tab, setTab] = useState<'posts' | 'salvos'>('posts');
  const [editing, setEditing] = useState(false);
  const [followList, setFollowList] = useState<FollowTab | null>(null);
  const navigate = useNavigate();
  const ui = useUI();
  const toast = useToast();

  const isMe = user?.id === state.currentUserId;
  const posts = useMemo(() => (user ? sel.visiblePosts(state).filter((p) => p.authorId === user.id) : []), [state, user]);
  const saved = useMemo(
    () => (isMe ? state.savedPostIds.map((id) => state.posts.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p && !state.blockedUserIds.includes(p.authorId)) : []),
    [state, isMe],
  );

  if (!user) return <NotFound what="Perfil" />;
  const blocked = state.blockedUserIds.includes(user.id);

  const startChat = () => {
    const id = social.openConversation(user.id);
    navigate(`/mensagens/${id}`);
  };

  return (
    <div>
      <div className="h-36 sm:h-44 lg:rounded-b-3xl border-b border-line relative overflow-hidden" style={{ backgroundColor: user.coverColor }}>
        <div className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: 'radial-gradient(#B0FF35 1px, transparent 1px)', backgroundSize: '18px 18px' }} aria-hidden />
      </div>
      <div className="px-4 lg:px-1">
        <div className="flex items-end justify-between -mt-12 sm:-mt-14">
          <Avatar user={user} size="xl" ring />
          <div className="flex items-center gap-2 pb-1">
            {isMe ? (
              <>
                <IconButton label="Configurações" className="border border-line" onClick={() => navigate('/configuracoes')}>
                  <Settings className="h-5 w-5" />
                </IconButton>
                <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>
                  Editar perfil
                </Button>
              </>
            ) : blocked ? (
              <Button
                variant="danger"
                onClick={() => {
                  social.unblock(user.id);
                  toast.success(`${user.name} foi desbloqueado(a).`);
                }}
              >
                Desbloquear
              </Button>
            ) : (
              <>
                <Menu
                  label="Mais opções do perfil"
                  items={[
                    {
                      label: 'Copiar link do perfil',
                      icon: <Link2 className="h-4 w-4" />,
                      onSelect: async () => {
                        const ok = await copyText(`${location.origin}${location.pathname}#/perfil/${user.handle}`);
                        ok ? toast.success('Link do perfil copiado.') : toast.error('Não foi possível copiar.');
                      },
                    },
                    { label: 'Denunciar perfil', icon: <Flag className="h-4 w-4" />, danger: true, onSelect: () => ui.openReport({ target: 'user', id: user.id, name: `o perfil de ${user.name}`, userId: user.id }) },
                    {
                      label: `Bloquear @${user.handle}`,
                      icon: <Ban className="h-4 w-4" />,
                      danger: true,
                      onSelect: () =>
                        ui.confirm({
                          title: `Bloquear ${user.name}?`,
                          message: 'Você deixará de ver publicações, comentários e mensagens dessa pessoa.',
                          confirmLabel: 'Bloquear',
                          danger: true,
                          onConfirm: () => {
                            social.block(user.id);
                            toast.success(`${user.name} foi bloqueado(a).`);
                          },
                        }),
                    },
                    ...(sel.isModerator(state) && user.role !== 'admin' && user.role !== 'moderator'
                      ? [
                          {
                            label: user.banned ? 'Reativar conta (moderação)' : 'Suspender conta (moderação)',
                            icon: <ShieldAlert className="h-4 w-4" />,
                            danger: !user.banned,
                            onSelect: () =>
                              ui.confirm({
                                title: user.banned ? `Reativar ${user.name}?` : `Suspender ${user.name}?`,
                                message: user.banned
                                  ? 'A pessoa volta a poder publicar, comentar e interagir.'
                                  : 'A pessoa não poderá publicar, comentar, curtir, seguir nem mandar mensagens, e os posts dela somem do feed.',
                                confirmLabel: user.banned ? 'Reativar' : 'Suspender',
                                danger: !user.banned,
                                onConfirm: () =>
                                  void moderation
                                    .setBan(user.id, !user.banned, user.banned ? undefined : 'Suspenso pela moderação')
                                    .then(() => toast.success(user.banned ? 'Conta reativada.' : 'Conta suspensa.'))
                                    .catch((e: Error) => toast.error(e.message)),
                              }),
                          },
                        ]
                      : []),
                  ]}
                />
                <IconButton label={`Enviar mensagem para ${user.name}`} className="border border-line" onClick={startChat}>
                  <Mail className="h-5 w-5" />
                </IconButton>
                <FollowButton user={user} size="md" />
              </>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight mt-3 flex items-center gap-2 flex-wrap">
          {user.name}
          {user.founder && (
            <span className="rounded-full bg-lime/15 text-lime border border-lime/30 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide" title="Membro fundador da Joggo">
              Fundador
            </span>
          )}
        </h1>
        <p className="text-ink-muted">@{user.handle}</p>
        {user.bio && <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">{user.bio}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-ink-muted">
          {user.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {user.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" /> Na Joggo desde {new Date(user.joinedAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {user.interests.map((i) => (
            <span key={i} className="rounded-full bg-surface border border-line px-3 py-1 text-xs font-semibold text-ink-muted">
              {categoryLabel(i)}
            </span>
          ))}
        </div>
        <div className="flex gap-5 mt-4 text-[15px]">
          <button type="button" onClick={() => setFollowList('seguidores')} className="hover:underline underline-offset-2">
            <strong>{compact(sel.followerCount(state, user))}</strong>{' '}
            <span className="text-ink-muted">{sel.followerCount(state, user) === 1 ? 'seguidor' : 'seguidores'}</span>
          </button>
          <button type="button" onClick={() => setFollowList('seguindo')} className="hover:underline underline-offset-2">
            <strong>{compact(sel.followingCount(state, user))}</strong> <span className="text-ink-muted">seguindo</span>
          </button>
          {!isMe && sel.followingOf(state, user.id).some((u) => u.id === state.currentUserId) && (
            <span className="self-center rounded-md bg-surface border border-line px-2 py-0.5 text-xs text-ink-muted">Segue você</span>
          )}
        </div>
        {!blocked && <TipsterStatsCard userId={user.id} isMe={isMe} />}
      </div>

      {blocked ? (
        <EmptyState icon={<Ban className="h-6 w-6" />} title={`Você bloqueou @${user.handle}`}>
          As publicações e mensagens desta pessoa estão ocultas para você.
        </EmptyState>
      ) : (
        <>
          <Tabs
            label="Conteúdo do perfil"
            className="mt-4"
            value={tab}
            onChange={setTab}
            tabs={
              isMe
                ? [
                    { id: 'posts', label: 'Publicações' },
                    {
                      id: 'salvos',
                      label: (
                        <span className="inline-flex items-center gap-1.5">
                          Salvos <Lock className="h-3.5 w-3.5" aria-label="visível só para você" />
                        </span>
                      ),
                    },
                  ]
                : [{ id: 'posts', label: 'Publicações' }]
            }
          />
          <div className="px-3 lg:px-0 py-4">
            {tab === 'posts' || !isMe ? (
              posts.length ? (
                <PostList posts={posts} adCategories={user.interests} withAds={false} />
              ) : (
                <EmptyState
                  icon={<Inbox className="h-6 w-6" />}
                  title={isMe ? 'Você ainda não publicou' : 'Nenhuma publicação ainda'}
                  action={isMe ? <Button onClick={() => ui.openComposer()}>Criar publicação</Button> : undefined}
                />
              )
            ) : saved.length ? (
              <>
                <p className="text-xs text-ink-muted mb-3 inline-flex items-center gap-1.5 px-1">
                  <Lock className="h-3.5 w-3.5" /> Somente você vê seus itens salvos.
                </p>
                <PostList posts={saved} adCategories={user.interests} withAds={false} />
              </>
            ) : (
              <EmptyState icon={<Bookmark className="h-6 w-6" />} title="Nada salvo ainda">
                Toque no ícone de salvar em uma publicação para guardá-la aqui.{' '}
                <Link to="/" className="text-lime hover:underline">
                  Ir para o feed
                </Link>
              </EmptyState>
            )}
          </div>
        </>
      )}
      {followList && <FollowListModal key={user.id + followList} user={user} open initialTab={followList} onClose={() => setFollowList(null)} />}
      {isMe && <EditProfileModal open={editing} onClose={() => setEditing(false)} onSaved={(h) => h !== handle && navigate(`/perfil/${h}`, { replace: true })} />}
    </div>
  );
}
