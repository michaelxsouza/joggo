import { useMemo, useState } from 'react';
import { ImagePlus, Inbox, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { feedPosts, sel, useSocial, type FeedTab } from '@/services/socialService';
import { CATEGORIES, type Category } from '@/types/social';
import { Avatar, Chip, EmptyState, Tabs } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { PostList } from '@/components/posts/PostList';
import { useUI } from '@/app/UIContext';
import { useDocumentTitle } from '@/lib/hooks';

export default function FeedPage() {
  useDocumentTitle('Feed');
  const state = useSocial((s) => s);
  const me = sel.me(state);
  const ui = useUI();
  const navigate = useNavigate();
  const [tab, setTab] = useState<FeedTab>('para-voce');
  const [category, setCategory] = useState<Category | 'todas'>('todas');
  const posts = useMemo(() => feedPosts(state, tab, category), [state, tab, category]);
  const adCategories = category === 'todas' ? me.interests : [category];

  return (
    <div>
      <div className="sticky top-14 lg:top-0 z-20 bg-bg/90 backdrop-blur">
        <Tabs
          label="Feeds"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'para-voce', label: 'Para você' },
            { id: 'seguindo', label: 'Seguindo' },
          ]}
        />
        <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 lg:px-0 py-3" role="group" aria-label="Filtrar por categoria">
          <Chip active={category === 'todas'} onClick={() => setCategory('todas')}>
            Todas
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="px-3 lg:px-0 space-y-3 sm:space-y-4">
        <div className="card p-3 sm:p-4 flex items-center gap-3">
          <Avatar user={me} />
          <button
            onClick={() => ui.openComposer()}
            className="flex-1 text-left h-11 px-4 rounded-full bg-surface border border-line text-ink-faint hover:border-ink-faint transition-colors text-[15px] truncate"
          >
            No que você está pensando, {me.name.split(' ')[0]}?
          </button>
          <Button variant="ghost" size="sm" aria-label="Publicar com imagem" className="hidden sm:inline-flex" icon={<ImagePlus className="h-5 w-5 text-lime" />} onClick={() => ui.openComposer()}>
            Imagem
          </Button>
        </div>

        {posts.length === 0 ? (
          tab === 'seguindo' && category === 'todas' ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="Seu feed Seguindo está vazio"
              action={<Button onClick={() => navigate('/explorar')}>Encontrar pessoas</Button>}
            >
              Siga pessoas e entre em comunidades para ver as publicações delas aqui.
            </EmptyState>
          ) : (
            <EmptyState icon={<Inbox className="h-6 w-6" />} title="Nada por aqui ainda" action={<Button variant="secondary" onClick={() => setCategory('todas')}>Ver todas as categorias</Button>}>
              Não há publicações nesta categoria {tab === 'seguindo' ? 'de quem você segue' : ''}. Que tal começar a conversa?
            </EmptyState>
          )
        ) : (
          <PostList posts={posts} adCategories={adCategories} adContext="feed" />
        )}
        {posts.length > 0 && <p className="text-center text-xs text-ink-faint py-6">Você chegou ao fim</p>}
      </div>
    </div>
  );
}
