import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CreatePostModal } from '@/components/posts/CreatePostModal';
import { ReportModal, type ReportRequest } from '@/components/moderation/ReportModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ConfirmOpts {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

interface UICtx {
  openComposer: (opts?: { communityId?: string }) => void;
  openReport: (r: ReportRequest) => void;
  confirm: (o: ConfirmOpts) => void;
}

const Ctx = createContext<UICtx | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [composer, setComposer] = useState<{ open: boolean; communityId?: string }>({ open: false });
  const [report, setReport] = useState<ReportRequest | null>(null);
  const [confirmState, setConfirm] = useState<ConfirmOpts | null>(null);

  const openComposer = useCallback((opts?: { communityId?: string }) => setComposer({ open: true, communityId: opts?.communityId }), []);
  const openReport = useCallback((r: ReportRequest) => setReport(r), []);
  const confirm = useCallback((o: ConfirmOpts) => setConfirm(o), []);

  return (
    <Ctx.Provider value={{ openComposer, openReport, confirm }}>
      {children}
      <CreatePostModal open={composer.open} communityId={composer.communityId} onClose={() => setComposer({ open: false })} />
      <ReportModal request={report} onClose={() => setReport(null)} />
      <Modal
        open={!!confirmState}
        onClose={() => setConfirm(null)}
        title={confirmState?.title ?? ''}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant={confirmState?.danger ? 'danger' : 'primary'}
              onClick={() => {
                confirmState?.onConfirm();
                setConfirm(null);
              }}
            >
              {confirmState?.confirmLabel ?? 'Confirmar'}
            </Button>
          </>
        }
      >
        <div className="text-[15px] text-ink-muted">{confirmState?.message}</div>
      </Modal>
    </Ctx.Provider>
  );
}

export const useUI = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUI fora do UIProvider');
  return c;
};
