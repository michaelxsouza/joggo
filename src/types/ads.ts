// Tipos do módulo de publicidade. Separados dos dados de publicações de propósito:
// anúncios terão backend, medição e cobrança próprios.
import type { Category, ID } from './social';

export type Placement = 'feed' | 'sidebar' | 'mobile_feed' | 'community';

export const PLACEMENTS: { id: Placement; label: string; description: string }[] = [
  { id: 'feed', label: 'Feed (computador)', description: 'Publicação patrocinada entre posts do feed no computador.' },
  { id: 'mobile_feed', label: 'Feed (celular)', description: 'Card patrocinado entre publicações no celular.' },
  { id: 'sidebar', label: 'Banner lateral', description: 'Banner na coluna direita do computador.' },
  { id: 'community', label: 'Comunidades', description: 'Anúncio dentro de comunidades do mesmo tema.' },
];

export const placementLabel = (p: Placement) => PLACEMENTS.find((x) => x.id === p)?.label ?? p;

export type CampaignStatus =
  | 'rascunho'
  | 'em_analise'
  | 'aprovada'
  | 'ativa'
  | 'pausada'
  | 'encerrada'
  | 'rejeitada';

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  rascunho: 'Rascunho',
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  ativa: 'Ativa',
  pausada: 'Pausada',
  encerrada: 'Encerrada',
  rejeitada: 'Rejeitada',
};

export type PricingModel = 'periodo' | 'cpm' | 'cpc';

export const PRICING_LABEL: Record<PricingModel, string> = {
  periodo: 'Por período (diária)',
  cpm: 'CPM (mil impressões)',
  cpc: 'CPC (por clique)',
};

export interface Advertiser {
  id: ID;
  name: string;
  segment: string;
  contactName: string;
  status: 'verificado' | 'pendente' | 'suspenso';
  /** Anunciante do setor de apostas: exige verificação de elegibilidade. */
  gamblingOperator: boolean;
  createdAt: string;
}

export interface GamblingEligibility {
  /** Autorização/licença informada pelo anunciante (não verificada automaticamente). */
  licenseInfo: string;
  territories: string;
  adultAudienceConfirmed: boolean;
}

export interface ReviewChecklist {
  advertiserEligibility: boolean;
  adultAudience: boolean;
  territoryRules: boolean;
  noProfitPromises: boolean;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  spent: number; // em reais, simulado
  byPlacement: Partial<Record<Placement, { impressions: number; clicks: number; spent: number }>>;
  /** Dias (yyyy-mm-dd) já cobrados em posicionamentos de preço por período. */
  periodDaysCharged: Partial<Record<Placement, string[]>>;
}

export interface Campaign {
  id: ID;
  advertiserId: ID;
  name: string;
  title: string;
  description: string;
  image?: string;
  ctaLabel: string;
  destinationUrl: string;
  placements: Placement[];
  categories: Category[];
  budget: number;
  startDate: string; // yyyy-mm-dd
  endDate: string;
  status: CampaignStatus;
  isGambling: boolean;
  eligibility?: GamblingEligibility;
  review?: { checklist: ReviewChecklist; reviewedAt?: string; note?: string };
  rejectionReason?: string;
  endedReason?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  metrics: CampaignMetrics;
}

export interface AdSlotConfig {
  placement: Placement;
  enabled: boolean;
}

export interface PricingRule {
  placement: Placement;
  model: PricingModel;
  price: number; // R$ por dia, por mil impressões ou por clique
}

export interface AdReport {
  id: ID;
  campaignId: ID;
  reason: string;
  createdAt: string;
  status: 'aberta' | 'resolvida';
}

export interface AdsState {
  version: number;
  currentAdvertiserId: ID;
  advertisers: Advertiser[];
  campaigns: Campaign[];
  slots: AdSlotConfig[];
  pricing: PricingRule[];
  /** Um anúncio no máximo a cada N publicações (mínimo 6). */
  frequency: number;
  reports: AdReport[];
  hiddenCampaignIds: ID[];
}
