import { Lock, Ticket } from 'lucide-react';
import { sel, useSocial } from '@/services/socialService';
import type { ID } from '@/types/social';
import { cn } from '@/lib/utils';

/** Mínimo de bilhetes resolvidos para exibir a taxa de acerto nos posts. */
export const MIN_RESOLVED_FOR_BADGE = 3;

/** Histórico de bilhetes no perfil: greens, reds, pendentes e taxa de acerto. */
export function TipsterStatsCard({ userId, isMe }: { userId: ID; isMe: boolean }) {
  const t = useSocial((s) => sel.tipster(s, userId));

  if (!t.total)
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-line p-4 text-sm text-ink-muted flex items-center gap-3">
        <Ticket className="h-5 w-5 text-ink-faint shrink-0" aria-hidden />
        {isMe ? 'Poste seu primeiro bilhete para começar seu histórico de acertos.' : 'Ainda não publicou bilhetes.'}
      </div>
    );

  const greenPct = t.resolved ? (t.greens / t.resolved) * 100 : 0;
  return (
    <section className="mt-4 rounded-2xl border border-line bg-surface p-4" aria-label="Histórico de bilhetes">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted inline-flex items-center gap-1.5">
          <Ticket className="h-4 w-4" aria-hidden /> Histórico de bilhetes
        </h2>
        <span className="text-[11px] text-ink-faint inline-flex items-center gap-1" title="Resultados não podem ser editados nem apagados">
          <Lock className="h-3 w-3" aria-hidden /> Histórico travado
        </span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <Stat value={t.rate != null ? `${t.rate}%` : '—'} label="Acerto" highlight />
        <Stat value={t.greens} label="Greens" cls="text-lime" />
        <Stat value={t.reds} label="Reds" cls="text-danger" />
        <Stat value={t.pendentes} label="Pendentes" />
      </div>
      {t.resolved > 0 && (
        <div className="mt-3 h-1.5 rounded-full bg-danger/40 overflow-hidden" aria-hidden>
          <div className="h-full bg-lime" style={{ width: `${greenPct}%` }} />
        </div>
      )}
    </section>
  );
}

function Stat({ value, label, cls, highlight }: { value: number | string; label: string; cls?: string; highlight?: boolean }) {
  return (
    <div className={cn('rounded-xl py-2', highlight && 'bg-lime/10 border border-lime/25')}>
      <div className={cn('text-xl font-extrabold tabular-nums', highlight && 'text-lime', cls)}>{value}</div>
      <div className="text-[11px] text-ink-muted">{label}</div>
    </div>
  );
}

/** Selo pequeno ao lado do nome nos posts, ex.: "75% · 12G 4R". */
export function TipsterBadge({ userId }: { userId: ID }) {
  const t = useSocial((s) => sel.tipster(s, userId));
  if (t.rate == null || t.resolved < MIN_RESOLVED_FOR_BADGE) return null;
  return (
    <span
      className={cn('rounded-full border px-1.5 py-px text-[10px] font-bold tabular-nums', t.rate >= 60 ? 'bg-lime/10 text-lime border-lime/30' : 'bg-surface text-ink-muted border-line')}
      title={`${t.greens} greens e ${t.reds} reds em ${t.resolved} bilhetes`}
    >
      {t.rate}% acerto
    </span>
  );
}
