import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav, MobileHeader, Sidebar } from './Navigation';
import { RightRail } from './RightRail';
import { cn } from '@/lib/utils';

/** Rotas que usam a área central larga, sem a coluna direita. */
const WIDE = ['/mensagens', '/anunciar', '/admin'];

export function AppShell() {
  const { pathname } = useLocation();
  const wide = WIDE.some((p) => pathname.startsWith(p));

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      <button type="button" onClick={() => document.getElementById('conteudo')?.focus()} className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[90] focus:bg-lime focus:text-lime-ink focus:px-4 focus:py-2 focus:rounded-xl font-bold">
        Pular para o conteúdo
      </button>
      <MobileHeader />
      <div className="mx-auto flex max-w-[1280px] lg:px-4 gap-6">
        <Sidebar />
        <main id="conteudo" tabIndex={-1} className={cn('flex-1 min-w-0 outline-none', pathname.startsWith('/mensagens') ? (pathname.startsWith('/mensagens/') ? 'pb-0' : 'pb-24 lg:pb-0') : 'pb-24 lg:pb-10', !wide && 'max-w-[640px] mx-auto xl:mx-0')}>
          <Outlet />
        </main>
        {!wide && <RightRail />}
      </div>
      <BottomNav />
    </div>
  );
}

export function PageHeader({ title, subtitle, action, back }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; back?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 lg:px-0 pt-4 lg:pt-6 pb-4">
      {back}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
