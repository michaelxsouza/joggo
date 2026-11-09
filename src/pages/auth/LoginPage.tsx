import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Info, Mail } from 'lucide-react';
import { AuthLayout, GoogleIcon } from '@/components/auth/AuthLayout';
import { IconField, PasswordField } from '@/components/auth/PasswordField';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { auth, isEmail } from '@/services/authService';
import { useDocumentTitle } from '@/lib/hooks';

export function DemoAuthNotice() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-info/25 bg-info/5 px-3 py-2.5 text-xs text-ink-muted">
      <Info className="h-4 w-4 text-info shrink-0" aria-hidden />
      <p>
        <strong className="text-ink">Modo demonstração:</strong> não há autenticação real. Qualquer e-mail e senha válidos entram no perfil de exemplo, e a senha não é salva.
      </p>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 my-5 text-sm text-ink-faint" aria-hidden>
      <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function useGoogleSignIn() {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const run = async (to: string) => {
    setLoading(true);
    try {
      await auth.signInWithGoogle();
      toast.info('Login com Google depende de integração OAuth. Você entrou em modo demonstração.');
      navigate(to, { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  return { run, loading };
}

export default function LoginPage() {
  useDocumentTitle('Entrar');
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const google = useGoogleSignIn();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'Informe seu e-mail.';
    else if (!isEmail(email)) errs.email = 'Este e-mail não parece válido. Confira se tem @ e domínio.';
    if (!password) errs.password = 'Informe sua senha.';
    else if (password.length < 8) errs.password = 'A senha tem pelo menos 8 caracteres.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await auth.signInWithPassword(email, password, remember);
      setPassword('');
      toast.success('Bem-vindo de volta!');
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ form: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-7">
        <h1 className="text-[28px] font-extrabold tracking-tight">Entre na Joggo</h1>
        <p className="text-ink-muted mt-1">Sua comunidade está esperando por você.</p>
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        <IconField
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@email.com"
          icon={<Mail className="h-[18px] w-[18px]" />}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((x) => ({ ...x, email: undefined, form: undefined }));
          }}
          error={errors.email}
          autoFocus
        />
        <PasswordField
          label="Senha"
          autoComplete="current-password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((x) => ({ ...x, password: undefined, form: undefined }));
          }}
          error={errors.password}
        />
        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[#B0FF35] h-4 w-4" />
            Lembrar de mim
          </label>
          <button type="button" onClick={() => setForgot(true)} className="font-semibold text-lime hover:underline">
            Esqueci minha senha
          </button>
        </div>
        {errors.form && (
          <p role="alert" className="error-text">
            {errors.form}
          </p>
        )}
        <Button type="submit" size="lg" block loading={loading}>
          Entrar
        </Button>
      </form>

      <AuthDivider />

      <Button variant="outline" size="lg" block loading={google.loading} icon={<GoogleIcon className="h-5 w-5" />} onClick={() => google.run(from)}>
        Continuar com Google
      </Button>

      <p className="text-center mt-6 text-[15px] text-ink-muted">
        Ainda não tem conta?{' '}
        <Link to="/criar-conta" className="font-bold text-lime hover:underline">
          Criar conta
        </Link>
      </p>

      <div className="mt-6 space-y-4">
        <DemoAuthNotice />
        <p className="text-center text-xs text-ink-faint leading-relaxed">
          Ao continuar, você concorda com os{' '}
          <Link to="/termos" className="underline hover:text-ink">
            Termos de Uso
          </Link>{' '}
          e a{' '}
          <Link to="/termos#privacidade" className="underline hover:text-ink">
            Política de Privacidade
          </Link>
          .
          <br />
          Exclusivo para maiores de 18 anos.
        </p>
      </div>

      <ForgotPasswordModal open={forgot} onClose={() => setForgot(false)} initialEmail={email} />
    </AuthLayout>
  );
}

function ForgotPasswordModal({ open, onClose, initialEmail }: { open: boolean; onClose: () => void; initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) setEmail(initialEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    onClose();
    setTimeout(() => {
      setSent(false);
      setError(undefined);
    }, 200);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Recuperar senha" size="sm" description={sent ? undefined : 'Enviaremos um link para você criar uma nova senha.'}>
      {sent ? (
        <div className="space-y-4">
          <p className="text-[15px] text-ink-muted">
            Se houver uma conta com <strong className="text-ink">{email}</strong>, você receberá um link de recuperação em instantes.
          </p>
          <p className="text-xs text-ink-faint">Demonstração: nenhum e-mail é enviado até existir integração de envio.</p>
          <Button block onClick={close}>
            Voltar ao login
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <IconField
            label="E-mail"
            type="email"
            autoComplete="email"
            data-autofocus
            icon={<Mail className="h-[18px] w-[18px]" />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(undefined);
            }}
            error={error}
            placeholder="voce@email.com"
          />
          <Button type="submit" block loading={loading}>
            Enviar link
          </Button>
        </form>
      )}
    </Modal>
  );
}
