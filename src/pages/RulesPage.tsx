import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Ban, HandCoins, HeartHandshake, MessageSquareWarning, ShieldCheck, UserX, Megaphone, Lock } from 'lucide-react';
import { PageHeader } from '@/components/layout/AppShell';
import { useDocumentTitle } from '@/lib/hooks';

const RULES = [
  { icon: UserX, title: 'Somente maiores de 18 anos', text: 'A Joggo é exclusiva para adultos. Perfis que aparentem pertencer a menores serão removidos.' },
  { icon: HandCoins, title: 'Sem promessas de lucro', text: 'Não publique “palpites garantidos”, “sistemas infalíveis” ou qualquer promessa de ganho. Jogo é entretenimento, com risco.' },
  { icon: Ban, title: 'Sem pedir ou oferecer dinheiro', text: 'É proibido pedir empréstimos, vender cotas, tips pagas ou divulgar links de afiliado nas publicações.' },
  { icon: MessageSquareWarning, title: 'Respeito sempre', text: 'Sem assédio, discurso de ódio, ameaças ou exposição de dados pessoais de outras pessoas.' },
  { icon: Megaphone, title: 'Publicidade identificada', text: 'Conteúdo patrocinado só aparece em espaços marcados como “Patrocinado” e passa por revisão.' },
  { icon: Lock, title: 'Privacidade', text: 'Não compartilhe documentos, dados bancários ou senhas — nem em mensagens privadas.' },
];

export default function RulesPage() {
  useDocumentTitle('Regras da comunidade');
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <div>
      <PageHeader title="Regras da comunidade" subtitle="O que torna a Joggo um bom lugar para conversar sobre jogos" />
      <div className="px-3 lg:px-0 space-y-4">
        <ul className="grid gap-3">
          {RULES.map(({ icon: I, title, text }) => (
            <li key={title} className="card p-4 flex gap-3.5">
              <span className="h-10 w-10 rounded-xl bg-surface border border-line inline-flex items-center justify-center text-lime shrink-0">
                <I className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-bold">{title}</h2>
                <p className="text-sm text-ink-muted mt-0.5 leading-relaxed">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <section id="jogo-responsavel" className="card p-5 scroll-mt-20">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-lime" /> Jogue com responsabilidade
          </h2>
          <ul className="mt-3 space-y-2 text-[15px] text-ink-muted list-disc pl-5">
            <li>Defina limites de tempo e de dinheiro antes de jogar — e respeite-os.</li>
            <li>Nunca jogue para recuperar perdas, pagar contas ou resolver problemas financeiros.</li>
            <li>Faça pausas e não misture jogo com álcool ou momentos de estresse.</li>
            <li>Se o jogo deixou de ser diversão, converse com alguém de confiança e procure apoio profissional.</li>
          </ul>
          <p className="text-sm text-ink-muted mt-4">
            A Joggo é uma rede social: não oferece apostas, depósitos, saques ou carteira, e não utiliza sinais de vulnerabilidade, histórico de perdas ou depósitos para segmentar anúncios.
          </p>
        </section>

        <section className="card p-5">
          <h2 className="font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-lime" /> Denúncias e bloqueio
          </h2>
          <p className="text-sm text-ink-muted mt-2 leading-relaxed">
            Use o menu “⋯” em publicações, perfis e anúncios para denunciar, ocultar ou bloquear. Usuários bloqueados não aparecem no seu feed, comentários ou mensagens. Gerencie bloqueios em Configurações.
          </p>
        </section>
      </div>
    </div>
  );
}
