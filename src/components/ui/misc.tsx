import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import type { User } from '@/types/social';
import { IconButton } from './Button';

// ---------- Avatar ----------
const avatarSizes = { xs: 'h-7 w-7 text-[11px]', sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-lg', xl: 'h-24 w-24 sm:h-28 sm:w-28 text-2xl' };

export function Avatar({ user, size = 'md', className, ring }: { user: Pick<User, 'name' | 'avatarColor' | 'avatarImage'>; size?: keyof typeof avatarSizes; className?: string; ring?: boolean }) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white overflow-hidden select-none',
        avatarSizes[size],
        ring && 'ring-4 ring-bg',
        className,
      )}
      style={{ backgroundColor: user.avatarColor }}
      aria-hidden
    >
      {user.avatarImage ? <img src={user.avatarImage} alt="" className="h-full w-full object-cover" /> : initials(user.name)}
    </span>
  );
}

// ---------- Chip (filtro) ----------
export function Chip({ active, children, onClick, icon }: { active?: boolean; children: ReactNode; onClick?: () => void; icon?: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap',
        active ? 'bg-lime text-lime-ink border-lime' : 'bg-surface text-ink-muted border-line hover:text-ink hover:border-ink-faint',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

// ---------- Tabs ----------
export function Tabs<T extends string>({ tabs, value, onChange, className, label }: { tabs: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string; label: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div role="tablist" aria-label={label} className={cn('flex border-b border-line', className)}>
      {tabs.map((t, i) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => (refs.current[i] = el)}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
                onChange(tabs[n]!.id);
                refs.current[n]?.focus();
              }
            }}
            className={cn(
              'relative flex-1 h-12 text-[15px] font-semibold transition-colors',
              active ? 'text-ink' : 'text-ink-muted hover:text-ink',
            )}
          >
            {t.label}
            <span className={cn('absolute left-1/2 -translate-x-1/2 bottom-0 h-[3px] rounded-full bg-lime transition-all', active ? 'w-12' : 'w-0')} />
          </button>
        );
      })}
    </div>
  );
}

// ---------- Estado vazio ----------
export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-14 animate-fade-in">
      <div className="h-14 w-14 rounded-2xl bg-surface border border-line flex items-center justify-center text-ink-muted mb-4">{icon}</div>
      <h3 className="font-bold text-lg">{title}</h3>
      {children && <p className="text-ink-muted text-sm mt-1.5 max-w-sm">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------- Badge ----------
export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'lime' | 'warn' | 'danger' | 'info'; className?: string }) {
  const tones = {
    neutral: 'bg-surface text-ink-muted border-line',
    lime: 'bg-lime/10 text-lime border-lime/25',
    warn: 'bg-warn/10 text-warn border-warn/25',
    danger: 'bg-danger/10 text-danger border-danger/25',
    info: 'bg-info/10 text-info border-info/25',
  };
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide', tones[tone], className)}>{children}</span>;
}

// ---------- Toggle ----------
export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <label htmlFor={id} className="font-semibold text-[15px] cursor-pointer">
          {label}
        </label>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors border', checked ? 'bg-lime border-lime' : 'bg-surface border-line')}
      >
        <span className={cn('absolute top-0.5 h-[22px] w-[22px] rounded-full transition-all', checked ? 'left-[22px] bg-lime-ink' : 'left-0.5 bg-ink-muted')} />
      </button>
    </div>
  );
}

// ---------- Menu suspenso (teclado) ----------
export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

export function Menu({ items, label = 'Mais opções', align = 'right', trigger }: { items: MenuItem[]; label?: string; align?: 'left' | 'right'; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const first = list.current?.querySelector<HTMLElement>('[role=menuitem]');
    first?.focus();
    const onDoc = (e: MouseEvent) => {
      if (!list.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const onKey = (e: React.KeyboardEvent) => {
    const els = Array.from(list.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? []);
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      els[(i + 1) % els.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      els[(i - 1 + els.length) % els.length]?.focus();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
      btn.current?.focus();
    } else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className="relative">
      {trigger ? (
        <button ref={btn} aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} aria-label={label} onClick={() => setOpen((o) => !o)}>
          {trigger}
        </button>
      ) : (
        <IconButton ref={btn} label={label} size="sm" aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((o) => !o)}>
          <MoreHorizontal className="h-5 w-5" />
        </IconButton>
      )}
      {open && (
        <div
          ref={list}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onKey}
          className={cn('absolute z-40 mt-1 min-w-[220px] rounded-2xl border border-line bg-surface p-1.5 shadow-pop animate-pop-in', align === 'right' ? 'right-0' : 'left-0')}
        >
          {items.map((it) => (
            <button
              key={it.label}
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                setOpen(false);
                it.onSelect();
              }}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left outline-none',
                it.danger ? 'text-danger hover:bg-danger/10 focus:bg-danger/10' : 'text-ink hover:bg-surface-2 focus:bg-surface-2',
              )}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Seção de card ----------
export function SectionCard({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('card p-4', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h2 className="font-bold text-[15px]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function DemoNote({ children, className }: { children?: ReactNode; className?: string }) {
  return <p className={cn('text-[11px] text-ink-faint', className)}>{children ?? 'Dados demonstrativos.'}</p>;
}
