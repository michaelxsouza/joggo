import { useEffect, useSyncExternalStore } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { clearSocial, loadSocial, onSocialError, sel, socialStatus, useSocial } from '@/services/socialService';
import Onboarding from '@/pages/Onboarding';
import { UIProvider } from '@/app/UIContext';
import { AppShell } from '@/components/layout/AppShell';
import { reconcileCampaigns } from '@/services/adsService';
import FeedPage from '@/pages/FeedPage';
import ExplorePage from '@/pages/ExplorePage';
import CommunitiesPage from '@/pages/CommunitiesPage';
import CommunityDetailPage from '@/pages/CommunityDetailPage';
import ProfilePage from '@/pages/ProfilePage';
import MessagesPage from '@/pages/MessagesPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SettingsPage from '@/pages/SettingsPage';
import RulesPage from '@/pages/RulesPage';
import PostDetailPage from '@/pages/PostDetailPage';
import NotFound from '@/pages/NotFound';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import TermsPage from '@/pages/auth/TermsPage';
import NewPasswordPage from '@/pages/auth/NewPasswordPage';
import ModerationPage from '@/pages/ModerationPage';
import { auth, useAuth } from '@/services/authService';

function Splash() {
  return <div className="min-h-dvh grid place-items-center text-ink-faint text-sm" aria-busy="true">Carregando…</div>;
}

/** Carrega os dados do usuário logado e mostra erros de gravação como aviso. */
function SocialGate({ userId, children }: { userId: string; children: React.ReactNode }) {
  const toast = useToast();
  const status = useSyncExternalStore(socialStatus.subscribe, socialStatus.get);
  useEffect(() => {
    void loadSocial();
    return () => clearSocial();
  }, [userId]);
  useEffect(() => onSocialError((m) => toast.error(m)), [toast]);
  if (status.status === 'error')
    return (
      <div className="min-h-dvh grid place-items-center p-6 text-center">
        <div className="max-w-sm space-y-4">
          <p className="text-ink-muted">{status.error}</p>
          <Button onClick={() => void loadSocial()}>Tentar de novo</Button>
        </div>
      </div>
    );
  if (status.status !== 'ready') return <Splash />;
  return <OnboardingGate>{children}</OnboardingGate>;
}

/** Quem ainda não passou pelas boas-vindas vê os 4 passos antes do feed. */
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const me = useSocial(sel.me);
  if (me?.banned) return <SuspendedScreen reason={me.banReason} />;
  return (me?.onboarded ?? true) ? <>{children}</> : <Onboarding />;
}

function SuspendedScreen({ reason }: { reason?: string }) {
  return (
    <div className="min-h-dvh grid place-items-center p-6 text-center">
      <div className="max-w-sm space-y-4">
        <h1 className="text-2xl font-extrabold">Conta suspensa</h1>
        <p className="text-ink-muted">
          Sua conta foi suspensa pela moderação da Joggo{reason ? ` por: ${reason}` : ''}. Se acha que foi um engano, fale com a equipe da Joggo.
        </p>
        <Button variant="secondary" onClick={() => void auth.signOut()}>
          Sair da conta
        </Button>
      </div>
    </div>
  );
}

/** Protege as rotas do app: sem sessão, vai para /entrar e volta depois. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, session, recovery } = useAuth();
  const location = useLocation();
  if (!ready) return <Splash />;
  if (recovery && session) return <NewPasswordPage />;
  if (!session) return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  return <SocialGate userId={session.userId}>{children}</SocialGate>;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { ready, session } = useAuth();
  const location = useLocation();
  if (!ready) return <Splash />;
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  return session ? <Navigate to={from} replace /> : <>{children}</>;
}

// HashRouter permite hospedar como site estático sem configurar rotas no servidor.
export default function App() {
  useEffect(() => {
    reconcileCampaigns();
  }, []);
  return (
    <HashRouter>
      <ToastProvider>
        <UIProvider>
          <Routes>
            <Route path="entrar" element={<GuestOnly><LoginPage /></GuestOnly>} />
            <Route path="criar-conta" element={<GuestOnly><SignUpPage /></GuestOnly>} />
            <Route path="termos" element={<TermsPage />} />
            <Route element={<RequireAuth><AppShell /></RequireAuth>}>
              <Route index element={<FeedPage />} />
              <Route path="explorar" element={<ExplorePage />} />
              <Route path="comunidades" element={<CommunitiesPage />} />
              <Route path="comunidades/:slug" element={<CommunityDetailPage />} />
              <Route path="perfil/:handle" element={<ProfilePage />} />
              <Route path="mensagens" element={<MessagesPage />} />
              <Route path="mensagens/:id" element={<MessagesPage />} />
              <Route path="notificacoes" element={<NotificationsPage />} />
              <Route path="configuracoes" element={<SettingsPage />} />
              <Route path="regras" element={<RulesPage />} />
              <Route path="post/:id" element={<PostDetailPage />} />
              <Route path="moderacao" element={<ModerationPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </UIProvider>
      </ToastProvider>
    </HashRouter>
  );
}
