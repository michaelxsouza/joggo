import { useEffect, useRef, useState, type RefObject } from 'react';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

// Leve e sem dependências: uma seleção dos emojis mais usados, com uma aba para o nosso nicho.
const GROUPS: { id: string; label: string; icon: string; emojis: string }[] = [
  { id: 'joggo', label: 'Jogo', icon: '⚽', emojis: '⚽ 🏀 🏈 ⚾ 🎾 🏐 🏒 🥊 🏎️ 🏆 🥇 🥈 🥉 🎯 🎲 🃏 ♠️ ♥️ ♦️ ♣️ 🎰 🎡 🪙 💰 💵 💸 📈 📉 ✅ ❌ 🟢 🔴 💚 ❤️ 🔥 🍀 🎟️ 🧾 📊 ⏱️ 🔒 🚀 💎 👑 🙏 🤞 💪 👏 🙌' },
  { id: 'rostos', label: 'Rostos', icon: '😀', emojis: '😀 😃 😄 😁 😆 😅 🤣 😂 🙂 😉 😊 😇 🥰 😍 🤩 😘 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 😮‍💨 🤥 😌 😔 😪 😴 😷 🤒 🤕 🥵 🥶 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 💀 🤡 👻 👽 🤖' },
  { id: 'gestos', label: 'Gestos', icon: '👍', emojis: '👍 👎 👊 ✊ 🤛 🤜 🤝 👏 🙌 👐 🤲 🙏 ✌️ 🤟 🤘 👌 🤌 🤏 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 🤙 💪 🫡 🫶 👀 🧠 🗣️' },
  { id: 'simbolos', label: 'Símbolos', icon: '❤️', emojis: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ❤️‍🔥 💯 💢 💥 💫 💦 💨 ⭐ 🌟 ✨ ⚡ 🔥 🌈 ☀️ 🌙 🎉 🎊 🎁 🏁 🚩 ⚠️ ⛔ 🆕 🆗 🆒 🔝 🔜 ➕ ➖ ✖️ ❗ ❓ 💬 🗯️ 💤' },
  { id: 'comida', label: 'Comida', icon: '🍺', emojis: '🍺 🍻 🥂 🍷 🥃 🍸 🍹 🧉 ☕ 🥤 🍕 🍔 🌭 🍟 🌮 🥩 🍗 🥪 🍿 🍩 🍫 🍰 🎂 🍉 🍓 🍌 🥑 🌶️' },
];

/** Insere texto na posição do cursor do textarea e devolve o cursor para depois dele. */
export function insertAtCaret(ref: RefObject<HTMLTextAreaElement>, value: string, setValue: (v: string) => void, insert: string) {
  const el = ref.current;
  const start = el?.selectionStart ?? value.length;
  const end = el?.selectionEnd ?? value.length;
  const next = value.slice(0, start) + insert + value.slice(end);
  setValue(next);
  const pos = start + insert.length;
  requestAnimationFrame(() => {
    if (!el) return;
    el.focus();
    el.setSelectionRange(pos, pos);
  });
}

/** Botão de emoji com painel. `placement` define se o painel abre para cima ou para baixo. */
export function EmojiButton({ onPick, placement = 'bottom', align = 'left', className }: { onPick: (emoji: string) => void; placement?: 'top' | 'bottom'; align?: 'left' | 'right'; className?: string }) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState(GROUPS[0]!.id);
  const box = useRef<HTMLDivElement>(null);

  // fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const current = GROUPS.find((g) => g.id === group)!;

  return (
    <div ref={box} className={cn('relative', className)}>
      <button
        type="button"
        aria-label="Inserir emoji"
        aria-expanded={open}
        title="Emoji"
        onMouseDown={(e) => e.preventDefault()} // mantém o cursor no texto
        onClick={() => setOpen((v) => !v)}
        className={cn('grid h-9 w-9 place-items-center rounded-full text-ink-muted hover:text-lime hover:bg-surface', open && 'text-lime bg-surface')}
      >
        <Smile className="h-5 w-5" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Escolher emoji"
          className={cn(
            'z-50 rounded-2xl border border-line bg-bg shadow-pop',
            // celular: painel fixo e centralizado, nunca sai da tela
            'max-sm:fixed max-sm:inset-x-4 max-sm:bottom-24',
            'sm:absolute sm:w-[300px]',
            placement === 'top' ? 'sm:bottom-full sm:mb-2' : 'sm:top-full sm:mt-2',
            align === 'right' ? 'sm:right-0' : 'sm:left-0',
          )}
        >
          <div className="flex border-b border-line px-1" role="tablist">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={group === g.id}
                title={g.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setGroup(g.id)}
                className={cn('flex-1 h-10 text-lg border-b-2 -mb-px', group === g.id ? 'border-lime' : 'border-transparent opacity-60 hover:opacity-100')}
              >
                {g.icon}
              </button>
            ))}
          </div>
          <p className="px-3 pt-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">{current.label}</p>
          <div className="grid grid-cols-8 gap-0.5 p-2 max-h-56 justify-items-center overflow-y-auto">
            {current.emojis.split(' ').map((e) => (
              <button
                key={e}
                type="button"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => onPick(e)}
                className="h-9 w-9 grid place-items-center rounded-lg text-[22px] hover:bg-surface"
                aria-label={e}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
