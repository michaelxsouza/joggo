import { COMPETITIONS, dayKey, isLive, todayKey, useMatches } from '@/services/matchesService';
import { MatchRow } from '@/pages/MatchesPage';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { sel, useSocial } from '@/services/socialService';
import { Avatar, SectionCard } from '@/components/ui/misc';
import { FollowButton, JoinButton } from '@/components/social/Buttons';
import { AdSlot } from '@/components/ads/AdUnits';
import { compact } from '@/lib/utils';
import { ResponsibleNote } from './Navigation';

export function SearchBox({ autoFocus, initial = '' }: { autoFocus?: boolean; initial?: string }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/explorar?q=${encodeURIComponent(q.trim())}`);
      }}
      className="relative"
    >
      <label htmlFor="rail-search" className="sr-only">
        Buscar na Joggo
      </label>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-ink-muted pointer-events-none" aria-hidden />
      <input
        id="rail-search"
        type="search"
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar pessoas, posts, comunidades"
        className="field pl-10 rounded-full h-11"
      />
    </form>
  );
}

export function RightRail() {
  const state = useSocial((s) => s);
  const me = sel.me(state);
  const featured = [...state.communities].sort((a, b) => sel.memberCount(state, b) - sel.memberCount(state, a)).slice(0, 3);
  const suggestions = state.users
    .filter((u) => u.id !== me.id && !state.followingIds.includes(u.id) && !state.blockedUserIds.includes(u.id))
    .sort((a, b) => Number(b.interests.some((i) => me.interests.includes(i))) - Number(a.interests.some((i) => me.interests.includes(i))))
    .slice(0, 3);

  return (
    <aside aria-label="Destaques" className="hidden xl:block w-[330px] shrink-0">
      <div className="sticky top-0 py-5 space-y-4 max-h-dvh overflow-y-auto scrollbar-none">
        <SearchBox />

        <TodayMatches />

        <SectionCard title="Comunidades em destaque" action={<Link to="/comunidades" className="text-sm font-semibold text-lime hover:underline">Ver todas</Link>}>
          <ul className="space-y-3">
            {featured.map((c) => (
              <li key={c.id} className="flex items-center gap-3">
                <Link to={`/comunidades/${c.slug}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                  <img src={c.cover} alt="" className="h-11 w-11 rounded-xl object-cover border border-line" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:underline">{c.name}</p>
                    <p className="text-xs text-ink-muted">{compact(sel.memberCount(state, c))} {sel.memberCount(state, c) === 1 ? "membro" : "membros"}</p>
                  </div>
                </Link>
                <JoinButton community={c} />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Quem seguir">
          {suggestions.length === 0 ? (
            <p className="text-sm text-ink-muted">Você já segue todo mundo por aqui 👀</p>
          ) : (
            <ul className="space-y-3">
              {suggestions.map((u) => (
                <li key={u.id} className="flex items-center gap-3">
                  <Link to={`/perfil/${u.handle}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                    <Avatar user={u} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate group-hover:underline">{u.name}</p>
                      <p className="text-xs text-ink-muted truncate">@{u.handle}</p>
                    </div>
                  </Link>
                  <FollowButton user={u} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <AdSlot placement="sidebar" categories={me.interests} seed={1} variant="banner" context="coluna lateral" />

        <ResponsibleNote className="px-1" />
      </div>
    </aside>
  );
}

/** Até 5 jogos de hoje (ao vivo primeiro). */
function TodayMatches() {
  const { matches } = useMatches();
  const today = todayKey();
  const list = (matches ?? [])
    .filter((m) => dayKey(m.date) === today)
    .sort((a, b) => Number(isLive(b.status)) - Number(isLive(a.status)) || (COMPETITIONS[a.competitionCode]?.order ?? 99) - (COMPETITIONS[b.competitionCode]?.order ?? 99) || a.date.getTime() - b.date.getTime())
    .slice(0, 5);
  if (!list.length) return null;
  return (
    <SectionCard title="Jogos de hoje" action={<Link to="/jogos" className="text-sm font-semibold text-lime hover:underline">Ver todos</Link>}>
      <ul className="divide-y divide-line -my-2">
        {list.map((m) => (
          <MatchRow key={m.id} m={m} compact />
        ))}
      </ul>
    </SectionCard>
  );
}
