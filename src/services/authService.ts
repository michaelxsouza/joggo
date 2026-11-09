// Autenticação — implementação de DEMONSTRAÇÃO.
// Não há verificação de senha: nenhuma senha é enviada ou armazenada.
// Para produção, implemente `AuthProvider` com um backend (ex.: Supabase Auth) e troque `auth` abaixo.
import { useSyncExternalStore } from 'react';
import { safeGet, safeRemove, safeSet } from '@/lib/store';

export interface Session {
  mode: 'demo';
  provider: 'email' | 'google';
  startedAt: string;
}

export interface SignUpInput {
  name: string;
  handle: string;
  email: string;
  password: string;
  birthDate: string; // yyyy-mm-dd
}

export interface AuthProvider {
  readonly isDemo: boolean;
  getSession(): Session | null;
  signInWithPassword(email: string, password: string, remember: boolean): Promise<Session>;
  signInWithGoogle(): Promise<Session>;
  signUp(input: SignUpInput): Promise<Session>;
  requestPasswordReset(email: string): Promise<void>;
  signOut(): void;
  subscribe(fn: () => void): () => void;
}

const KEY = 'joggo:session';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const readSession = (): Session | null => {
  const raw = safeGet(KEY) ?? sessionGet();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
};

function sessionGet() {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function sessionSet(v: string | null) {
  try {
    if (v === null) window.sessionStorage.removeItem(KEY);
    else window.sessionStorage.setItem(KEY, v);
  } catch {
    /* ignora */
  }
}

let current: Session | null = readSession();

function start(provider: Session['provider'], remember: boolean): Session {
  const s: Session = { mode: 'demo', provider, startedAt: new Date().toISOString() };
  const json = JSON.stringify(s);
  // "Lembrar de mim": persiste no navegador; caso contrário, só nesta aba.
  if (remember) {
    safeSet(KEY, json);
    sessionSet(null);
  } else {
    safeRemove(KEY);
    sessionSet(json);
  }
  current = s;
  emit();
  return s;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- Validações compartilhadas ----------
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export function ageFrom(birthDate: string): number {
  const b = new Date(birthDate + 'T12:00:00');
  const n = new Date();
  let age = n.getFullYear() - b.getFullYear();
  const m = n.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < b.getDate())) age--;
  return age;
}

export function passwordStrength(p: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) score++;
  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score]! };
}

export const auth: AuthProvider = {
  isDemo: true,
  getSession: () => current,
  async signInWithPassword(email, password, remember) {
    if (!isEmail(email)) throw new Error('Informe um e-mail válido.');
    if (password.length < 8) throw new Error('A senha tem pelo menos 8 caracteres.');
    await wait(500);
    // Demonstração: qualquer e-mail/senha válidos entram no perfil de exemplo. A senha é descartada.
    return start('email', remember);
  },
  async signInWithGoogle() {
    await wait(400);
    return start('google', true);
  },
  async signUp(input) {
    if (ageFrom(input.birthDate) < 18) throw new Error('A Joggo é exclusiva para maiores de 18 anos.');
    await wait(600);
    return start('email', true);
  },
  async requestPasswordReset(email) {
    if (!isEmail(email)) throw new Error('Informe um e-mail válido.');
    await wait(500);
  },
  signOut() {
    safeRemove(KEY);
    sessionSet(null);
    current = null;
    emit();
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export const useSession = () => useSyncExternalStore(auth.subscribe, auth.getSession);
