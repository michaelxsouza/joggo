import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, ChevronRight, LogOut, Flag, HeartHandshake, Pencil, ScrollText, ShieldAlert, ShieldCheck } from 'lucide-react';
import { sel, social, useSocial } from '@/services/socialService';
import { Avatar, SectionCard, Toggle } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { PageHeader } from '@/components/layout/AppShell';
import { useToast } from '@/components/ui/Toast';
import { timeAgo } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { auth } from '@/services/authService';
import { InstallAppCard } from '@/components/layout/InstallApp';

export default function SettingsPage() {
  useDocumentTitle('Configurações');
  const state = useSocial((s) => s);
  const me = sel.me(state);
  const isMod = sel.isModerator(state);
  const prefs = state.notificationPrefs;
  const [editing, setEditing] = useState(false);
  const toast = useToast();

  const setPref = (k: keyof typeof prefs, label: string) => (v: boolean) => {
    social.setNotificationPrefs({ [k]: v });
    toast.success(`${label}: ${v ? 'ativado' : 'desativado'}.`);
  };

  const blocked = state.blockedUserIds.map((id) => sel.user(state, id)).filter(Boolean);

  return (
    <div>
      <PageHeader title="Configurações" />
      <div className="px-3 lg:px-0 space-y-4">
        <SectionCard title="Perfil">
          <div className="flex items-center gap-3">
            <Avatar user={me} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{me.name}</p>
              <p className="text-sm text-ink-muted truncate">@{me.handle}</p>
            </div>
            <Button variant="secondary" size="sm" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>
              Editar
            </Button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            icon={<LogOut className="h-4 w-4" />}
            onClick={() => {
              void auth.signOut();
              toast.success('Você saiu da sua conta.');
            }}
          >
            Sair da conta
          </Button>
        </SectionCard>

        <InstallAppCard compact />

        <SectionCard title="Notificações">
          <div className="divide-y divide-line">
            <Toggle label="Curtidas" description="Quando alguém curtir suas publicações" checked={prefs.likes} onChange={setPref('likes', 'Curtidas')} />
            <Toggle label="Comentários" description="Respostas às suas publicações" checked={prefs.comments} onChange={setPref('comments', 'Comentários')} />
            <Toggle label="Novos seguidores" checked={prefs.follows} onChange={setPref('follows', 'Novos seguidores')} />
            <Toggle label="Mensagens" checked={prefs.messages} onChange={setPref('messages', 'Mensagens')} />
            <Toggle label="Comunidades" description="Novidades das comunidades em que você participa" checked={prefs.communities} onChange={setPref('communities', 'Comunidades')} />
            <Toggle label="Resumo por e-mail" description="Depende de integração futura de e-mail" checked={prefs.emailDigest} onChange={setPref('emailDigest', 'Resumo por e-mail')} />
          </div>
        </SectionCard>

        <SectionCard title="Segurança e comunidade">
          <ul className="-mx-2">
            {isMod && <RowLink to="/moderacao" icon={<ShieldCheck className="h-5 w-5" />} label="Moderação" />}
            <RowLink to="/regras" icon={<ScrollText className="h-5 w-5" />} label="Regras da comunidade" />
            <RowLink to="/regras#jogo-responsavel" icon={<HeartHandshake className="h-5 w-5" />} label="Jogo responsável" />
          </ul>
        </SectionCard>

        <SectionCard title={`Usuários bloqueados (${blocked.length})`}>
          {blocked.length === 0 ? (
            <p className="text-sm text-ink-muted flex items-center gap-2">
              <Ban className="h-4 w-4" /> Você não bloqueou ninguém. Bloqueie pelo menu “⋯” de um perfil ou publicação.
            </p>
          ) : (
            <ul className="space-y-2">
              {blocked.map((u) => (
                <li key={u!.id} className="flex items-center gap-3">
                  <Avatar user={u!} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u!.name}</p>
                    <p className="text-xs text-ink-muted">@{u!.handle}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      social.unblock(u!.id);
                      toast.success(`${u!.name} foi desbloqueado(a).`);
                    }}
                  >
                    Desbloquear
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={`Denúncias enviadas (${state.reports.length})`}>
          {state.reports.length === 0 ? (
            <p className="text-sm text-ink-muted flex items-center gap-2">
              <Flag className="h-4 w-4" /> Nenhuma denúncia enviada.
            </p>
          ) : (
            <ul className="space-y-2">
              {state.reports.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-center gap-3 text-sm rounded-xl bg-surface px-3 py-2.5">
                  <ShieldAlert className="h-4 w-4 text-warn shrink-0" />
                  <span className="flex-1 min-w-0 truncate">
                    {{ post: 'Publicação', user: 'Perfil', comment: 'Comentário', ad: 'Anúncio' }[r.target]} — {r.reason}
                  </span>
                  <span className="text-xs text-ink-faint shrink-0">{timeAgo(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-ink-faint mt-3">A equipe da Joggo analisa todas as denúncias.</p>
        </SectionCard>


      </div>
      <EditProfileModal open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}

function RowLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-surface transition-colors">
        <span className="text-ink-muted">{icon}</span>
        <span className="flex-1 font-semibold text-[15px]">{label}</span>
        <ChevronRight className="h-4 w-4 text-ink-faint" />
      </Link>
    </li>
  );
}
