// Tipos do domínio social da Joggo.
// Mantidos independentes da UI para facilitar a troca de localStorage por uma API.

export type Category = 'esportes' | 'poker' | 'roleta' | 'slots' | 'cassino';

export type ID = string;

export interface User {
  id: ID;
  name: string;
  handle: string; // sem @
  bio: string;
  location?: string;
  avatarColor: string; // cor de fundo do avatar gerado
  avatarImage?: string; // data URL ou URL (opcional)
  coverImage?: string;
  coverColor: string;
  interests: Category[];
  joinedAt: string; // ISO
  followers: number; // seguidores (sem contar eu)
  following: number;
  founder?: boolean;
}

export interface Post {
  id: ID;
  authorId: ID;
  communityId?: ID;
  category: Category;
  text: string;
  image?: string;
  createdAt: string;
  baseLikes: number; // curtidas de outros usuários (sem contar a minha)
  kind?: 'post' | 'bilhete';
  betEvent?: string;
  betPick?: string;
  betOdd?: number;
  betResult?: BetResult;
}

export type BetResult = 'pendente' | 'green' | 'red' | 'anulado';

export interface Comment {
  id: ID;
  postId: ID;
  authorId: ID;
  text: string;
  createdAt: string;
}

export interface Community {
  id: ID;
  slug: string;
  name: string;
  category: Category;
  description: string;
  cover: string;
  rules: string[];
  baseMembers: number;
  memberIds: ID[]; // membros conhecidos (demonstração)
  createdAt: string;
}

export interface Message {
  id: ID;
  conversationId: ID;
  authorId: ID;
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: ID;
  participantId: ID; // o outro participante (o usuário atual é implícito)
  updatedAt: string;
  unread: number;
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'community' | 'system';

export interface AppNotification {
  id: ID;
  type: NotificationType;
  actorId?: ID;
  postId?: ID;
  communityId?: ID;
  text: string;
  createdAt: string;
  read: boolean;
}

export type ReportTarget = 'post' | 'user' | 'comment' | 'ad';

export interface Report {
  id: ID;
  target: ReportTarget;
  targetId: ID;
  reason: string;
  details?: string;
  createdAt: string;
}

export interface NotificationPrefs {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  communities: boolean;
  emailDigest: boolean;
}

/** Estado social persistido localmente (por navegador). */
export interface SocialState {
  version: number;
  currentUserId: ID;
  users: User[];
  posts: Post[];
  comments: Comment[];
  communities: Community[];
  likedPostIds: ID[];
  savedPostIds: ID[];
  hiddenPostIds: ID[];
  followingIds: ID[];
  joinedCommunityIds: ID[];
  blockedUserIds: ID[];
  reports: Report[];
  conversations: Conversation[];
  messages: Message[];
  notifications: AppNotification[];
  notificationPrefs: NotificationPrefs;
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'esportes', label: 'Esportes' },
  { id: 'poker', label: 'Poker' },
  { id: 'roleta', label: 'Roleta' },
  { id: 'slots', label: 'Slots' },
  { id: 'cassino', label: 'Cassino' },
];

export const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.id === c)?.label ?? c;
