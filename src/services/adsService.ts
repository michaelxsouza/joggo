// Camada de dados de publicidade (local). Separada dos dados sociais.
// Toda métrica e todo "gasto" aqui são SIMULADOS. Nada é cobrado nem veiculado de verdade.
import { createPersistentStore, useStore } from '@/lib/store';
import { nowIso, todayYmd, uid } from '@/lib/utils';
import { seedAds } from '@/data/seed/ads';
import type { AdsState, Campaign, Placement, PricingRule, ReviewChecklist, AdSlotConfig, Advertiser } from '@/types/ads';
import type { Category, ID } from '@/types/social';
import type { AdDelivery, AdMeasurement, AdReviewQueue, PaymentGateway } from './contracts';

/** Anúncios desligados no beta: nenhum anúncio é exibido. */
export const ADS_ENABLED = false;

export const adsStore = createPersistentStore<AdsState>('joggo:ads', seedAds);
export const useAds = <S,>(selector: (s: AdsState) => S) => useStore(adsStore, selector);
const set = adsStore.set;

const patchCampaign = (id: ID, patch: Partial<Campaign> | ((c: Campaign) => Partial<Campaign>)) =>
  set((s) => ({
    ...s,
    campaigns: s.campaigns.map((c) =>
      c.id === id ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch), updatedAt: nowIso() } : c,
    ),
  }));

export const getCampaign = (id: ID) => adsStore.get().campaigns.find((c) => c.id === id);

/** Encerra campanhas cujo período terminou ou cujo orçamento simulado acabou. */
export function reconcileCampaigns() {
  const today = todayYmd();
  set((s) => ({
    ...s,
    campaigns: s.campaigns.map((c) => {
      if (!['ativa', 'aprovada', 'pausada'].includes(c.status)) return c;
      if (c.endDate < today) return { ...c, status: 'encerrada', endedReason: 'Período da campanha terminou.' };
      if (c.metrics.spent >= c.budget) return { ...c, status: 'encerrada', endedReason: 'Orçamento da simulação atingido.' };
      return c;
    }),
  }));
}

// ---------- Entrega ----------
export function isServing(c: Campaign, s: AdsState, today = todayYmd()) {
  return (
    c.status === 'ativa' &&
    c.startDate <= today &&
    c.endDate >= today &&
    c.metrics.spent < c.budget &&
    !s.hiddenCampaignIds.includes(c.id)
  );
}

export const delivery: AdDelivery & {
  pick(s: AdsState, placement: Placement, categories: Category[], seed: number): Campaign | undefined;
} = {
  eligible(placement, opts) {
    if (!ADS_ENABLED) return [];
    const s = adsStore.get();
    const slot = s.slots.find((x) => x.placement === placement);
    if (!slot?.enabled) return [];
    return s.campaigns.filter(
      (c) =>
        isServing(c, s) &&
        c.placements.includes(placement) &&
        (!opts?.categories?.length || c.categories.some((k) => opts.categories!.includes(k))),
    );
  },
  /** Escolhe um anúncio para o espaço; prioriza categorias informadas, depois qualquer elegível. */
  pick(s, placement, categories, seed) {
    const slot = s.slots.find((x) => x.placement === placement);
    if (!slot?.enabled) return undefined;
    const all = s.campaigns.filter((c) => isServing(c, s) && c.placements.includes(placement));
    const matched = all.filter((c) => c.categories.some((k) => categories.includes(k)));
    // Comunidades: somente anúncios relacionados ao tema.
    const pool = placement === 'community' ? matched : matched.length ? matched : all;
    if (!pool.length) return undefined;
    return pool[Math.abs(seed) % pool.length];
  },
};

// ---------- Medição simulada ----------
const seenThisSession = new Set<string>();

function costFor(rule: PricingRule | undefined, kind: 'impression' | 'click') {
  if (!rule) return 0;
  if (rule.model === 'cpm' && kind === 'impression') return rule.price / 1000;
  if (rule.model === 'cpc' && kind === 'click') return rule.price;
  return 0;
}

function track(campaignId: ID, placement: Placement, kind: 'impression' | 'click') {
  set((s) => {
    const c = s.campaigns.find((x) => x.id === campaignId);
    if (!c || !isServing(c, s)) return s;
    const rule = s.pricing.find((p) => p.placement === placement);
    let cost = costFor(rule, kind);
    const today = todayYmd();
    const charged = c.metrics.periodDaysCharged[placement] ?? [];
    let periodDays = charged;
    if (rule?.model === 'periodo' && kind === 'impression' && !charged.includes(today)) {
      cost += rule.price;
      periodDays = [...charged, today];
    }
    // O orçamento é um limite rígido da simulação.
    const remaining = c.budget - c.metrics.spent;
    const applied = Math.min(cost, Math.max(0, remaining));
    const by = c.metrics.byPlacement[placement] ?? { impressions: 0, clicks: 0, spent: 0 };
    const spent = +(c.metrics.spent + applied).toFixed(4);
    const ended = spent >= c.budget;
    const updated: Campaign = {
      ...c,
      status: ended ? 'encerrada' : c.status,
      endedReason: ended ? 'Orçamento da simulação atingido.' : c.endedReason,
      metrics: {
        ...c.metrics,
        impressions: c.metrics.impressions + (kind === 'impression' ? 1 : 0),
        clicks: c.metrics.clicks + (kind === 'click' ? 1 : 0),
        spent,
        byPlacement: {
          ...c.metrics.byPlacement,
          [placement]: {
            impressions: by.impressions + (kind === 'impression' ? 1 : 0),
            clicks: by.clicks + (kind === 'click' ? 1 : 0),
            spent: +(by.spent + applied).toFixed(4),
          },
        },
        periodDaysCharged: { ...c.metrics.periodDaysCharged, [placement]: periodDays },
      },
    };
    return { ...s, campaigns: s.campaigns.map((x) => (x.id === c.id ? updated : x)) };
  });
}

export const measurement: AdMeasurement = {
  simulated: true,
  trackImpression(campaignId, placement) {
    // Uma impressão por anúncio/posicionamento por sessão, para não inflar números na demonstração.
    const key = `${campaignId}:${placement}`;
    if (seenThisSession.has(key)) return;
    seenThisSession.add(key);
    track(campaignId, placement, 'impression');
  },
  trackClick(campaignId, placement) {
    track(campaignId, placement, 'click');
  },
};

// ---------- Pagamentos (não integrados) ----------
export const payments: PaymentGateway = {
  available: false,
  async authorizeBudget() {
    return { ok: false, reason: 'Pagamentos ainda não integrados. O orçamento funciona apenas como limite da simulação.' };
  },
  async captureSpend() {
    return { ok: false, reason: 'Pagamentos ainda não integrados.' };
  },
};

// ---------- Validação ----------
export type CampaignDraft = Omit<Campaign, 'id' | 'advertiserId' | 'status' | 'metrics' | 'createdAt' | 'updatedAt'>;

export function validateCampaign(d: CampaignDraft, forSubmit: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  if (d.name.trim().length < 3) e.name = 'Dê um nome com pelo menos 3 caracteres.';
  if (!forSubmit) return e;
  if (d.title.trim().length < 5) e.title = 'O título precisa ter pelo menos 5 caracteres.';
  if (d.title.length > 60) e.title = 'Use até 60 caracteres no título.';
  if (d.description.trim().length < 10) e.description = 'Descreva o anúncio (mínimo de 10 caracteres).';
  if (d.description.length > 160) e.description = 'Use até 160 caracteres na descrição.';
  try {
    const u = new URL(d.destinationUrl);
    if (u.protocol !== 'https:') e.destinationUrl = 'Use um link seguro (https://).';
  } catch {
    e.destinationUrl = 'Informe um link de destino válido, começando com https://.';
  }
  if (!d.placements.length) e.placements = 'Escolha pelo menos um posicionamento.';
  if (!d.categories.length) e.categories = 'Escolha pelo menos uma categoria de interesse.';
  if (!(d.budget >= 50)) e.budget = 'O orçamento mínimo é de R$ 50,00.';
  if (!d.startDate) e.startDate = 'Informe a data de início.';
  if (!d.endDate) e.endDate = 'Informe a data de término.';
  if (d.startDate && d.endDate && d.endDate < d.startDate) e.endDate = 'O término deve ser depois do início.';
  if (d.endDate && d.endDate < todayYmd()) e.endDate = 'A data de término já passou.';
  if (/garantid|lucro certo|ganho certo|fique rico|renda extra/i.test(d.title + ' ' + d.description))
    e.description = 'Remova promessas de ganho ou resultado garantido.';
  if (d.isGambling) {
    if (!d.eligibility?.licenseInfo.trim()) e.licenseInfo = 'Informe a autorização/licença do operador.';
    if (!d.eligibility?.territories.trim()) e.territories = 'Informe os territórios de veiculação.';
    if (!d.eligibility?.adultAudienceConfirmed) e.adultAudience = 'Confirme que o anúncio é exclusivo para maiores de 18 anos.';
  }
  return e;
}

// ---------- Ações do anunciante ----------
export const ads = {
  saveDraft(d: CampaignDraft, id?: ID): ID {
    const s = adsStore.get();
    if (id) {
      const c = getCampaign(id);
      if (!c) throw new Error('Campanha não encontrada.');
      // Editar uma campanha rejeitada ou aprovada a devolve para rascunho.
      const status = ['rejeitada', 'aprovada', 'em_analise'].includes(c.status) ? 'rascunho' : c.status;
      patchCampaign(id, { ...d, status });
    } else {
      id = uid('cp');
      const c: Campaign = {
        ...d,
        id,
        advertiserId: s.currentAdvertiserId,
        status: 'rascunho',
        createdAt: nowIso(),
        updatedAt: nowIso(),
        metrics: { impressions: 0, clicks: 0, spent: 0, byPlacement: {}, periodDaysCharged: {} },
      };
      set((st) => ({ ...st, campaigns: [c, ...st.campaigns] }));
    }
    const err = adsStore.lastError();
    if (err) throw new Error(err);
    return id;
  },
  /** Inicia a veiculação SIMULADA de uma campanha aprovada. */
  start(id: ID) {
    const c = getCampaign(id);
    if (!c) return { ok: false, error: 'Campanha não encontrada.' };
    if (c.status !== 'aprovada' && c.status !== 'pausada') return { ok: false, error: 'Só campanhas aprovadas ou pausadas podem ser iniciadas.' };
    if (c.endDate < todayYmd()) return { ok: false, error: 'O período da campanha já terminou.' };
    if (c.metrics.spent >= c.budget) return { ok: false, error: 'O orçamento da simulação foi atingido.' };
    patchCampaign(id, { status: 'ativa' });
    return { ok: true };
  },
  pause: (id: ID) => patchCampaign(id, { status: 'pausada' }),
  end: (id: ID) => patchCampaign(id, { status: 'encerrada', endedReason: 'Encerrada manualmente.' }),
  remove: (id: ID) => set((s) => ({ ...s, campaigns: s.campaigns.filter((c) => c.id !== id) })),
  duplicate(id: ID) {
    const c = getCampaign(id);
    if (!c) return;
    const copy: Campaign = {
      ...c,
      id: uid('cp'),
      name: `${c.name} (cópia)`,
      status: 'rascunho',
      rejectionReason: undefined,
      endedReason: undefined,
      review: undefined,
      submittedAt: undefined,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metrics: { impressions: 0, clicks: 0, spent: 0, byPlacement: {}, periodDaysCharged: {} },
    };
    set((s) => ({ ...s, campaigns: [copy, ...s.campaigns] }));
    return copy.id;
  },
  setCurrentAdvertiser: (id: ID) => set((s) => ({ ...s, currentAdvertiserId: id })),
  // Usuário final
  hide: (id: ID) => set((s) => ({ ...s, hiddenCampaignIds: [...new Set([...s.hiddenCampaignIds, id])] })),
  report(campaignId: ID, reason: string) {
    if (!reason) throw new Error('Escolha um motivo.');
    set((s) => ({
      ...s,
      hiddenCampaignIds: [...new Set([...s.hiddenCampaignIds, campaignId])],
      reports: [{ id: uid('ar'), campaignId, reason, createdAt: nowIso(), status: 'aberta' }, ...s.reports],
    }));
  },
  resetDemo: () => {
    seenThisSession.clear();
    adsStore.reset();
  },
};

// ---------- Revisão administrativa ----------
export const review: AdReviewQueue = {
  submit(id) {
    patchCampaign(id, { status: 'em_analise', submittedAt: nowIso(), rejectionReason: undefined });
  },
  approve(id, checklist: ReviewChecklist, note) {
    const c = getCampaign(id);
    if (!c) return { ok: false, error: 'Campanha não encontrada.' };
    if (c.status !== 'em_analise') return { ok: false, error: 'Só campanhas em análise podem ser aprovadas.' };
    if (!checklist.noProfitPromises) return { ok: false, error: 'Confirme que o anúncio não promete ganhos.' };
    if (c.isGambling) {
      const adv = adsStore.get().advertisers.find((a) => a.id === c.advertiserId);
      if (!checklist.advertiserEligibility || !checklist.adultAudience || !checklist.territoryRules)
        return { ok: false, error: 'Anúncios de apostas exigem todos os itens da revisão de elegibilidade.' };
      if (adv?.status !== 'verificado')
        return { ok: false, error: 'O anunciante de apostas precisa estar verificado antes da aprovação.' };
    }
    patchCampaign(id, { status: 'aprovada', review: { checklist, reviewedAt: nowIso(), note } });
    return { ok: true };
  },
  reject(id, reason) {
    if (reason.trim().length < 10) return { ok: false, error: 'Explique o motivo da rejeição (mínimo de 10 caracteres).' };
    patchCampaign(id, { status: 'rejeitada', rejectionReason: reason.trim() });
    return { ok: true };
  },
};

export const admin = {
  pause: (id: ID) => patchCampaign(id, { status: 'pausada' }),
  setSlot: (placement: Placement, patch: Partial<AdSlotConfig>) =>
    set((s) => ({ ...s, slots: s.slots.map((x) => (x.placement === placement ? { ...x, ...patch } : x)) })),
  setPricing(placement: Placement, patch: Partial<PricingRule>) {
    if (patch.price !== undefined && !(patch.price > 0)) throw new Error('O preço deve ser maior que zero.');
    set((s) => ({ ...s, pricing: s.pricing.map((x) => (x.placement === placement ? { ...x, ...patch } : x)) }));
  },
  setFrequency(n: number) {
    set((s) => ({ ...s, frequency: Math.max(6, Math.min(20, Math.round(n))) }));
  },
  setAdvertiserStatus: (id: ID, status: Advertiser['status']) =>
    set((s) => ({ ...s, advertisers: s.advertisers.map((a) => (a.id === id ? { ...a, status } : a)) })),
  resolveReport: (id: ID) => set((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id ? { ...r, status: 'resolvida' } : r)) })),
};
