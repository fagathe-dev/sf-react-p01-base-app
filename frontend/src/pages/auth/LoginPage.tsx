import { useAuthStore } from '@/stores/auth.store';
import { AuthResponse } from '@/types/auth.types';
import { AuthCard } from '@/components/AuthCard';
import { Link, SegmentedControl } from 'core-react/ui';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CodeLoginForm, PasswordLoginForm } from './components';

type LoginMode = 'password' | 'code';

const LOGIN_MODES: Array<{ value: LoginMode; label: string; icon: string }> = [
  { value: 'password', label: 'Mot de passe', icon: 'lock-outline' },
  { value: 'code', label: 'Code par e-mail', icon: 'email-fast-outline' },
];

export const LoginPage = () => {
  const [mode, setMode] = useState<LoginMode>('password');
  const { setAuth, token, user } = useAuthStore();
  const navigate = useNavigate();

  // Redirection automatique si une session valide est déjà active
  useEffect(() => {
    if (token && user) {
      navigate('/', { replace: true });
    }
  }, [token, user, navigate]);

  const handleAuthenticated = ({ token, user }: AuthResponse) => {
    setAuth(token, user);
    navigate('/');
  };

  return (
    <AuthCard
      title="Bon retour parmi nous"
      subtitle="Connectez-vous pour retrouver vos tâches et votre journal."
      footer={
        <>
          Pas encore de compte ? <Link href="/register">Créer un compte</Link>
        </>
      }
    >
      <SegmentedControl
        aria-label="Mode de connexion"
        options={LOGIN_MODES}
        value={mode}
        onChange={setMode}
        fullWidth
      />

      {mode === 'password' ? (
        <PasswordLoginForm onAuthenticated={handleAuthenticated} />
      ) : (
        <CodeLoginForm onAuthenticated={handleAuthenticated} />
      )}
    </AuthCard>
  );
};
