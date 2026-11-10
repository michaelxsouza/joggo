import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { IconButton } from '@/components/ui/Button';
import { useDocumentTitle } from '@/lib/hooks';

/** Contato oficial para dúvidas e pedidos sobre dados. Troque pelo e-mail da Joggo quando houver domínio próprio. */
export const SUPPORT_CONTACT = 'mensagem direta para o perfil oficial @michaelxsouza na Joggo';
const UPDATED_AT = '10 de novembro de 2026';

function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-extrabold text-ink tracking-tight pt-4 scroll-mt-6">
      {children}
    </h2>
  );
}

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

        <nav className="flex gap-2 mb-6 text-sm" aria-label="Seções">
          <a href="#/termos" className="rounded-full border border-line px-3 py-1.5 hover:border-lime">
            Termos de Uso
          </a>
          <Link to="/termos#privacidade" className="rounded-full border border-line px-3 py-1.5 hover:border-lime">
            Política de Privacidade
          </Link>
        </nav>

        <article className="space-y-3 text-[15px] leading-relaxed text-ink-muted">
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">Termos de Uso</h1>
          <p className="text-xs text-ink-faint">Última atualização: {UPDATED_AT}</p>

          <H2>1. O que é a Joggo</H2>
          <p>
            A Joggo é uma rede social para pessoas maiores de 18 anos conversarem sobre esportes, apostas esportivas, poker e jogos de cassino, publicarem bilhetes e acompanharem resultados.
            <strong className="text-ink"> A Joggo não é uma casa de apostas:</strong> não aceita apostas, não recebe depósitos, não faz saques, não tem carteira e não intermedeia pagamentos entre usuários.
          </p>

          <H2>2. Quem pode usar</H2>
          <p>
            Somente maiores de 18 anos. Ao criar a conta você declara ter 18 anos ou mais e informa sua data de nascimento. Contas de menores de idade serão excluídas assim que identificadas.
          </p>

          <H2>3. Sua conta</H2>
          <p>
            Você é responsável pelas informações que fornece e por manter sua senha em segredo. Cada pessoa pode ter uma conta. Não é permitido se passar por outra pessoa, marca ou tipster.
          </p>

          <H2>4. Bilhetes e histórico</H2>
          <p>
            Bilhetes publicados registram jogo, palpite e odd. O resultado (green, red ou anulado) é marcado pelo próprio autor uma única vez e não pode ser alterado. Depois de 10 minutos, ou
            depois de marcado o resultado, o bilhete não pode ser excluído pelo autor. Isso garante que o histórico de acertos exibido no perfil seja real.
          </p>
          <p>
            Bilhetes e análises publicados na Joggo são opiniões pessoais dos usuários. <strong className="text-ink">Não são recomendação de investimento nem garantia de resultado.</strong>{' '}
            Decisões de aposta são de responsabilidade exclusiva de cada pessoa.
          </p>

          <H2>5. Regras da comunidade</H2>
          <p>Não é permitido:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>prometer lucro, "green garantido" ou renda com apostas;</li>
            <li>pedir ou oferecer dinheiro, Pix, "banca" ou empréstimos;</li>
            <li>vender tips, sinais, grupos pagos ou cursos;</li>
            <li>divulgar casas de apostas não autorizadas no Brasil ou links de afiliado;</li>
            <li>golpes, contas falsas, spam ou manipulação de resultados;</li>
            <li>assédio, discurso de ódio, conteúdo sexual, violento ou ilegal;</li>
            <li>publicar dados pessoais de outras pessoas.</li>
          </ul>
          <p>
            Veja também as <Link to="/regras" className="text-lime hover:underline">Regras da comunidade</Link>.
          </p>

          <H2>6. Moderação</H2>
          <p>
            Qualquer pessoa pode denunciar publicações, comentários e perfis. A equipe da Joggo pode remover conteúdos e suspender ou excluir contas que violem estes termos, com ou sem aviso
            prévio, conforme a gravidade.
          </p>

          <H2>7. Seu conteúdo</H2>
          <p>
            O que você publica continua sendo seu. Ao publicar, você autoriza a Joggo a exibir esse conteúdo dentro da plataforma para as pessoas que podem vê-lo. Você garante ter o direito de
            publicar as imagens e textos que envia.
          </p>

          <H2>8. Jogo responsável</H2>
          <p>
            Aposta é entretenimento, não fonte de renda. Defina limites, nunca aposte dinheiro que fará falta e procure ajuda se sentir que perdeu o controle. Veja nossa página de{' '}
            <Link to="/regras#jogo-responsavel" className="text-lime hover:underline">jogo responsável</Link>.
          </p>

          <H2>9. Disponibilidade e responsabilidade</H2>
          <p>
            A Joggo é oferecida "como está" e pode passar por mudanças, instabilidades ou interrupções. Resultados de jogos exibidos vêm de fontes externas e podem ter atraso ou erro. A Joggo não
            se responsabiliza por perdas decorrentes de apostas feitas com base em conteúdos da plataforma.
          </p>

          <H2>10. Alterações</H2>
          <p>Estes termos podem ser atualizados. Mudanças importantes serão avisadas dentro da plataforma.</p>

          <h1 id="privacidade" className="text-3xl font-extrabold text-ink tracking-tight pt-10 scroll-mt-6">
            Política de Privacidade
          </h1>
          <p className="text-xs text-ink-faint">Última atualização: {UPDATED_AT} · De acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018)</p>

          <H2>1. Dados que coletamos</H2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-ink">Cadastro:</strong> nome, @usuário, e-mail, senha (guardada de forma criptografada) e data de nascimento.
            </li>
            <li>
              <strong className="text-ink">Perfil (opcional):</strong> foto, capa, bio, cidade e interesses.
            </li>
            <li>
              <strong className="text-ink">O que você publica:</strong> posts, bilhetes, imagens, comentários, curtidas, quem você segue, comunidades, mensagens diretas e denúncias.
            </li>
            <li>
              <strong className="text-ink">Dados técnicos:</strong> registros de acesso e informações do navegador, usados para segurança e funcionamento.
            </li>
          </ul>
          <p>Não pedimos CPF, documentos, dados bancários ou informações sobre suas apostas em casas de apostas.</p>

          <H2>2. Para que usamos</H2>
          <ul className="list-disc pl-5 space-y-1">
            <li>criar e manter sua conta e confirmar que você tem 18 anos ou mais;</li>
            <li>exibir seu perfil, publicações, histórico de bilhetes e notificações;</li>
            <li>moderar a comunidade, prevenir golpes, spam e abusos;</li>
            <li>melhorar a plataforma e cumprir obrigações legais.</li>
          </ul>
          <p>
            A base legal é a execução do serviço que você contratou ao criar a conta (art. 7º, V, da LGPD), o legítimo interesse para segurança e moderação (art. 7º, IX) e o cumprimento de
            obrigações legais (art. 7º, II).
          </p>

          <H2>3. O que é público</H2>
          <p>
            Para outras pessoas logadas na Joggo ficam visíveis: nome, @usuário, foto, capa, bio, cidade, interesses, publicações, bilhetes e taxa de acerto, comentários, seguidores e comunidades.
            Sua data de nascimento, seu e-mail, suas mensagens diretas, seus itens salvos, bloqueios e denúncias <strong className="text-ink">não</strong> são exibidos para outras pessoas. Quem
            não tem conta não vê nada além da tela de entrada.
          </p>

          <H2>4. Com quem compartilhamos</H2>
          <p>
            Não vendemos seus dados. Usamos fornecedores para operar a plataforma: hospedagem do site (Netlify) e banco de dados, login e armazenamento de imagens (Supabase). Esses serviços podem
            processar dados fora do Brasil, com medidas de segurança adequadas. Podemos compartilhar dados quando exigido por lei ou ordem judicial.
          </p>

          <H2>5. Publicidade</H2>
          <p>
            Se houver anúncios no futuro, eles serão identificados como "Patrocinado" e segmentados apenas por interesse e tema do conteúdo. Nunca usaremos histórico de perdas, frequência de
            jogo ou sinais de vulnerabilidade para direcionar anúncios.
          </p>

          <H2>6. Quanto tempo guardamos</H2>
          <p>
            Enquanto sua conta existir. Quando você exclui a conta, seu perfil, publicações, bilhetes, comentários, curtidas, mensagens e notificações são apagados imediatamente. Cópias de
            segurança e registros técnicos podem levar até 90 dias para serem apagados definitivamente.
          </p>

          <H2>7. Seus direitos</H2>
          <p>Pela LGPD você pode: confirmar e acessar seus dados, corrigi-los, pedir a exclusão, saber com quem são compartilhados e revogar consentimentos. Na própria Joggo você pode:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>editar seus dados em <Link to="/configuracoes" className="text-lime hover:underline">Configurações › Perfil</Link>;</li>
            <li>
              <strong className="text-ink">excluir sua conta e todos os seus dados</strong> em <Link to="/configuracoes" className="text-lime hover:underline">Configurações › Excluir minha conta</Link>.
            </li>
          </ul>
          <p>Para outros pedidos, fale com a equipe da Joggo por {SUPPORT_CONTACT}.</p>

          <H2>8. Segurança</H2>
          <p>
            Usamos conexão criptografada (HTTPS), senhas protegidas e regras de acesso no banco de dados que impedem que uma pessoa veja ou altere dados privados de outra. Nenhum sistema é 100%
            seguro: use uma senha forte e exclusiva.
          </p>

          <H2>9. Menores de idade</H2>
          <p>A Joggo não é destinada a menores de 18 anos. Se identificarmos uma conta de menor, ela e seus dados serão excluídos.</p>

          <H2>10. Contato</H2>
          <p>Dúvidas sobre esta política ou sobre seus dados: {SUPPORT_CONTACT}.</p>
        </article>
      </div>
    </div>
  );
}
