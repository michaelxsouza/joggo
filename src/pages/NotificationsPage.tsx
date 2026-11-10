import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtSign, Bell, BellOff, CheckCheck, Heart, Info, MessageCircle, UserPlus, Users } from 'lucide-react';
import { sel, social, useSocial } from '@/services/socialService';
import type { AppNotification } from '@/types/social';
import { Avatar, EmptyState, Tabs } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/AppShell';
import { useToast } from '@/components/ui/Toast';
import { cn, timeAgo } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';

const ICON = {
  like: { icon: Heart, cls: 'text-[#FF5C7A] bg-[#FF5C7A]/10' },
  comment: { icon: MessageCircle, cls: 'text-info bg-info/10' },
  follow: { icon: UserPlus, cls: 'text-lime bg-lime/10' },
  community: { icon: Users, cls: 'text-warn bg-warn/10' },
  system: { icon: Info, cls: 'text-ink-muted bg-surface' },
  mention: { icon: AtSign, cls: 'text-lime bg-lime/10' },
};

export default function NotificationsPage() {
  useDocumentTitle('Notificações');
  const state = useSocial((s) => s);
  const [tab, setTab] = useState<'todas' | 'nao-lidas'>('todas');
  const navigate = useNavigate();
  const toast = useToast();
  const unread = sel.unreadNotifications(state);
  const list = state.notifications
    .filter((n) => !n.actorId || !state.blockedUserIds.includes(n.actorId))
    .filter((n) => tab === 'todas' || !n.read)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const open = (n: AppNotification) => {
    social.markNotification(n.id);
    const actor = n.actorId ? sel.user(state, n.actorId) : undefined;
    if (n.postId) navigate(`/post/${n.postId}`);
    else if (n.type === 'follow' && actor) navigate(`/perfil/${actor.handle}`);
    else if (n.communityId) {
      const c = sel.community(state, n.communityId);
      if (c) navigate(`/comunidades/${c.slug}`);
    } else if (n.type === 'system') navigate('/regras');
  };

  return (
    <div>
      <PageHeader
        title="Notificações"
        subtitle={unread ? `${unread} não lida(s)` : 'Tudo em dia'}
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={<CheckCheck className="h-4 w-4" />}
            disabled={!unread}
            onClick={() => {
              social.markAllNotifications();
              toast.success('Todas as notificações foram marcadas como lidas.');
            }}
          >
            <span className="hidden sm:inline">Marcar todas como lidas</span>
            <span className="sm:hidden">Ler todas</span>
          </Button>
        }
      />
      <Tabs
        label="Filtro de notificações"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'todas', label: 'Todas' },
          { id: 'nao-lidas', label: `Não lidas${unread ? ` (${unread})` : ''}` },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon={tab === 'nao-lidas' ? <BellOff className="h-6 w-6" /> : <Bell className="h-6 w-6" />} title={tab === 'nao-lidas' ? 'Nenhuma notificação não lida' : 'Sem notificações'}>
          Quando alguém curtir, comentar ou seguir você, aparecerá aqui.
        </EmptyState>
      ) : (
        <ul className="px-3 lg:px-0 py-3 space-y-2">
          {list.map((n) => {
            const actor = n.actorId ? sel.user(state, n.actorId) : undefined;
            const I = ICON[n.type];
            return (
              <li key={n.id}>
                <button
                  onClick={() => open(n)}
                  className={cn(
                    'w-full text-left flex items-start gap-3 rounded-2xl border p-3.5 transition-colors',
                    n.read ? 'border-line bg-card hover:bg-surface' : 'border-lime/25 bg-lime/[.05] hover:bg-lime/[.08]',
                  )}
                >
                  <span className={cn('h-9 w-9 rounded-full inline-flex items-center justify-center shrink-0', I.cls)} aria-hidden>
                    <I.icon className="h-[18px] w-[18px]" />
                  </span>
                  {actor && <Avatar user={actor} size="sm" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] leading-snug">
                      {actor && <strong>{actor.name} </strong>}
                      <span className={n.read ? 'text-ink-muted' : 'text-ink'}>{n.text}</span>
                    </p>
                    <p className="text-xs text-ink-faint mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <span className="h-2.5 w-2.5 rounded-full bg-lime mt-2 shrink-0">
                      <span className="sr-only">Não lida</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
