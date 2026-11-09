import { useEffect, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextArea, TextField } from '@/components/ui/Field';
import { Avatar, Chip } from '@/components/ui/misc';
import { useToast } from '@/components/ui/Toast';
import { sel, social, useSocial } from '@/services/socialService';
import { CATEGORIES, type Category } from '@/types/social';
import { cn, fileToCompressedDataUrl } from '@/lib/utils';

const COLORS = ['#3B5BDB', '#C2255C', '#2B8A3E', '#9C36B5', '#E8590C', '#1098AD', '#5C940D', '#7048E8', '#F08C00', '#0B7285'];
const COVERS = ['#1E2A22', '#2A1E24', '#1C2629', '#251E2A', '#2A251B', '#1B1F2A'];

export function EditProfileModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: (handle: string) => void }) {
  const me = useSocial(sel.me);
  const toast = useToast();
  const [form, setForm] = useState(me);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(me);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const up = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const toggleInterest = (c: Category) =>
    up('interests', form.interests.includes(c) ? form.interests.filter((x) => x !== c) : [...form.interests, c]);

  const save = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Informe um nome com pelo menos 2 caracteres.';
    if (!/^@?[a-z0-9._]{3,20}$/i.test(form.handle.trim())) e.handle = 'De 3 a 20 caracteres: letras, números, ponto ou _.';
    if (form.bio.length > 160) e.bio = 'Máximo de 160 caracteres.';
    if (!form.interests.length) e.interests = 'Escolha pelo menos um interesse.';
    if (Object.values(e).some(Boolean)) return setErrors(e);
    try {
      social.updateProfile({
        name: form.name.trim(),
        handle: form.handle,
        bio: form.bio.trim(),
        location: form.location?.trim(),
        interests: form.interests,
        avatarColor: form.avatarColor,
        avatarImage: form.avatarImage,
        coverColor: form.coverColor,
      });
      toast.success('Perfil atualizado.');
      onClose();
      onSaved?.(form.handle.trim().replace(/^@/, ''));
    } catch (err) {
      const msg = (err as Error).message;
      setErrors(msg.includes('usuário') ? { handle: msg } : { form: msg });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar perfil"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Salvar alterações</Button>
        </>
      }
    >
      <div className="rounded-2xl h-24 border border-line" style={{ backgroundColor: form.coverColor }} aria-hidden />
      <div className="flex items-end gap-4 -mt-10 px-3">
        <Avatar user={form} size="lg" ring />
        <div className="flex gap-2 pb-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            id="avatar-file"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              try {
                up('avatarImage', await fileToCompressedDataUrl(f, 320, 0.85));
              } catch (err) {
                toast.error((err as Error).message);
              } finally {
                setBusy(false);
                e.target.value = '';
              }
            }}
          />
          <Button size="sm" variant="secondary" loading={busy} icon={<Camera className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
            Foto
          </Button>
          {form.avatarImage && (
            <Button size="sm" variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => up('avatarImage', undefined)}>
              Remover
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <fieldset>
          <legend className="label">Cor do avatar</legend>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Cor ${c}`}
                aria-pressed={form.avatarColor === c}
                onClick={() => up('avatarColor', c)}
                className={cn('h-8 w-8 rounded-full border-2', form.avatarColor === c ? 'border-lime' : 'border-transparent')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">Cor da capa</legend>
          <div className="flex flex-wrap gap-2">
            {COVERS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Capa ${c}`}
                aria-pressed={form.coverColor === c}
                onClick={() => up('coverColor', c)}
                className={cn('h-8 w-12 rounded-lg border-2', form.coverColor === c ? 'border-lime' : 'border-line')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </fieldset>
        <TextField label="Nome" value={form.name} onChange={(e) => up('name', e.target.value)} error={errors.name} maxLength={50} autoComplete="name" />
        <TextField label="Usuário" value={form.handle} onChange={(e) => up('handle', e.target.value)} error={errors.handle} hint="Aparece como @usuário." maxLength={21} autoComplete="off" />
        <TextArea label="Biografia" rows={3} value={form.bio} onChange={(e) => up('bio', e.target.value)} error={errors.bio} counter={{ value: form.bio.length, max: 160 }} />
        <TextField label="Localização (opcional)" value={form.location ?? ''} onChange={(e) => up('location', e.target.value)} maxLength={60} placeholder="Cidade, UF" />
        <fieldset>
          <legend className="label">Interesses</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c.id} active={form.interests.includes(c.id)} onClick={() => toggleInterest(c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>
          {errors.interests && <p className="error-text">{errors.interests}</p>}
          <p className="hint">Interesses ajudam a ordenar o feed e a escolher anúncios por categoria.</p>
        </fieldset>
        {errors.form && (
          <p role="alert" className="error-text">
            {errors.form}
          </p>
        )}
      </div>
    </Modal>
  );
}
