import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Ban, CheckCircle2, Flag, MessageSquare, RotateCcw, ShieldCheck, Ticket, Trash2, User as UserIcon, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/AppShell';
import { Avatar, EmptyState } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useUI } from '@/app/UIContext';
import { sel, useSocial } from '@/services/socialService';
import { fetchBanned, fetchQueue, moderation, type BannedUser, type ReportGroup } from '@/services/moderationService';
import { cn, timeAgo } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';

type Tab = 'abertas' | 'fechadas' | 'suspensos';
const TARGET_LABEL = { post: 'Publicação', comment: 'Comentário', user: 'Perfil', ad: 'Anúncio' } as const;
const TARGET_ICON = { post: Flag, comment: MessageSquare, user: UserIcon, ad: Flag } as const;

export default function ModerationPage() {
  useDocumentTitle('Moderação');
  const isMod = useSocial(sel.isModerator);
  const [tab, setTab] = useState<Tab>('abertas');
  const [groups, setGroups] = useState<ReportGroup[] | null>(null);
  const [banned, setBanned] = useState<BannedUser[] | null>(null);
  const [error, setError] = useState<string>();
  const [banTarget, setBanTarget] = useState<{ id: string; name: string; group?: ReportGroup } | null>(null);
  const toast = useToast();
  const ui = useUI();

  const load = useCallback(async () => {
    setError(undefined);
    try {
      if (tab === 'suspensos') setBanned(await fetchBanned());
      else setGroups(await fetchQueue(tab === 'abertas' ? 'aberta' : 'fechadas'));
    } catch {
      setError('Não foi possível carregar. Tente novamente.');
    }
  }, [tab]);

  useEffect(() => {
    setGroups(null);
    setBanned(null);
    void load();
  }, [load]);

  if (!isMod) return <Navigate to="/" replace />;

  const act = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      void load();
    } catch (e) {
      toast.error((e as Error).message || 'Não foi possível concluir a ação.');
    }
  };

  return (
    <div>
      <PageHeader title="Moderação" subtitle="Denúncias da comunidade e contas suspensas" />
      <div className="grid grid-cols-3 border-b border-line mb-4" role="tablist">
        {(
          [
            ['abertas', 'Abertas'],
            ['fechadas', 'Resolvidas'],
            ['suspensos', 'Suspensos'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn('h-11 text-sm font-bold border-b-2 -mb-px', tab === id ? 'border-lime text-ink' : 'border-transparent text-ink-muted hover:text-ink')}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="card p-4 text-center">
          <p className="text-ink-muted">{error}</p>
          <Button size="sm" className="mt-3" onClick={() => void load()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {tab !== 'suspensos' &&
        !error &&
        (groups == null ? (
          <p className="text-center text-ink-faint py-10">Carregando…</p>
        ) : groups.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="h-6 w-6" />} title={tab === 'abertas' ? 'Nenhuma denúncia aberta' : 'Nada por aqui ainda'}>
            {tab === 'abertas' ? 'A comunidade está tranquila. 👌' : 'Denúncias resolvidas ou descartadas aparecem aqui.'}
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {groups.map((g) => (
              <ReportCard
                key={g.key}
                g={g}
                open={tab === 'abertas'}
                onDelete={() =>
                  ui.confirm({
                    title: `Apagar ${TARGET_LABEL[g.target].toLowerCase()}?`,
                    message: 'O conteúdo será removido para todos e as denúncias marcadas como resolvidas.',
                    confirmLabel: 'Apagar',
                    danger: true,
                    onConfirm: () => void act(() => moderation.deleteContent(g), 'Conteúdo apagado.'),
                  })
                }
                onBan={(id, name) => setBanTarget({ id, name, group: g })}
                onResolve={(s) => void act(() => moderation.resolve(g, s), s === 'resolvida' ? 'Marcada como resolvida.' : 'Denúncia descartada.')}
              />
            ))}
          </ul>
        ))}

      {tab === 'suspensos' &&
        !error &&
        (banned == null ? (
          <p className="text-center text-ink-faint py-10">Carregando…</p>
        ) : banned.length === 0 ? (
          <EmptyState icon={<Ban className="h-6 w-6" />} title="Nenhuma conta suspensa">
            Contas suspensas não conseguem publicar, comentar, curtir ou mandar mensagens.
          </EmptyState>
        ) : (
          <ul className="card divide-y divide-line">
            {banned.map((u) => (
              <li key={u.id} className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <Link to={`/perfil/${u.handle}`} className="font-bold hover:underline">
                    {u.name}
                  </Link>{' '}
                  <span className="text-ink-muted text-sm">@{u.handle}</span>
                  <p className="text-sm text-ink-muted">
                    Suspenso {timeAgo(u.bannedAt)}
                    {u.reason && ` · ${u.reason}`}
                  </p>
                </div>
                <Button size="sm" variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={() => void act(() => moderation.setBan(u.id, false), `@${u.handle} foi reativado.`)}>
                  Reativar
                </Button>
              </li>
            ))}
          </ul>
        ))}

      {banTarget && (
        <BanModal
          name={banTarget.name}
          onClose={() => setBanTarget(null)}
          onConfirm={(reason) => {
            const t = banTarget;
            setBanTarget(null);
            void act(async () => {
              await moderation.setBan(t.id, true, reason);
              if (t.group) await moderation.resolve(t.group, 'resolvida');
            }, `${t.name} foi suspenso(a).`);
          }}
        />
      )}
    </div>
  );
}

function ReportCard({
  g,
  open,
  onDelete,
  onBan,
  onResolve,
}: {
  g: ReportGroup;
  open: boolean;
  onDelete: () => void;
  onBan: (id: string, name: string) => void;
  onResolve: (s: 'resolvida' | 'descartada') => void;
}) {
  const state = useSocial((s) => s);
  const author = g.authorId ? sel.user(state, g.authorId) : undefined;
  const Icon = TARGET_ICON[g.target];
  const status = g.reports[0]?.status;

  return (
    <li className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
          <Icon className="h-4 w-4" aria-hidden /> {TARGET_LABEL[g.target]}
        </span>
        <span className="flex items-center gap-2 text-xs">
          {!open && (
            <span className={cn('rounded-full border px-2 py-0.5 font-bold', status === 'resolvida' ? 'text-lime border-lime/30' : 'text-ink-muted border-line')}>
              {status === 'resolvida' ? 'Resolvida' : 'Descartada'}
            </span>
          )}
          <span className={cn('rounded-full px-2 py-0.5 font-bold', g.reports.length > 1 ? 'bg-danger/15 text-danger' : 'bg-surface text-ink-muted')}>
            {g.reports.length} {g.reports.length === 1 ? 'denúncia' : 'denúncias'}
          </span>
        </span>
      </div>

      {author && (
        <Link to={`/perfil/${author.handle}`} className="mt-3 flex items-center gap-2 group">
          <Avatar user={author} size="sm" />
          <span className="font-bold group-hover:underline">{author.name}</span>
          <span className="text-sm text-ink-muted">@{author.handle}</span>
          {author.banned && <span className="text-[10px] font-bold uppercase text-danger border border-danger/40 rounded-full px-1.5">Suspenso</span>}
        </Link>
      )}

      <div className="mt-3 rounded-xl border border-line bg-surface p-3 text-[15px]">
        {g.missing ? (
          <p className="text-ink-faint italic">Conteúdo já foi apagado.</p>
        ) : g.post ? (
          <>
            {g.post.kind === 'bilhete' && (
              <p className="text-sm mb-1 inline-flex items-center gap-1.5 text-ink-muted">
                <Ticket className="h-4 w-4" /> Bilhete: <strong className="text-ink">{g.post.betPick}</strong> @ {g.post.betOdd?.toFixed(2).replace('.', ',')} · {g.post.betResult}
              </p>
            )}
            {g.post.text && <p className="whitespace-pre-wrap break-words">{g.post.text}</p>}
            {g.post.images.length > 0 && (
              <div className="mt-2 flex gap-2">
                {g.post.images.map((src) => (
                  <img key={src} src={src} alt="" className="h-20 w-20 rounded-lg object-cover border border-line" />
                ))}
              </div>
            )}
            <Link to={`/post/${g.targetId}`} className="text-xs text-lime hover:underline mt-2 inline-block">
              Abrir publicação
            </Link>
          </>
        ) : g.comment ? (
          <>
            <p className="whitespace-pre-wrap break-words">{g.comment.text}</p>
            <Link to={`/post/${g.comment.postId}`} className="text-xs text-lime hover:underline mt-2 inline-block">
              Ver no post
            </Link>
          </>
        ) : (
          <p className="text-ink-muted">Denúncia sobre o perfil de {author ? `@${author.handle}` : 'um usuário'}.</p>
        )}
      </div>

      <ul className="mt-3 space-y-1.5">
        {g.reports.map((r) => {
          const reporter = sel.user(state, r.reporterId);
          return (
            <li key={r.id} className="text-sm">
              <span className="font-semibold">{r.reason}</span>
              {r.details && <span className="text-ink-muted"> — {r.details}</span>}
              <span className="text-ink-faint">
                {' '}
                · por @{reporter?.handle ?? 'usuário'} · {timeAgo(r.createdAt)}
              </span>
            </li>
          );
        })}
      </ul>

      {open && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(g.target === 'post' || g.target === 'comment') && !g.missing && (
            <Button size="sm" variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={onDelete}>
              Apagar
            </Button>
          )}
          {author && !author.banned && author.role !== 'admin' && author.role !== 'moderator' && (
            <Button size="sm" variant="secondary" icon={<Ban className="h-4 w-4" />} onClick={() => onBan(author.id, author.name)}>
              Suspender autor
            </Button>
          )}
          <Button size="sm" variant="secondary" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => onResolve('resolvida')}>
            Resolvida
          </Button>
          <Button size="sm" variant="ghost" icon={<XCircle className="h-4 w-4" />} onClick={() => onResolve('descartada')}>
            Descartar
          </Button>
        </div>
      )}
    </li>
  );
}

const BAN_REASONS = ['Golpe ou pedido de Pix', 'Venda de tips ou grupos pagos', 'Divulgação de casas não autorizadas', 'Assédio ou discurso de ódio', 'Spam', 'Conta falsa'];

function BanModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState(BAN_REASONS[0]!);
  return (
    <Modal
      open
      onClose={onClose}
      title={`Suspender ${name}?`}
      description="A pessoa continua conseguindo entrar, mas não pode publicar, comentar, curtir, seguir nem mandar mensagens. Os posts dela somem do feed. Você pode reativar depois."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => onConfirm(reason)}>
            Suspender
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="label">Motivo</legend>
        <div className="space-y-1.5">
          {BAN_REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="ban-reason" checked={reason === r} onChange={() => setReason(r)} className="accent-[#B0FF35]" />
              {r}
            </label>
          ))}
        </div>
      </fieldset>
    </Modal>
  );
}
