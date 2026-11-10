import { EmojiButton, insertAtCaret } from '@/components/posts/EmojiPicker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Info, MessageSquarePlus, MessagesSquare, Search, Send } from 'lucide-react';
import { sel, social, useSocial } from '@/services/socialService';
import { Avatar, EmptyState } from '@/components/ui/misc';
import { Button, IconButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { cn, timeAgo, timeHM } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';

function DemoBanner() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-info/25 bg-info/5 px-3 py-2 text-xs text-ink-muted">
      <Info className="h-4 w-4 text-info shrink-0 mt-px" aria-hidden />
      <span>
        <strong className="text-ink">Demonstração:</strong> as mensagens ficam salvas apenas neste navegador e não são entregues a outras pessoas até existir backend.
      </span>
    </div>
  );
}

export default function MessagesPage() {
  useDocumentTitle('Mensagens');
  const { id } = useParams();
  const navigate = useNavigate();
  const state = useSocial((s) => s);
  const [q, setQ] = useState('');
  const [newOpen, setNewOpen] = useState(false);

  const conversations = useMemo(
    () =>
      state.conversations
        .filter((c) => !state.blockedUserIds.includes(c.participantId))
        .map((c) => {
          const user = sel.user(state, c.participantId)!;
          const msgs = state.messages.filter((m) => m.conversationId === c.id);
          return { ...c, user, last: msgs[msgs.length - 1] };
        })
        .filter((c) => c.user)
        .filter((c) => {
          const t = q.trim().toLowerCase();
          return !t || c.user.name.toLowerCase().includes(t) || c.user.handle.toLowerCase().includes(t) || c.last?.text.toLowerCase().includes(t);
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [state, q],
  );

  const active = id ? state.conversations.find((c) => c.id === id) : undefined;

  return (
    <div className="lg:pt-6 lg:h-dvh lg:pb-6 flex flex-col">
      <div className="flex-1 min-h-0 lg:card lg:overflow-hidden flex">
        {/* Lista */}
        <section aria-label="Conversas" className={cn('w-full lg:w-[340px] lg:border-r border-line flex flex-col shrink-0', id && 'hidden lg:flex')}>
          <div className="p-4 space-y-3 border-b border-line">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-extrabold">Mensagens</h1>
              <IconButton label="Nova conversa" onClick={() => setNewOpen(true)}>
                <MessageSquarePlus className="h-5 w-5" />
              </IconButton>
            </div>
            <div className="relative">
              <label htmlFor="conv-q" className="sr-only">
                Buscar conversas
              </label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" aria-hidden />
              <input id="conv-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar conversas" className="field pl-9 h-10 rounded-full text-sm" />
            </div>
            <DemoBanner />
          </div>
          <ul className="flex-1 overflow-y-auto">
            {conversations.length === 0 && (
              <li className="p-6 text-center text-sm text-ink-muted">{q ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa ainda.'}</li>
            )}
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/mensagens/${c.id}`}
                  aria-current={c.id === id ? 'page' : undefined}
                  className={cn('flex items-center gap-3 px-4 py-3.5 transition-colors', c.id === id ? 'bg-lime/[.07]' : 'hover:bg-surface')}
                >
                  <Avatar user={c.user} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn('truncate flex-1', c.unread ? 'font-extrabold' : 'font-semibold')}>{c.user.name}</p>
                      <span className="text-xs text-ink-faint shrink-0">{timeAgo(c.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={cn('text-sm truncate flex-1', c.unread ? 'text-ink' : 'text-ink-muted')}>
                        {c.last ? `${c.last.authorId === state.currentUserId ? 'Você: ' : ''}${c.last.text}` : 'Comece a conversa'}
                      </p>
                      {c.unread > 0 && (
                        <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-lime text-lime-ink text-[11px] font-extrabold inline-flex items-center justify-center">
                          {c.unread}
                          <span className="sr-only"> não lidas</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Chat */}
        <section aria-label="Conversa" className={cn('flex-1 min-w-0 flex-col', id ? 'flex' : 'hidden lg:flex')}>
          {active && !state.blockedUserIds.includes(active.participantId) ? (
            <Chat conversationId={active.id} />
          ) : id ? (
            <EmptyState icon={<MessagesSquare className="h-6 w-6" />} title="Conversa não encontrada" action={<Button onClick={() => navigate('/mensagens')}>Voltar às conversas</Button>} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={<MessagesSquare className="h-6 w-6" />} title="Selecione uma conversa" action={<Button onClick={() => setNewOpen(true)}>Nova conversa</Button>}>
                Converse sobre partidas, torneios e experiências com quem você segue.
              </EmptyState>
            </div>
          )}
        </section>
      </div>
      <NewConversationModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}

function Chat({ conversationId }: { conversationId: string }) {
  const state = useSocial((s) => s);
  const conv = state.conversations.find((c) => c.id === conversationId)!;
  const user = sel.user(state, conv.participantId)!;
  const messages = state.messages.filter((m) => m.conversationId === conversationId);
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    social.markConversationRead(conversationId);
    inputRef.current?.focus();
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, conversationId]);

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      social.sendMessage(conversationId, text);
      setText('');
      setError(undefined);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  let lastDay = '';
  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] lg:h-full">
      <header className="flex items-center gap-3 px-3 lg:px-4 h-16 border-b border-line shrink-0">
        <IconButton label="Voltar às conversas" className="lg:hidden" onClick={() => navigate('/mensagens')}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <Link to={`/perfil/${user.handle}`} className="flex items-center gap-3 min-w-0 group">
          <Avatar user={user} size="sm" />
          <div className="min-w-0">
            <p className="font-bold truncate leading-tight group-hover:underline">{user.name}</p>
            <p className="text-xs text-ink-muted truncate">@{user.handle}</p>
          </div>
        </Link>
        <span className="ml-auto text-[11px] font-bold uppercase tracking-wide text-info border border-info/30 rounded-md px-1.5 py-0.5">Demo</span>
      </header>
      <div className="flex-1 overflow-y-auto px-3 lg:px-5 py-4 space-y-1.5" aria-live="polite">
        {messages.length === 0 && <p className="text-center text-sm text-ink-muted py-10">Diga olá para {user.name.split(' ')[0]} 👋</p>}
        {messages.map((m) => {
          const mine = m.authorId === state.currentUserId;
          const day = new Date(m.createdAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDay && <p className="text-center text-[11px] text-ink-faint my-3 first-letter:uppercase">{day}</p>}
              <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3.5 py-2 animate-fade-in',
                    mine ? 'bg-lime text-lime-ink rounded-br-md' : 'bg-surface text-ink rounded-bl-md',
                  )}
                >
                  <p className="text-[15px] leading-snug whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={cn('text-[10px] mt-0.5 text-right', mine ? 'text-lime-ink/70' : 'text-ink-faint')}>
                    <time dateTime={m.createdAt}>{timeHM(m.createdAt)}</time>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="border-t border-line p-3 flex items-end gap-2 shrink-0 safe-bottom">
        <label htmlFor="chat-input" className="sr-only">
          Mensagem para {user.name}
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          rows={1}
          value={text}
          maxLength={1000}
          onChange={(e) => {
            setText(e.target.value);
            setError(undefined);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Escreva uma mensagem…"
          className="field resize-none min-h-[44px] max-h-32 rounded-2xl"
        />
        <EmojiButton onPick={(e) => insertAtCaret(inputRef, text, setText, e)} placement="top" align="right" className="shrink-0 self-center" />
        <IconButton label="Enviar mensagem" type="submit" disabled={!text.trim()} className="bg-lime text-lime-ink hover:bg-lime-dim hover:text-lime-ink disabled:opacity-40 shrink-0">
          <Send className="h-5 w-5" />
        </IconButton>
      </form>
      {error && (
        <p role="alert" className="error-text px-4 pb-2">
          {error}
        </p>
      )}
    </div>
  );
}

function NewConversationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useSocial((s) => s);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const users = state.users.filter(
    (u) => u.id !== state.currentUserId && !state.blockedUserIds.includes(u.id) && (u.name.toLowerCase().includes(q.toLowerCase()) || u.handle.includes(q.toLowerCase())),
  );
  return (
    <Modal open={open} onClose={onClose} title="Nova conversa" size="sm">
      <label htmlFor="new-conv-q" className="sr-only">
        Buscar pessoa
      </label>
      <input id="new-conv-q" data-autofocus type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pessoa" className="field mb-3" />
      <ul className="space-y-1 max-h-80 overflow-y-auto">
        {users.length === 0 && <li className="text-sm text-ink-muted py-4 text-center">Ninguém encontrado.</li>}
        {users.map((u) => (
          <li key={u.id}>
            <button
              className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-surface text-left"
              onClick={() => {
                const id = social.openConversation(u.id);
                onClose();
                navigate(`/mensagens/${id}`);
                if (!state.followingIds.includes(u.id)) toast.info(`Você ainda não segue ${u.name}.`);
              }}
            >
              <Avatar user={u} size="sm" />
              <div className="min-w-0">
                <p className="font-semibold truncate">{u.name}</p>
                <p className="text-xs text-ink-muted">@{u.handle}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
