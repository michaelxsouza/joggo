import { useState } from 'react';
import { Users } from 'lucide-react';
import { useSocial } from '@/services/socialService';
import { CATEGORIES, type Category } from '@/types/social';
import { Chip, EmptyState, Tabs } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { CommunityCard } from '@/components/communities/CommunityCard';
import { PageHeader } from '@/components/layout/AppShell';
import { useDocumentTitle } from '@/lib/hooks';

export default function CommunitiesPage() {
  useDocumentTitle('Comunidades');
  const [tab, setTab] = useState<'todas' | 'minhas'>('todas');
  const [category, setCategory] = useState<Category | null>(null);
  const communities = useSocial((s) => s.communities);
  const joined = useSocial((s) => s.joinedCommunityIds);

  const list = communities.filter((c) => (tab === 'todas' || joined.includes(c.id)) && (!category || c.category === category));

  return (
    <div>
      <PageHeader title="Comunidades" subtitle="Grupos para cada tipo de jogador" />
      <Tabs
        label="Comunidades"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'todas', label: 'Descobrir' },
          { id: 'minhas', label: `Minhas (${joined.length})` },
        ]}
      />
      <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 lg:px-0 py-3" role="group" aria-label="Filtrar por categoria">
        <Chip active={!category} onClick={() => setCategory(null)}>
          Todas
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={tab === 'minhas' ? 'Você ainda não participa de comunidades' : 'Nenhuma comunidade nesta categoria'}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setTab('todas');
                setCategory(null);
              }}
            >
              Descobrir comunidades
            </Button>
          }
        >
          {tab === 'minhas' ? 'Entre em uma comunidade para acompanhar as conversas no seu feed.' : 'Tente outra categoria.'}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-3 lg:px-0">
          {list.map((c) => (
            <CommunityCard key={c.id} community={c} />
          ))}
        </div>
      )}
      <p className="text-center text-xs text-ink-faint py-6">Comunidades e números de membros são demonstrativos.</p>
    </div>
  );
}
