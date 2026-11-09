import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardCheck, Flag, Pause, Play, ShieldAlert, XCircle } from 'lucide-react';
import { admin, ads, review, useAds } from '@/services/adsService';
import { PLACEMENTS, PRICING_LABEL, STATUS_LABEL, placementLabel, type Campaign, type CampaignStatus, type PricingModel, type ReviewChecklist } from '@/types/ads';
import { categoryLabel } from '@/types/social';
import { Badge, Chip, EmptyState, SectionCard, Toggle } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SelectField, TextArea, TextField } from '@/components/ui/Field';
import { PageHeader } from '@/components/layout/AppShell';
import { AdView } from '@/components/ads/AdUnits';
import { HBars, MetricTiles, SimulationNotice, StatusBadge, ctr } from '@/components/ads/AdsShared';
import { useToast } from '@/components/ui/Toast';
import { brl, cn, compact, fmtDate, pct, timeAgo } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';

type Tab = 'revisao' | 'campanhas' | 'anunciantes' | 'espacos' | 'relatorios' | 'denuncias';

export default function AdminPage() {
  useDocumentTitle('Administração');
  const [tab, setTab] = useState<Tab>('revisao');
  const pending = useAds((s) => s.campaigns.filter((c) => c.status === 'em_analise').length);
  const openReports = useAds((s) => s.reports.filter((r) => r.status === 'aberta').length);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'revisao', label: 'Revisão', count: pending },
    { id: 'campanhas', label: 'Campanhas' },
    { id: 'anunciantes', label: 'Anunciantes' },
    { id: 'espacos', label: 'Espaços e preços' },
    { id: 'relatorios', label: 'Relatórios' },
    { id: 'denuncias', label: 'Denúncias', count: openReports },
  ];

  return (
    <div className="max-w-[1040px]">
      <PageHeader title="Administração de anúncios" subtitle="Área restrita a administradores · demonstração sem controle de acesso" />
      <div className="px-3 lg:px-0 space-y-4">
        <SimulationNotice>
          <strong className="text-ink">Demonstração.</strong> Em produção, esta área exigirá autenticação de administrador. Decisões e métricas aqui são locais e simuladas.
        </SimulationNotice>
        <div role="tablist" aria-label="Seções administrativas" className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'h-10 px-4 rounded-xl text-sm font-semibold whitespace-nowrap border transition-colors inline-flex items-center gap-2',
                tab === t.id ? 'bg-lime/10 text-lime border-lime/30' : 'border-line text-ink-muted hover:text-ink hover:bg-surface',
              )}
            >
              {t.label}
              {!!t.count && <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-lime text-lime-ink text-[11px] font-extrabold inline-flex items-center justify-center">{t.count}</span>}
            </button>
          ))}
        </div>
        <div role="tabpanel">
          {tab === 'revisao' && <ReviewQueue />}
          {tab === 'campanhas' && <AllCampaigns />}
          {tab === 'anunciantes' && <Advertisers />}
          {tab === 'espacos' && <SlotsAndPricing />}
          {tab === 'relatorios' && <Reports />}
          {tab === 'denuncias' && <AdReports />}
        </div>
      </div>
    </div>
  );
}

// ---------- Revisão ----------
function ReviewQueue() {
  const queue = useAds((s) => s.campaigns.filter((c) => c.status === 'em_analise'));
  const advertisers = useAds((s) => s.advertisers);
  const [selected, setSelected] = useState<Campaign | null>(null);
  if (!queue.length)
    return (
      <EmptyState icon={<ClipboardCheck className="h-6 w-6" />} title="Fila de revisão vazia">
        Campanhas enviadas pelos anunciantes aparecerão aqui.
      </EmptyState>
    );
  return (
    <>
      <ul className="space-y-3">
        {queue.map((c) => {
          const adv = advertisers.find((a) => a.id === c.advertiserId)!;
          return (
            <li key={c.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold">{c.name}</p>
                  {c.isGambling && (
                    <Badge tone="warn">
                      <ShieldAlert className="h-3 w-3" /> Apostas · revisão específica
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-ink-muted">
                  {adv.name} ({adv.status}) · enviada {c.submittedAt ? timeAgo(c.submittedAt) : '—'} · {brl(c.budget)} · {fmtDate(c.startDate)}–{fmtDate(c.endDate)}
                </p>
              </div>
              <Button size="sm" onClick={() => setSelected(c)}>
                Revisar
              </Button>
            </li>
          );
        })}
      </ul>
      {selected && <ReviewModal campaign={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function ReviewModal({ campaign: c, onClose }: { campaign: Campaign; onClose: () => void }) {
  const adv = useAds((s) => s.advertisers.find((a) => a.id === c.advertiserId)!);
  const toast = useToast();
  const [check, setCheck] = useState<ReviewChecklist>({ advertiserEligibility: false, adultAudience: false, territoryRules: false, noProfitPromises: false });
  const [mode, setMode] = useState<'review' | 'reject'>('review');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string>();

  const items: { key: keyof ReviewChecklist; label: string; gamblingOnly?: boolean }[] = [
    { key: 'noProfitPromises', label: 'O conteúdo não promete ganhos, lucro ou resultado garantido e está claramente identificado como publicidade.' },
    { key: 'advertiserEligibility', label: 'Elegibilidade do anunciante verificada (autorização/licença válida para o operador).', gamblingOnly: true },
    { key: 'adultAudience', label: 'Público exclusivamente adulto (18+) e mensagem de jogo responsável presentes.', gamblingOnly: true },
    { key: 'territoryRules', label: 'Regras aplicáveis ao território de veiculação conferidas.', gamblingOnly: true },
  ];

  const approve = () => {
    const r = review.approve(c.id, check);
    if (!r.ok) return setError(r.error);
    toast.success('Campanha aprovada.');
    onClose();
  };
  const reject = () => {
    const r = review.reject(c.id, reason);
    if (!r.ok) return setError(r.error);
    toast.success('Campanha rejeitada. O anunciante verá o motivo.');
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Revisar: ${c.name}`}
      description={`${adv.name} · conta ${adv.status}`}
      size="lg"
      footer={
        mode === 'review' ? (
          <>
            <Button variant="danger" icon={<XCircle className="h-4 w-4" />} onClick={() => { setMode('reject'); setError(undefined); }}>
              Rejeitar
            </Button>
            <Button icon={<CheckCircle2 className="h-4 w-4" />} onClick={approve}>
              Aprovar
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => { setMode('review'); setError(undefined); }}>
              Voltar
            </Button>
            <Button variant="danger" onClick={reject}>
              Confirmar rejeição
            </Button>
          </>
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdView preview campaign={c} advertiserName={adv.name} variant="mobile" />
        <div className="space-y-3 text-sm">
          <dl className="space-y-1.5">
            <div><dt className="inline text-ink-muted">Posicionamentos: </dt><dd className="inline">{c.placements.map(placementLabel).join(', ')}</dd></div>
            <div><dt className="inline text-ink-muted">Categorias: </dt><dd className="inline">{c.categories.map(categoryLabel).join(', ')}</dd></div>
            <div><dt className="inline text-ink-muted">Destino: </dt><dd className="inline break-all">{c.destinationUrl}</dd></div>
            <div><dt className="inline text-ink-muted">Orçamento: </dt><dd className="inline">{brl(c.budget)}</dd></div>
            {c.isGambling && (
              <div className="rounded-xl border border-warn/30 bg-warn/5 p-3 mt-2">
                <p className="font-semibold text-warn flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" /> Anúncio de apostas</p>
                <p className="text-ink-muted mt-1">Licença informada: {c.eligibility?.licenseInfo || '—'}</p>
                <p className="text-ink-muted">Territórios: {c.eligibility?.territories || '—'}</p>
                <p className="text-ink-muted">18+ confirmado pelo anunciante: {c.eligibility?.adultAudienceConfirmed ? 'sim' : 'não'}</p>
                {adv.status !== 'verificado' && <p className="text-danger mt-1 font-semibold">Anunciante ainda não verificado — verifique na aba Anunciantes antes de aprovar.</p>}
              </div>
            )}
          </dl>
          {mode === 'review' ? (
            <fieldset className="space-y-2">
              <legend className="font-semibold mb-1">Checklist de revisão</legend>
              {items
                .filter((i) => !i.gamblingOnly || c.isGambling)
                .map((i) => (
                  <label key={i.key} className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={check[i.key]} onChange={(e) => { setCheck((x) => ({ ...x, [i.key]: e.target.checked })); setError(undefined); }} className="accent-[#B0FF35] h-4 w-4 mt-0.5" />
                    <span>{i.label}</span>
                  </label>
                ))}
            </fieldset>
          ) : (
            <TextArea label="Motivo da rejeição (visível ao anunciante)" rows={4} value={reason} onChange={(e) => { setReason(e.target.value); setError(undefined); }} data-autofocus placeholder="Explique o que precisa ser ajustado para reenviar." />
          )}
          {error && <p role="alert" className="error-text">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}

// ---------- Campanhas ----------
function AllCampaigns() {
  const state = useAds((s) => s);
  const toast = useToast();
  const [filter, setFilter] = useState<CampaignStatus | 'todas'>('todas');
  const list = state.campaigns.filter((c) => filter === 'todas' || c.status === filter);
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3" role="group" aria-label="Filtrar por status">
        {(['todas', ...Object.keys(STATUS_LABEL)] as (CampaignStatus | 'todas')[]).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f === 'todas' ? 'Todas' : STATUS_LABEL[f]}
          </Chip>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={<ClipboardCheck className="h-6 w-6" />} title="Nenhuma campanha com este status" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <caption className="sr-only">Todas as campanhas</caption>
            <thead>
              <tr className="text-left text-ink-muted border-b border-line">
                <th className="p-3 font-semibold">Campanha</th>
                <th className="p-3 font-semibold">Anunciante</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Gasto / orçamento</th>
                <th className="p-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-b border-line/60 last:border-0">
                  <td className="p-3">
                    <Link to={`/anunciar/${c.id}`} className="font-semibold hover:underline">{c.name}</Link>
                    {c.isGambling && <span className="ml-2 text-[11px] font-bold text-warn">APOSTAS</span>}
                  </td>
                  <td className="p-3 text-ink-muted">{state.advertisers.find((a) => a.id === c.advertiserId)?.name}</td>
                  <td className="p-3"><StatusBadge status={c.status} /></td>
                  <td className="p-3 text-right tabular-nums">{brl(c.metrics.spent)} / {brl(c.budget)}</td>
                  <td className="p-3 text-right">
                    {c.status === 'ativa' ? (
                      <Button size="sm" variant="secondary" icon={<Pause className="h-4 w-4" />} onClick={() => { admin.pause(c.id); toast.success(`“${c.name}” pausada.`); }}>
                        Pausar
                      </Button>
                    ) : c.status === 'pausada' ? (
                      <Button size="sm" variant="secondary" icon={<Play className="h-4 w-4" />} onClick={() => { const r = ads.start(c.id); r.ok ? toast.success('Campanha retomada.') : toast.error(r.error!); }}>
                        Retomar
                      </Button>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Anunciantes ----------
function Advertisers() {
  const state = useAds((s) => s);
  const toast = useToast();
  return (
    <ul className="space-y-3">
      {state.advertisers.map((a) => {
        const campaigns = state.campaigns.filter((c) => c.advertiserId === a.id);
        return (
          <li key={a.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold">{a.name}</p>
                <Badge tone={a.status === 'verificado' ? 'lime' : a.status === 'pendente' ? 'warn' : 'danger'}>{a.status}</Badge>
                {a.gamblingOperator && <Badge tone="warn">Operador de apostas</Badge>}
              </div>
              <p className="text-sm text-ink-muted">
                {a.segment} · {a.contactName} · {campaigns.length} campanha(s) · desde {fmtDate(a.createdAt)}
              </p>
            </div>
            <SelectField
              label="Status da conta"
              className="sm:w-48"
              value={a.status}
              onChange={(e) => {
                const status = e.target.value as typeof a.status;
                admin.setAdvertiserStatus(a.id, status);
                if (status === 'suspenso') campaigns.filter((c) => c.status === 'ativa').forEach((c) => admin.pause(c.id));
                toast.success(`${a.name}: conta ${status}.${status === 'suspenso' ? ' Campanhas ativas foram pausadas.' : ''}`);
              }}
            >
              <option value="verificado">Verificado</option>
              <option value="pendente">Pendente</option>
              <option value="suspenso">Suspenso</option>
            </SelectField>
          </li>
        );
      })}
      <li className="text-xs text-ink-faint px-1">Verificação real de documentos e licenças dependerá de integração com o backend e processo de compliance.</li>
    </ul>
  );
}

// ---------- Espaços e preços ----------
function SlotsAndPricing() {
  const state = useAds((s) => s);
  const toast = useToast();
  return (
    <div className="space-y-4">
      <SectionCard title="Frequência no feed">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <TextField
            label="Um anúncio a cada N publicações"
            type="number"
            min={6}
            max={20}
            className="sm:w-60"
            value={state.frequency}
            onChange={(e) => admin.setFrequency(e.target.valueAsNumber || 6)}
            hint="Mínimo de 6 (no máximo 1 anúncio a cada 6 publicações)."
          />
        </div>
        <p className="text-xs text-ink-faint mt-3">Sem pop-ups e sem reprodução automática com som em nenhum formato.</p>
      </SectionCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PLACEMENTS.map((p) => {
          const slot = state.slots.find((s) => s.placement === p.id)!;
          const rule = state.pricing.find((r) => r.placement === p.id)!;
          return (
            <PricingCard
              key={p.id}
              title={p.label}
              description={p.description}
              enabled={slot.enabled}
              model={rule.model}
              price={rule.price}
              onToggle={(v) => {
                admin.setSlot(p.id, { enabled: v });
                toast.success(`${p.label}: ${v ? 'disponível' : 'indisponível'}.`);
              }}
              onSave={(model, price) => {
                try {
                  admin.setPricing(p.id, { model, price });
                  toast.success(`Preço de ${p.label} atualizado.`);
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            />
          );
        })}
      </div>
      <p className="text-xs text-ink-faint">Preços de referência para a simulação. Integração de pagamentos: não disponível nesta versão.</p>
    </div>
  );
}

function PricingCard({ title, description, enabled, model, price, onToggle, onSave }: { title: string; description: string; enabled: boolean; model: PricingModel; price: number; onToggle: (v: boolean) => void; onSave: (m: PricingModel, p: number) => void }) {
  const [m, setM] = useState(model);
  const [p, setP] = useState(String(price));
  const dirty = m !== model || Number(p) !== price;
  return (
    <div className="card p-4">
      <Toggle label={title} description={description} checked={enabled} onChange={onToggle} />
      <div className="grid grid-cols-2 gap-3 mt-2">
        <SelectField label="Modelo" value={m} onChange={(e) => setM(e.target.value as PricingModel)}>
          {(Object.keys(PRICING_LABEL) as PricingModel[]).map((k) => (
            <option key={k} value={k}>{PRICING_LABEL[k]}</option>
          ))}
        </SelectField>
        <TextField label="Preço (R$)" type="number" min={0.01} step={0.01} value={p} onChange={(e) => setP(e.target.value)} error={Number(p) > 0 ? undefined : 'Informe um valor maior que zero.'} />
      </div>
      <Button size="sm" className="mt-3" disabled={!dirty || !(Number(p) > 0)} onClick={() => onSave(m, Number(p))}>
        Salvar preço
      </Button>
    </div>
  );
}

// ---------- Relatórios ----------
function Reports() {
  const state = useAds((s) => s);
  const totals = state.campaigns.reduce((a, c) => ({ impressions: a.impressions + c.metrics.impressions, clicks: a.clicks + c.metrics.clicks, spent: a.spent + c.metrics.spent }), { impressions: 0, clicks: 0, spent: 0 });
  const byPlacement = PLACEMENTS.map((p) => {
    const agg = state.campaigns.reduce(
      (a, c) => {
        const m = c.metrics.byPlacement[p.id];
        return m ? { impressions: a.impressions + m.impressions, clicks: a.clicks + m.clicks, spent: a.spent + m.spent } : a;
      },
      { impressions: 0, clicks: 0, spent: 0 },
    );
    return { label: p.label, ...agg };
  });
  const withData = state.campaigns.filter((c) => c.metrics.impressions > 0).sort((a, b) => b.metrics.spent - a.metrics.spent);
  return (
    <div className="space-y-4">
      <MetricTiles {...totals} />
      <SectionCard title="Gasto simulado por posicionamento">
        <HBars rows={byPlacement.map((r) => ({ label: r.label, value: r.spent }))} format={brl} />
      </SectionCard>
      <SectionCard title="Por posicionamento">
        <ReportTable rows={byPlacement.map((r) => ({ key: r.label, name: r.label, ...r }))} />
      </SectionCard>
      <SectionCard title="Por campanha">
        <ReportTable rows={withData.map((c) => ({ key: c.id, name: c.name, impressions: c.metrics.impressions, clicks: c.metrics.clicks, spent: c.metrics.spent }))} />
      </SectionCard>
    </div>
  );
}

function ReportTable({ rows }: { rows: { key: string; name: string; impressions: number; clicks: number; spent: number }[] }) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="text-left text-ink-muted border-b border-line">
            <th className="py-2 font-semibold">Nome</th>
            <th className="py-2 font-semibold text-right">Impressões</th>
            <th className="py-2 font-semibold text-right">Cliques</th>
            <th className="py-2 font-semibold text-right">CTR</th>
            <th className="py-2 font-semibold text-right">Gasto</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line/60 last:border-0">
              <td className="py-2.5">{r.name}</td>
              <td className="py-2.5 text-right">{compact(r.impressions)}</td>
              <td className="py-2.5 text-right">{compact(r.clicks)}</td>
              <td className="py-2.5 text-right">{pct(ctr(r))}</td>
              <td className="py-2.5 text-right">{brl(r.spent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Denúncias ----------
function AdReports() {
  const state = useAds((s) => s);
  const toast = useToast();
  const list = [...state.reports].sort((a, b) => (a.status === b.status ? b.createdAt.localeCompare(a.createdAt) : a.status === 'aberta' ? -1 : 1));
  if (!list.length)
    return (
      <EmptyState icon={<Flag className="h-6 w-6" />} title="Nenhum anúncio denunciado">
        Denúncias feitas pelos usuários aparecerão aqui.
      </EmptyState>
    );
  return (
    <ul className="space-y-3">
      {list.map((r) => {
        const c = state.campaigns.find((x) => x.id === r.campaignId);
        const adv = state.advertisers.find((a) => a.id === c?.advertiserId);
        return (
          <li key={r.id} className={cn('card p-4 flex flex-col sm:flex-row sm:items-center gap-3', r.status === 'resolvida' && 'opacity-60')}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Flag className="h-4 w-4 text-danger" />
                <p className="font-bold">{r.reason}</p>
                <Badge tone={r.status === 'aberta' ? 'danger' : 'neutral'}>{r.status}</Badge>
              </div>
              <p className="text-sm text-ink-muted mt-0.5">
                {c ? <Link to={`/anunciar/${c.id}`} className="hover:underline">{c.name}</Link> : 'Campanha removida'} · {adv?.name} · {timeAgo(r.createdAt)}
                {c && <> · <StatusBadge status={c.status} /></>}
              </p>
            </div>
            {r.status === 'aberta' && (
              <div className="flex gap-2">
                {c?.status === 'ativa' && (
                  <Button size="sm" variant="secondary" icon={<Pause className="h-4 w-4" />} onClick={() => { admin.pause(c.id); toast.success('Campanha pausada para análise.'); }}>
                    Pausar campanha
                  </Button>
                )}
                <Button size="sm" onClick={() => { admin.resolveReport(r.id); toast.success('Denúncia marcada como resolvida.'); }}>
                  Resolver
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
