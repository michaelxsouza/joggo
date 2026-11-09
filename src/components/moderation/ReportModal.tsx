import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { social } from '@/services/socialService';
import { ads } from '@/services/adsService';
import type { ReportTarget } from '@/types/social';
import { cn } from '@/lib/utils';

export interface ReportRequest {
  target: ReportTarget;
  id: string;
  /** Nome amigável do alvo (ex.: "publicação de Ana"). */
  name: string;
  /** Para usuários: permite bloquear junto. */
  userId?: string;
}

const REASONS: Record<ReportTarget, string[]> = {
  post: [
    'Spam ou golpe',
    'Promessa de lucro ou ganho garantido',
    'Pedido de dinheiro ou dados pessoais',
    'Assédio ou discurso de ódio',
    'Envolve menores de idade',
    'Incentivo ao jogo irresponsável',
    'Outro motivo',
  ],
  comment: ['Spam ou golpe', 'Assédio ou discurso de ódio', 'Pedido de dinheiro ou dados pessoais', 'Outro motivo'],
  user: ['Perfil falso ou golpe', 'Assédio', 'Parece ser menor de 18 anos', 'Pedido de dinheiro', 'Outro motivo'],
  ad: [
    'Enganoso ou promete ganhos',
    'Conteúdo impróprio',
    'Parece direcionado a menores',
    'Repetitivo ou irrelevante',
    'Link suspeito',
    'Outro motivo',
  ],
};

export function ReportModal({ request, onClose }: { request: ReportRequest | null; onClose: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setReason('');
    setDetails('');
    setAlsoBlock(false);
    setError(undefined);
  }, [request]);

  if (!request) return null;
  const reasons = REASONS[request.target];

  const submit = () => {
    if (!reason) return setError('Escolha um motivo para continuar.');
    if (reason === 'Outro motivo' && details.trim().length < 5) return setError('Descreva brevemente o motivo.');
    try {
      if (request.target === 'ad') {
        ads.report(request.id, reason);
        toast.success('Anúncio denunciado e ocultado. Nossa equipe vai revisar.');
      } else {
        social.report(request.target, request.id, reason, details.trim() || undefined);
        if (request.target === 'post') social.hidePost(request.id);
        if (alsoBlock && request.userId) social.block(request.userId);
        toast.success(alsoBlock ? 'Denúncia enviada e usuário bloqueado.' : 'Denúncia enviada. Obrigado por ajudar a comunidade.');
      }
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Denunciar"
      description={`Por que você está denunciando ${request.name}?`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={submit}>
            Enviar denúncia
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="sr-only">Motivo</legend>
        <div className="space-y-1.5">
          {reasons.map((r) => (
            <label
              key={r}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3.5 py-3 cursor-pointer transition-colors',
                reason === r ? 'border-lime/60 bg-lime/5' : 'border-line hover:bg-surface',
              )}
            >
              <input
                type="radio"
                name="report-reason"
                value={r}
                checked={reason === r}
                onChange={() => {
                  setReason(r);
                  setError(undefined);
                }}
                className="accent-[#B0FF35] h-4 w-4"
              />
              <span className="text-[15px]">{r}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {request.target !== 'ad' && (
        <TextArea label="Detalhes (opcional)" className="mt-4" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} counter={{ value: details.length, max: 300 }} maxLength={300} />
      )}
      {request.userId && (
        <label className="flex items-center gap-3 mt-4 text-[15px] cursor-pointer">
          <input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} className="accent-[#B0FF35] h-4 w-4" />
          Também bloquear este usuário
        </label>
      )}
      {error && (
        <p role="alert" className="error-text mt-3">
          {error}
        </p>
      )}
      <p className="text-[11px] text-ink-faint mt-4">Demonstração: a denúncia é registrada neste navegador. Com backend, ela irá para a fila de moderação.</p>
    </Modal>
  );
}
