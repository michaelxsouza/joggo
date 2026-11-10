import { Fragment, useMemo, useState, type KeyboardEvent, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useSocial } from '@/services/socialService';
import { Avatar } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

const MENTION_RE = /(@[A-Za-z0-9._]{3,24})/g;

/** Texto com @usuário virando link para o perfil (só para quem existe na Joggo). */
export function RichText({ text }: { text: string }) {
  const handles = useSocial((s) => s.users);
  const set = useMemo(() => new Set(handles.map((u) => u.handle.toLowerCase())), [handles]);
  const parts = text.split(MENTION_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          const raw = part.slice(1);
          const handle = raw.replace(/\.+$/, '');
          const trail = raw.slice(handle.length);
          if (set.has(handle.toLowerCase()))
            return (
              <Fragment key={i}>
                <Link to={`/perfil/${handle.toLowerCase()}`} className="text-lime font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>
                  @{handle}
                </Link>
                {trail}
              </Fragment>
            );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/**
 * Autocompletar ao digitar @ num textarea.
 * Uso: const m = useMentionPicker(ref, text, setText); <textarea onChange={(e) => { setText(e.target.value); m.onInput(e.target); }} onKeyDown={(e) => { if (m.onKeyDown(e)) return; ... }} /> {m.popover}
 */
export function useMentionPicker(ref: RefObject<HTMLTextAreaElement>, value: string, setValue: (v: string) => void, opts?: { placement?: 'top' | 'bottom' }) {
  const users = useSocial((s) => s.users.filter((u) => u.id !== s.currentUserId && !s.blockedUserIds.includes(u.id) && !u.banned));
  const [query, setQuery] = useState<{ start: number; q: string } | null>(null);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    if (!query) return [];
    const q = query.q;
    return users
      .filter((u) => !q || u.handle.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
      .sort((a, b) => Number(b.handle.toLowerCase().startsWith(q)) - Number(a.handle.toLowerCase().startsWith(q)))
      .slice(0, 6);
  }, [users, query]);

  const onInput = (el: HTMLTextAreaElement) => {
    const caret = el.selectionStart ?? el.value.length;
    const m = el.value.slice(0, caret).match(/(^|\s)@([A-Za-z0-9._]{0,24})$/);
    setQuery(m ? { start: caret - m[2]!.length - 1, q: m[2]!.toLowerCase() } : null);
    setActive(0);
  };

  const pick = (handle: string) => {
    const el = ref.current;
    if (!el || !query) return;
    const caret = el.selectionStart ?? value.length;
    const next = value.slice(0, query.start) + '@' + handle + ' ' + value.slice(caret);
    setValue(next);
    setQuery(null);
    const pos = query.start + handle.length + 2;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  /** Retorna true quando a tecla foi usada pela lista (o textarea não deve tratar). */
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!matches.length) return false;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length);
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      pick(matches[active]!.handle);
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setQuery(null);
      return true;
    }
    return false;
  };

  const popover =
    matches.length > 0 ? (
      <ul
        role="listbox"
        aria-label="Marcar pessoa"
        className={cn(
          'absolute left-0 right-0 z-50 max-h-64 overflow-y-auto rounded-2xl border border-line bg-bg shadow-pop p-1',
          opts?.placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-1',
        )}
      >
        {matches.map((u, i) => (
          <li key={u.id} role="option" aria-selected={i === active}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(u.handle);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn('w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left', i === active ? 'bg-surface' : '')}
            >
              <Avatar user={u} size="xs" />
              <span className="min-w-0">
                <span className="block text-sm font-bold truncate">{u.name}</span>
                <span className="block text-xs text-ink-muted truncate">@{u.handle}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return { onInput, onKeyDown, popover, close: () => setQuery(null) };
}
