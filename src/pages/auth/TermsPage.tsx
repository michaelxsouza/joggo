import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { IconButton } from '@/components/ui/Button';
import { useDocumentTitle } from '@/lib/hooks';

/** Rascunho de Termos e Privacidade para o protótipo. Deve ser revisado por um advogado antes do lançamento. */
export default function TermsPage() {
  useDocumentTitle('Termos e Privacidade');
  const navigate = useNavigate();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash]);
  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-3 mb-8">
          <IconButton label="Voltar" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/entrar'))}>
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
          <Logo height={30} />
        </div>
        <p className="rounded-xl border border-warn/30 bg-warn/5 px-3.5 py-2.5 text-sm text-ink-muted mb-6">
          <strong className="text-warn">Rascunho do protótipo.</strong> Este texto é um modelo e precisa de revisão jurídica antes do lançamento.
        </p>
        <article className="space-y-4 text-[15px] leading-relaxed text-ink-muted">
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">Termos de Uso</h1>
          <p>A Joggo é uma rede social para maiores de 18 anos conversarem sobre jogos. A plataforma não oferece apostas, depósitos, saques ou carteira, e não intermedeia pagamentos entre usuários.</p>
          <p>Ao usar a Joggo você se compromete a respeitar as regras da comunidade: sem promessas de lucro, sem pedir ou oferecer dinheiro, sem divulgação de links de afiliado e sem assédio. Conteúdos e contas que violem as regras podem ser removidos.</p>
          <p>Publicidade aparece apenas em espaços identificados como “Patrocinado” e passa por revisão. Anúncios de apostas exigem verificação de elegibilidade do anunciante e seguem as regras aplicáveis ao território.</p>
          <h2 id="privacidade" className="text-2xl font-extrabold text-ink tracking-tight pt-6 scroll-mt-6">Política de Privacidade</h2>
          <p>Coletamos os dados necessários para a conta (nome, usuário, e-mail e data de nascimento), o conteúdo que você publica e dados de uso para segurança e funcionamento do serviço.</p>
          <p>Anúncios são exibidos com base em categorias de interesse e no tema do conteúdo. Não usamos histórico de perdas, depósitos, frequência de jogo ou sinais de vulnerabilidade para segmentação.</p>
          <p>Você pode solicitar acesso, correção ou exclusão dos seus dados, conforme a LGPD. Para isso, fale com a equipe da Joggo.</p>
        </article>
      </div>
    </div>
  );
}
