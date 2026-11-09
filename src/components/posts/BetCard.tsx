import { CheckCircle2, CircleSlash, Clock, Ticket, XCircle } from 'lucide-react';
import type { BetResult, Post } from '@/types/social';
import { social } from '@/services/socialService';
import { useUI } from '@/app/UIContext';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const STATUS: Record<BetResult, { label: string; icon: typeof Clock; cls: string }> = {
  pendente: { label: 'Pendente', icon: Clock, cls: 'bg-warn/15 text-warn border-warn/30' },
  green: { label: 'Green', icon: CheckCircle2, cls: 'bg-lime/15 text-lime border-lime/40' },
  red: { label: 'Red', icon: XCircle, cls: 'bg-danger/15 text-danger border-danger/40' },
  anulado: { label: 'Anulado', icon: CircleSlash, cls: 'bg-surface text-ink-muted border-line' },
};

export const formatOdd = (n?: number) => (n != null ? n.toFixed(2).replace('.', ',') : '');

/** Cartão do bilhete: evento, palpite, odd e resultado. O autor marca o resultado uma única vez. */
export function BetCard({ post, isMine }: { post: Post; isMine: boolean }) {
  const ui = useUI();
  const toast = useToast();
  const status = STATUS[post.betResult ?? 'pendente'];
  const Icon = status.icon;

  const mark = (r: Exclude<BetResult, 'pendente'>) =>
    ui.confirm({
      title: `Marcar como ${STATUS[r].label}?`,
      message: 'O resultado não pode ser alterado depois. Seja honesto: a comunidade confia no seu histórico.',
      confirmLabel: `Confirmar ${STATUS[r].label}`,
      danger: r === 'red',
      onConfirm: () => {
        try {
          social.setBetResult(post.id, r);
          toast.success(r === 'green' ? 'Green! 💚' : `Bilhete marcado como ${STATUS[r].label}.`);
        } catch (e) {
          toast.error((e as Error).message);
        }
      },
    });

  return (
    <div className={cn('mt-3 rounded-2xl border p-4', post.betResult === 'green' ? 'border-lime/40 bg-lime/5' : post.betResult === 'red' ? 'border-danger/30 bg-danger/5' : 'border-line bg-surface')}>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
          <Ticket className="h-4 w-4" aria-hidden /> Bilhete
        </span>
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold', status.cls)}>
          <Icon className="h-3.5 w-3.5" aria-hidden /> {status.label}
        </span>
      </div>
      {post.betEvent && <p className="mt-2 text-sm text-ink-muted">{post.betEvent}</p>}
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-[17px] font-bold leading-snug break-words">{post.betPick}</p>
        <p className="shrink-0 text-right">
          <span className="block text-[11px] text-ink-faint uppercase">Odd</span>
          <span className="text-xl font-extrabold tabular-nums text-lime">{formatOdd(post.betOdd)}</span>
        </p>
      </div>
      {isMine && post.betResult === 'pendente' && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button type="button" onClick={() => mark('green')} className="h-9 rounded-xl border border-lime/40 text-lime text-sm font-bold hover:bg-lime/10">
            Deu green
          </button>
          <button type="button" onClick={() => mark('red')} className="h-9 rounded-xl border border-danger/40 text-danger text-sm font-bold hover:bg-danger/10">
            Deu red
          </button>
          <button type="button" onClick={() => mark('anulado')} className="h-9 rounded-xl border border-line text-ink-muted text-sm font-bold hover:bg-surface">
            Anulado
          </button>
        </div>
      )}
    </div>
  );
}
