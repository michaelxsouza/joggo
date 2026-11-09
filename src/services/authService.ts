// Autenticação real com Supabase Auth.
// O perfil (nome, @usuário, nascimento) é criado no banco por trigger a partir dos metadados do cadastro.
import { useSyncExternalStore } from 'react';
import type { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Session {
  userId: string;
  email: string;
}

export interface SignUpInput {
  name: string;
  handle: string;
  email: string;
  password: string;
  birthDate: string; // yyyy-mm-dd
}

interface AuthState {
  ready: boolean; // sessão inicial já carregada
  session: Session | null;
  recovery: boolean; // usuário voltou pelo link de "esqueci minha senha"
}

let state: AuthState = { ready: false, session: null, recovery: false };
const listeners = new Set<() => void>();
const set = (patch: Partial<AuthState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

const toSession = (u: { id: string; email?: string } | null | undefined): Session | null =>
  u ? { userId: u.id, email: u.email ?? '' } : null;

supabase.auth.getSession().then(({ data }) => set({ ready: true, session: toSession(data.session?.user) }));
supabase.auth.onAuthStateChange((event, s) => {
  set({ ready: true, session: toSession(s?.user), ...(event === 'PASSWORD_RECOVERY' ? { recovery: true } : {}) });
});

/** Traduz os erros do Supabase para mensagens amigáveis. */
function friendly(e: AuthError | Error): Error {
  const m = e.message.toLowerCase();
  if (m.includes('invalid login credentials')) return new Error('E-mail ou senha incorretos.');
  if (m.includes('email not confirmed')) return new Error('Confirme seu e-mail antes de entrar. Procure o link na sua caixa de entrada (e no spam).');
  if (m.includes('already registered') || m.includes('already been registered')) return new Error('Já existe uma conta com este e-mail. Tente entrar.');
  if (m.includes('database error saving new user')) return new Error('Não foi possível criar a conta. Confira se o @usuário está livre e se você tem 18 anos ou mais.');
  if (m.includes('rate limit') || m.includes('too many')) return new Error('Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.');
  if (m.includes('password should be')) return new Error('Senha muito fraca. Use pelo menos 8 caracteres com letras e números.');
  if (m.includes('same password') || m.includes('different from the old')) return new Error('A nova senha precisa ser diferente da anterior.');
  if (m.includes('failed to fetch') || m.includes('network')) return new Error('Sem conexão com o servidor. Verifique sua internet.');
  return new Error('Algo deu errado. Tente novamente.');
}

const appUrl = () => window.location.origin + window.location.pathname;

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

export const auth = {
  getState: () => state,
  async signInWithPassword(email: string, password: string): Promise<void> {
    if (!isEmail(email)) throw new Error('Informe um e-mail válido.');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw friendly(error);
  },
  /** Retorna `needsConfirmation: true` quando o Supabase exige confirmar o e-mail antes do login. */
  async signUp(input: SignUpInput): Promise<{ needsConfirmation: boolean }> {
    if (ageFrom(input.birthDate) < 18) throw new Error('A Joggo é exclusiva para maiores de 18 anos.');
    const handle = input.handle.trim().replace(/^@/, '').toLowerCase();
    const { data: free, error: hErr } = await supabase.rpc('handle_available', { h: handle });
    if (hErr) throw friendly(hErr);
    if (!free) throw new Error('Este @usuário já está em uso. Escolha outro.');
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        emailRedirectTo: appUrl(),
        data: { name: input.name.trim(), handle, birth_date: input.birthDate },
      },
    });
    if (error) throw friendly(error);
    // Com confirmação de e-mail ativa, o Supabase devolve usuário sem sessão.
    // Se o e-mail já existir, devolve usuário sem identidades.
    if (data.user && data.user.identities?.length === 0) throw new Error('Já existe uma conta com este e-mail. Tente entrar.');
    return { needsConfirmation: !data.session };
  },
  async isHandleAvailable(handle: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('handle_available', { h: handle.trim().replace(/^@/, '').toLowerCase() });
    if (error) return true; // não bloqueia o formulário; o banco valida no envio
    return Boolean(data);
  },
  async requestPasswordReset(email: string): Promise<void> {
    if (!isEmail(email)) throw new Error('Informe um e-mail válido.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: appUrl() });
    if (error) throw friendly(error);
  },
  async updatePassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw friendly(error);
    set({ recovery: false });
  },
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    set({ session: null, recovery: false });
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

const getState = () => state;
export const useAuth = () => useSyncExternalStore(auth.subscribe, getState);
export const useSession = () => useAuth().session;
