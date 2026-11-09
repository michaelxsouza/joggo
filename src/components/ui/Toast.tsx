import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn, uid } from '@/lib/utils';

type Kind = 'success' | 'error' | 'info';
interface Toast {
  id: string;
  kind: Kind;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface Ctx {
  toast: (message: string, opts?: { kind?: Kind; action?: Toast['action'] }) => void;
  success: (m: string, action?: Toast['action']) => void;
  error: (m: string) => void;
  info: (m: string) => void;
}

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const dismiss = useCallback((id: string) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const toast = useCallback<Ctx['toast']>(
    (message, opts) => {
      const id = uid('t');
      setItems((l) => [...l.slice(-2), { id, message, kind: opts?.kind ?? 'info', action: opts?.action }]);
      window.setTimeout(() => dismiss(id), opts?.action ? 6000 : 3800);
    },
    [dismiss],
  );
  const value: Ctx = {
    toast,
    success: (m, action) => toast(m, { kind: 'success', action }),
    error: (m) => toast(m, { kind: 'error' }),
    info: (m) => toast(m, { kind: 'info' }),
  };
  const Icon = { success: CheckCircle2, error: AlertTriangle, info: Info };
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="fixed z-[80] left-1/2 -translate-x-1/2 bottom-24 lg:bottom-6 flex flex-col gap-2 w-[min(92vw,420px)] pointer-events-none"
      >
        {items.map((t) => {
          const I = Icon[t.kind];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line bg-surface/95 backdrop-blur px-4 py-3 shadow-pop animate-slide-up"
            >
              <I
                className={cn('h-5 w-5 shrink-0', t.kind === 'success' && 'text-lime', t.kind === 'error' && 'text-danger', t.kind === 'info' && 'text-info')}
                aria-hidden
              />
              <p className="text-sm flex-1">{t.message}</p>
              {t.action && (
                <button
                  className="text-sm font-bold text-lime hover:underline"
                  onClick={() => {
                    t.action!.onClick();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button aria-label="Fechar aviso" className="text-ink-muted hover:text-ink p-1" onClick={() => dismiss(t.id)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => {
  const c = useContext(ToastCtx);
  if (!c) throw new Error('useToast fora do ToastProvider');
  return c;
};
