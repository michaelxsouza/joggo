import { useMemo, useState } from 'react';
import { Check, ChevronLeft, Lock, Ticket, Trophy, Users } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Avatar } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { sel, social, useSocial } from '@/services/socialService';
import { useUI } from '@/app/UIContext';
import { CATEGORIES, type Category, type ID } from '@/types/social';
import { cn } from '@/lib/utils';

const INTEREST_EMOJI: Record<Category, string> = { esportes: '⚽', poker: '♠️', roleta: '🎡', slots: '🎰', cassino: '🃏' };
const STEPS = ['Interesses', 'Comunidades', 'Pessoas', 'Pronto'];

/** Boas-vindas em 4 passos para quem acabou de criar a conta. */
export default function Onboarding() {
  const state = useSocial((s) => s);
  const me = sel.me(state);
  const ui = useUI();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<Category[]>(me.interests.length ? me.interests : ['esportes']);
  const [communityIds, setCommunityIds] = useState<ID[] | null>(null);
  const [followIds, setFollowIds] = useState<ID[] | null>(null);

  // Comunidades sugeridas: Bilhete do Dia + as dos interesses escolhidos
  const suggestedCommunities = useMemo(
    () => state.communities.filter((c) => c.slug === 'bilhete-do-dia' || interests.includes(c.category)).map((c) => c.id),
    [state.communities, interests],
  );
  const chosenCommunities = communityIds ?? suggestedCommunities;

  // Pessoas: fundadores primeiro, depois quem tem mais seguidores
  const people = useMemo(
    () =>
      state.users
        .filter((u) => u.id !== me.id && !state.blockedUserIds.includes(u.id))
        .sort((a, b) => Number(!!b.founder) - Number(!!a.founder) || sel.followerCount(state, b) - sel.followerCount(state, a))
        .slice(0, 12),
    [state, me.id],
  );
  const chosenFollows = followIds ?? people.filter((u) => u.founder).map((u) => u.id);

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const finish = (then?: 'bilhete') => {
    social.completeOnboarding({ interests, communityIds: chosenCommunities, followIds: chosenFollows });
    if (then) setTimeout(() => ui.openComposer({ mode: 'bilhete', communityId: state.communities.find((c) => c.slug === 'bilhete-do-dia')?.id }), 50);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-lg flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          {step > 0 && step < 3 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
          ) : (
            <Logo height={28} />
          )}
          <span className="text-xs text-ink-faint">
            {step + 1} de {STEPS.length}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <span key={i} className={cn('h-1 rounded-full', i <= step ? 'bg-lime' : 'bg-surface')} />
          ))}
        </div>

        <div className="flex-1 mt-8 animate-fade-in" key={step}>
          {step === 0 && (
            <>
              <h1 className="text-[28px] font-extrabold tracking-tight">Bem-vindo à Joggo, {me.name.split(' ')[0]}!</h1>
              <p className="text-ink-muted mt-2">Do que você curte? Vamos montar seu feed com isso.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {CATEGORIES.map((c) => {
                  const on = interests.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setInterests((cur) => toggle(cur, c.id))}
                      className={cn('relative h-20 rounded-2xl border text-left px-4 transition-colors', on ? 'border-lime bg-lime/10' : 'border-line bg-surface hover:border-ink-faint')}
                    >
                      <span className="text-2xl" aria-hidden>
                        {INTEREST_EMOJI[c.id]}
                      </span>
                      <span className="block font-bold mt-1">{c.label}</span>
                      {on && <Check className="absolute top-3 right-3 h-5 w-5 text-lime" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-[28px] font-extrabold tracking-tight">Entre nas comunidades</h1>
              <p className="text-ink-muted mt-2">É onde a conversa acontece. Já separamos algumas para você.</p>
              <ul className="mt-6 space-y-2">
                {state.communities.map((c) => {
                  const on = chosenCommunities.includes(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setCommunityIds(toggle(chosenCommunities, c.id))}
                        className={cn('w-full flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors', on ? 'border-lime bg-lime/5' : 'border-line bg-surface hover:border-ink-faint')}
                      >
                        <img src={c.cover} alt="" className="h-12 w-12 rounded-xl object-cover border border-line" />
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold">{c.name}</span>
                          <span className="block text-sm text-ink-muted truncate">{c.description}</span>
                        </span>
                        <span className={cn('grid h-7 w-7 place-items-center rounded-full border', on ? 'bg-lime border-lime text-black' : 'border-line')}>
                          {on && <Check className="h-4 w-4" />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-[28px] font-extrabold tracking-tight">Siga quem já está aqui</h1>
              <p className="text-ink-muted mt-2">Os posts de quem você segue aparecem na aba Seguindo.</p>
              {people.length === 0 ? (
                <p className="mt-6 text-ink-muted">Você é uma das primeiras pessoas por aqui. 🚀</p>
              ) : (
                <ul className="mt-6 space-y-2">
                  {people.map((u) => {
                    const on = chosenFollows.includes(u.id);
                    const t = sel.tipster(state, u.id);
                    return (
                      <li key={u.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                        <Avatar user={u} />
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="font-bold truncate">{u.name}</span>
                            {u.founder && <span className="rounded-full bg-lime/15 text-lime border border-lime/30 px-1.5 py-px text-[10px] font-bold uppercase">Fundador</span>}
                          </span>
                          <span className="block text-sm text-ink-muted truncate">
                            @{u.handle}
                            {t.rate != null && ` · ${t.rate}% de acerto`}
                          </span>
                        </span>
                        <Button size="sm" variant={on ? 'secondary' : 'primary'} onClick={() => setFollowIds(toggle(chosenFollows, u.id))}>
                          {on ? 'Seguindo' : 'Seguir'}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-[28px] font-extrabold tracking-tight">Tudo pronto! 🎉</h1>
              <p className="text-ink-muted mt-2">Aqui, o que vale é o histórico real. Veja como funciona:</p>
              <ul className="mt-6 space-y-3">
                {[
                  [Ticket, 'Poste seu bilhete antes do jogo', 'Jogo, palpite e odd. Depois, marque green ou red.'],
                  [Lock, 'Ninguém apaga o red', 'O resultado é marcado uma vez e fica no seu perfil para sempre.'],
                  [Trophy, 'Seu histórico vira sua reputação', 'Sua taxa de acerto aparece no perfil e nos seus posts.'],
                  [Users, 'Comunidade sem golpe', 'Proibido vender tips ou pedir Pix. Denuncie quem fizer.'],
                ].map(([I, title, text]) => {
                  const Icon = I as typeof Ticket;
                  return (
                    <li key={title as string} className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
                      <Icon className="h-5 w-5 text-lime shrink-0 mt-0.5" aria-hidden />
                      <span>
                        <span className="block font-bold">{title as string}</span>
                        <span className="block text-sm text-ink-muted">{text as string}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="mt-8 space-y-2 safe-bottom">
          {step < 3 ? (
            <Button size="lg" block disabled={step === 0 && !interests.length} onClick={() => setStep(step + 1)}>
              {step === 0 && !interests.length ? 'Escolha pelo menos um' : 'Continuar'}
            </Button>
          ) : (
            <>
              <Button size="lg" block icon={<Ticket className="h-5 w-5" />} onClick={() => finish('bilhete')}>
                Postar meu primeiro bilhete
              </Button>
              <Button size="lg" block variant="ghost" onClick={() => finish()}>
                Ir para o feed
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
