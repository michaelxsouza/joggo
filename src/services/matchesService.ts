// Jogos e resultados: lidos da tabela public.matches (atualizada pelo servidor a cada 10 min).
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Match {
  id: number;
  competitionCode: string;
  competitionName: string;
  competitionEmblem?: string;
  date: Date;
  status: string;
  matchday?: number;
  home: { name: string; short: string; crest?: string };
  away: { name: string; short: string; crest?: string };
  homeScore: number | null;
  awayScore: number | null;
}

/** Nomes em português e ordem de exibição das competições. */
export const COMPETITIONS: Record<string, { label: string; order: number }> = {
  BSA: { label: 'Brasileirão', order: 1 },
  CL: { label: 'Champions League', order: 2 },
  PL: { label: 'Premier League', order: 3 },
  PD: { label: 'La Liga', order: 4 },
  SA: { label: 'Serie A (Itália)', order: 5 },
  BL1: { label: 'Bundesliga', order: 6 },
  FL1: { label: 'Ligue 1', order: 7 },
  PPL: { label: 'Liga Portugal', order: 8 },
};
export const competitionLabel = (code: string, fallback: string) => COMPETITIONS[code]?.label ?? fallback;

export const isLive = (s: string) => s === 'IN_PLAY' || s === 'PAUSED' || s === 'LIVE';
export const isFinished = (s: string) => s === 'FINISHED' || s === 'AWARDED';
export const statusLabel = (s: string) =>
  ({ PAUSED: 'Intervalo', POSTPONED: 'Adiado', SUSPENDED: 'Suspenso', CANCELLED: 'Cancelado', FINISHED: 'Encerrado', AWARDED: 'Encerrado' })[s] ?? '';

/* eslint-disable @typescript-eslint/no-explicit-any */
const toMatch = (r: any): Match => ({
  id: r.id,
  competitionCode: r.competition_code,
  competitionName: r.competition_name,
  competitionEmblem: r.competition_emblem ?? undefined,
  date: new Date(r.utc_date),
  status: r.status,
  matchday: r.matchday ?? undefined,
  home: { name: r.home_name, short: r.home_short || r.home_name, crest: r.home_crest ?? undefined },
  away: { name: r.away_name, short: r.away_short || r.away_name, crest: r.away_crest ?? undefined },
  homeScore: r.home_score,
  awayScore: r.away_score,
});

let cache: { at: number; data: Match[] } | null = null;

/** Carrega os jogos (de 2 dias atrás até 7 dias à frente). Cache de 2 min no navegador. */
export async function fetchMatches(force = false): Promise<Match[]> {
  if (!force && cache && Date.now() - cache.at < 120_000) return cache.data;
  const from = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data, error } = await supabase.from('matches').select('*').gte('utc_date', from).order('utc_date').limit(1000);
  if (error) throw error;
  cache = { at: Date.now(), data: (data ?? []).map(toMatch) };
  return cache.data;
}

export function useMatches() {
  const [matches, setMatches] = useState<Match[] | null>(cache?.data ?? null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = (force = false) =>
      fetchMatches(force)
        .then((m) => alive && (setMatches(m), setError(false)))
        .catch(() => alive && setError(true));
    void load();
    const t = window.setInterval(() => void load(true), 120_000); // atualiza a cada 2 min com a página aberta
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);
  return { matches, error };
}

/** Chave do dia no fuso do Brasil (AAAA-MM-DD). */
export const dayKey = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
export const todayKey = () => dayKey(new Date());
export const shiftDay = (key: string, n: number) => {
  const d = new Date(key + 'T12:00:00-03:00');
  d.setDate(d.getDate() + n);
  return dayKey(d);
};
export const timeBR = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
