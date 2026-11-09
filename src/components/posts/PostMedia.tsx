import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, PlayCircle } from 'lucide-react';
import { parseVideoUrl } from '@/lib/video';
import { cn } from '@/lib/utils';

/** Proporção como no Instagram: entre paisagem 1.91:1 e retrato 4:5, sem cortar a imagem além disso. */
const clampRatio = (r: number) => Math.min(1.91, Math.max(0.8, r));

/** Uma ou mais imagens (carrossel com deslizar, setas e bolinhas). */
export function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [ratio, setRatio] = useState<number>();
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  if (!images.length) return null;

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(images.length - 1, i));
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="relative mt-3 rounded-2xl overflow-hidden border border-line bg-black">
      <div
        ref={track}
        className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ aspectRatio: ratio ? String(clampRatio(ratio)) : '1' }}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {images.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={images.length > 1 ? `${alt} (${i + 1} de ${images.length})` : alt}
            loading="lazy"
            draggable={false}
            onLoad={i === 0 ? (e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight) : undefined}
            className="h-full w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {images.length > 1 && (
        <>
          <span className="absolute top-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold tabular-nums">
            {index + 1}/{images.length}
          </span>
          {index > 0 && (
            <button type="button" aria-label="Imagem anterior" onClick={() => go(index - 1)} className="hidden sm:grid absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 place-items-center rounded-full bg-black/70 hover:bg-black/85">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {index < images.length - 1 && (
            <button type="button" aria-label="Próxima imagem" onClick={() => go(index + 1)} className="hidden sm:grid absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 place-items-center rounded-full bg-black/70 hover:bg-black/85">
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5" aria-hidden>
            {images.map((_, i) => (
              <span key={i} className={cn('h-1.5 w-1.5 rounded-full', i === index ? 'bg-lime' : 'bg-white/50')} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Player embutido do YouTube/Instagram/TikTok/Kick. Só carrega o player quando a pessoa toca. */
export function VideoEmbedView({ url }: { url: string }) {
  const v = parseVideoUrl(url);
  const [playing, setPlaying] = useState(false);
  if (!v) return null;

  if (!v.embedUrl)
    return (
      <a href={v.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-lime/50">
        <PlayCircle className="h-8 w-8 text-lime shrink-0" aria-hidden />
        <span className="flex-1 min-w-0">
          <span className="block font-semibold">Vídeo no {v.label}</span>
          <span className="block text-sm text-ink-muted truncate">{v.url}</span>
        </span>
        <ExternalLink className="h-4 w-4 text-ink-muted" aria-hidden />
      </a>
    );

  return (
    <div className={cn('mt-3 rounded-2xl overflow-hidden border border-line bg-black', v.vertical && 'max-w-[360px]')}>
      <div className="relative w-full" style={{ aspectRatio: v.vertical ? (v.provider === 'instagram' ? '4 / 5.6' : '9 / 16') : '16 / 9' }}>
        {playing ? (
          <iframe
            src={v.embedUrl + (v.provider === 'youtube' ? '?autoplay=1&rel=0' : '')}
            title={`Vídeo do ${v.label}`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-muted hover:text-ink" aria-label={`Reproduzir vídeo do ${v.label}`}>
            <PlayCircle className="h-14 w-14 text-lime" aria-hidden />
            <span className="text-sm font-semibold">Assistir vídeo do {v.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}
