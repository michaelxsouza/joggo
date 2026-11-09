// Camada de dados social (implementação local com localStorage).
// A UI só conversa com estas funções e com os seletores, nunca com o localStorage.
import { createPersistentStore, useStore } from '@/lib/store';
import { nowIso, uid } from '@/lib/utils';
import { seedSocial } from '@/data/seed/social';
import type { Category, Community, ID, NotificationPrefs, Post, ReportTarget, SocialState, User } from '@/types/social';

export const socialStore = createPersistentStore<SocialState>('joggo:social', seedSocial);

export const useSocial = <S,>(selector: (s: SocialState) => S) => useStore(socialStore, selector);

const set = socialStore.set;
const toggle = (arr: ID[], id: ID) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

// ---------- Seletores ----------
export const sel = {
  me: (s: SocialState) => s.users.find((u) => u.id === s.currentUserId)!,
  user: (s: SocialState, id: ID) => s.users.find((u) => u.id === id),
  userByHandle: (s: SocialState, handle: string) => s.users.find((u) => u.handle.toLowerCase() === handle.toLowerCase()),
  community: (s: SocialState, id?: ID) => (id ? s.communities.find((c) => c.id === id) : undefined),
  likeCount: (s: SocialState, p: Post) => p.baseLikes + (s.likedPostIds.includes(p.id) ? 1 : 0),
  commentsOf: (s: SocialState, postId: ID) => s.comments.filter((c) => c.postId === postId && !s.blockedUserIds.includes(c.authorId)),
  memberCount: (s: SocialState, c: Community) =>
    c.baseMembers + (s.joinedCommunityIds.includes(c.id) && !c.memberIds.includes(s.currentUserId) ? 1 : 0) -
    (!s.joinedCommunityIds.includes(c.id) && c.memberIds.includes(s.currentUserId) ? 1 : 0),
  followerCount: (s: SocialState, u: User) => u.followers + (s.followingIds.includes(u.id) ? 1 : 0),
  followingCount: (s: SocialState, u: User) => (u.id === s.currentUserId ? s.followingIds.length : u.following),
  visiblePosts: (s: SocialState) =>
    s.posts
      .filter((p) => !s.hiddenPostIds.includes(p.id) && !s.blockedUserIds.includes(p.authorId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  unreadNotifications: (s: SocialState) => s.notifications.filter((n) => !n.read).length,
  unreadMessages: (s: SocialState) =>
    s.conversations.filter((c) => !s.blockedUserIds.includes(c.participantId)).reduce((a, c) => a + c.unread, 0),
};

export type FeedTab = 'para-voce' | 'seguindo';

/** "Para você": tudo, priorizando interesses. "Seguindo": pessoas seguidas, comunidades e suas próprias publicações. */
export function feedPosts(s: SocialState, tab: FeedTab, category: Category | 'todas'): Post[] {
  let list = sel.visiblePosts(s);
  if (tab === 'seguindo') {
    list = list.filter(
      (p) =>
        s.followingIds.includes(p.authorId) ||
        p.authorId === s.currentUserId ||
        (p.communityId && s.joinedCommunityIds.includes(p.communityId)),
    );
  } else {
    const me = sel.me(s);
    // Recência com leve impulso para interesses do usuário (sem dados sensíveis).
    const score = (p: Post) =>
      new Date(p.createdAt).getTime() + (me.interests.includes(p.category) ? 1000 * 60 * 60 * 6 : 0);
    list = [...list].sort((a, b) => score(b) - score(a));
  }
  if (category !== 'todas') list = list.filter((p) => p.category === category);
  return list;
}

// ---------- Ações ----------
export const social = {
  createPost(input: { text: string; image?: string; category: Category; communityId?: ID }) {
    const text = input.text.trim();
    if (!text && !input.image) throw new Error('Escreva algo ou adicione uma imagem.');
    if (text.length > 1000) throw new Error('A publicação pode ter até 1000 caracteres.');
    const post: Post = {
      id: uid('p'),
      authorId: socialStore.get().currentUserId,
      text,
      image: input.image,
      category: input.category,
      communityId: input.communityId,
      createdAt: nowIso(),
      baseLikes: 0,
    };
    set((s) => ({ ...s, posts: [post, ...s.posts] }));
    const err = socialStore.lastError();
    if (err) throw new Error(err);
    return post;
  },
  deletePost(id: ID) {
    set((s) => ({ ...s, posts: s.posts.filter((p) => p.id !== id), comments: s.comments.filter((c) => c.postId !== id) }));
  },
  toggleLike: (id: ID) => set((s) => ({ ...s, likedPostIds: toggle(s.likedPostIds, id) })),
  toggleSave: (id: ID) => set((s) => ({ ...s, savedPostIds: toggle(s.savedPostIds, id) })),
  hidePost: (id: ID) => set((s) => ({ ...s, hiddenPostIds: [...new Set([...s.hiddenPostIds, id])] })),
  unhidePost: (id: ID) => set((s) => ({ ...s, hiddenPostIds: s.hiddenPostIds.filter((x) => x !== id) })),
  addComment(postId: ID, text: string) {
    const t = text.trim();
    if (!t) throw new Error('O comentário está vazio.');
    if (t.length > 500) throw new Error('Comentários podem ter até 500 caracteres.');
    set((s) => ({
      ...s,
      comments: [...s.comments, { id: uid('cm'), postId, authorId: s.currentUserId, text: t, createdAt: nowIso() }],
    }));
  },
  deleteComment: (id: ID) => set((s) => ({ ...s, comments: s.comments.filter((c) => c.id !== id) })),
  toggleFollow: (userId: ID) => set((s) => ({ ...s, followingIds: toggle(s.followingIds, userId) })),
  toggleCommunity: (communityId: ID) => set((s) => ({ ...s, joinedCommunityIds: toggle(s.joinedCommunityIds, communityId) })),
  updateProfile(patch: Partial<Pick<User, 'name' | 'handle' | 'bio' | 'location' | 'interests' | 'avatarColor' | 'coverColor' | 'avatarImage' | 'coverImage'>>) {
    const s0 = socialStore.get();
    if (patch.name !== undefined && patch.name.trim().length < 2) throw new Error('O nome precisa ter pelo menos 2 caracteres.');
    if (patch.handle !== undefined) {
      const h = patch.handle.trim().replace(/^@/, '');
      if (!/^[a-z0-9._]{3,20}$/i.test(h)) throw new Error('O usuário deve ter de 3 a 20 caracteres: letras, números, ponto ou _.');
      if (s0.users.some((u) => u.id !== s0.currentUserId && u.handle.toLowerCase() === h.toLowerCase()))
        throw new Error('Este @usuário já está em uso.');
      patch.handle = h;
    }
    if (patch.bio !== undefined && patch.bio.length > 160) throw new Error('A biografia pode ter até 160 caracteres.');
    set((s) => ({ ...s, users: s.users.map((u) => (u.id === s.currentUserId ? { ...u, ...patch } : u)) }));
    const err = socialStore.lastError();
    if (err) throw new Error(err);
  },
  block: (userId: ID) =>
    set((s) => ({
      ...s,
      blockedUserIds: [...new Set([...s.blockedUserIds, userId])],
      followingIds: s.followingIds.filter((x) => x !== userId),
    })),
  unblock: (userId: ID) => set((s) => ({ ...s, blockedUserIds: s.blockedUserIds.filter((x) => x !== userId) })),
  report(target: ReportTarget, targetId: ID, reason: string, details?: string) {
    if (!reason) throw new Error('Escolha um motivo.');
    set((s) => ({ ...s, reports: [{ id: uid('r'), target, targetId, reason, details, createdAt: nowIso() }, ...s.reports] }));
  },
  markNotification: (id: ID) => set((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllNotifications: () => set((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  setNotificationPrefs: (p: Partial<NotificationPrefs>) => set((s) => ({ ...s, notificationPrefs: { ...s.notificationPrefs, ...p } })),
  /** Abre (ou cria) a conversa com um usuário e retorna o id. */
  openConversation(userId: ID): ID {
    const s = socialStore.get();
    const existing = s.conversations.find((c) => c.participantId === userId);
    if (existing) return existing.id;
    const id = uid('cv');
    set((st) => ({ ...st, conversations: [{ id, participantId: userId, updatedAt: nowIso(), unread: 0 }, ...st.conversations] }));
    return id;
  },
  sendMessage(conversationId: ID, text: string) {
    const t = text.trim();
    if (!t) throw new Error('Digite uma mensagem.');
    if (t.length > 1000) throw new Error('Mensagens podem ter até 1000 caracteres.');
    const at = nowIso();
    set((s) => ({
      ...s,
      messages: [...s.messages, { id: uid('m'), conversationId, authorId: s.currentUserId, text: t, createdAt: at }],
      conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, updatedAt: at } : c)),
    }));
  },
  markConversationRead: (id: ID) =>
    set((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === id && c.unread ? { ...c, unread: 0 } : c)) })),
  resetDemo: () => socialStore.reset(),
};
