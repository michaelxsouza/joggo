import { useEffect, useRef, useState } from 'react';
import { ImagePlus, MessageSquareText, Ticket, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar, Chip } from '@/components/ui/misc';
import { SelectField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { sel, social, useSocial } from '@/services/socialService';
import { CATEGORIES, type Category, type ID } from '@/types/social';
import { cn, fileToCompressedDataUrl } from '@/lib/utils';
import { useMentionPicker } from './mentions';

const MAX = 2000;
const MAX_IMAGES = 4;

type Mode = 'post' | 'bilhete';
const parseOdd = (v: string) => Number(v.replace(',', '.').trim());

export function CreatePostModal({ open, onClose, communityId: initialCommunity, initialMode = 'post' }: { open: boolean; onClose: () => void; communityId?: ID; initialMode?: Mode }) {
  const me = useSocial(sel.me);
  const communities = useSocial((s) => s.communities.filter((c) => s.joinedCommunityIds.includes(c.id)));
  const toast = useToast();
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>('post');
  const [betEvent, setBetEvent] = useState('');
  const [betPick, setBetPick] = useState('');
  const [betOdd, setBetOdd] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [communityId, setCommunityId] = useState<string>('');
  const [error, setError] = useState<string>();
  const [loadingImg, setLoadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const mention = useMentionPicker(textRef, text, setText);

  useEffect(() => {
    if (open) {
      setText('');
      setImages([]);
      setMode(initialMode);
      setBetEvent('');
      setBetPick('');
      setBetOdd('');
      setError(undefined);
      const c = communities.find((x) => x.id === initialCommunity);
      setCommunityId(c?.id ?? '');
      setCategory(c?.category ?? me.interests[0] ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onCommunity = (id: string) => {
    setCommunityId(id);
    const c = communities.find((x) => x.id === id);
    if (c) setCategory(c.category);
  };

  const pickImages = async (files?: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) return setError(`Máximo de ${MAX_IMAGES} imagens por publicação.`);
    setLoadingImg(true);
    setError(undefined);
    try {
      const picked = Array.from(files).slice(0, room);
      const out = await Promise.all(picked.map((f) => fileToCompressedDataUrl(f, 1080, 0.82)));
      setImages((cur) => [...cur, ...out].slice(0, MAX_IMAGES));
      if (files.length > room) setError(`Só cabem ${MAX_IMAGES} imagens por publicação.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingImg(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = () => {
    if (!category) return setError('Escolha uma categoria para a publicação.');
    let bet: { event?: string; pick: string; odd: number } | undefined;
    if (mode === 'bilhete') {
      if (!betPick.trim()) return setError('Informe o palpite do bilhete.');
      const odd = parseOdd(betOdd);
      if (!(odd >= 1.01) || odd > 100000) return setError('Informe a odd do bilhete (ex.: 1,85).');
      bet = { event: betEvent, pick: betPick, odd };
    }
    try {
      social.createPost({ text, images, category, communityId: communityId || undefined, bet });
      toast.success(mode === 'bilhete' ? 'Bilhete publicado! Boa sorte 🍀' : 'Publicação criada!');
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const tooLong = text.length > MAX;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Criar publicação"
      size="md"
      initialFocus={textRef}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={(mode === 'post' && !text.trim() && !images.length) || tooLong || loadingImg}>
            Publicar
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1 mb-4" role="tablist" aria-label="Tipo de publicação">
        {(
          [
            ['post', 'Publicação', MessageSquareText],
            ['bilhete', 'Bilhete', Ticket],
          ] as const
        ).map(([id, label, I]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id);
              setError(undefined);
            }}
            className={cn('h-9 rounded-lg text-sm font-bold inline-flex items-center justify-center gap-1.5', mode === id ? 'bg-lime text-black' : 'text-ink-muted hover:text-ink')}
          >
            <I className="h-4 w-4" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {mode === 'bilhete' && (
        <div className="mb-4 space-y-3 rounded-2xl border border-line bg-surface p-3 animate-fade-in">
          <label className="block">
            <span className="label block">Jogo ou evento (opcional)</span>
            <input className="field" value={betEvent} maxLength={120} onChange={(e) => setBetEvent(e.target.value)} placeholder="Ex.: Flamengo x Palmeiras — Brasileirão" />
          </label>
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <label className="block">
              <span className="label block">Palpite</span>
              <input className="field" value={betPick} maxLength={200} onChange={(e) => { setBetPick(e.target.value); setError(undefined); }} placeholder="Ex.: Ambas marcam" />
            </label>
            <label className="block">
              <span className="label block">Odd</span>
              <input className="field tabular-nums" inputMode="decimal" value={betOdd} maxLength={9} onChange={(e) => { setBetOdd(e.target.value.replace(/[^\d.,]/g, '')); setError(undefined); }} placeholder="1,85" />
            </label>
          </div>
          <p className="text-[11px] text-ink-faint">Depois do jogo, marque green ou red no seu post. O resultado não pode ser alterado.</p>
        </div>
      )}

      <div className="flex gap-3">
        <Avatar user={me} size="md" />
        <div className="flex-1 min-w-0 relative">
          <label htmlFor="compose-text" className="sr-only">
            Texto da publicação
          </label>
          <textarea
            id="compose-text"
            ref={textRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(undefined);
              mention.onInput(e.target);
            }}
            onBlur={() => setTimeout(mention.close, 150)}
            onKeyDown={(e) => {
              if (mention.onKeyDown(e)) return;
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={4}
            placeholder={mode === 'bilhete' ? 'Conte sua análise (opcional)…' : 'Compartilhe uma experiência, uma dúvida ou uma análise… Use @ para marcar alguém.'}
            className="w-full bg-transparent resize-none text-[17px] leading-relaxed placeholder:text-ink-faint focus:outline-none focus-visible:outline-none"
          />
          {mention.popover}
          <div className={cn('text-right text-xs tabular-nums', tooLong ? 'text-danger' : 'text-ink-faint')}>
            {text.length}/{MAX}
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <div className={cn('mt-3 grid gap-2 animate-fade-in', images.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
          {images.map((src, i) => (
            <div key={i} className="relative rounded-2xl overflow-hidden border border-line bg-black">
              <img src={src} alt={`Pré-visualização da imagem ${i + 1}`} className={cn('w-full object-contain', images.length > 1 ? 'aspect-square object-cover' : 'max-h-80')} />
              <button
                type="button"
                aria-label={`Remover imagem ${i + 1}`}
                onClick={() => setImages((cur) => cur.filter((_, k) => k !== i))}
                className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 hover:bg-black/85"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}


      <fieldset className="mt-4">
        <legend className="label">Categoria</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <SelectField label="Publicar em" className="mt-4" value={communityId} onChange={(e) => onCommunity(e.target.value)} hint={communities.length ? undefined : 'Entre em comunidades para publicar nelas.'}>
        <option value="">Meu perfil (público)</option>
        {communities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>

      <div className="mt-4 flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" id="compose-image" onChange={(e) => pickImages(e.target.files)} />
        <Button variant="secondary" size="sm" icon={<ImagePlus className="h-4 w-4" />} loading={loadingImg} disabled={images.length >= MAX_IMAGES} onClick={() => fileRef.current?.click()}>
          {images.length ? `Imagens (${images.length}/${MAX_IMAGES})` : 'Imagens'}
        </Button>
        <span className="text-xs text-ink-faint">Até 4 imagens · JPG, PNG ou WEBP</span>
      </div>

      {error && (
        <p role="alert" className="error-text mt-3">
          {error}
        </p>
      )}
      <p className="text-[11px] text-ink-faint mt-4">
        Lembre-se: sem promessas de lucro, pedidos de dinheiro ou divulgação de links de apostas.
      </p>
    </Modal>
  );
}
