import { BarChart3, Lock, ShieldCheck, Ticket, Trophy, Users } from 'lucide-react';

/** Perguntas frequentes — o mesmo conteúdo vai no JSON-LD (FAQPage) do index.html. */
export const FAQ: [string, string][] = [
  ['O que é a Joggo?', 'A Joggo é uma rede social brasileira para maiores de 18 anos que curtem futebol, apostas esportivas, poker e cassino. Você posta seus bilhetes, acompanha palpites de outras pessoas, entra em comunidades e vê resultados dos jogos.'],
  ['A Joggo é uma casa de apostas?', 'Não. A Joggo não aceita apostas, não recebe depósitos e não faz saques. É uma comunidade para conversar, compartilhar bilhetes e acompanhar quem acerta de verdade.'],
  ['Como funciona o histórico de bilhetes?', 'Você posta o bilhete antes do jogo com o palpite e a odd. Depois marca green ou red uma única vez, e o bilhete não pode ser apagado. Assim sua taxa de acerto no perfil é real — ninguém apaga o red.'],
  ['A Joggo é gratuita?', 'Sim. Criar a conta e usar a Joggo é grátis.'],
  ['Posso vender tips ou pedir Pix na Joggo?', 'Não. Venda de tips, grupos pagos, pedidos de Pix e promessas de lucro são proibidos. A moderação remove o conteúdo e suspende quem fizer isso.'],
  ['Tem aplicativo?', 'Sim. A Joggo pode ser instalada na tela inicial do Android e do iPhone direto pelo navegador, sem precisar de loja de aplicativos.'],
];

const FEATURES = [
  { icon: Ticket, title: 'Bilhete do dia', text: 'Poste seu bilhete com jogo, palpite e odd. Depois do jogo, marque green ou red.' },
  { icon: Lock, title: 'Ninguém apaga o red', text: 'O resultado é travado. Seu histórico de acertos é real, sem print editado.' },
  { icon: BarChart3, title: 'Taxa de acerto no perfil', text: 'Greens, reds e porcentagem de acerto de cada tipster, à vista de todos.' },
  { icon: Trophy, title: 'Jogos e resultados', text: 'Brasileirão, Champions, Premier League e mais, atualizados automaticamente.' },
  { icon: Users, title: 'Comunidades', text: 'Futebol brasileiro, futebol europeu, NBA, poker e cassino: cada assunto no seu lugar.' },
  { icon: ShieldCheck, title: 'Sem golpe', text: 'Proibido vender tips e pedir Pix. Moderação ativa e denúncia em um toque.' },
];

/** Conteúdo da página de entrada para quem ainda não tem conta (e para o Google). */
export function LandingSeo() {
  return (
    <section className="relative mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-10 pb-16" aria-labelledby="sobre-joggo">
      <div className="text-center max-w-2xl mx-auto">
        <h2 id="sobre-joggo" className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          A rede social de quem <span className="text-lime">aposta com histórico real</span>
        </h2>
        <p className="mt-3 text-ink-muted text-lg">
          Bilhetes, palpites de futebol, tipsters com taxa de acerto e resultados dos jogos em um só lugar. Gratuita e só para maiores de 18 anos.
        </p>
      </div>

      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="card p-5">
            <Icon className="h-6 w-6 text-lime" aria-hidden />
            <h3 className="mt-3 font-bold text-lg">{title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-14 max-w-2xl mx-auto">
        <h2 className="text-2xl font-extrabold tracking-tight text-center">Perguntas frequentes</h2>
        <div className="mt-5 space-y-2">
          {FAQ.map(([q, a]) => (
            <details key={q} className="card p-4 group">
              <summary className="cursor-pointer font-bold list-none flex items-center justify-between gap-3">
                {q}
                <span className="text-lime text-xl leading-none group-open:rotate-45 transition-transform" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-2 text-ink-muted text-[15px]">{a}</p>
            </details>
          ))}
        </div>
      </div>

      <p className="mt-12 text-center text-xs text-ink-faint max-w-xl mx-auto">
        Joggo — rede social de apostas esportivas, bilhetes e palpites de futebol. Jogue com responsabilidade: aposta é entretenimento, não fonte de renda. Proibido para menores de 18 anos.
      </p>
    </section>
  );
}
