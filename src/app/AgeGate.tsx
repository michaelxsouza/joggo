import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/brand/Logo';
import { safeGet, safeSet } from '@/lib/store';

const KEY = 'joggo:age-ok';

/** Confirmação de idade (autodeclaração). Não é verificação de identidade. */
export function AgeGate() {
  const [ok, setOk] = useState(() => safeGet(KEY) === '1');
  const [denied, setDenied] = useState(false);
  if (ok) return null;
  return (
    <Modal open onClose={() => undefined} dismissible={false} title={denied ? 'Conteúdo para maiores de 18 anos' : 'Boas-vindas à Joggo'} size="sm" sheet={false}>
      <div className="flex justify-center my-2">
        <Logo height={40} />
      </div>
      <p className="text-center text-ink-muted text-[15px] mt-2">Seu jogo. Sua comunidade.</p>
      {denied ? (
        <p className="mt-5 text-[15px] text-ink-muted text-center">
          A Joggo é exclusiva para maiores de 18 anos. Volte quando tiver a idade mínima.
        </p>
      ) : (
        <>
          <div className="mt-5 rounded-2xl border border-line bg-surface p-4 flex gap-3">
            <ShieldCheck className="h-5 w-5 text-lime shrink-0 mt-0.5" />
            <p className="text-sm text-ink-muted">
              Esta é uma rede social para adultos que gostam de jogos. Aqui não há apostas, depósitos ou saques. Jogue com responsabilidade.
            </p>
          </div>
          <p className="mt-5 font-semibold text-center">Você tem 18 anos ou mais?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDenied(true)}>
              Não
            </Button>
            <Button
              data-autofocus
              onClick={() => {
                safeSet(KEY, '1');
                setOk(true);
              }}
            >
              Sim, tenho 18+
            </Button>
          </div>
          <p className="text-[11px] text-ink-faint text-center mt-4">Protótipo com dados demonstrativos. A confirmação é uma autodeclaração.</p>
        </>
      )}
      {denied && (
        <Button variant="ghost" block className="mt-4" onClick={() => setDenied(false)}>
          Voltar
        </Button>
      )}
    </Modal>
  );
}
