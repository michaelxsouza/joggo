import { useState } from 'react';
import { Download, Share, SquarePlus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { promptInstall, useInstallMode } from '@/lib/pwa';

/** Cartão "Instale a Joggo no celular" (some quando já está instalado). */
export function InstallAppCard({ compact = false }: { compact?: boolean }) {
  const mode = useInstallMode();
  const [iosHelp, setIosHelp] = useState(false);
  const toast = useToast();
  if (mode === 'installed') return null;

  const install = async () => {
    if (mode === 'prompt') {
      const ok = await promptInstall();
      if (ok) toast.success('Joggo instalada! Procure o ícone na sua tela inicial.');
    } else setIosHelp(true);
  };

  return (
    <>
      <div className={compact ? 'card p-4' : 'rounded-2xl border border-line bg-surface p-4'}>
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="" className="h-11 w-11 rounded-xl border border-line" />
          <div className="flex-1 min-w-0">
            <p className="font-bold">Joggo no seu celular</p>
            <p className="text-sm text-ink-muted">Abra direto da tela inicial, em tela cheia, como um app.</p>
          </div>
        </div>
        <Button block size="sm" className="mt-3" icon={<Download className="h-4 w-4" />} onClick={() => void install()}>
          {mode === 'prompt' ? 'Instalar app' : 'Como instalar'}
        </Button>
      </div>
      <Modal open={iosHelp} onClose={() => setIosHelp(false)} title="Instalar a Joggo" size="sm">
        <ol className="space-y-4 text-[15px]">
          <li className="flex gap-3">
            <Share className="h-5 w-5 text-lime shrink-0 mt-0.5" />
            <span>
              No <strong>iPhone (Safari)</strong>, toque em <strong>Compartilhar</strong>, o quadrado com a seta para cima.
            </span>
          </li>
          <li className="flex gap-3">
            <SquarePlus className="h-5 w-5 text-lime shrink-0 mt-0.5" />
            <span>
              Role e toque em <strong>Adicionar à Tela de Início</strong> e depois em <strong>Adicionar</strong>.
            </span>
          </li>
          <li className="flex gap-3">
            <Smartphone className="h-5 w-5 text-lime shrink-0 mt-0.5" />
            <span>
              No <strong>Android (Chrome)</strong>, toque nos <strong>três pontinhos</strong> e em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.
            </span>
          </li>
        </ol>
        <Button block className="mt-5" onClick={() => setIosHelp(false)}>
          Entendi
        </Button>
      </Modal>
    </>
  );
}
