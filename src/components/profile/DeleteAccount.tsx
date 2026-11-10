import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SectionCard } from '@/components/ui/misc';
import { supabase } from '@/lib/supabase';
import { auth } from '@/services/authService';
import { sel, useSocial } from '@/services/socialService';

/** Apaga as imagens enviadas pela pessoa (pasta media/<uid>/...). Melhor esforço. */
async function deleteMyFiles(uid: string) {
  const bucket = supabase.storage.from('media');
  for (const folder of ['posts', 'avatar', 'cover']) {
    const { data } = await bucket.list(`${uid}/${folder}`, { limit: 1000 });
    const paths = (data ?? []).map((f) => `${uid}/${folder}/${f.name}`);
    if (paths.length) await bucket.remove(paths);
  }
}

/** "Excluir minha conta": confirmação digitando o @usuário. */
export function DeleteAccountSection() {
  const me = useSocial(sel.me);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const ok = typed.trim().replace(/^@/, '').toLowerCase() === me.handle.toLowerCase();

  const confirm = async () => {
    setLoading(true);
    setError(undefined);
    try {
      await deleteMyFiles(me.id).catch(() => undefined);
      const { error: e } = await supabase.rpc('delete_my_account');
      if (e) throw e;
      await auth.signOut();
      window.location.hash = '#/entrar';
    } catch {
      setError('Não foi possível excluir agora. Tente novamente em alguns minutos.');
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Excluir minha conta">
      <p className="text-sm text-ink-muted">
        Apaga para sempre seu perfil, publicações, bilhetes e histórico de acertos, comentários, curtidas, mensagens e imagens. Essa ação não pode ser desfeita.
      </p>
      <Button variant="danger" size="sm" className="mt-3" icon={<Trash2 className="h-4 w-4" />} onClick={() => setOpen(true)}>
        Excluir minha conta
      </Button>
      <Modal
        open={open}
        onClose={() => !loading && setOpen(false)}
        title="Excluir sua conta?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="danger" disabled={!ok} loading={loading} onClick={() => void confirm()}>
              Excluir para sempre
            </Button>
          </>
        }
      >
        <p className="text-[15px] text-ink-muted">
          Tudo o que você publicou na Joggo será apagado imediatamente, incluindo seu histórico de bilhetes. <strong className="text-ink">Não dá para recuperar depois.</strong>
        </p>
        <label className="block mt-4">
          <span className="label block">
            Para confirmar, digite seu usuário: <strong className="text-ink">@{me.handle}</strong>
          </span>
          <input className="field" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="none" placeholder={`@${me.handle}`} />
        </label>
        {error && (
          <p role="alert" className="error-text mt-3">
            {error}
          </p>
        )}
      </Modal>
    </SectionCard>
  );
}
