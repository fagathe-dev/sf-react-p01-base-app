import { getErrorMessage } from '@/services/apiError';
import { verifyEmail } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { AuthCard } from '@/components/AuthCard';
import { Alert, Button, Loading } from 'core-react/ui';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Page ouverte depuis le lien reçu à l'inscription (/verify-email?token=…) :
 * active le compte puis connecte automatiquement l'utilisateur.
 */
export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(token ? null : 'Le lien de vérification est incomplet.');
  // Le jeton est à usage unique : évite un second appel (StrictMode exécute les effets deux fois en dev)
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token || hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        const { token: jwt, user } = await verifyEmail(token);
        useAuthStore.getState().setAuth(jwt, user);
        navigate('/', { replace: true });
      } catch (err) {
        setError(getErrorMessage(err, 'Ce lien de vérification est invalide ou a expiré.'));
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <AuthCard title="Vérification du compte">
      {error ? (
        <>
          <Alert variant="danger">{error}</Alert>
          <Button href="/login" $fullWidth>
            Se connecter pour recevoir un nouveau lien
          </Button>
        </>
      ) : (
        <Loading size="lg" label="Activation de votre compte…" />
      )}
    </AuthCard>
  );
};
