import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';

export default function NotFound({ what = 'Página' }: { what?: string }) {
  const navigate = useNavigate();
  return (
    <EmptyState icon={<Compass className="h-6 w-6" />} title={`${what} não encontrada`} action={<Button onClick={() => navigate('/')}>Voltar ao feed</Button>}>
      O endereço pode estar incorreto ou o conteúdo foi removido.
    </EmptyState>
  );
}
