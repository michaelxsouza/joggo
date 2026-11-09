import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ImagePlus, Monitor, Save, Send, ShieldAlert, Smartphone, Trash2 } from 'lucide-react';
import { ads, getCampaign, review, useAds, validateCampaign, type CampaignDraft } from '@/services/adsService';
import { PLACEMENTS, PRICING_LABEL, type Placement } from '@/types/ads';
import { CATEGORIES, type Category } from '@/types/social';
import { Button, IconButton } from '@/components/ui/Button';
import { Chip, SectionCard } from '@/components/ui/misc';
import { TextArea, TextField } from '@/components/ui/Field';
import { PageHeader } from '@/components/layout/AppShell';
import { AdView } from '@/components/ads/AdUnits';
import { SimulationNotice, StatusBadge } from '@/components/ads/AdsShared';
import { useToast } from '@/components/ui/Toast';
import { addDaysYmd, brl, cn, fileToCompressedDataUrl, todayYmd } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import arena from '@/assets/demo/ad-arena.svg';
import livro from '@/assets/demo/ad-livro.svg';
import fone from '@/assets/demo/ad-fone.svg';
import mesa from '@/assets/demo/ad-mesa.svg';
import NotFound from '../NotFound';

const SAMPLES = [arena, livro, fone, mesa];

const empty = (): CampaignDraft => ({
  name: '',
  title: '',
  description: '',
  image: undefined,
  ctaLabel: 'Saiba mais',
  destinationUrl: 'https://',
  placements: ['feed', 'mobile_feed'],
  categories: [],
  budget: 300,
  startDate: addDaysYmd(todayYmd(), 1),
  endDate: addDaysYmd(todayYmd(), 15),
  isGambling: false,
  eligibility: { licenseInfo: '', territories: 'Brasil', adultAudienceConfirmed: false },
});

export default function CampaignEditorPage() {
  const { id } = useParams();
  const existing = id ? getCampaign(id) : undefined;
  useDocumentTitle(existing ? 'Editar campanha' : 'Nova campanha');
  const navigate = useNavigate();
  const toast = useToast();
  const pricing = useAds((s) => s.pricing);
  const advertiser = useAds((s) => s.advertisers.find((a) => a.id === (existing?.advertiserId ?? s.currentAdvertiserId))!);
  const [d, setD] = useState<CampaignDraft>(() => {
    if (!existing) return { ...empty(), isGambling: false };
    const { id: _i, advertiserId: _a, status: _s, metrics: _m, createdAt: _c, updatedAt: _u, ...rest } = existing;
    return { ...empty(), ...rest };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [imgBusy, setImgBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const gambling = d.isGambling || advertiser.gamblingOperator;
  const days = useMemo(() => {
    if (!d.startDate || !d.endDate || d.endDate < d.startDate) return 0;
    return Math.round((new Date(d.endDate).getTime() - new Date(d.startDate).getTime()) / 86400000) + 1;
  }, [d.startDate, d.endDate]);

  if (id && !existing) return <NotFound what="Campanha" />;
  if (existing && ['ativa', 'encerrada'].includes(existing.status))
    return (
      <div className="p-6">
        <SimulationNotice>Campanhas ativas ou encerradas não podem ser editadas. Pause a campanha ou duplique-a para criar uma nova versão.</SimulationNotice>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(`/anunciar/${existing.id}`)}>
          Ver relatório
        </Button>
      </div>
    );

  const up = <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const elig = d.eligibility ?? { licenseInfo: '', territories: '', adultAudienceConfirmed: false };

  const save = (submit: boolean) => {
    const draft: CampaignDraft = { ...d, isGambling: gambling, budget: Number(d.budget) };
    const errs = validateCampaign(draft, submit);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Revise os campos destacados.');
      setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"], .error-text')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 30);
      return;
    }
    try {
      const cid = ads.saveDraft(draft, existing?.id);
      if (submit) {
        review.submit(cid);
        toast.success('Campanha enviada para análise. Você será avisado sobre a decisão.');
      } else toast.success('Rascunho salvo.');
      navigate('/anunciar');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        title={existing ? `Editar: ${existing.name}` : 'Nova campanha'}
        subtitle={advertiser.name}
        back={
          <IconButton label="Voltar" onClick={() => navigate('/anunciar')}>
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        }
        action={existing && <StatusBadge status={existing.status} />}
      />
      <div className="px-3 lg:px-0 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
        <div className="space-y-4">
          {existing?.status === 'rejeitada' && existing.rejectionReason && (
            <div className="flex gap-2 rounded-xl bg-danger/5 border border-danger/25 p-3.5 text-sm">
              <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
              <p>
                <strong className="text-danger">Rejeitada:</strong> <span className="text-ink-muted">{existing.rejectionReason}</span> Corrija e reenvie para análise.
              </p>
            </div>
          )}

          <SectionCard title="Criativo">
            <div className="space-y-4">
              <TextField label="Nome da campanha (interno)" value={d.name} onChange={(e) => up('name', e.target.value)} error={errors.name} maxLength={60} placeholder="Ex.: Lançamento coleção de verão" />
              <TextField label="Título" value={d.title} onChange={(e) => up('title', e.target.value)} error={errors.title} counter={{ value: d.title.length, max: 60 }} />
              <TextArea label="Descrição" rows={3} value={d.description} onChange={(e) => up('description', e.target.value)} error={errors.description} counter={{ value: d.description.length, max: 160 }} hint="Sem promessas de ganho, lucro ou resultado garantido." />
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-4">
                <TextField label="Link de destino" type="url" inputMode="url" value={d.destinationUrl} onChange={(e) => up('destinationUrl', e.target.value)} error={errors.destinationUrl} placeholder="https://" />
                <TextField label="Texto do botão" value={d.ctaLabel} onChange={(e) => up('ctaLabel', e.target.value)} maxLength={20} />
              </div>
              <div>
                <p className="label">Imagem</p>
                <div className="flex flex-wrap items-center gap-2">
                  {SAMPLES.map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => up('image', s)}
                      aria-pressed={d.image === s}
                      aria-label={`Usar imagem de exemplo ${i + 1}`}
                      className={cn('h-14 w-20 rounded-lg overflow-hidden border-2', d.image === s ? 'border-lime' : 'border-line')}
                    >
                      <img src={s} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    id="ad-image"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setImgBusy(true);
                      try {
                        up('image', await fileToCompressedDataUrl(f, 1000, 0.82));
                      } catch (err) {
                        toast.error((err as Error).message);
                      } finally {
                        setImgBusy(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button size="sm" variant="secondary" loading={imgBusy} icon={<ImagePlus className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
                    Enviar imagem
                  </Button>
                  {d.image && (
                    <Button size="sm" variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => up('image', undefined)}>
                      Remover
                    </Button>
                  )}
                </div>
                <p className="hint">Proporção recomendada 16:9. A imagem é reduzida e salva neste navegador.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Posicionamento e público">
            <fieldset>
              <legend className="label">Posicionamentos</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PLACEMENTS.map((p) => {
                  const rule = pricing.find((r) => r.placement === p.id);
                  const on = d.placements.includes(p.id);
                  return (
                    <label key={p.id} className={cn('flex gap-3 rounded-xl border p-3 cursor-pointer transition-colors', on ? 'border-lime/50 bg-lime/[.04]' : 'border-line hover:bg-surface')}>
                      <input type="checkbox" checked={on} onChange={() => up('placements', toggle<Placement>(d.placements, p.id))} className="accent-[#B0FF35] h-4 w-4 mt-0.5" />
                      <span>
                        <span className="font-semibold text-sm block">{p.label}</span>
                        <span className="text-xs text-ink-muted block">{p.description}</span>
                        {rule && (
                          <span className="text-xs text-ink-faint block mt-1">
                            {PRICING_LABEL[rule.model]}: {brl(rule.price)}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.placements && <p className="error-text">{errors.placements}</p>}
            </fieldset>
            <fieldset className="mt-4">
              <legend className="label">Categorias de interesse</legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Chip key={c.id} active={d.categories.includes(c.id)} onClick={() => up('categories', toggle<Category>(d.categories, c.id))}>
                    {c.label}
                  </Chip>
                ))}
              </div>
              {errors.categories && <p className="error-text">{errors.categories}</p>}
              <p className="hint">
                A segmentação usa apenas categorias de interesse declaradas e o tema do conteúdo. Não é possível segmentar por histórico de perdas, depósitos, frequência de jogo ou sinais de vulnerabilidade. Todo o público é maior de 18 anos.
              </p>
            </fieldset>
          </SectionCard>

          <SectionCard title="Orçamento e período">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField
                label="Orçamento total (R$)"
                type="number"
                min={50}
                step={10}
                inputMode="decimal"
                value={Number.isFinite(d.budget) ? d.budget : ''}
                onChange={(e) => up('budget', e.target.valueAsNumber)}
                error={errors.budget}
              />
              <TextField label="Início" type="date" value={d.startDate} onChange={(e) => up('startDate', e.target.value)} error={errors.startDate} />
              <TextField label="Término" type="date" value={d.endDate} min={d.startDate} onChange={(e) => up('endDate', e.target.value)} error={errors.endDate} />
            </div>
            <p className="hint mt-3">
              {days > 0 && d.budget > 0 ? `${days} dia(s) · cerca de ${brl(d.budget / days)} por dia. ` : ''}O orçamento é o limite máximo da simulação: ao ser atingido, a campanha é encerrada automaticamente. Pagamentos ainda não estão integrados.
            </p>
          </SectionCard>

          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-warn" /> Anúncio de apostas
              </span>
            }
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={gambling} disabled={advertiser.gamblingOperator} onChange={(e) => up('isGambling', e.target.checked)} className="accent-[#B0FF35] h-4 w-4 mt-1" />
              <span className="text-sm">
                <span className="font-semibold block">Este anúncio promove apostas ou jogos de azar</span>
                <span className="text-ink-muted">
                  {advertiser.gamblingOperator ? 'Obrigatório para operadores de apostas. ' : ''}Antes de qualquer veiculação real, passa por revisão específica de elegibilidade do anunciante, público adulto e regras aplicáveis ao território.
                </span>
              </span>
            </label>
            {gambling && (
              <div className="mt-4 space-y-4 animate-fade-in">
                <TextField
                  label="Autorização / licença do operador"
                  value={elig.licenseInfo}
                  onChange={(e) => up('eligibility', { ...elig, licenseInfo: e.target.value })}
                  error={errors.licenseInfo}
                  hint="Informação declarada; a verificação é feita pela equipe de revisão."
                />
                <TextField label="Territórios de veiculação" value={elig.territories} onChange={(e) => up('eligibility', { ...elig, territories: e.target.value })} error={errors.territories} />
                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={elig.adultAudienceConfirmed}
                    onChange={(e) => {
                      up('eligibility', { ...elig, adultAudienceConfirmed: e.target.checked });
                      setErrors((x) => ({ ...x, adultAudience: '' }));
                    }}
                    className="accent-[#B0FF35] h-4 w-4 mt-0.5"
                  />
                  Confirmo que o anúncio é destinado exclusivamente a maiores de 18 anos e incluirá a mensagem de jogo responsável.
                </label>
                {errors.adultAudience && <p className="error-text">{errors.adultAudience}</p>}
              </div>
            )}
          </SectionCard>

          <div className="flex flex-wrap justify-end gap-2 pb-4">
            <Button variant="ghost" onClick={() => navigate('/anunciar')}>
              Cancelar
            </Button>
            <Button variant="secondary" icon={<Save className="h-4 w-4" />} onClick={() => save(false)}>
              Salvar rascunho
            </Button>
            <Button icon={<Send className="h-4 w-4" />} onClick={() => save(true)}>
              Enviar para análise
            </Button>
          </div>
        </div>

        {/* Prévia */}
        <aside className="lg:sticky lg:top-6 space-y-3" aria-label="Prévia do anúncio">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Prévia</h2>
            <div className="inline-flex rounded-xl bg-surface border border-line p-1" role="group" aria-label="Dispositivo da prévia">
              <button
                aria-pressed={device === 'desktop'}
                onClick={() => setDevice('desktop')}
                className={cn('h-8 px-3 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5', device === 'desktop' ? 'bg-lime text-lime-ink' : 'text-ink-muted')}
              >
                <Monitor className="h-4 w-4" /> Computador
              </button>
              <button
                aria-pressed={device === 'mobile'}
                onClick={() => setDevice('mobile')}
                className={cn('h-8 px-3 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5', device === 'mobile' ? 'bg-lime text-lime-ink' : 'text-ink-muted')}
              >
                <Smartphone className="h-4 w-4" /> Celular
              </button>
            </div>
          </div>
          {device === 'desktop' ? (
            <div className="space-y-3">
              {(d.placements.includes('feed') || d.placements.includes('community')) && (
                <div>
                  <p className="text-xs text-ink-faint mb-1.5">Feed / comunidades</p>
                  <AdView preview campaign={{ ...d, id: 'preview', isGambling: gambling }} advertiserName={advertiser.name} variant="feed" />
                </div>
              )}
              {d.placements.includes('sidebar') && (
                <div className="max-w-[300px]">
                  <p className="text-xs text-ink-faint mb-1.5">Banner lateral</p>
                  <AdView preview campaign={{ ...d, id: 'preview', isGambling: gambling }} advertiserName={advertiser.name} variant="banner" />
                </div>
              )}
              {!d.placements.some((p) => ['feed', 'community', 'sidebar'].includes(p)) && <p className="text-sm text-ink-muted card p-4">Nenhum posicionamento de computador selecionado.</p>}
            </div>
          ) : (
            <div className="mx-auto w-[300px] rounded-[2rem] border-[6px] border-surface-2 bg-bg p-2.5 shadow-pop">
              <div className="h-1.5 w-16 bg-surface-2 rounded-full mx-auto mb-2.5" aria-hidden />
              {d.placements.includes('mobile_feed') || d.placements.includes('community') ? (
                <AdView preview campaign={{ ...d, id: 'preview', isGambling: gambling }} advertiserName={advertiser.name} variant="mobile" />
              ) : (
                <p className="text-sm text-ink-muted p-4">Selecione “Feed (celular)” ou “Comunidades” para aparecer no celular.</p>
              )}
            </div>
          )}
          <p className="text-[11px] text-ink-faint">A identificação “Patrocinado” é obrigatória e não pode ser removida.</p>
        </aside>
      </div>
    </div>
  );
}
