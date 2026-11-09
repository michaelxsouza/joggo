/**
 * Contratos para integrações futuras.
 * Hoje, as implementações locais (localStorage) cumprem estas interfaces.
 * Para ligar um backend, crie novas implementações e troque-as em `services/index.ts`.
 */
import type { Campaign, Placement, ReviewChecklist } from '@/types/ads';
import type { ID } from '@/types/social';

/** Pagamentos de campanhas. NÃO há cobrança nesta versão. */
export interface PaymentGateway {
  readonly available: boolean;
  /** Pré-autoriza o orçamento de uma campanha. */
  authorizeBudget(campaignId: ID, amount: number): Promise<{ ok: boolean; reference?: string; reason?: string }>;
  /** Fatura o valor consumido em um período. */
  captureSpend(campaignId: ID, amount: number): Promise<{ ok: boolean; reference?: string; reason?: string }>;
}

/** Medição de impressões e cliques (ex.: serviço de eventos com antifraude). */
export interface AdMeasurement {
  readonly simulated: boolean;
  trackImpression(campaignId: ID, placement: Placement): void;
  trackClick(campaignId: ID, placement: Placement): void;
}

/** Fila de aprovação administrativa de anúncios. */
export interface AdReviewQueue {
  submit(campaignId: ID): void;
  approve(campaignId: ID, checklist: ReviewChecklist, note?: string): { ok: boolean; error?: string };
  reject(campaignId: ID, reason: string): { ok: boolean; error?: string };
}

/** Serviço de entrega: decide quais anúncios podem ser exibidos. */
export interface AdDelivery {
  eligible(placement: Placement, opts?: { categories?: string[] }): Campaign[];
}
