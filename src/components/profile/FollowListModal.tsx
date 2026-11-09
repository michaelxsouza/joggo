import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/misc';
import { FollowButton } from '@/components/social/Buttons';
import { sel, useSocial } from '@/services/socialService';
import type { User } from '@/types/social';
import { cn } from '@/lib/utils';

export type FollowTab = 'seguidores' | 'seguindo';

/** Lista de seguidores / seguindo, como no Instagram. */
export function FollowListModal({ user, open, initialTab, onClose }: { user: User; open: boolean; initialTab: FollowTab; onClose: () => void }) {
  const [tab, setTab] = useState<FollowTab>(initialTab);
  const [q, setQ] = useState('');
  const state = useSocial((s) => s);
  const meId = state.currentUserId;
  const followers = sel.followersOf(state, user.id);
  const following = sel.followingOf(state, user.id);
  const followsMe = new Set(sel.followersOf(state, meId).map((u) => u.id));

  const list = (tab === 'seguidores' ? followers : following).filter((u) => {
    const t = q.trim().toLowerCase();
    return !t || u.name.toLowerCase().includes(t) || u.handle.toLowerCase().includes(t);
  });
  const isMe = user.id === meId;

  return (
    <Modal open={open} onClose={onClose} title={`@${user.handle}`} size="sm">
      <div className="grid grid-cols-2 border-b border-line -mx-1 mb-3" role="tablist">
        {(
          [
            ['seguidores', `${followers.length} ${followers.length === 1 ? 'seguidor' : 'seguidores'}`],
            ['seguindo', `${following.length} seguindo`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn('h-11 text-sm font-bold border-b-2 -mb-px', tab === id ? 'border-lime text-ink' : 'border-transparent text-ink-muted hover:text-ink')}
          >
            {label}
          </button>
        ))}
      </div>

      {(followers.length > 6 || following.length > 6) && (
        <label className="relative block mb-3">
          <span className="sr-only">Buscar</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" aria-hidden />
          <input className="field pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" />
        </label>
      )}

      {list.length === 0 ? (
        <div className="py-10 text-center text-ink-muted">
          <Users className="h-8 w-8 mx-auto mb-2 text-ink-faint" aria-hidden />
          {q
            ? 'Ninguém encontrado.'
            : tab === 'seguidores'
              ? isMe
                ? 'Você ainda não tem seguidores. Publique e participe das comunidades para ser encontrado.'
                : `@${user.handle} ainda não tem seguidores.`
              : isMe
                ? 'Você ainda não segue ninguém. Explore as comunidades para encontrar pessoas.'
                : `@${user.handle} ainda não segue ninguém.`}
        </div>
      ) : (
        <ul className="-mx-2 max-h-[60vh] overflow-y-auto">
          {list.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface">
              <Link to={`/perfil/${u.handle}`} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0 group">
                <Avatar user={u} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold truncate group-hover:underline">{u.name}</span>
                    {u.founder && <span className="rounded-full bg-lime/15 text-lime border border-lime/30 px-1.5 py-px text-[10px] font-bold uppercase">Fundador</span>}
                  </span>
                  <span className="block text-sm text-ink-muted truncate">
                    @{u.handle}
                    {u.id !== meId && followsMe.has(u.id) && <span className="ml-1.5 text-xs text-ink-faint">· Segue você</span>}
                  </span>
                </span>
              </Link>
              {u.id === meId ? <span className="text-sm text-ink-muted px-2">Você</span> : <FollowButton user={u} />}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
