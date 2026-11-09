import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { useAds } from '@/services/adsService';
import { PLACEMENTS, PRICING_LABEL, placementLabel } from '@/types/ads';
import { categoryLabel } from '@/types/social';
import { IconButton } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/misc';
import { PageHeader } from '@/components/layout/AppShell';
import { AdView } from '@/components/ads/AdUnits';
import { BudgetBar, HBars, MetricTiles, SimulationNotice, StatusBadge, ctr } from '@/components/ads/AdsShared';
import { CampaignActions } from '@/components/ads/CampaignActions';
import { brl, compact, fmtDate, pct, timeAgo } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import NotFound from '../NotFound';

export default function CampaignReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const c = useAds((s) => s.campaigns.find((x) => x.id === id));
  const advertiser = useAds((s) => s.advertisers.find((a) => a.id === c?.advertiserId));
  const pricing = useAds((s) => s.pricing);
  useDocumentTitle(c ? `Relatório: ${c.name}` : 'Relatório');
  if (!c || !advertiser) return <NotFound what="Campanha" />;

  const rows = PLACEMENTS.filter((p) => c.placements.includes(p.id)).map((p) => {
    const m = c.metrics.byPlacement[p.id] ?? { impressions: 0, clicks: 0, spent: 0 };
    return { placement: p.id, ...m };
  });

  return (
    <div className="max-w-[980px]">
      <PageHeader
        title={c.name}
        subtitle={`${advertiser.name} · ${fmtDate(c.startDate)} – ${fmtDate(c.endDate)}`}
        back={
          <IconButton label="Voltar ao painel" onClick={() => navigate('/anunciar')}>
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        }
      />
      <div className="px-3 lg:px-0 space-y-4">
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <StatusBadge status={c.status} />
          <span className="text-sm text-ink-muted">Atualizada {timeAgo(c.updatedAt)}</span>
          <div className="ml-auto">
            <CampaignActions c={c} showReport={false} />
          </div>
        </div>
        {c.status === 'rejeitada' && c.rejectionReason && (
          <div className="flex gap-2 rounded-xl bg-danger/5 border border-danger/25 p-3.5 text-sm">
            <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
            <p>
              <strong className="text-danger">Motivo da rejeição:</strong> <span className="text-ink-muted">{c.rejectionReason}</span>
            </p>
          </div>
        )}
        {c.endedReason && c.status === 'encerrada' && <p className="text-sm text-ink-muted">{c.endedReason}</p>}

        <SimulationNotice />
        <MetricTiles impressions={c.metrics.impressions} clicks={c.metrics.clicks} spent={c.metrics.spent} budget={c.budget} />
        <div className="card p-4">
          <p className="text-sm font-semibold mb-2">Orçamento consumido</p>
          <BudgetBar c={c} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Impressões por posicionamento">
            {rows.every((r) => !r.impressions) ? (
              <p className="text-sm text-ink-muted">Ainda sem impressões nesta simulação.</p>
            ) : (
              <HBars rows={rows.map((r) => ({ label: placementLabel(r.placement), value: r.impressions }))} format={compact} />
            )}
          </SectionCard>
          <SectionCard title="Criativo">
            <AdView preview campaign={c} advertiserName={advertiser.name} variant="mobile" />
          </SectionCard>
        </div>

        <SectionCard title="Detalhamento">
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[560px]">
              <caption className="sr-only">Métricas simuladas por posicionamento</caption>
              <thead>
                <tr className="text-left text-ink-muted border-b border-line">
                  <th className="py-2 font-semibold">Posicionamento</th>
                  <th className="py-2 font-semibold">Modelo</th>
                  <th className="py-2 font-semibold text-right">Impressões</th>
                  <th className="py-2 font-semibold text-right">Cliques</th>
                  <th className="py-2 font-semibold text-right">CTR</th>
                  <th className="py-2 font-semibold text-right">Gasto</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {rows.map((r) => {
                  const rule = pricing.find((p) => p.placement === r.placement);
                  return (
                    <tr key={r.placement} className="border-b border-line/60">
                      <td className="py-2.5">{placementLabel(r.placement)}</td>
                      <td className="py-2.5 text-ink-muted">{rule ? `${PRICING_LABEL[rule.model]} · ${brl(rule.price)}` : '—'}</td>
                      <td className="py-2.5 text-right">{r.impressions.toLocaleString('pt-BR')}</td>
                      <td className="py-2.5 text-right">{r.clicks.toLocaleString('pt-BR')}</td>
                      <td className="py-2.5 text-right">{pct(ctr(r))}</td>
                      <td className="py-2.5 text-right">{brl(r.spent)}</td>
                    </tr>
                  );
                })}
                <tr className="font-bold">
                  <td className="py-2.5" colSpan={2}>
                    Total
                  </td>
                  <td className="py-2.5 text-right">{c.metrics.impressions.toLocaleString('pt-BR')}</td>
                  <td className="py-2.5 text-right">{c.metrics.clicks.toLocaleString('pt-BR')}</td>
                  <td className="py-2.5 text-right">{pct(ctr(c.metrics))}</td>
                  <td className="py-2.5 text-right">{brl(c.metrics.spent)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
            <div>
              <dt className="text-ink-muted">Categorias</dt>
              <dd>{c.categories.map(categoryLabel).join(', ')}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Destino</dt>
              <dd className="truncate">
                <a href={c.destinationUrl} target="_blank" rel="noopener noreferrer" className="text-lime hover:underline inline-flex items-center gap-1">
                  {c.destinationUrl} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </dd>
            </div>
            {c.isGambling && (
              <div className="sm:col-span-2">
                <dt className="text-ink-muted">Elegibilidade (apostas)</dt>
                <dd>
                  {c.eligibility?.licenseInfo} · Territórios: {c.eligibility?.territories} · Público 18+: {c.eligibility?.adultAudienceConfirmed ? 'confirmado' : 'não confirmado'}
                </dd>
              </div>
            )}
          </dl>
        </SectionCard>
      </div>
    </div>
  );
}
