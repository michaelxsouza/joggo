import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './Button';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

let openCount = 0;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Em telas pequenas, abre como folha inferior. */
  sheet?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
  dismissible?: boolean;
}

const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

/** Modal acessível: foco preso, fecha com Esc, devolve o foco ao fechar. */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', sheet = true, initialFocus, dismissible = true }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    openCount++;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => {
      const target = initialFocus?.current ?? ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? ref.current?.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? ref.current)?.focus();
    }, 20);
    const onKey = (e: KeyboardEvent) => {
      if (!ref.current) return;
      // Apenas o modal mais recente reage.
      const dialogs = document.querySelectorAll('[data-modal-root]');
      if (dialogs[dialogs.length - 1] !== ref.current) return;
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        onCloseRef.current();
      }
      if (e.key === 'Tab') {
        const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0]!;
        const last = items[items.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      openCount--;
      if (openCount <= 0) document.body.style.overflow = '';
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px] animate-fade-in"
        onClick={() => dismissible && onClose()}
        aria-hidden
      />
      <div
        ref={ref}
        data-modal-root
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-card border border-line shadow-pop flex flex-col max-h-[92dvh] outline-none',
          sheet ? 'rounded-t-3xl sm:rounded-2xl animate-slide-up sm:animate-pop-in' : 'rounded-2xl m-4 animate-pop-in',
          widths[size],
        )}
      >
        <div className="flex items-start gap-3 px-5 pt-5 pb-3">
          <div className="flex-1 min-w-0">
            <h2 id={titleId} className="text-lg font-bold leading-tight">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-ink-muted mt-1">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <IconButton label="Fechar" size="sm" onClick={onClose} className="-mr-1 -mt-1">
              <X className="h-5 w-5" />
            </IconButton>
          )}
        </div>
        <div className="px-5 pb-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-line flex flex-wrap justify-end gap-2 safe-bottom">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
