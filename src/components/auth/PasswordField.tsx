import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PasswordField = forwardRef<HTMLInputElement, { label: string; error?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>>(function PasswordField(
  { label, error, hint, className, ...rest },
  ref,
) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-ink-muted pointer-events-none" aria-hidden />
        <input
          ref={ref}
          id={id}
          type={show ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={cn('field h-12 pl-11 pr-12', error && 'field-error')}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={show}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink"
        >
          {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-err`} role="alert" className="error-text">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export const IconField = forwardRef<HTMLInputElement, { label: string; error?: string; hint?: string; icon: React.ReactNode } & InputHTMLAttributes<HTMLInputElement>>(function IconField(
  { label, error, hint, icon, className, ...rest },
  ref,
) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" aria-hidden>
          {icon}
        </span>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={cn('field h-12 pl-11', error && 'field-error')}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${id}-err`} role="alert" className="error-text">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
