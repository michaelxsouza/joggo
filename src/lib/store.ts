import { useRef, useSyncExternalStore } from 'react';

/**
 * Store mínimo com persistência em localStorage.
 * Toda leitura/escrita é protegida: em navegação privada ou com armazenamento
 * cheio o app continua funcionando apenas em memória.
 * Nunca armazene senhas, tokens ou dados sensíveis aqui.
 */
export interface Store<T> {
  get: () => T;
  set: (updater: (prev: T) => T) => void;
  subscribe: (fn: () => void) => () => void;
  reset: () => void;
  /** Último erro de persistência (ex.: cota excedida), se houver. */
  lastError: () => string | null;
}

export function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): string | null {
  try {
    window.localStorage.setItem(key, value);
    return null;
  } catch (e) {
    const name = (e as DOMException)?.name;
    return name === 'QuotaExceededError'
      ? 'O armazenamento local do navegador está cheio. Remova imagens ou restaure os dados de demonstração.'
      : 'Não foi possível salvar no navegador. As alterações valem só até recarregar a página.';
  }
}

export function safeRemove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignora */
  }
}

export function createPersistentStore<T extends { version: number }>(
  key: string,
  seed: () => T,
  migrate?: (raw: T) => T,
): Store<T> {
  const listeners = new Set<() => void>();
  let error: string | null = null;

  const load = (): T => {
    const raw = safeGet(key);
    if (!raw) return seed();
    try {
      const parsed = JSON.parse(raw) as T;
      const fresh = seed();
      if (parsed.version !== fresh.version) return fresh;
      return migrate ? migrate(parsed) : parsed;
    } catch {
      return seed();
    }
  };

  let state = load();

  const emit = () => listeners.forEach((l) => l());

  return {
    get: () => state,
    set: (updater) => {
      state = updater(state);
      error = safeSet(key, JSON.stringify(state));
      emit();
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    reset: () => {
      safeRemove(key);
      state = seed();
      error = safeSet(key, JSON.stringify(state));
      emit();
    },
    lastError: () => error,
  };
}

/**
 * Assina o store com um seletor. O resultado é memorizado por (estado, seletor),
 * então seletores podem devolver arrays/objetos novos sem causar loops de render.
 */
export function useStore<T, S>(store: Store<T>, selector: (s: T) => S): S {
  const cache = useRef<{ state: T; selector: (s: T) => S; value: S } | null>(null);
  const getSnapshot = () => {
    const state = store.get();
    const c = cache.current;
    if (c && c.state === state && c.selector === selector) return c.value;
    const value = selector(state);
    cache.current = { state, selector, value };
    return value;
  };
  return useSyncExternalStore(store.subscribe, getSnapshot);
}
