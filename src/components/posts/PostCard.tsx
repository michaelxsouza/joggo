import { memo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, EyeOff, Flag, Heart, Link2, MessageCircle, Share2, Trash2, Ban, Users } from 'lucide-react';
import type { Post } from '@/types/social';
import { categoryLabel } from '@/types/social';
import { sel, social, useSocial } from '@/services/socialService';
import { Avatar, Menu, type MenuItem } from '@/components/ui/misc';
import { useToast } from '@/components/ui/Toast';
import { useUI } from '@/app/UIContext';
import { cn, compact, copyText, timeAgo } from '@/lib/utils';
import { CommentsSection } from './CommentsSection';
import { ImageCarousel } from './PostMedia';
import { BetCard } from './BetCard';

export const postLink = (id: string) => `${window.location.origin}${window.location.pathname}#/post/${id}`;

function PostCardInner({ post, defaultOpenComments = false }: { post: Post; defaultOpenComments?: boolean }) {
  const author = useSocial((s) => sel.user(s, post.authorId));
  const community = useSocial((s) => sel.community(s, post.communityId));
  const liked = useSocial((s) => s.likedPostIds.includes(post.id));
  const saved = useSocial((s) => s.savedPostIds.includes(post.id));
  const likeCount = useSocial((s) => sel.likeCount(s, post));
  const commentCount = useSocial((s) => sel.commentsOf(s, post.id).length);
  const meId = useSocial((s) => s.currentUserId);
  const [showComments, setShowComments] = useState(defaultOpenComments);
  const [pulse, setPulse] = useState(0);
  const toast = useToast();
  const ui = useUI();
  const navigate = useNavigate();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  if (!author) return null;
  const isMine = author.id === meId;

  const share = async () => {
    const ok = await copyText(postLink(post.id));
    ok ? toast.success('Link copiado para a área de transferência.') : toast.error('Não foi possível copiar. Copie o link pela barra de endereço.');
  };

  const menu: MenuItem[] = [
    { label: 'Copiar link', icon: <Link2 className="h-4 w-4" />, onSelect: share },
    { label: 'Ver perfil do autor', icon: <Users className="h-4 w-4" />, onSelect: () => navigate(`/perfil/${author.handle}`) },
  ];
  if (isMine) {
    menu.push({
      label: 'Excluir publicação',
      icon: <Trash2 className="h-4 w-4" />,
      danger: true,
      onSelect: () =>
        ui.confirm({
          title: 'Excluir publicação?',
          message: 'Esta ação não pode ser desfeita.',
          confirmLabel: 'Excluir',
          danger: true,
          onConfirm: () => {
            social.deletePost(post.id);
            toast.success('Publicação excluída.');
          },
        }),
    });
  } else {
    menu.push(
      {
        label: 'Ocultar publicação',
        icon: <EyeOff className="h-4 w-4" />,
        onSelect: () => {
          social.hidePost(post.id);
          toast.success('Publicação ocultada.', { label: 'Desfazer', onClick: () => social.unhidePost(post.id) });
        },
      },
      {
        label: 'Denunciar publicação',
        icon: <Flag className="h-4 w-4" />,
        danger: true,
        onSelect: () => ui.openReport({ target: 'post', id: post.id, name: `a publicação de ${author.name}`, userId: author.id }),
      },
      {
        label: `Bloquear @${author.handle}`,
        icon: <Ban className="h-4 w-4" />,
        danger: true,
        onSelect: () =>
          ui.confirm({
            title: `Bloquear ${author.name}?`,
            message: 'Você deixará de ver publicações, comentários e mensagens dessa pessoa. É possível desbloquear em Configurações.',
            confirmLabel: 'Bloquear',
            danger: true,
            onConfirm: () => {
              social.block(author.id);
              toast.success(`${author.name} foi bloqueado(a).`);
            },
          }),
      },
    );
  }

  return (
    <article className="card p-4 sm:p-5 animate-fade-in" aria-label={`Publicação de ${author.name}`}>
      <header className="flex items-start gap-3">
        <Link to={`/perfil/${author.handle}`} aria-label={`Abrir perfil de ${author.name}`} className="rounded-full">
          <Avatar user={author} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-x-1.5 flex-wrap leading-tight">
            <Link to={`/perfil/${author.handle}`} className="font-bold hover:underline truncate">
              {author.name}
            </Link>
            {author.founder && (
              <span className="rounded-full bg-lime/15 text-lime border border-lime/30 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide" title="Membro fundador da Joggo">
                Fundador
              </span>
            )}
            <span className="text-ink-muted text-sm truncate">@{author.handle}</span>
            <span className="text-ink-faint text-sm" aria-hidden>
              ·
            </span>
            <time className="text-ink-muted text-sm" dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString('pt-BR')}>
              {timeAgo(post.createdAt)}
            </time>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="rounded-full bg-surface border border-line px-2 py-0.5 text-ink-muted font-semibold">{categoryLabel(post.category)}</span>
            {community && (
              <Link to={`/comunidades/${community.slug}`} className="text-ink-muted hover:text-lime truncate">
                em <span className="font-semibold">{community.name}</span>
              </Link>
            )}
          </div>
        </div>
        <Menu items={menu} label="Opções da publicação" />
      </header>

      {post.text && <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words">{post.text}</p>}
      {post.kind === 'bilhete' && <BetCard post={post} isMine={isMine} />}
      {post.images.length > 0 && <ImageCarousel images={post.images} alt={`Imagem da publicação de ${author.name}`} />}

      <footer className="mt-3 -mx-2 flex items-center justify-between">
        <div className="flex items-center">
          <ActionButton
            label={liked ? 'Descurtir' : 'Curtir'}
            pressed={liked}
            onClick={() => {
              social.toggleLike(post.id);
              setPulse((p) => p + 1);
            }}
            className={liked ? 'text-[#FF5C7A]' : undefined}
          >
            <Heart key={pulse} className={cn('h-5 w-5', liked && 'fill-current animate-heart')} />
            <span className="tabular-nums">{compact(likeCount)}</span>
          </ActionButton>
          <ActionButton
            label={`Comentários (${commentCount})`}
            pressed={showComments}
            onClick={() => {
              setShowComments((v) => !v);
              setTimeout(() => commentInputRef.current?.focus(), 50);
            }}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="tabular-nums">{compact(commentCount)}</span>
          </ActionButton>
          <ActionButton label="Compartilhar link" onClick={share}>
            <Share2 className="h-5 w-5" />
            <span className="hidden sm:inline">Compartilhar</span>
          </ActionButton>
        </div>
        <ActionButton
          label={saved ? 'Remover dos salvos' : 'Salvar'}
          pressed={saved}
          onClick={() => {
            social.toggleSave(post.id);
            toast.success(saved ? 'Removido dos salvos.' : 'Salvo! Veja em Meu perfil › Salvos.');
          }}
          className={saved ? 'text-lime' : undefined}
        >
          <Bookmark className={cn('h-5 w-5', saved && 'fill-current')} />
        </ActionButton>
      </footer>

      {showComments && <CommentsSection postId={post.id} inputRef={commentInputRef} />}
    </article>
  );
}

function ActionButton({ label, pressed, onClick, children, className }: { label: string; pressed?: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={cn('inline-flex items-center gap-1.5 h-10 min-w-[44px] px-2.5 rounded-full text-sm font-semibold text-ink-muted hover:text-ink hover:bg-surface transition-colors', className)}
    >
      {children}
    </button>
  );
}

export const PostCard = memo(PostCardInner);
