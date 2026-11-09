import { useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { Send, Trash2 } from 'lucide-react';
import { sel, social, useSocial } from '@/services/socialService';
import { Avatar } from '@/components/ui/misc';
import { IconButton } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { timeAgo } from '@/lib/utils';

export function CommentsSection({ postId, inputRef }: { postId: string; inputRef?: RefObject<HTMLTextAreaElement> }) {
  const comments = useSocial((s) => sel.commentsOf(s, postId));
  const users = useSocial((s) => s.users);
  const me = useSocial(sel.me);
  const toast = useToast();
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      social.addComment(postId, text);
      setText('');
      setError(undefined);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-line animate-fade-in">
      {comments.length === 0 && <p className="text-sm text-ink-muted mb-3">Nenhum comentário ainda. Comece a conversa!</p>}
      <ul className="space-y-3 mb-3">
        {comments.map((c) => {
          const u = users.find((x) => x.id === c.authorId);
          if (!u) return null;
          return (
            <li key={c.id} className="flex gap-2.5 group">
              <Link to={`/perfil/${u.handle}`} aria-label={`Perfil de ${u.name}`}>
                <Avatar user={u} size="sm" />
              </Link>
              <div className="flex-1 min-w-0 rounded-2xl bg-surface px-3.5 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <Link to={`/perfil/${u.handle}`} className="font-bold hover:underline">
                    {u.name}
                  </Link>
                  <span className="text-ink-faint text-xs">{timeAgo(c.createdAt)}</span>
                  {u.id === me.id && (
                    <button
                      className="ml-auto text-ink-faint hover:text-danger p-1"
                      aria-label="Excluir comentário"
                      onClick={() => {
                        social.deleteComment(c.id);
                        toast.success('Comentário excluído.');
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[14px] leading-relaxed mt-0.5 break-words whitespace-pre-wrap">{c.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <form onSubmit={submit} className="flex items-end gap-2">
        <Avatar user={me} size="sm" />
        <div className="flex-1">
          <label htmlFor={`c-${postId}`} className="sr-only">
            Escreva um comentário
          </label>
          <textarea
            id={`c-${postId}`}
            ref={inputRef}
            rows={1}
            value={text}
            maxLength={500}
            onChange={(e) => {
              setText(e.target.value);
              setError(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Escreva um comentário…"
            className="field py-2 min-h-[40px] resize-none"
          />
        </div>
        <IconButton label="Enviar comentário" type="submit" disabled={!text.trim()} className="text-lime disabled:opacity-40">
          <Send className="h-5 w-5" />
        </IconButton>
      </form>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}
