import type { ReactNode } from 'react';
import { CircleDot, Dices, Heart, MessageCircle, MoreHorizontal, Spade, Trophy } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Avatar } from '@/components/ui/misc';
import { cn } from '@/lib/utils';
import poker from '@/assets/demo/poker.svg';
import futebol from '@/assets/demo/futebol.svg';
import roleta from '@/assets/demo/roleta.svg';
import torneio from '@/assets/demo/torneio.svg';
import basquete from '@/assets/demo/basquete.svg';

const people = [
  { name: 'Ana Paula', avatarColor: '#C2255C' },
  { name: 'Bruno Teixeira', avatarColor: '#2B8A3E' },
  { name: 'Carla Nogueira', avatarColor: '#9C36B5' },
];

/** Balão de fala com o "J" da marca, usado como ornamento. */
function Bubble({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('text-lime/70', className)} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M14 6h36a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H38l-6 14-2-14H14a8 8 0 0 1-8-8V14a8 8 0 0 1 8-8Z" strokeLinejoin="round" />
    </svg>
  );
}

function Tag({ icon, children, className }: { icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn('absolute inline-flex items-center gap-2 rounded-xl border border-lime/30 bg-card/95 px-3.5 py-2 text-sm font-bold shadow-pop', className)}>
      <span className="text-lime">{icon}</span>
      {children}
    </span>
  );
}

function MiniPost({ name, color, time, text, likes, comments, className, image }: { name: string; color: string; time: string; text: string; likes: number; comments: number; className?: string; image?: string }) {
  return (
    <div className={cn('absolute rounded-2xl border border-line bg-card/95 p-4 shadow-pop backdrop-blur', className)}>
      <div className="flex items-center gap-2.5">
        <Avatar user={{ name, avatarColor: color }} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">{name}</p>
          <p className="text-[11px] text-ink-faint">{time}</p>
        </div>
        <MoreHorizontal className="h-4 w-4 text-ink-faint" />
      </div>
      <div className="flex gap-3 mt-2.5">
        <p className="text-[13px] leading-snug flex-1">{text}</p>
        {image && <img src={image} alt="" className="h-16 w-20 rounded-lg object-cover border border-line" />}
      </div>
      <div className="flex gap-4 mt-2.5 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" /> {likes}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" /> {comments}
        </span>
      </div>
    </div>
  );
}

/** Colagem ilustrativa (desktop). Pessoas e números são fictícios. */
function Collage() {
  return (
    <div className="relative h-[420px] xl:h-[460px] w-full max-w-[640px] select-none" aria-hidden>
      <img src={torneio} alt="" className="absolute left-[2%] top-[42%] h-40 w-56 rounded-2xl object-cover border border-line rotate-[-3deg] opacity-90" />
      <img src={futebol} alt="" className="absolute left-[10%] bottom-0 h-36 w-52 rounded-2xl object-cover border border-line rotate-[2deg]" />
      <img src={roleta} alt="" className="absolute right-[14%] bottom-[2%] h-32 w-40 rounded-2xl object-cover border border-line rotate-[3deg]" />
      <img src={basquete} alt="" className="absolute right-[2%] top-0 h-40 w-36 rounded-2xl object-cover border border-line rotate-[4deg]" />

      <MiniPost
        className="left-0 top-0 w-[280px] rotate-[-2deg] animate-[pop-in_.5s_ease-out_both]"
        name="Rafael M."
        color="#3B5BDB"
        time="2h atrás"
        text="Quem topa uma partida de poker hoje à noite?"
        likes={24}
        comments={7}
        image={poker}
      />
      <MiniPost
        className="right-[8%] top-[34%] w-[270px] rotate-[1.5deg] animate-[pop-in_.5s_.12s_ease-out_both]"
        name="Camila S."
        color="#D6336C"
        time="5h atrás"
        text="Essa comunidade é demais! Sempre encontro gente para conversar sobre as rodadas."
        likes={52}
        comments={12}
      />

      <Tag icon={<Spade className="h-4 w-4 fill-current" />} className="left-[48%] top-[4%] rotate-[-4deg]">Poker</Tag>
      <Tag icon={<Trophy className="h-4 w-4" />} className="left-[-2%] top-[34%] rotate-[-5deg]">Esportes</Tag>
      <Tag icon={<CircleDot className="h-4 w-4" />} className="left-[42%] bottom-[-4%] rotate-[3deg]">Roleta</Tag>
      <Tag icon={<Dices className="h-4 w-4" />} className="right-0 bottom-[30%] rotate-[-4deg]">Cassino</Tag>

      <div className="absolute left-[38%] top-[77%] flex items-center">
        {people.map((p) => (
          <Avatar key={p.name} user={p} size="md" className="-ml-2 first:ml-0 ring-2 ring-bg" />
        ))}
        <span className="-ml-2 h-11 w-11 rounded-full bg-surface ring-2 ring-bg text-sm font-bold inline-flex items-center justify-center">+12</span>
      </div>

      <Bubble className="absolute left-[40%] top-[22%] h-10 w-10" />
      <Bubble className="absolute left-[30%] bottom-[24%] h-12 w-12" />
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg relative overflow-hidden">
      {/* textura sutil */}
      <div className="pointer-events-none absolute inset-0 opacity-[.05]" style={{ backgroundImage: 'radial-gradient(#B0FF35 1px, transparent 1px)', backgroundSize: '22px 22px' }} aria-hidden />
      <div className="relative mx-auto max-w-[1280px] min-h-dvh grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 px-4 sm:px-6 lg:px-10 py-8 lg:py-12 items-center">
        <section className="hidden lg:flex flex-col gap-8" aria-label="Sobre a Joggo">
          <Logo height={52} className="self-start" />
          <div>
            <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.02]">
              Seu jogo.
              <br />
              <span className="text-lime">Sua comunidade.</span>
            </h1>
            <p className="mt-4 text-lg text-ink-muted max-w-md">Conecte-se com quem compartilha a sua paixão por jogos.</p>
          </div>
          <Collage />
        </section>

        <section className="w-full flex justify-center lg:justify-end">
          <div className="w-full max-w-[460px]">
            <div className="lg:hidden flex justify-center mb-6">
              <Logo height={40} />
            </div>
            <div className="sm:card sm:p-8 lg:p-10 animate-pop-in">{children}</div>
            <p className="mt-5 text-center text-[11px] text-ink-faint">
              <span className="inline-flex items-center rounded border border-ink-faint/40 px-1 mr-1 font-bold text-ink-muted">18+</span>
              Jogue com responsabilidade. A Joggo é uma rede social e não oferece apostas.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
