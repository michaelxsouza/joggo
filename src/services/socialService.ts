// Camada de dados social — Supabase.
// O estado fica em memória (mesmo formato do protótipo) e é carregado do banco após o login.
// As ações atualizam a tela na hora (otimista) e gravam no Supabase em seguida;
// se a gravação falhar, o estado é recarregado e o erro aparece como aviso.
import { useStore, type Store } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { nowIso, uid } from '@/lib/utils';
import type {
  AppNotification,
  BetResult,
  Category,
  Comment,
  Community,
  Conversation,
  ID,
  Message,
  NotificationPrefs,
  Post,
  ReportTarget,
  SocialState,
  User,
} from '@/types/social';
import coverFutebol from '@/assets/demo/futebol.svg';
import coverPoker from '@/assets/demo/poker.svg';
import coverRoleta from '@/assets/demo/roleta.svg';
import coverSlots from '@/assets/demo/slots.svg';
import coverCassino from '@/assets/demo/cassino.svg';
import coverBasquete from '@/assets/demo/basquete.svg';
import coverTorneio from '@/assets/demo/torneio.svg';

// Capa padrão quando a comunidade não tem imagem própria
const SLUG_COVER: Record<string, string> = { 'nba-basquete': coverBasquete, 'bilhete-do-dia': coverTorneio, 'futebol-europeu': coverFutebol };
const CATEGORY_COVER: Record<string, string> = { esportes: coverFutebol, poker: coverPoker, roleta: coverRoleta, slots: coverSlots, cassino: coverCassino };

// ---------- Store em memória ----------
const emptyState = (): SocialState => ({
  version: 1,
  currentUserId: '',
  users: [],
  posts: [],
  comments: [],
  communities: [],
  likedPostIds: [],
  savedPostIds: [],
  hiddenPostIds: [],
  followingIds: [],
  follows: [],
  joinedCommunityIds: [],
  blockedUserIds: [],
  reports: [],
  conversations: [],
  messages: [],
  notifications: [],
  notificationPrefs: { likes: true, comments: true, follows: true, messages: true, communities: true, emailDigest: false },
});

function createMemoryStore<T>(initial: () => T): Store<T> & { replace: (v: T) => void } {
  let state = initial();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    get: () => state,
    set: (fn) => {
      state = fn(state);
      emit();
    },
    replace: (v) => {
      state = v;
      emit();
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    reset: () => {
      state = initial();
      emit();
    },
    lastError: () => null,
  };
}

export const socialStore = createMemoryStore<SocialState>(emptyState);
export const useSocial = <S,>(selector: (s: SocialState) => S) => useStore(socialStore, selector);
const set = socialStore.set;
const me = () => socialStore.get().currentUserId;
const toggle = (arr: ID[], id: ID) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

// ---------- Status de carregamento e avisos de erro ----------
type LoadStatus = { status: 'idle' | 'loading' | 'ready' | 'error'; error?: string };
let loadStatus: LoadStatus = { status: 'idle' };
const statusListeners = new Set<() => void>();
const setStatus = (s: LoadStatus) => {
  loadStatus = s;
  statusListeners.forEach((l) => l());
};
export const socialStatus = {
  get: () => loadStatus,
  subscribe: (fn: () => void) => {
    statusListeners.add(fn);
    return () => {
      statusListeners.delete(fn);
    };
  },
};

const errorListeners = new Set<(msg: string) => void>();
/** A UI assina para mostrar erros de gravação como toast. */
export function onSocialError(fn: (msg: string) => void) {
  errorListeners.add(fn);
  return () => {
    errorListeners.delete(fn);
  };
}
function fail(e: unknown) {
  const raw = (e as { message?: string })?.message ?? String(e);
  const m = raw.toLowerCase();
  const msg =
    m.includes('limite de') || m.includes('rápido demais') || m.includes('bilhete') || m.includes('não é possível') || m.includes('você não pode') || m.includes('muitas mensagens')
      ? raw
      : m.includes('duplicate key') && m.includes('handle')
        ? 'Este @usuário já está em uso.'
        : m.includes('failed to fetch') || m.includes('network')
          ? 'Sem conexão. Verifique sua internet.'
          : 'Não foi possível salvar. Tente novamente.';
  errorListeners.forEach((l) => l(msg));
  void loadSocial(true); // volta ao estado real do banco
}
/** Executa a gravação em segundo plano; em caso de erro, avisa e recarrega. */
function run(p: PromiseLike<{ error: unknown }>) {
  Promise.resolve(p).then(
    (r) => r.error && fail(r.error),
    (e) => fail(e),
  );
}

// ---------- Mapeamento banco → app ----------
/* eslint-disable @typescript-eslint/no-explicit-any */
const toUser = (r: any, followers: number, following: number): User => ({
  id: r.id,
  name: r.name,
  handle: r.handle,
  bio: r.bio ?? '',
  location: r.location ?? undefined,
  avatarColor: r.avatar_color,
  avatarImage: r.avatar_url ?? undefined,
  coverImage: r.cover_url ?? undefined,
  coverColor: r.cover_color,
  interests: r.interests ?? [],
  joinedAt: r.created_at,
  followers,
  following,
  founder: r.founder,
});

const toPost = (r: any, likedByMe: boolean): Post => ({
  id: r.id,
  authorId: r.author_id,
  communityId: r.community_id ?? undefined,
  category: r.category,
  text: r.text ?? '',
  images: r.images?.length ? r.images : r.image_url ? [r.image_url] : [],
  createdAt: r.created_at,
  baseLikes: Math.max(0, (r.like_count ?? 0) - (likedByMe ? 1 : 0)),
  kind: r.kind,
  betEvent: r.bet_event ?? undefined,
  betPick: r.bet_pick ?? undefined,
  betOdd: r.bet_odd != null ? Number(r.bet_odd) : undefined,
  betResult: r.bet_result ?? undefined,
});

const NOTIF_TEXT: Record<string, string> = {
  like: 'curtiu sua publicação',
  comment: 'comentou na sua publicação',
  follow: 'começou a seguir você',
  community: 'entrou na sua comunidade',
  system: 'Aviso da Joggo',
};

const PREF_COLUMNS = { likes: 'likes', comments: 'comments', follows: 'follows', messages: 'messages', communities: 'communities', emailDigest: 'email_digest' } as const;

// ---------- Carregamento ----------
let loading: Promise<void> | null = null;
let realtime: ReturnType<typeof supabase.channel> | null = null;

/** Carrega tudo o que a tela precisa. Na escala do beta (dezenas de pessoas) isso é leve. */
export function loadSocial(silent = false): Promise<void> {
  if (loading) return loading;
  loading = (async () => {
    if (!silent) setStatus({ status: 'loading' });
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uidMe = auth.user?.id;
      if (!uidMe) throw new Error('Sessão expirada. Entre novamente.');

      const q = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('post_feed').select('*').order('created_at', { ascending: false }).limit(300),
        supabase.from('communities').select('*').order('created_at'),
        supabase.from('community_members').select('community_id,user_id'),
        supabase.from('follows').select('follower_id,following_id'),
        supabase.from('likes').select('post_id').eq('user_id', uidMe),
        supabase.from('saves').select('post_id'),
        supabase.from('hidden_posts').select('post_id'),
        supabase.from('blocks').select('blocked_id'),
        supabase.from('reports').select('*').eq('reporter_id', uidMe).order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('notification_prefs').select('*').maybeSingle(),
        supabase.from('conversation_members').select('conversation_id,user_id,last_read_at'),
        supabase.from('messages').select('*').order('created_at').limit(2000),
      ]);
      const firstErr = q.find((r) => r.error)?.error;
      if (firstErr) throw firstErr;
      const [profiles, posts, communities, members, follows, likes, saves, hidden, blocks, reports, notifs, prefs, convMembers, messages] = q.map((r) => r.data as any);

      if (!(profiles as any[]).some((p) => p.id === uidMe)) throw new Error('Seu perfil não foi encontrado. Fale com o suporte da Joggo.');

      const followRows = follows as { follower_id: string; following_id: string }[];
      const followingIds = followRows.filter((f) => f.follower_id === uidMe).map((f) => f.following_id);
      const users = (profiles as any[]).map((p) =>
        toUser(
          p,
          followRows.filter((f) => f.following_id === p.id && f.follower_id !== uidMe).length,
          followRows.filter((f) => f.follower_id === p.id).length,
        ),
      );

      const liked = new Set((likes as any[]).map((l) => l.post_id as string));
      const postList = (posts as any[]).map((p) => toPost(p, liked.has(p.id)));
      const postIds = postList.map((p) => p.id);

      let comments: Comment[] = [];
      if (postIds.length) {
        const { data, error } = await supabase.from('comments').select('*').in('post_id', postIds).order('created_at');
        if (error) throw error;
        comments = (data ?? []).map((c: any) => ({ id: c.id, postId: c.post_id, authorId: c.author_id, text: c.text, createdAt: c.created_at }));
      }

      const memberRows = members as { community_id: string; user_id: string }[];
      const communityList: Community[] = (communities as any[]).map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        category: c.category,
        description: c.description,
        cover: c.cover_url || SLUG_COVER[c.slug] || CATEGORY_COVER[c.category] || coverFutebol,
        rules: c.rules ?? [],
        baseMembers: memberRows.filter((m) => m.community_id === c.id && m.user_id !== uidMe).length,
        memberIds: memberRows.filter((m) => m.community_id === c.id && m.user_id !== uidMe).map((m) => m.user_id),
        createdAt: c.created_at,
      }));

      // conversas 1:1
      const cm = convMembers as { conversation_id: string; user_id: string; last_read_at: string }[];
      const msgs: Message[] = (messages as any[]).map((m) => ({ id: m.id, conversationId: m.conversation_id, authorId: m.author_id, text: m.text, createdAt: m.created_at }));
      const conversations: Conversation[] = cm
        .filter((m) => m.user_id === uidMe)
        .map((mine) => {
          const other = cm.find((m) => m.conversation_id === mine.conversation_id && m.user_id !== uidMe);
          const inConv = msgs.filter((m) => m.conversationId === mine.conversation_id);
          return {
            id: mine.conversation_id,
            participantId: other?.user_id ?? '',
            updatedAt: inConv.at(-1)?.createdAt ?? mine.last_read_at,
            unread: inConv.filter((m) => m.authorId !== uidMe && m.createdAt > mine.last_read_at).length,
          };
        })
        .filter((c) => c.participantId);

      const p = prefs as any;
      socialStore.replace({
        version: 1,
        currentUserId: uidMe,
        users,
        posts: postList,
        comments,
        communities: communityList,
        likedPostIds: [...liked],
        savedPostIds: (saves as any[]).map((s) => s.post_id),
        hiddenPostIds: (hidden as any[]).map((s) => s.post_id),
        followingIds,
        follows: followRows.filter((f) => f.follower_id !== uidMe).map((f) => ({ followerId: f.follower_id, followingId: f.following_id })),
        joinedCommunityIds: memberRows.filter((m) => m.user_id === uidMe).map((m) => m.community_id),
        blockedUserIds: (blocks as any[]).map((b) => b.blocked_id),
        reports: (reports as any[]).map((r) => ({ id: r.id, target: r.target, targetId: r.target_id, reason: r.reason, details: r.details ?? undefined, createdAt: r.created_at })),
        conversations,
        messages: msgs,
        notifications: (notifs as any[]).map(
          (n): AppNotification => ({
            id: n.id,
            type: n.type,
            actorId: n.actor_id ?? undefined,
            postId: n.post_id ?? undefined,
            communityId: n.community_id ?? undefined,
            text: NOTIF_TEXT[n.type] ?? '',
            createdAt: n.created_at,
            read: n.read,
          }),
        ),
        notificationPrefs: p
          ? { likes: p.likes, comments: p.comments, follows: p.follows, messages: p.messages, communities: p.communities, emailDigest: p.email_digest }
          : emptyState().notificationPrefs,
      });
      setStatus({ status: 'ready' });
      startRealtime(uidMe);
    } catch (e) {
      if (!silent || loadStatus.status !== 'ready') setStatus({ status: 'error', error: (e as Error).message || 'Não foi possível carregar a Joggo.' });
    } finally {
      loading = null;
    }
  })();
  return loading;
}

/** Limpa tudo ao sair da conta. */
export function clearSocial() {
  if (realtime) void supabase.removeChannel(realtime);
  realtime = null;
  socialStore.reset();
  setStatus({ status: 'idle' });
}

// Novas mensagens e notificações chegam em tempo real (o RLS filtra o que cada um pode ver).
let reloadTimer: number | undefined;
const softReload = () => {
  window.clearTimeout(reloadTimer);
  reloadTimer = window.setTimeout(() => void loadSocial(true), 400);
};
function startRealtime(uidMe: string) {
  if (realtime) return;
  realtime = supabase
    .channel('joggo-' + uidMe)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, softReload)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uidMe}` }, softReload)
    .subscribe();
}

// ---------- Upload de imagens ----------
/** Recebe a imagem já comprimida (data URL) e envia ao Storage, na pasta do usuário. */
async function uploadDataUrl(dataUrl: string, folder: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : blob.type === 'image/gif' ? 'gif' : 'jpg';
  const path = `${me()}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}
const isDataUrl = (v?: string) => !!v && v.startsWith('data:');

// ---------- Seletores ----------
export const sel = {
  me: (s: SocialState) => s.users.find((u) => u.id === s.currentUserId)!,
  user: (s: SocialState, id: ID) => s.users.find((u) => u.id === id),
  userByHandle: (s: SocialState, handle: string) => s.users.find((u) => u.handle.toLowerCase() === handle.toLowerCase()),
  community: (s: SocialState, id?: ID) => (id ? s.communities.find((c) => c.id === id) : undefined),
  likeCount: (s: SocialState, p: Post) => p.baseLikes + (s.likedPostIds.includes(p.id) ? 1 : 0),
  commentsOf: (s: SocialState, postId: ID) => s.comments.filter((c) => c.postId === postId && !s.blockedUserIds.includes(c.authorId)),
  memberCount: (s: SocialState, c: Community) => c.baseMembers + (s.joinedCommunityIds.includes(c.id) ? 1 : 0),
  /** Pessoas que seguem `uid` (sem bloqueados). */
  followersOf: (s: SocialState, uid: ID): User[] => {
    const ids = s.follows.filter((f) => f.followingId === uid).map((f) => f.followerId);
    if (s.followingIds.includes(uid)) ids.unshift(s.currentUserId);
    return ids.filter((id) => !s.blockedUserIds.includes(id)).map((id) => s.users.find((u) => u.id === id)).filter((u): u is User => !!u);
  },
  /** Pessoas que `uid` segue (sem bloqueados). */
  followingOf: (s: SocialState, uid: ID): User[] => {
    const ids = uid === s.currentUserId ? s.followingIds : s.follows.filter((f) => f.followerId === uid).map((f) => f.followingId);
    return ids.filter((id) => !s.blockedUserIds.includes(id)).map((id) => s.users.find((u) => u.id === id)).filter((u): u is User => !!u);
  },
  followerCount: (s: SocialState, u: User) => sel.followersOf(s, u.id).length,
  followingCount: (s: SocialState, u: User) => sel.followingOf(s, u.id).length,
  visiblePosts: (s: SocialState) =>
    s.posts
      .filter((p) => !s.hiddenPostIds.includes(p.id) && !s.blockedUserIds.includes(p.authorId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  unreadNotifications: (s: SocialState) => s.notifications.filter((n) => !n.read && (!n.actorId || !s.blockedUserIds.includes(n.actorId))).length,
  unreadMessages: (s: SocialState) =>
    s.conversations.filter((c) => !s.blockedUserIds.includes(c.participantId)).reduce((a, c) => a + c.unread, 0),
};

export type FeedTab = 'para-voce' | 'seguindo';

/** "Para você": tudo, priorizando interesses. "Seguindo": pessoas seguidas, comunidades e suas próprias publicações. */
export function feedPosts(s: SocialState, tab: FeedTab, category: Category | 'todas'): Post[] {
  let list = sel.visiblePosts(s);
  if (tab === 'seguindo') {
    list = list.filter(
      (p) => s.followingIds.includes(p.authorId) || p.authorId === s.currentUserId || (p.communityId && s.joinedCommunityIds.includes(p.communityId)),
    );
  } else {
    const meUser = sel.me(s);
    const score = (p: Post) => new Date(p.createdAt).getTime() + (meUser?.interests.includes(p.category) ? 1000 * 60 * 60 * 6 : 0);
    list = [...list].sort((a, b) => score(b) - score(a));
  }
  if (category !== 'todas') list = list.filter((p) => p.category === category);
  return list;
}

// ---------- Ações ----------
export const social = {
  createPost(input: {
    text: string;
    images?: string[];
    category: Category;
    communityId?: ID;
    bet?: { event?: string; pick: string; odd: number };
  }) {
    const text = input.text.trim();
    const images = (input.images ?? []).slice(0, 4);
    if (!text && !images.length && !input.bet) throw new Error('Escreva algo ou adicione uma imagem.');
    if (text.length > 2000) throw new Error('A publicação pode ter até 2000 caracteres.');
    if (input.bet) {
      if (!input.bet.pick.trim()) throw new Error('Informe o palpite do bilhete.');
      if (!(input.bet.odd >= 1.01)) throw new Error('A odd precisa ser maior que 1,00.');
    }
    const id = crypto.randomUUID();
    const post: Post = {
      id,
      authorId: me(),
      text,
      images,
      category: input.category,
      communityId: input.communityId,
      createdAt: nowIso(),
      baseLikes: 0,
      kind: input.bet ? 'bilhete' : 'post',
      betEvent: input.bet?.event?.trim() || undefined,
      betPick: input.bet?.pick.trim(),
      betOdd: input.bet?.odd,
      betResult: input.bet ? 'pendente' : undefined,
    };
    set((s) => ({ ...s, posts: [post, ...s.posts] }));
    void (async () => {
      try {
        const urls = await Promise.all(images.map((img) => (isDataUrl(img) ? uploadDataUrl(img, 'posts') : Promise.resolve(img))));
        if (urls.length) set((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? { ...p, images: urls } : p)) }));
        const { error } = await supabase.from('posts').insert({
          id,
          author_id: post.authorId,
          community_id: post.communityId ?? null,
          category: post.category,
          kind: post.kind,
          text,
          image_url: urls[0] ?? null,
          images: urls,
          bet_event: post.betEvent ?? null,
          bet_pick: post.betPick ?? null,
          bet_odd: post.betOdd ?? null,
          bet_result: post.betResult ?? null,
        });
        if (error) throw error;
      } catch (e) {
        fail(e);
      }
    })();
    return post;
  },
  /** Marca o resultado do bilhete (só uma vez). */
  setBetResult(postId: ID, result: Exclude<BetResult, 'pendente'>) {
    const p = socialStore.get().posts.find((x) => x.id === postId);
    if (!p || p.kind !== 'bilhete') return;
    if (p.betResult !== 'pendente') throw new Error('O resultado deste bilhete já foi marcado.');
    set((s) => ({ ...s, posts: s.posts.map((x) => (x.id === postId ? { ...x, betResult: result } : x)) }));
    run(supabase.from('posts').update({ bet_result: result }).eq('id', postId));
  },
  deletePost(id: ID) {
    set((s) => ({ ...s, posts: s.posts.filter((p) => p.id !== id), comments: s.comments.filter((c) => c.postId !== id) }));
    run(supabase.from('posts').delete().eq('id', id));
  },
  toggleLike(id: ID) {
    const liked = socialStore.get().likedPostIds.includes(id);
    set((s) => ({ ...s, likedPostIds: toggle(s.likedPostIds, id) }));
    run(liked ? supabase.from('likes').delete().match({ post_id: id, user_id: me() }) : supabase.from('likes').insert({ post_id: id, user_id: me() }));
  },
  toggleSave(id: ID) {
    const saved = socialStore.get().savedPostIds.includes(id);
    set((s) => ({ ...s, savedPostIds: toggle(s.savedPostIds, id) }));
    run(saved ? supabase.from('saves').delete().match({ post_id: id, user_id: me() }) : supabase.from('saves').insert({ post_id: id, user_id: me() }));
  },
  hidePost(id: ID) {
    if (socialStore.get().hiddenPostIds.includes(id)) return;
    set((s) => ({ ...s, hiddenPostIds: [...s.hiddenPostIds, id] }));
    run(supabase.from('hidden_posts').insert({ post_id: id, user_id: me() }));
  },
  unhidePost(id: ID) {
    set((s) => ({ ...s, hiddenPostIds: s.hiddenPostIds.filter((x) => x !== id) }));
    run(supabase.from('hidden_posts').delete().match({ post_id: id, user_id: me() }));
  },
  addComment(postId: ID, text: string) {
    const t = text.trim();
    if (!t) throw new Error('O comentário está vazio.');
    if (t.length > 1000) throw new Error('Comentários podem ter até 1000 caracteres.');
    const id = crypto.randomUUID();
    set((s) => ({ ...s, comments: [...s.comments, { id, postId, authorId: me(), text: t, createdAt: nowIso() }] }));
    run(supabase.from('comments').insert({ id, post_id: postId, author_id: me(), text: t }));
  },
  deleteComment(id: ID) {
    set((s) => ({ ...s, comments: s.comments.filter((c) => c.id !== id) }));
    run(supabase.from('comments').delete().eq('id', id));
  },
  toggleFollow(userId: ID) {
    const following = socialStore.get().followingIds.includes(userId);
    set((s) => ({ ...s, followingIds: toggle(s.followingIds, userId) }));
    run(
      following
        ? supabase.from('follows').delete().match({ follower_id: me(), following_id: userId })
        : supabase.from('follows').insert({ follower_id: me(), following_id: userId }),
    );
  },
  toggleCommunity(communityId: ID) {
    const joined = socialStore.get().joinedCommunityIds.includes(communityId);
    set((s) => ({ ...s, joinedCommunityIds: toggle(s.joinedCommunityIds, communityId) }));
    run(
      joined
        ? supabase.from('community_members').delete().match({ community_id: communityId, user_id: me() })
        : supabase.from('community_members').insert({ community_id: communityId, user_id: me() }),
    );
  },
  updateProfile(patch: Partial<Pick<User, 'name' | 'handle' | 'bio' | 'location' | 'interests' | 'avatarColor' | 'coverColor' | 'avatarImage' | 'coverImage'>>) {
    const s0 = socialStore.get();
    if (patch.name !== undefined && patch.name.trim().length < 2) throw new Error('O nome precisa ter pelo menos 2 caracteres.');
    if (patch.handle !== undefined) {
      const h = patch.handle.trim().replace(/^@/, '').toLowerCase();
      if (!/^[a-z0-9._]{3,20}$/.test(h)) throw new Error('O usuário deve ter de 3 a 20 caracteres: letras, números, ponto ou _.');
      if (s0.users.some((u) => u.id !== s0.currentUserId && u.handle.toLowerCase() === h)) throw new Error('Este @usuário já está em uso.');
      patch.handle = h;
    }
    if (patch.bio !== undefined && patch.bio.length > 160) throw new Error('A biografia pode ter até 160 caracteres.');
    set((s) => ({ ...s, users: s.users.map((u) => (u.id === s.currentUserId ? { ...u, ...patch } : u)) }));
    void (async () => {
      try {
        const row: Record<string, unknown> = {};
        if (patch.name !== undefined) row.name = patch.name.trim();
        if (patch.handle !== undefined) row.handle = patch.handle;
        if (patch.bio !== undefined) row.bio = patch.bio;
        if (patch.location !== undefined) row.location = patch.location || null;
        if (patch.interests !== undefined) row.interests = patch.interests;
        if (patch.avatarColor !== undefined) row.avatar_color = patch.avatarColor;
        if (patch.coverColor !== undefined) row.cover_color = patch.coverColor;
        if ('avatarImage' in patch) row.avatar_url = isDataUrl(patch.avatarImage) ? await uploadDataUrl(patch.avatarImage!, 'avatar') : (patch.avatarImage ?? null);
        if ('coverImage' in patch) row.cover_url = isDataUrl(patch.coverImage) ? await uploadDataUrl(patch.coverImage!, 'cover') : (patch.coverImage ?? null);
        const { error } = await supabase.from('profiles').update(row).eq('id', me());
        if (error) throw error;
        if (row.avatar_url !== undefined || row.cover_url !== undefined)
          set((s) => ({
            ...s,
            users: s.users.map((u) =>
              u.id === s.currentUserId
                ? { ...u, ...(row.avatar_url !== undefined ? { avatarImage: (row.avatar_url as string) ?? undefined } : {}), ...(row.cover_url !== undefined ? { coverImage: (row.cover_url as string) ?? undefined } : {}) }
                : u,
            ),
          }));
      } catch (e) {
        fail(e);
      }
    })();
  },
  block(userId: ID) {
    const wasFollowing = socialStore.get().followingIds.includes(userId);
    set((s) => ({ ...s, blockedUserIds: [...new Set([...s.blockedUserIds, userId])], followingIds: s.followingIds.filter((x) => x !== userId) }));
    run(supabase.from('blocks').insert({ blocker_id: me(), blocked_id: userId }));
    if (wasFollowing) run(supabase.from('follows').delete().match({ follower_id: me(), following_id: userId }));
  },
  unblock(userId: ID) {
    set((s) => ({ ...s, blockedUserIds: s.blockedUserIds.filter((x) => x !== userId) }));
    run(supabase.from('blocks').delete().match({ blocker_id: me(), blocked_id: userId }));
  },
  report(target: ReportTarget, targetId: ID, reason: string, details?: string) {
    if (!reason) throw new Error('Escolha um motivo.');
    const id = crypto.randomUUID();
    set((s) => ({ ...s, reports: [{ id, target, targetId, reason, details, createdAt: nowIso() }, ...s.reports] }));
    run(supabase.from('reports').insert({ id, reporter_id: me(), target, target_id: targetId, reason, details: details || null }));
  },
  markNotification(id: ID) {
    set((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    run(supabase.from('notifications').update({ read: true }).eq('id', id));
  },
  markAllNotifications() {
    set((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    run(supabase.from('notifications').update({ read: true }).eq('user_id', me()).eq('read', false));
  },
  setNotificationPrefs(p: Partial<NotificationPrefs>) {
    set((s) => ({ ...s, notificationPrefs: { ...s.notificationPrefs, ...p } }));
    const full = socialStore.get().notificationPrefs;
    const row: Record<string, unknown> = { user_id: me() };
    (Object.keys(PREF_COLUMNS) as (keyof NotificationPrefs)[]).forEach((k) => (row[PREF_COLUMNS[k]] = full[k]));
    run(supabase.from('notification_prefs').upsert(row));
  },
  /** Abre (ou cria) a conversa com um usuário e retorna o id. */
  openConversation(userId: ID): ID {
    const s = socialStore.get();
    const existing = s.conversations.find((c) => c.participantId === userId);
    if (existing) return existing.id;
    // id provisório até o banco responder; a tela é atualizada quando chega o id real
    const tmp = uid('cv');
    set((st) => ({ ...st, conversations: [{ id: tmp, participantId: userId, updatedAt: nowIso(), unread: 0 }, ...st.conversations] }));
    void (async () => {
      const { data, error } = await supabase.rpc('start_conversation', { other: userId });
      if (error) return fail(error);
      const real = data as string;
      set((st) => ({
        ...st,
        conversations: st.conversations.map((c) => (c.id === tmp ? { ...c, id: real } : c)),
        messages: st.messages.map((m) => (m.conversationId === tmp ? { ...m, conversationId: real } : m)),
      }));
      if (window.location.hash.includes(tmp)) window.location.hash = window.location.hash.replace(tmp, real);
      // mensagens enviadas antes do id real
      for (const m of socialStore.get().messages.filter((x) => x.conversationId === real && pendingMessages.has(x.id))) {
        pendingMessages.delete(m.id);
        run(supabase.from('messages').insert({ id: m.id, conversation_id: real, author_id: me(), text: m.text }));
      }
    })();
    return tmp;
  },
  sendMessage(conversationId: ID, text: string) {
    const t = text.trim();
    if (!t) throw new Error('Digite uma mensagem.');
    if (t.length > 2000) throw new Error('Mensagens podem ter até 2000 caracteres.');
    const at = nowIso();
    const id = crypto.randomUUID();
    set((s) => ({
      ...s,
      messages: [...s.messages, { id, conversationId, authorId: me(), text: t, createdAt: at }],
      conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, updatedAt: at } : c)),
    }));
    if (conversationId.startsWith('cv')) pendingMessages.add(id);
    else run(supabase.from('messages').insert({ id, conversation_id: conversationId, author_id: me(), text: t }));
  },
  markConversationRead(id: ID) {
    const c = socialStore.get().conversations.find((x) => x.id === id);
    if (!c || !c.unread) return;
    set((s) => ({ ...s, conversations: s.conversations.map((x) => (x.id === id ? { ...x, unread: 0 } : x)) }));
    run(supabase.from('conversation_members').update({ last_read_at: nowIso() }).match({ conversation_id: id, user_id: me() }));
  },
  /** Recarrega os dados do servidor. */
  resetDemo: () => loadSocial(),
};

const pendingMessages = new Set<string>();
