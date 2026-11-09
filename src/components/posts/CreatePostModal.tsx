import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar, Chip } from '@/components/ui/misc';
import { SelectField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { sel, social, useSocial } from '@/services/socialService';
import { CATEGORIES, type Category, type ID } from '@/types/social';
import { cn, fileToCompressedDataUrl } from '@/lib/utils';

const MAX = 1000;

export function CreatePostModal({ open, onClose, communityId: initialCommunity }: { open: boolean; onClose: () => void; communityId?: ID }) {
  const me = useSocial(sel.me);
  const communities = useSocial((s) => s.communities.filter((c) => s.joinedCommunityIds.includes(c.id)));
  const toast = useToast();
  const [text, setText] = useState('');
  const [image, setImage] = useState<string>();
  const [category, setCategory] = useState<Category | ''>('');
  const [communityId, setCommunityId] = useState<string>('');
  const [error, setError] = useState<string>();
  const [loadingImg, setLoadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setText('');
      setImage(undefined);
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

  const pickImage = async (f?: File) => {
    if (!f) return;
    setLoadingImg(true);
    setError(undefined);
    try {
      setImage(await fileToCompressedDataUrl(f));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingImg(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = () => {
    if (!category) return setError('Escolha uma categoria para a publicação.');
    try {
      social.createPost({ text, image, category, communityId: communityId || undefined });
      toast.success('Publicação criada!');
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
          <Button onClick={submit} disabled={(!text.trim() && !image) || tooLong || loadingImg}>
            Publicar
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <Avatar user={me} size="md" />
        <div className="flex-1 min-w-0">
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
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={4}
            placeholder="Compartilhe uma experiência, uma dúvida ou uma análise…"
            className="w-full bg-transparent resize-none text-[17px] leading-relaxed placeholder:text-ink-faint focus:outline-none focus-visible:outline-none"
          />
          <div className={cn('text-right text-xs tabular-nums', tooLong ? 'text-danger' : 'text-ink-faint')}>
            {text.length}/{MAX}
          </div>
        </div>
      </div>

      {image && (
        <div className="relative mt-3 rounded-2xl overflow-hidden border border-line animate-fade-in">
          <img src={image} alt="Pré-visualização da imagem selecionada" className="w-full max-h-80 object-cover" />
          <button
            type="button"
            onClick={() => setImage(undefined)}
            className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-sm font-semibold hover:bg-black/85"
          >
            <Trash2 className="h-4 w-4" /> Remover
          </button>
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
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" id="compose-image" onChange={(e) => pickImage(e.target.files?.[0])} />
        <Button variant="secondary" size="sm" icon={<ImagePlus className="h-4 w-4" />} loading={loadingImg} onClick={() => fileRef.current?.click()}>
          {image ? 'Trocar imagem' : 'Adicionar imagem'}
        </Button>
        <span className="text-xs text-ink-faint">JPG, PNG ou WEBP até 10 MB</span>
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
