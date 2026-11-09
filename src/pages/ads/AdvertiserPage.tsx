import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Megaphone, Plus } from 'lucide-react';
import { ads, useAds } from '@/services/adsService';
import { STATUS_LABEL, placementLabel, type CampaignStatus } from '@/types/ads';
import { Chip, EmptyState } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/Field';
import { PageHeader } from '@/components/layout/AppShell';
import { BudgetBar, MetricTiles, SimulationNotice, StatusBadge, ctr } from '@/components/ads/AdsShared';
import { CampaignActions } from '@/components/ads/CampaignActions';
import { compact, fmtDate, pct } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';

const FILTERS: (CampaignStatus | 'todas')[] = ['todas', 'rascunho', 'em_analise', 'aprovada', 'ativa', 'pausada', 'encerrada', 'rejeitada'];

export default function AdvertiserPage() {
  useDocumentTitle('Anunciar na Joggo');
  const state = useAds((s) => s);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<CampaignStatus | 'todas'>('todas');
  const advertiser = state.advertisers.find((a) => a.id === state.currentAdvertiserId)!;
  const mine = state.campaigns.filter((c) => c.advertiserId === advertiser.id);
  const list = mine.filter((c) => filter === 'todas' || c.status === filter);
  const totals = mine.reduce(
    (a, c) => ({ impressions: a.impressions + c.metrics.impressions, clicks: a.clicks + c.metrics.clicks, spent: a.spent + c.metrics.spent }),
    { impressions: 0, clicks: 0, spent: 0 },
  );
  const active = mine.filter((c) => c.status === 'ativa').length;

  return (
    <div className="max-w-[980px]">
      <PageHeader
        title="Anunciar na Joggo"
        subtitle="Painel do anunciante"
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/anunciar/nova')}>
            <span className="hidden sm:inline">Nova campanha</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        }
      />
      <div className="px-3 lg:px-0 space-y-5">
        <SimulationNotice />

        <div className="card p-4 flex flex-col sm:flex-row sm:items-end gap-3">
          <SelectField label="Conta de anunciante (demonstração)" className="sm:w-80" value={advertiser.id} onChange={(e) => ads.setCurrentAdvertiser(e.target.value)}>
            {state.advertisers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.segment}
              </option>
            ))}
          </SelectField>
          <div className="text-sm text-ink-muted sm:pb-2.5">
            Status da conta:{' '}
            <strong className={advertiser.status === 'verificado' ? 'text-lime' : advertiser.status === 'pendente' ? 'text-warn' : 'text-danger'}>{advertiser.status}</strong>
            {advertiser.gamblingOperator && <span className="ml-2 text-warn">· operador de apostas (revisão de elegibilidade)</span>}
          </div>
        </div>

        <section aria-labelledby="ov">
          <h2 id="ov" className="font-bold mb-3">
            Visão geral · {mine.length} campanha(s), {active} ativa(s)
          </h2>
          <MetricTiles {...totals} />
        </section>

        <section aria-labelledby="cl">
          <h2 id="cl" className="font-bold mb-3">
            Campanhas
          </h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3" role="group" aria-label="Filtrar por status">
            {FILTERS.map((f) => {
              const n = f === 'todas' ? mine.length : mine.filter((c) => c.status === f).length;
              return (
                <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                  {f === 'todas' ? 'Todas' : STATUS_LABEL[f]} <span className="opacity-60">{n}</span>
                </Chip>
              );
            })}
          </div>

          {list.length === 0 ? (
            <EmptyState icon={<Megaphone className="h-6 w-6" />} title="Nenhuma campanha aqui" action={<Button onClick={() => navigate('/anunciar/nova')}>Criar campanha</Button>}>
              {filter === 'todas' ? 'Crie sua primeira campanha para alcançar jogadores por categoria de interesse.' : 'Não há campanhas com este status.'}
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {list.map((c) => (
                <li key={c.id} className="card p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <Link to={`/anunciar/${c.id}`} className="flex gap-3 flex-1 min-w-0 group">
                      <div className="h-16 w-24 rounded-xl overflow-hidden bg-surface border border-line shrink-0">
                        {c.image ? <img src={c.image} alt="" className="h-full w-full object-cover" /> : <div className="h-full flex items-center justify-center text-[10px] text-ink-faint">Sem imagem</div>}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold truncate group-hover:underline">{c.name}</p>
                          <StatusBadge status={c.status} />
                          {c.isGambling && <span className="text-[11px] font-bold text-warn">APOSTAS · 18+</span>}
                        </div>
                        <p className="text-sm text-ink-muted mt-0.5">
                          {fmtDate(c.startDate)} – {fmtDate(c.endDate)} · {c.placements.map(placementLabel).join(', ')}
                        </p>
                        <p className="text-sm text-ink-muted tabular-nums">
                          {compact(c.metrics.impressions)} impressões · {compact(c.metrics.clicks)} cliques · CTR {pct(ctr(c.metrics))}
                        </p>
                      </div>
                    </Link>
                    <div className="sm:w-44 shrink-0">
                      <BudgetBar c={c} />
                    </div>
                    <CampaignActions c={c} />
                  </div>
                  {c.status === 'rejeitada' && c.rejectionReason && (
                    <div className="mt-3 flex gap-2 rounded-xl bg-danger/5 border border-danger/25 p-3 text-sm">
                      <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                      <p>
                        <strong className="text-danger">Motivo da rejeição:</strong> <span className="text-ink-muted">{c.rejectionReason}</span>
                      </p>
                    </div>
                  )}
                  {c.status === 'encerrada' && c.endedReason && <p className="mt-2 text-xs text-ink-faint">{c.endedReason}</p>}
                  {c.status === 'em_analise' && <p className="mt-2 text-xs text-warn">Aguardando revisão da equipe Joggo{c.isGambling ? ' (inclui revisão de elegibilidade para apostas)' : ''}.</p>}
                  {c.status === 'aprovada' && <p className="mt-2 text-xs text-info">Aprovada. Inicie a veiculação simulada quando quiser.</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
