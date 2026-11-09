import { useEffect, useState } from 'react';
import { ExternalLink, EyeOff, Flag, HelpCircle, Megaphone } from 'lucide-react';
import type { Campaign, Placement } from '@/types/ads';
import { placementLabel } from '@/types/ads';
import { categoryLabel, type Category } from '@/types/social';
import { ads, adsStore, delivery, measurement, useAds } from '@/services/adsService';
import { Menu } from '@/components/ui/misc';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useUI } from '@/app/UIContext';
import { cn } from '@/lib/utils';

export type AdVariant = 'feed' | 'mobile' | 'banner';

interface AdViewProps {
  campaign: Pick<Campaign, 'id' | 'title' | 'description' | 'image' | 'ctaLabel' | 'destinationUrl' | 'categories' | 'isGambling'>;
  advertiserName: string;
  variant: AdVariant;
  /** Em prévia, nada é medido e ações ficam desativadas. */
  preview?: boolean;
  onCta?: () => void;
  onWhy?: () => void;
  onHide?: () => void;
  onReport?: () => void;
}

/** Visual do anúncio — usado na entrega real e na prévia do painel do anunciante. */
export function AdView({ campaign, advertiserName, variant, preview, onCta, onWhy, onHide, onReport }: AdViewProps) {
  const domain = (() => {
    try {
      return new URL(campaign.destinationUrl).hostname.replace(/^www\./, '');
    } catch {
      return 'link de destino';
    }
  })();

  const label = (
    <span className="inline-flex items-center gap-1 rounded-md bg-surface border border-line px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
      Patrocinado
    </span>
  );

  const menu = preview ? null : (
    <Menu
      label="Opções do anúncio"
      items={[
        { label: 'Por que estou vendo este anúncio?', icon: <HelpCircle className="h-4 w-4" />, onSelect: () => onWhy?.() },
        { label: 'Ocultar anúncio', icon: <EyeOff className="h-4 w-4" />, onSelect: () => onHide?.() },
        { label: 'Denunciar anúncio', icon: <Flag className="h-4 w-4" />, danger: true, onSelect: () => onReport?.() },
      ]}
    />
  );

  const gamblingNote = campaign.isGambling && (
    <p className="text-[11px] text-ink-faint mt-2">18+ · Jogue com responsabilidade</p>
  );

  if (variant === 'banner') {
    return (
      <aside aria-label={`Anúncio patrocinado de ${advertiserName}`} className="card overflow-hidden">
        <div className="flex items-center justify-between px-3 pt-2.5">
          {label}
          {menu}
        </div>
        {campaign.image && <img src={campaign.image} alt="" className="mt-2 w-full aspect-[16/9] object-cover" />}
        <div className="p-3.5">
          <p className="text-xs text-ink-muted font-semibold">{advertiserName}</p>
          <h3 className="font-bold leading-snug mt-0.5">{campaign.title || 'Título do anúncio'}</h3>
          <p className="text-sm text-ink-muted mt-1 line-clamp-3">{campaign.description || 'Descrição do anúncio.'}</p>
          <Button variant="secondary" size="sm" block className="mt-3" onClick={onCta} disabled={preview} icon={<ExternalLink className="h-4 w-4" />}>
            {campaign.ctaLabel || 'Saiba mais'}
          </Button>
          {gamblingNote}
        </div>
      </aside>
    );
  }

  const compactCard = variant === 'mobile';
  return (
    <article aria-label={`Anúncio patrocinado de ${advertiserName}`} className={cn('card', compactCard ? 'p-3.5' : 'p-4 sm:p-5')}>
      <header className="flex items-center gap-3">
        <span className="h-10 w-10 rounded-full bg-surface border border-line flex items-center justify-center text-ink-muted shrink-0" aria-hidden>
          <Megaphone className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold leading-tight truncate">{advertiserName}</p>
          <div className="mt-1">{label}</div>
        </div>
        {menu}
      </header>
      <p className={cn('mt-3 text-[15px] leading-relaxed', compactCard && 'text-sm')}>{campaign.description || 'Descrição do anúncio.'}</p>
      <div className="mt-3 rounded-2xl overflow-hidden border border-line bg-surface">
        {campaign.image ? (
          <img src={campaign.image} alt="" className={cn('w-full object-cover', compactCard ? 'aspect-[16/9]' : 'aspect-[16/8]')} />
        ) : (
          <div className={cn('w-full flex items-center justify-center text-ink-faint text-sm', compactCard ? 'aspect-[16/9]' : 'aspect-[16/8]')}>Sem imagem</div>
        )}
        <div className="flex items-center gap-3 px-3.5 py-3 border-t border-line">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ink-muted truncate">{domain}</p>
            <p className="font-bold leading-snug truncate">{campaign.title || 'Título do anúncio'}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={onCta} disabled={preview}>
            {campaign.ctaLabel || 'Saiba mais'}
          </Button>
        </div>
      </div>
      {gamblingNote}
    </article>
  );
}

/** Espaço de anúncio: escolhe uma campanha elegível, mede impressão/clique (simulado) e oferece controles ao usuário. */
export function AdSlot({ placement, categories, seed, variant, context }: { placement: Placement; categories: Category[]; seed: number; variant: AdVariant; context?: string }) {
  const campaign = useAds((s) => delivery.pick(s, placement, categories, seed));
  const advertiser = useAds((s) => s.advertisers.find((a) => a.id === campaign?.advertiserId));
  const [why, setWhy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const toast = useToast();
  const ui = useUI();

  useEffect(() => {
    if (campaign) measurement.trackImpression(campaign.id, placement);
  }, [campaign?.id, placement]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!campaign || !advertiser) return null;

  const matched = campaign.categories.filter((c) => categories.includes(c));

  return (
    <>
      <AdView
        campaign={campaign}
        advertiserName={advertiser.name}
        variant={variant}
        onCta={() => {
          measurement.trackClick(campaign.id, placement);
          setLeaving(true);
        }}
        onWhy={() => setWhy(true)}
        onHide={() => {
          ads.hide(campaign.id);
          toast.success('Anúncio ocultado. Você não verá mais esta campanha.');
        }}
        onReport={() => ui.openReport({ target: 'ad', id: campaign.id, name: `o anúncio de ${advertiser.name}` })}
      />
      <Modal open={why} onClose={() => setWhy(false)} title="Por que estou vendo este anúncio?" size="sm">
        <div className="space-y-3 text-[15px] text-ink-muted">
          <p>
            Este anúncio de <strong className="text-ink">{advertiser.name}</strong> foi exibido no posicionamento{' '}
            <strong className="text-ink">{placementLabel(placement)}</strong>
            {context ? ` (${context})` : ''}.
          </p>
          {matched.length ? (
            <p>
              A campanha escolheu a(s) categoria(s) <strong className="text-ink">{matched.map(categoryLabel).join(', ')}</strong>, que corresponde(m) aos seus interesses ou ao tema do conteúdo que você está vendo.
            </p>
          ) : (
            <p>A campanha não corresponde a um interesse específico seu; ela foi exibida porque estava disponível para este espaço.</p>
          )}
          <p className="rounded-xl bg-surface border border-line p-3 text-sm">
            A Joggo <strong className="text-ink">não usa</strong> histórico de perdas, depósitos, frequência de jogo ou sinais de vulnerabilidade para segmentar anúncios.
          </p>
          <p className="text-sm">Você pode ocultar ou denunciar qualquer anúncio pelo menu “⋯”.</p>
        </div>
      </Modal>
      <Modal
        open={leaving}
        onClose={() => setLeaving(false)}
        title="Você está saindo da Joggo"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLeaving(false)}>
              Voltar
            </Button>
            <a
              href={campaign.destinationUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => setLeaving(false)}
              className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-lime text-lime-ink font-bold hover:bg-lime-dim transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Continuar
            </a>
          </>
        }
      >
        <p className="text-[15px] text-ink-muted">
          Este link de anúncio abre um site externo: <span className="text-ink break-all">{campaign.destinationUrl}</span>
        </p>
        <p className="text-[11px] text-ink-faint mt-3">Demonstração: o clique foi contabilizado apenas na simulação local.</p>
      </Modal>
    </>
  );
}

/** Intercala no máximo um anúncio a cada `every` publicações (mínimo 6). */
export function interleave<T>(items: T[], every: number): ({ kind: 'item'; item: T } | { kind: 'ad'; index: number })[] {
  const n = Math.max(6, every);
  const out: ({ kind: 'item'; item: T } | { kind: 'ad'; index: number })[] = [];
  items.forEach((item, i) => {
    out.push({ kind: 'item', item });
    if ((i + 1) % n === 0 && i < items.length - 1) out.push({ kind: 'ad', index: (i + 1) / n });
  });
  return out;
}

export const useAdFrequency = () => useAds((s) => s.frequency);
export const adsSnapshot = () => adsStore.get();
