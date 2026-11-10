import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/layout/AppShell';
import { Chip, EmptyState } from '@/components/ui/misc';
import { COMPETITIONS, competitionLabel, dayKey, isFinished, isLive, shiftDay, statusLabel, timeBR, todayKey, useMatches, type Match } from '@/services/matchesService';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';

const dayTitle = (key: string) => {
  const t = todayKey();
  if (key === t) return 'Hoje';
  if (key === shiftDay(t, -1)) return 'Ontem';
  if (key === shiftDay(t, 1)) return 'Amanhã';
  const d = new Date(key + 'T12:00:00-03:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
};

export default function MatchesPage() {
  useDocumentTitle('Jogos');
  const { matches, error } = useMatches();
  const [day, setDay] = useState(todayKey());
  const [comp, setComp] = useState<string>('todas');

  const days = useMemo(() => Array.from({ length: 10 }, (_, i) => shiftDay(todayKey(), i - 2)), []);
  const liveCount = (matches ?? []).filter((m) => isLive(m.status)).length;

  const groups = useMemo(() => {
    const list = (matches ?? []).filter((m) => dayKey(m.date) === day && (comp === 'todas' || m.competitionCode === comp));
    const by = new Map<string, Match[]>();
    for (const m of list) by.set(m.competitionCode, [...(by.get(m.competitionCode) ?? []), m]);
    return [...by.entries()].sort((a, b) => (COMPETITIONS[a[0]]?.order ?? 99) - (COMPETITIONS[b[0]]?.order ?? 99));
  }, [matches, day, comp]);

  const competitionsWithGames = useMemo(() => {
    const set = new Set((matches ?? []).map((m) => m.competitionCode));
    return Object.keys(COMPETITIONS).filter((c) => set.has(c));
  }, [matches]);

  return (
    <div>
      <PageHeader title="Jogos" subtitle={liveCount ? `${liveCount} ${liveCount === 1 ? 'jogo' : 'jogos'} ao vivo agora` : 'Resultados e próximos jogos'} />

      <div className="sticky top-14 lg:top-0 z-20 bg-bg/90 backdrop-blur pb-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-4 lg:px-0 py-2" role="tablist" aria-label="Dia">
          {days.map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={day === d}
              onClick={() => setDay(d)}
              className={cn(
                'shrink-0 h-9 px-3.5 rounded-full text-sm font-bold border capitalize',
                day === d ? 'bg-lime text-black border-lime' : 'border-line text-ink-muted hover:text-ink',
              )}
            >
              {dayTitle(d)}
            </button>
          ))}
        </div>
        {competitionsWithGames.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 lg:px-0 pt-1" role="group" aria-label="Campeonato">
            <Chip active={comp === 'todas'} onClick={() => setComp('todas')}>
              Todos
            </Chip>
            {competitionsWithGames.map((c) => (
              <Chip key={c} active={comp === c} onClick={() => setComp(c)}>
                {COMPETITIONS[c]!.label}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 lg:px-0 space-y-4 mt-2">
        {error && !matches && <p className="text-center text-ink-muted py-10">Não foi possível carregar os jogos agora.</p>}
        {!error && matches == null && <p className="text-center text-ink-faint py-10">Carregando jogos…</p>}
        {matches && matches.length === 0 && (
          <EmptyState icon={<Trophy className="h-6 w-6" />} title="Jogos chegando">
            Os jogos e resultados aparecem aqui assim que a atualização automática rodar.
          </EmptyState>
        )}
        {matches && matches.length > 0 && groups.length === 0 && (
          <EmptyState icon={<CalendarDays className="h-6 w-6" />} title={`Sem jogos ${dayTitle(day).toLowerCase() === 'hoje' ? 'hoje' : 'neste dia'}`}>
            Escolha outro dia acima.
          </EmptyState>
        )}
        {groups.map(([code, list]) => (
          <section key={code} className="card overflow-hidden" aria-label={competitionLabel(code, list[0]!.competitionName)}>
            <header className="flex items-center gap-2 px-4 py-2.5 border-b border-line bg-surface/60">
              {list[0]!.competitionEmblem && <img src={list[0]!.competitionEmblem} alt="" className="h-5 w-5 object-contain" loading="lazy" />}
              <h2 className="text-sm font-bold">{competitionLabel(code, list[0]!.competitionName)}</h2>
              {list[0]!.matchday && <span className="text-xs text-ink-faint">· Rodada {list[0]!.matchday}</span>}
            </header>
            <ul className="divide-y divide-line">
              {list.map((m) => (
                <MatchRow key={m.id} m={m} />
              ))}
            </ul>
          </section>
        ))}
        {matches && matches.length > 0 && (
          <p className="text-center text-[11px] text-ink-faint py-4">
            Atualizado automaticamente. Placares ao vivo podem ter alguns minutos de atraso. Dados: football-data.org.{' '}
            <Link to="/comunidades/bilhete-do-dia" className="text-lime hover:underline">
              Postar bilhete
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export function MatchRow({ m, compact = false }: { m: Match; compact?: boolean }) {
  const live = isLive(m.status);
  const done = isFinished(m.status);
  const hasScore = m.homeScore != null && m.awayScore != null && (live || done);
  const label = statusLabel(m.status);
  const winner = done && hasScore ? (m.homeScore! > m.awayScore! ? 'home' : m.awayScore! > m.homeScore! ? 'away' : null) : null;

  return (
    <li className={cn('flex items-center gap-3', compact ? 'py-2' : 'px-4 py-3')}>
      <div className={cn('shrink-0 text-center', compact ? 'w-11' : 'w-14')}>
        {live ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-danger">
            <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" aria-hidden /> {m.status === 'PAUSED' ? 'INT' : 'AO VIVO'}
          </span>
        ) : (
          <span className={cn('text-xs font-semibold', done ? 'text-ink-faint' : 'text-ink-muted')}>{label && !done ? label : done ? 'Fim' : timeBR(m.date)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        {(['home', 'away'] as const).map((side) => {
          const t = m[side];
          const score = side === 'home' ? m.homeScore : m.awayScore;
          return (
            <div key={side} className="flex items-center gap-2">
              {t.crest ? <img src={t.crest} alt="" className="h-5 w-5 object-contain shrink-0" loading="lazy" /> : <span className="h-5 w-5 shrink-0 rounded-full bg-surface" />}
              <span className={cn('flex-1 truncate text-[15px]', winner === side ? 'font-bold' : winner ? 'text-ink-muted' : 'font-medium')}>{compact ? t.short : t.name}</span>
              {hasScore && <span className={cn('tabular-nums font-extrabold w-5 text-right', live && 'text-danger', winner === side && 'text-lime')}>{score}</span>}
            </div>
          );
        })}
      </div>
    </li>
  );
}
