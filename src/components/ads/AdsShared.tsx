import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import type { Campaign, CampaignStatus } from '@/types/ads';
import { STATUS_LABEL } from '@/types/ads';
import { Badge } from '@/components/ui/misc';
import { brl, cn, compact, pct } from '@/lib/utils';

const TONE: Record<CampaignStatus, 'neutral' | 'lime' | 'warn' | 'danger' | 'info'> = {
  rascunho: 'neutral',
  em_analise: 'warn',
  aprovada: 'info',
  ativa: 'lime',
  pausada: 'neutral',
  encerrada: 'neutral',
  rejeitada: 'danger',
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <Badge tone={TONE[status]}>
      {status === 'ativa' && <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden />}
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function SimulationNotice({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl border border-info/25 bg-info/5 px-3.5 py-2.5 text-sm text-ink-muted', className)}>
      <Info className="h-4 w-4 text-info shrink-0 mt-0.5" aria-hidden />
      <p>
        {children ?? (
          <>
            <strong className="text-ink">Demonstração.</strong> Métricas e valores são simulados neste navegador. Nenhuma campanha é veiculada de verdade e nenhuma cobrança é realizada — o orçamento funciona apenas como limite da simulação.
          </>
        )}
      </p>
    </div>
  );
}

/** Bloco de número em destaque (stat tile). */
export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-ink-muted">{label}</p>
      <p className="text-2xl font-extrabold tracking-tight mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-ink-faint mt-0.5">{sub}</p>}
    </div>
  );
}

export const ctr = (c: { impressions: number; clicks: number }) => (c.impressions ? c.clicks / c.impressions : 0);

export function MetricTiles({ impressions, clicks, spent, budget }: { impressions: number; clicks: number; spent: number; budget?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatTile label="Impressões (simuladas)" value={compact(impressions)} />
      <StatTile label="Cliques (simulados)" value={compact(clicks)} />
      <StatTile label="CTR" value={pct(ctr({ impressions, clicks }))} />
      <StatTile label="Gasto simulado" value={brl(spent)} sub={budget !== undefined ? `de ${brl(budget)} de orçamento` : undefined} />
    </div>
  );
}

export function BudgetBar({ c }: { c: Pick<Campaign, 'budget' | 'metrics'> }) {
  const ratio = Math.min(1, c.budget ? c.metrics.spent / c.budget : 0);
  return (
    <div>
      <div className="h-1.5 rounded-full bg-surface overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)} aria-label="Orçamento consumido na simulação">
        <div className={cn('h-full rounded-full', ratio >= 1 ? 'bg-warn' : 'bg-lime/80')} style={{ width: `${ratio * 100}%` }} />
      </div>
      <p className="text-[11px] text-ink-faint mt-1 tabular-nums">
        {brl(c.metrics.spent)} / {brl(c.budget)}
      </p>
    </div>
  );
}

/** Barras horizontais de série única (sem legenda; o título nomeia a medida). */
export function HBars({ rows, format }: { rows: { label: string; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[120px_1fr_auto] sm:grid-cols-[160px_1fr_auto] items-center gap-3 text-sm" title={`${r.label}: ${format(r.value)}`}>
          <span className="text-ink-muted truncate">{r.label}</span>
          <span className="h-3 rounded-r bg-surface">
            <span className="block h-full rounded-r bg-lime/70" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="tabular-nums font-semibold">{format(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}
