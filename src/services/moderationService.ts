// Moderação: fila de denúncias e ações (apenas admin/moderador — o banco confere via RLS e RPCs).
import { supabase } from '@/lib/supabase';
import { loadSocial } from '@/services/socialService';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ReportTarget = 'post' | 'comment' | 'user' | 'ad';
export type ReportStatus = 'aberta' | 'resolvida' | 'descartada';

export interface ReportItem {
  id: string;
  reporterId: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  createdAt: string;
}

/** Denúncias agrupadas pelo mesmo alvo (um post denunciado 3 vezes = 1 item com 3 denúncias). */
export interface ReportGroup {
  key: string;
  target: ReportTarget;
  targetId: string;
  reports: ReportItem[];
  lastAt: string;
  /** Autor do conteúdo denunciado (ou o próprio usuário denunciado). */
  authorId?: string;
  post?: { text: string; images: string[]; kind: string; betPick?: string; betOdd?: number; betResult?: string; createdAt: string };
  comment?: { text: string; postId: string; createdAt: string };
  missing?: boolean; // conteúdo já apagado
}

export interface BannedUser {
  id: string;
  name: string;
  handle: string;
  bannedAt: string;
  reason?: string;
}

export async function fetchQueue(status: 'aberta' | 'fechadas'): Promise<ReportGroup[]> {
  let q = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(300);
  q = status === 'aberta' ? q.eq('status', 'aberta') : q.neq('status', 'aberta');
  const { data, error } = await q;
  if (error) throw error;

  const groups = new Map<string, ReportGroup>();
  for (const r of (data ?? []) as any[]) {
    const key = `${r.target}:${r.target_id}`;
    const g: ReportGroup = groups.get(key) ?? { key, target: r.target, targetId: r.target_id, reports: [], lastAt: r.created_at };
    g.reports.push({ id: r.id, reporterId: r.reporter_id, reason: r.reason, details: r.details ?? undefined, status: r.status, createdAt: r.created_at });
    if (r.created_at > g.lastAt) g.lastAt = r.created_at;
    groups.set(key, g);
  }
  const list = [...groups.values()];

  const postIds = list.filter((g) => g.target === 'post').map((g) => g.targetId);
  const commentIds = list.filter((g) => g.target === 'comment').map((g) => g.targetId);
  const [posts, comments] = await Promise.all([
    postIds.length ? supabase.from('posts').select('id,author_id,text,images,image_url,kind,bet_pick,bet_odd,bet_result,created_at').in('id', postIds) : Promise.resolve({ data: [], error: null }),
    commentIds.length ? supabase.from('comments').select('id,author_id,post_id,text,created_at').in('id', commentIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (posts.error) throw posts.error;
  if (comments.error) throw comments.error;

  for (const g of list) {
    if (g.target === 'post') {
      const p = (posts.data as any[]).find((x) => x.id === g.targetId);
      if (!p) g.missing = true;
      else {
        g.authorId = p.author_id;
        g.post = {
          text: p.text,
          images: p.images?.length ? p.images : p.image_url ? [p.image_url] : [],
          kind: p.kind,
          betPick: p.bet_pick ?? undefined,
          betOdd: p.bet_odd != null ? Number(p.bet_odd) : undefined,
          betResult: p.bet_result ?? undefined,
          createdAt: p.created_at,
        };
      }
    } else if (g.target === 'comment') {
      const c = (comments.data as any[]).find((x) => x.id === g.targetId);
      if (!c) g.missing = true;
      else {
        g.authorId = c.author_id;
        g.comment = { text: c.text, postId: c.post_id, createdAt: c.created_at };
      }
    } else if (g.target === 'user') {
      g.authorId = g.targetId;
    }
  }
  // mais denunciados primeiro, depois os mais recentes
  return list.sort((a, b) => b.reports.length - a.reports.length || b.lastAt.localeCompare(a.lastAt));
}

export async function fetchBanned(): Promise<BannedUser[]> {
  const { data, error } = await supabase.from('profiles').select('id,name,handle,banned_at,ban_reason').not('banned_at', 'is', null).order('banned_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((u: any) => ({ id: u.id, name: u.name, handle: u.handle, bannedAt: u.banned_at, reason: u.ban_reason ?? undefined }));
}

export async function openReportCount(): Promise<number> {
  const { count } = await supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'aberta');
  return count ?? 0;
}

const check = (r: { error: unknown }) => {
  if (r.error) throw r.error;
};

export const moderation = {
  async resolve(g: Pick<ReportGroup, 'target' | 'targetId'>, status: 'resolvida' | 'descartada') {
    check(await supabase.rpc('mod_resolve_reports', { t: g.target, tid: g.targetId, new_status: status }));
  },
  async deleteContent(g: ReportGroup) {
    if (g.target === 'post') check(await supabase.from('posts').delete().eq('id', g.targetId));
    else if (g.target === 'comment') check(await supabase.from('comments').delete().eq('id', g.targetId));
    await moderation.resolve(g, 'resolvida');
    void loadSocial(true);
  },
  async setBan(userId: string, banned: boolean, reason?: string) {
    check(await supabase.rpc('mod_set_ban', { target: userId, banned, reason: reason ?? null }));
    void loadSocial(true);
  },
};
