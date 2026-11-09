import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, EyeOff } from 'lucide-react';
import { social, useSocial } from '@/services/socialService';
import { PostCard } from '@/components/posts/PostCard';
import { IconButton, Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/misc';
import { PageHeader } from '@/components/layout/AppShell';
import { useDocumentTitle } from '@/lib/hooks';
import NotFound from './NotFound';

export default function PostDetailPage() {
  useDocumentTitle('Publicação');
  const { id } = useParams();
  const navigate = useNavigate();
  const post = useSocial((s) => s.posts.find((p) => p.id === id));
  const hidden = useSocial((s) => !!id && s.hiddenPostIds.includes(id));
  const blocked = useSocial((s) => !!post && s.blockedUserIds.includes(post.authorId));
  if (!post) return <NotFound what="Publicação" />;
  return (
    <div>
      <PageHeader
        title="Publicação"
        back={
          <IconButton label="Voltar" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))}>
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        }
      />
      <div className="px-3 lg:px-0">
        {hidden || blocked ? (
          <EmptyState
            icon={<EyeOff className="h-6 w-6" />}
            title={blocked ? 'Você bloqueou o autor' : 'Você ocultou esta publicação'}
            action={hidden && !blocked ? <Button variant="secondary" onClick={() => social.unhidePost(post.id)}>Mostrar novamente</Button> : undefined}
          />
        ) : (
          <PostCard post={post} defaultOpenComments />
        )}
      </div>
    </div>
  );
}
