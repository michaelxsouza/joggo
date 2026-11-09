import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { Community } from '@/types/social';
import { categoryLabel } from '@/types/social';
import { sel, useSocial } from '@/services/socialService';
import { JoinButton } from '@/components/social/Buttons';
import { compact } from '@/lib/utils';

export function CommunityCard({ community: c }: { community: Community }) {
  const members = useSocial((s) => sel.memberCount(s, c));
  const joined = useSocial((s) => s.joinedCommunityIds.includes(c.id));
  return (
    <article className="card overflow-hidden flex flex-col group hover:border-ink-faint/50 transition-colors">
      <Link to={`/comunidades/${c.slug}`} className="block relative" aria-label={`Abrir ${c.name}`}>
        <img src={c.cover} alt="" className="h-28 w-full object-cover" loading="lazy" />
        {joined && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-lime text-lime-ink text-[11px] font-extrabold px-2 py-1">
            <Check className="h-3 w-3" strokeWidth={3} /> Você participa
          </span>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-ink-muted font-semibold">
          <span>{categoryLabel(c.category)}</span>
          <span aria-hidden>·</span>
          <span>{compact(members)} membros</span>
        </div>
        <Link to={`/comunidades/${c.slug}`} className="font-bold text-[17px] mt-1 hover:underline">
          {c.name}
        </Link>
        <p className="text-sm text-ink-muted mt-1 line-clamp-2 flex-1">{c.description}</p>
        <div className="mt-3">
          <JoinButton community={c} block />
        </div>
      </div>
    </article>
  );
}
