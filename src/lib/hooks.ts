import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

/** Layout de celular/tablet (abaixo de 1024px). */
export const useIsMobile = () => useMediaQuery('(max-width: 1023px)');

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Joggo` : 'Joggo — Rede social de apostas esportivas, bilhetes e palpites de futebol';
  }, [title]);
}
