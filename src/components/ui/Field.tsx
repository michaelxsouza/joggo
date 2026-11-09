import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Base {
  label: string;
  hint?: ReactNode;
  error?: string;
  counter?: { value: number; max: number };
}

export const TextField = forwardRef<HTMLInputElement, Base & InputHTMLAttributes<HTMLInputElement>>(function TextField(
  { label, hint, error, counter, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={fid} className="label">
        {label}
      </label>
      <input
        ref={ref}
        id={fid}
        aria-invalid={!!error}
        aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined}
        className={cn('field', error && 'field-error')}
        {...rest}
      />
      <FieldFoot id={fid} hint={hint} error={error} counter={counter} />
    </div>
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, Base & TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(
  { label, hint, error, counter, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={fid} className="label">
        {label}
      </label>
      <textarea
        ref={ref}
        id={fid}
        aria-invalid={!!error}
        aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined}
        className={cn('field resize-none', error && 'field-error')}
        {...rest}
      />
      <FieldFoot id={fid} hint={hint} error={error} counter={counter} />
    </div>
  );
});

export function SelectField({ label, hint, error, className, id, children, ...rest }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={fid} className="label">
        {label}
      </label>
      <select id={fid} aria-invalid={!!error} className={cn('field appearance-none bg-no-repeat pr-9', error && 'field-error')} {...rest}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23A8B0AA' stroke-width='2'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")", backgroundPosition: 'right 12px center' }}>
        {children}
      </select>
      <FieldFoot id={fid} hint={hint} error={error} />
    </div>
  );
}

function FieldFoot({ id, hint, error, counter }: { id: string; hint?: ReactNode; error?: string; counter?: { value: number; max: number } }) {
  if (!hint && !error && !counter) return null;
  return (
    <div className="flex justify-between gap-3">
      {error ? (
        <p id={`${id}-err`} className="error-text" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : (
        <span />
      )}
      {counter && (
        <span className={cn('text-xs mt-1.5 tabular-nums', counter.value > counter.max ? 'text-danger' : 'text-ink-faint')}>
          {counter.value}/{counter.max}
        </span>
      )}
    </div>
  );
}
