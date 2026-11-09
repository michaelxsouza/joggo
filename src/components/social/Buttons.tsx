import { Check, Plus, UserCheck, UserPlus } from 'lucide-react';
import { social, useSocial } from '@/services/socialService';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { Community, User } from '@/types/social';

export function FollowButton({ user, size = 'sm' }: { user: User; size?: 'sm' | 'md' }) {
  const following = useSocial((s) => s.followingIds.includes(user.id));
  const toast = useToast();
  return (
    <Button
      size={size}
      variant={following ? 'joined' : 'primary'}
      aria-pressed={following}
      aria-label={following ? `Deixar de seguir ${user.name}` : `Seguir ${user.name}`}
      icon={following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      onClick={() => {
        social.toggleFollow(user.id);
        toast.success(following ? `Você deixou de seguir ${user.name}.` : `Agora você segue ${user.name}.`);
      }}
    >
      {following ? 'Seguindo' : 'Seguir'}
    </Button>
  );
}

export function JoinButton({ community, size = 'sm', block }: { community: Community; size?: 'sm' | 'md'; block?: boolean }) {
  const joined = useSocial((s) => s.joinedCommunityIds.includes(community.id));
  const toast = useToast();
  return (
    <Button
      size={size}
      block={block}
      variant={joined ? 'joined' : 'primary'}
      aria-pressed={joined}
      aria-label={joined ? `Sair de ${community.name}` : `Entrar em ${community.name}`}
      icon={joined ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        social.toggleCommunity(community.id);
        toast.success(joined ? `Você saiu de ${community.name}.` : `Você entrou em ${community.name}!`);
      }}
    >
      {joined ? 'Participando' : 'Entrar'}
    </Button>
  );
}
