import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
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
import AdvertiserPage from '@/pages/ads/AdvertiserPage';
import CampaignEditorPage from '@/pages/ads/CampaignEditorPage';
import CampaignReportPage from '@/pages/ads/CampaignReportPage';
import AdminPage from '@/pages/ads/AdminPage';
import NotFound from '@/pages/NotFound';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import TermsPage from '@/pages/auth/TermsPage';
import NewPasswordPage from '@/pages/auth/NewPasswordPage';
import { useAuth } from '@/services/authService';

function Splash() {
  return <div className="min-h-dvh grid place-items-center text-ink-faint text-sm" aria-busy="true">Carregando…</div>;
}

/** Protege as rotas do app: sem sessão, vai para /entrar e volta depois. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, session, recovery } = useAuth();
  const location = useLocation();
  if (!ready) return <Splash />;
  if (recovery && session) return <NewPasswordPage />;
  if (!session) return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
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
              <Route path="anunciar" element={<AdvertiserPage />} />
              <Route path="anunciar/nova" element={<CampaignEditorPage />} />
              <Route path="anunciar/:id/editar" element={<CampaignEditorPage />} />
              <Route path="anunciar/:id" element={<CampaignReportPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </UIProvider>
      </ToastProvider>
    </HashRouter>
  );
}
