import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, CalendarDays, Mail, User } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { IconField, PasswordField } from '@/components/auth/PasswordField';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ageFrom, auth, isEmail, passwordStrength } from '@/services/authService';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { MailCheck } from 'lucide-react';

type Errors = Partial<Record<'name' | 'handle' | 'email' | 'birthDate' | 'password' | 'terms' | 'form', string>>;

export default function SignUpPage() {
  useDocumentTitle('Criar conta');
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const [f, setF] = useState({ name: '', handle: '', email: '', birthDate: '', password: '', terms: false });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const strength = passwordStrength(f.password);

  const up = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, form: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    const handle = f.handle.trim().replace(/^@/, '');
    if (f.name.trim().length < 2) errs.name = 'Informe seu nome.';
    if (!/^[a-z0-9._]{3,20}$/i.test(handle)) errs.handle = 'De 3 a 20 caracteres: letras, números, ponto ou _.';
    else if (!(await auth.isHandleAvailable(handle))) errs.handle = 'Este @usuário já está em uso.';
    if (!isEmail(f.email)) errs.email = 'Informe um e-mail válido.';
    if (!f.birthDate) errs.birthDate = 'Informe sua data de nascimento.';
    else if (ageFrom(f.birthDate) < 18) errs.birthDate = 'A Joggo é exclusiva para maiores de 18 anos.';
    else if (ageFrom(f.birthDate) > 110) errs.birthDate = 'Confira a data de nascimento.';
    if (f.password.length < 8) errs.password = 'Use pelo menos 8 caracteres.';
    else if (strength.score < 2) errs.password = 'Senha fraca: misture letras maiúsculas, minúsculas e números.';
    if (!f.terms) errs.terms = 'Você precisa aceitar os Termos de Uso e a Política de Privacidade.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const { needsConfirmation } = await auth.signUp({ ...f, handle });
      if (needsConfirmation) {
        setConfirmEmail(f.email.trim());
        return;
      }
      toast.success(`Conta criada! Bem-vindo(a), ${f.name.trim().split(' ')[0]}.`);
      navigate('/', { replace: true });
    } catch (err) {
      setErrors({ form: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const maxBirth = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().slice(0, 10);
  })();

  if (confirmEmail)
    return (
      <AuthLayout>
        <div className="text-center">
          <MailCheck className="h-12 w-12 text-lime mx-auto" aria-hidden />
          <h1 className="text-[26px] font-extrabold tracking-tight mt-4">Confirme seu e-mail</h1>
          <p className="text-ink-muted mt-2">
            Enviamos um link para <strong className="text-ink">{confirmEmail}</strong>. Clique nele para ativar sua conta e depois entre na Joggo.
          </p>
          <p className="text-xs text-ink-faint mt-3">Não chegou? Confira a pasta de spam.</p>
          <Link to="/entrar" className="inline-block mt-6 font-bold text-lime hover:underline">
            Ir para o login
          </Link>
        </div>
      </AuthLayout>
    );

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h1 className="text-[28px] font-extrabold tracking-tight">Crie sua conta</h1>
        <p className="text-ink-muted mt-1">Leva menos de um minuto.</p>
      </div>


      <form onSubmit={submit} noValidate className="space-y-4">
        <IconField label="Nome" autoComplete="name" icon={<User className="h-[18px] w-[18px]" />} value={f.name} onChange={(e) => up('name', e.target.value)} error={errors.name} maxLength={50} placeholder="Como você quer ser chamado" />
        <IconField label="Usuário" autoComplete="username" icon={<AtSign className="h-[18px] w-[18px]" />} value={f.handle} onChange={(e) => up('handle', e.target.value)} error={errors.handle} maxLength={21} placeholder="seu.usuario" />
        <IconField label="E-mail" type="email" inputMode="email" autoComplete="email" icon={<Mail className="h-[18px] w-[18px]" />} value={f.email} onChange={(e) => up('email', e.target.value)} error={errors.email} placeholder="voce@email.com" />
        <IconField
          label="Data de nascimento"
          type="date"
          max={maxBirth}
          icon={<CalendarDays className="h-[18px] w-[18px]" />}
          value={f.birthDate}
          onChange={(e) => up('birthDate', e.target.value)}
          error={errors.birthDate}
          hint="Usada só para confirmar que você tem 18 anos ou mais."
        />
        <div>
          <PasswordField label="Senha" autoComplete="new-password" value={f.password} onChange={(e) => up('password', e.target.value)} error={errors.password} placeholder="Mínimo de 8 caracteres" />
          {f.password && !errors.password && (
            <div className="mt-2" aria-live="polite">
              <div className="flex gap-1" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={cn('h-1 flex-1 rounded-full', i < strength.score ? (strength.score >= 3 ? 'bg-lime' : 'bg-warn') : 'bg-surface')} />
                ))}
              </div>
              <p className="text-xs text-ink-muted mt-1">Força da senha: {strength.label}</p>
            </div>
          )}
        </div>
        <div>
          <label className="flex items-start gap-2.5 text-sm cursor-pointer">
            <input type="checkbox" checked={f.terms} onChange={(e) => up('terms', e.target.checked)} className="accent-[#B0FF35] h-4 w-4 mt-0.5" aria-invalid={!!errors.terms} />
            <span className="text-ink-muted">
              Tenho 18 anos ou mais e aceito os{' '}
              <Link to="/termos" className="text-lime hover:underline">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link to="/termos#privacidade" className="text-lime hover:underline">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>
          {errors.terms && (
            <p role="alert" className="error-text">
              {errors.terms}
            </p>
          )}
        </div>
        {errors.form && (
          <p role="alert" className="error-text">
            {errors.form}
          </p>
        )}
        <Button type="submit" size="lg" block loading={loading}>
          Criar conta
        </Button>
      </form>

      <p className="text-center mt-6 text-[15px] text-ink-muted">
        Já tem conta?{' '}
        <Link to="/entrar" className="font-bold text-lime hover:underline">
          Entrar
        </Link>
      </p>
      <div className="mt-6">
      </div>
    </AuthLayout>
  );
}
