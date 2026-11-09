// DADOS DE DEMONSTRAÇÃO DE PUBLICIDADE — anunciantes, campanhas e métricas são simulados.
// Nenhuma campanha aqui foi veiculada de verdade e nenhum valor foi cobrado.
import type { AdsState, Advertiser, Campaign, CampaignMetrics, PricingRule } from '@/types/ads';
import { addDaysYmd, daysAgoIso, todayYmd } from '@/lib/utils';
import arena from '@/assets/demo/ad-arena.svg';
import livro from '@/assets/demo/ad-livro.svg';
import fone from '@/assets/demo/ad-fone.svg';
import mesa from '@/assets/demo/ad-mesa.svg';

export const ADS_VERSION = 3;

const advertisers: Advertiser[] = [
  { id: 'adv_arena', name: 'Arena Shop', segment: 'Artigos esportivos', contactName: 'Equipe Arena', status: 'verificado', gamblingOperator: false, createdAt: daysAgoIso(90) },
  { id: 'adv_livro', name: 'Editora Leitura de Mesa', segment: 'Livros e cursos', contactName: 'Comercial Editora', status: 'verificado', gamblingOperator: false, createdAt: daysAgoIso(70) },
  { id: 'adv_som', name: 'SomPro Acessórios', segment: 'Eletrônicos e streaming', contactName: 'Marketing SomPro', status: 'verificado', gamblingOperator: false, createdAt: daysAgoIso(50) },
  { id: 'adv_viva', name: 'Mesa Viva Entretenimento', segment: 'Operador de jogos (apostas)', contactName: 'Compliance Mesa Viva', status: 'pendente', gamblingOperator: true, createdAt: daysAgoIso(12) },
];

const m = (impressions: number, clicks: number, spent: number, by: CampaignMetrics['byPlacement'] = {}): CampaignMetrics => ({
  impressions, clicks, spent, byPlacement: by, periodDaysCharged: {},
});

const today = todayYmd();

const base = { createdAt: daysAgoIso(20), updatedAt: daysAgoIso(2) };

const campaigns: Campaign[] = [
  {
    ...base, id: 'cp_arena1', advertiserId: 'adv_arena', name: 'Camisas temporada 2026',
    title: 'Camisas oficiais da temporada', description: 'Modelos dos principais clubes brasileiros com personalização de nome e número.',
    image: arena, ctaLabel: 'Ver coleção', destinationUrl: 'https://example.com/arena-shop',
    placements: ['feed', 'mobile_feed', 'sidebar'], categories: ['esportes'],
    budget: 1500, startDate: addDaysYmd(today, -10), endDate: addDaysYmd(today, 20),
    status: 'ativa', isGambling: false, submittedAt: daysAgoIso(14),
    metrics: m(18420, 236, 342.8, {
      feed: { impressions: 9100, clicks: 128, spent: 163.8 },
      mobile_feed: { impressions: 7120, clicks: 96, spent: 106.8 },
      sidebar: { impressions: 2200, clicks: 12, spent: 72 },
    }),
  },
  {
    ...base, id: 'cp_livro1', advertiserId: 'adv_livro', name: 'Livro Leitura de Mesa',
    title: 'Leitura de Mesa: poker para iniciantes', description: 'Conceitos de posição, ranges e gestão de banca explicados em português, sem fórmulas mágicas.',
    image: livro, ctaLabel: 'Conhecer o livro', destinationUrl: 'https://example.com/leitura-de-mesa',
    placements: ['feed', 'mobile_feed', 'community'], categories: ['poker'],
    budget: 800, startDate: addDaysYmd(today, -5), endDate: addDaysYmd(today, 25),
    status: 'ativa', isGambling: false, submittedAt: daysAgoIso(8),
    metrics: m(6200, 141, 191.4, {
      feed: { impressions: 3100, clicks: 70, spent: 55.8 },
      mobile_feed: { impressions: 2400, clicks: 51, spent: 36 },
      community: { impressions: 700, clicks: 20, spent: 18 },
    }),
  },
  {
    ...base, id: 'cp_som1', advertiserId: 'adv_som', name: 'Fones para streaming',
    title: 'Fone SomPro Stream', description: 'Microfone com cancelamento de ruído para quem narra partidas e faz lives.',
    image: fone, ctaLabel: 'Saiba mais', destinationUrl: 'https://example.com/sompro',
    placements: ['sidebar', 'community', 'mobile_feed'], categories: ['esportes', 'slots', 'cassino', 'roleta'],
    budget: 600, startDate: addDaysYmd(today, -3), endDate: addDaysYmd(today, 27),
    status: 'ativa', isGambling: false, submittedAt: daysAgoIso(5),
    metrics: m(3900, 44, 98.6, {
      sidebar: { impressions: 2100, clicks: 20, spent: 72 },
      community: { impressions: 1000, clicks: 14, spent: 12.6 },
      mobile_feed: { impressions: 800, clicks: 10, spent: 14 },
    }),
  },
  {
    ...base, id: 'cp_viva1', advertiserId: 'adv_viva', name: 'Mesa ao vivo — lançamento',
    title: 'Mesas ao vivo com crupiês brasileiros', description: 'Conheça nossas mesas de blackjack e roleta ao vivo. Proibido para menores de 18 anos. Jogue com responsabilidade.',
    image: mesa, ctaLabel: 'Conhecer', destinationUrl: 'https://example.com/mesa-viva',
    placements: ['feed', 'community'], categories: ['cassino', 'roleta'],
    budget: 2000, startDate: addDaysYmd(today, 3), endDate: addDaysYmd(today, 33),
    status: 'em_analise', isGambling: true, submittedAt: daysAgoIso(1),
    eligibility: { licenseInfo: 'Informada pelo anunciante: portaria de autorização nº 0000/2026 (fictícia)', territories: 'Brasil', adultAudienceConfirmed: true },
    metrics: m(0, 0, 0),
  },
  {
    ...base, id: 'cp_arena2', advertiserId: 'adv_arena', name: 'Chuteiras society',
    title: 'Chuteiras society com até 30% off', description: 'Linha nova para o futebol de fim de semana.',
    image: undefined, ctaLabel: 'Comprar', destinationUrl: 'https://example.com/arena-shop/chuteiras',
    placements: ['feed'], categories: ['esportes'],
    budget: 400, startDate: addDaysYmd(today, 7), endDate: addDaysYmd(today, 21),
    status: 'rascunho', isGambling: false, metrics: m(0, 0, 0),
  },
  {
    ...base, id: 'cp_arena3', advertiserId: 'adv_arena', name: 'Promo relâmpago',
    title: 'O MENOR PREÇO GARANTIDO!!!', description: 'Só hoje, corra.',
    image: arena, ctaLabel: 'Comprar', destinationUrl: 'https://example.com/arena-shop/promo',
    placements: ['feed', 'mobile_feed'], categories: ['esportes'],
    budget: 300, startDate: addDaysYmd(today, 1), endDate: addDaysYmd(today, 5),
    status: 'rejeitada', isGambling: false, submittedAt: daysAgoIso(3),
    rejectionReason: 'Título em caixa alta com afirmação sem comprovação ("menor preço garantido"). Ajuste o texto e descreva a oferta com clareza.',
    metrics: m(0, 0, 0),
  },
  {
    ...base, id: 'cp_arena0', advertiserId: 'adv_arena', name: 'Copa de bairro (setembro)',
    title: 'Kits para o seu time amador', description: 'Uniformes completos com desconto para times de várzea.',
    image: arena, ctaLabel: 'Montar kit', destinationUrl: 'https://example.com/arena-shop/kits',
    placements: ['feed', 'mobile_feed'], categories: ['esportes'],
    budget: 500, startDate: addDaysYmd(today, -60), endDate: addDaysYmd(today, -30),
    status: 'encerrada', endedReason: 'Período da campanha terminou.', isGambling: false, submittedAt: daysAgoIso(65),
    metrics: m(21500, 310, 500, {
      feed: { impressions: 12000, clicks: 190, spent: 290 },
      mobile_feed: { impressions: 9500, clicks: 120, spent: 210 },
    }),
  },
  {
    ...base, id: 'cp_som0', advertiserId: 'adv_som', name: 'Webcam 4K',
    title: 'Webcam 4K para lives', description: 'Imagem nítida mesmo com pouca luz.',
    image: fone, ctaLabel: 'Ver produto', destinationUrl: 'https://example.com/sompro/webcam',
    placements: ['sidebar'], categories: ['esportes', 'poker'],
    budget: 350, startDate: addDaysYmd(today, -8), endDate: addDaysYmd(today, 12),
    status: 'pausada', isGambling: false, submittedAt: daysAgoIso(10),
    metrics: m(1500, 9, 48, { sidebar: { impressions: 1500, clicks: 9, spent: 48 } }),
  },
];

const pricing: PricingRule[] = [
  { placement: 'feed', model: 'cpm', price: 18 },
  { placement: 'mobile_feed', model: 'cpm', price: 15 },
  { placement: 'sidebar', model: 'periodo', price: 24 },
  { placement: 'community', model: 'cpc', price: 0.9 },
];

export function seedAds(): AdsState {
  return {
    version: ADS_VERSION,
    currentAdvertiserId: 'adv_arena',
    advertisers,
    campaigns,
    slots: [
      { placement: 'feed', enabled: true },
      { placement: 'mobile_feed', enabled: true },
      { placement: 'sidebar', enabled: true },
      { placement: 'community', enabled: true },
    ],
    pricing,
    frequency: 6,
    reports: [
      { id: 'ar1', campaignId: 'cp_som1', reason: 'Anúncio repetitivo', createdAt: daysAgoIso(1), status: 'aberta' },
    ],
    hiddenCampaignIds: [],
  };
}
