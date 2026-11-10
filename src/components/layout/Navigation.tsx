import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { openReportCount } from '@/services/moderationService';
import { Bell, Compass, Home, LogOut, Mail, Plus, Search, Settings, ShieldCheck, Trophy, User, Users } from 'lucide-react';
import { auth } from '@/services/authService';
import { IconButton } from '@/components/ui/Button';
import { sel, useSocial } from '@/services/socialService';
import { useUI } from '@/app/UIContext';
import { Logo } from '@/components/brand/Logo';
import { Avatar } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

function useCounts() {
  const notif = useSocial(sel.unreadNotifications);
  const msgs = useSocial(sel.unreadMessages);
  return { notif, msgs };
}

function CountBadge({ n, className }: { n: number; className?: string }) {
  if (!n) return null;
  return (
    <span className={cn('min-w-[20px] h-5 px-1.5 rounded-full bg-lime text-lime-ink text-[11px] font-extrabold inline-flex items-center justify-center', className)}>
      {n > 9 ? '9+' : n}
      <span className="sr-only"> não lidas</span>
    </span>
  );
}

export function ResponsibleNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-[11px] text-ink-faint leading-relaxed', className)}>
      <span className="inline-flex items-center rounded border border-ink-faint/40 px-1 mr-1 font-bold text-ink-muted">18+</span>
      Jogue com responsabilidade. A Joggo não oferece apostas.
      <br />
      <Link to="/regras" className="hover:text-ink underline-offset-2 hover:underline">
        Regras
      </Link>
    </p>
  );
}

export function Sidebar() {
  const me = useSocial(sel.me);
  const isMod = useSocial(sel.isModerator);
  const loc = useLocation();
  const [openReports, setOpenReports] = useState(0);
  // contador de denúncias abertas para quem modera (atualiza ao trocar de página)
  useEffect(() => {
    if (isMod) void openReportCount().then(setOpenReports);
  }, [isMod, loc.pathname]);
  const { notif, msgs } = useCounts();
  const ui = useUI();
  const items = [
    { to: '/', label: 'Feed', icon: Home, end: true },
    { to: '/explorar', label: 'Explorar', icon: Compass },
    { to: '/jogos', label: 'Jogos', icon: Trophy },
    { to: '/comunidades', label: 'Comunidades', icon: Users },
    { to: '/mensagens', label: 'Mensagens', icon: Mail, count: msgs },
    { to: '/notificacoes', label: 'Notificações', icon: Bell, count: notif },
    { to: `/perfil/${me.handle}`, label: 'Meu perfil', icon: User },
    { to: '/configuracoes', label: 'Configurações', icon: Settings },
    ...(isMod ? [{ to: '/moderacao', label: 'Moderação', icon: ShieldCheck, count: openReports }] : []),
  ];
  return (
    <nav aria-label="Navegação principal" className="hidden lg:flex flex-col h-dvh sticky top-0 py-5 pr-4 w-[248px] shrink-0">
      <Link to="/" className="px-3 mb-6 inline-flex" aria-label="Joggo — início">
        <Logo height={34} />
      </Link>
      <ul className="space-y-1">
        {items.map(({ to, label, icon: Icon, end, count }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3.5 h-12 px-3 rounded-xl text-[16px] font-semibold transition-colors',
                  isActive ? 'bg-lime/10 text-lime' : 'text-ink-muted hover:text-ink hover:bg-surface',
                )
              }
            >
              <Icon className="h-[22px] w-[22px]" aria-hidden />
              <span className="flex-1">{label}</span>
              <CountBadge n={count ?? 0} />
            </NavLink>
          </li>
        ))}
      </ul>
      <Button size="lg" className="mt-5" icon={<Plus className="h-5 w-5" />} onClick={() => ui.openComposer()}>
        Criar publicação
      </Button>
      <div className="mt-auto">
        <div className="flex items-center gap-1">
          <Link to={`/perfil/${me.handle}`} className="flex items-center gap-3 rounded-2xl p-2.5 hover:bg-surface transition-colors flex-1 min-w-0">
            <Avatar user={me} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate leading-tight">{me.name}</p>
              <p className="text-sm text-ink-muted truncate">@{me.handle}</p>
            </div>
          </Link>
          <IconButton label="Sair da conta" size="sm" onClick={() => void auth.signOut()}>
            <LogOut className="h-[18px] w-[18px]" />
          </IconButton>
        </div>
        <ResponsibleNote className="px-2.5 mt-3" />
      </div>
    </nav>
  );
}

export function MobileHeader() {
  const { notif, msgs } = useCounts();
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line">
      <div className="flex items-center h-14 px-4 gap-2">
        <Link to="/" aria-label="Joggo — início" className="inline-flex">
          <Logo height={26} />
        </Link>
        <span className="ml-1 rounded border border-ink-faint/40 px-1 text-[10px] font-bold text-ink-muted" title="Somente maiores de 18 anos">
          18+
        </span>
        <div className="ml-auto flex items-center">
          <HeaderIcon to="/explorar" label="Buscar" count={0} icon={<Search className="h-[22px] w-[22px]" />} />
          <HeaderIcon to="/notificacoes" label="Notificações" count={notif} icon={<Bell className="h-[22px] w-[22px]" />} />
          <HeaderIcon to="/mensagens" label="Mensagens" count={msgs} icon={<Mail className="h-[22px] w-[22px]" />} />
        </div>
      </div>
    </header>
  );
}

function HeaderIcon({ to, label, count, icon }: { to: string; label: string; count: number; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      aria-label={count ? `${label} (${count} não lidas)` : label}
      className={({ isActive }) => cn('relative h-11 w-11 inline-flex items-center justify-center rounded-full', isActive ? 'text-lime' : 'text-ink-muted hover:text-ink')}
    >
      {icon}
      {count > 0 && <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-lime text-lime-ink text-[10px] font-extrabold flex items-center justify-center" aria-hidden>{count > 9 ? '9+' : count}</span>}
    </NavLink>
  );
}

export function BottomNav() {
  const me = useSocial(sel.me);
  const ui = useUI();
  const loc = useLocation();
  const items = [
    { to: '/', label: 'Feed', icon: Home, end: true },
    { to: '/jogos', label: 'Jogos', icon: Trophy },
    { to: 'create', label: 'Criar', icon: Plus },
    { to: '/comunidades', label: 'Comunidades', icon: Users },
    { to: `/perfil/${me.handle}`, label: 'Perfil', icon: User },
  ];
  if (loc.pathname.startsWith('/mensagens/')) return null; // chat em tela cheia
  return (
    <nav aria-label="Navegação inferior" className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-bg/95 backdrop-blur border-t border-line safe-bottom">
      <ul className="grid grid-cols-5 h-16">
        {items.map(({ to, label, icon: Icon, end }) =>
          to === 'create' ? (
            <li key={to} className="flex items-center justify-center">
              <button
                onClick={() => ui.openComposer()}
                aria-label="Criar publicação"
                className="h-11 w-11 rounded-2xl bg-lime text-lime-ink inline-flex items-center justify-center active:scale-95 transition-transform"
              >
                <Icon className="h-6 w-6" strokeWidth={2.5} />
              </button>
            </li>
          ) : (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn('h-full flex flex-col items-center justify-center gap-1 text-[11px] font-semibold', isActive ? 'text-lime' : 'text-ink-muted')
                }
              >
                <Icon className="h-[22px] w-[22px]" aria-hidden />
                {label}
              </NavLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
