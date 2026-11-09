import { useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordField } from '@/components/auth/PasswordField';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { auth, passwordStrength } from '@/services/authService';
import { useDocumentTitle } from '@/lib/hooks';

/** Exibida quando o usuário volta pelo link de recuperação de senha. */
export default function NewPasswordPage() {
  useDocumentTitle('Nova senha');
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Use pelo menos 8 caracteres.');
    if (passwordStrength(password).score < 2) return setError('Senha fraca: misture letras maiúsculas, minúsculas e números.');
    if (password !== confirm) return setError('As senhas não conferem.');
    setLoading(true);
    try {
      await auth.updatePassword(password);
      toast.success('Senha alterada! Você já está conectado.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-7">
        <h1 className="text-[28px] font-extrabold tracking-tight">Crie uma nova senha</h1>
        <p className="text-ink-muted mt-1">Escolha uma senha que você não usa em outros sites.</p>
      </div>
      <form onSubmit={submit} noValidate className="space-y-4">
        <PasswordField label="Nova senha" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(undefined); }} placeholder="Mínimo de 8 caracteres" autoFocus />
        <PasswordField label="Repita a nova senha" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(undefined); }} error={error} />
        <Button type="submit" size="lg" block loading={loading}>
          Salvar nova senha
        </Button>
      </form>
    </AuthLayout>
  );
}
