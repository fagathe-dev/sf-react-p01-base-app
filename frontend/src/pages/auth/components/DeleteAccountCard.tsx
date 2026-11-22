import { getErrorMessage } from '@/services/apiError';
import { deleteAccount, requestAccountDeletion } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { Alert, Button, Card, ConfirmDialog, Flex, Text, TextField, Title } from 'core-react/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { styled } from 'styled-components';
import { z } from 'zod';
import { loginCodeSchema } from '../authSchemas';

const codeFormSchema = z.object({ code: loginCodeSchema });
type CodeFormData = z.infer<typeof codeFormSchema>;

interface PendingCode {
  /** Timestamps (ms) d'expiration du code et de disponibilité d'un nouvel envoi */
  expiresAt: number;
  resendAt: number;
}

const DangerCard = styled(Card)`
  border-color: ${({ theme }) => theme.colors.danger.base};
`;

const DangerHeader = styled(Card.Header)`
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[4]};
  background-color: ${({ theme }) => theme.colors.danger.subtle};
`;

const Heading = styled(Title)`
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const Intro = styled.div`
  flex: 1;
  min-width: 16rem;
`;

const formatDuration = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const secondsUntil = (timestamp: number, now: number): number => Math.max(0, Math.ceil((timestamp - now) / 1000));

/** Horodatage courant, lu uniquement dans les gestionnaires d'événements (jamais pendant le rendu) */
const currentTimestamp = (): number => Date.now();

/**
 * Suppression définitive du compte en deux étapes : envoi d'un code par e-mail (10 min), puis saisie du code.
 */
export const DeleteAccountCard = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [pending, setPending] = useState<PendingCode | null>(null);
  const [now, setNow] = useState(currentTimestamp);
  const [info, setInfo] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeFormSchema),
    defaultValues: { code: '' },
  });

  // Rafraîchit les comptes à rebours tant qu'un code est en attente
  useEffect(() => {
    if (!pending) return;
    const interval = setInterval(() => setNow(currentTimestamp()), 1000);
    return () => clearInterval(interval);
  }, [pending]);

  const sendCode = async () => {
    setApiError(null);
    try {
      setIsRequesting(true);
      const response = await requestAccountDeletion();
      const sentAt = currentTimestamp();

      setNow(sentAt);
      setPending({
        expiresAt: sentAt + response.expiresIn * 1000,
        resendAt: sentAt + response.resendAvailable * 1000,
      });
      setInfo(response.message);
      reset({ code: '' });
    } catch (err) {
      setApiError(getErrorMessage(err, "Impossible d'envoyer le code de confirmation."));
    } finally {
      setIsRequesting(false);
    }
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleConfirmStart = () => {
    setIsConfirmOpen(false);
    sendCode();
  };

  const handleCancel = () => {
    setPending(null);
    setInfo(null);
    setApiError(null);
  };

  const onSubmit = async ({ code }: CodeFormData) => {
    setApiError(null);
    try {
      await deleteAccount(code.trim());
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      reset({ code: '' });
      setApiError(getErrorMessage(err, 'Erreur lors de la suppression du compte.'));
    }
  };

  const expiresIn = pending ? secondsUntil(pending.expiresAt, now) : 0;
  const resendIn = pending ? secondsUntil(pending.resendAt, now) : 0;

  return (
    <DangerCard>
      <DangerHeader>
        <Intro>
          <Heading as="h3" $color="danger">
            Supprimer définitivement le compte
          </Heading>
          <Text $size="sm" $color="muted">
            Cette action est irréversible : vos tâches, votre journal et tous vos fichiers seront supprimés du serveur.
            Un code de confirmation vous sera envoyé par e-mail.
          </Text>
        </Intro>

        {!pending && (
          <Button type="button" $variant="danger" $loading={isRequesting} onClick={() => setIsConfirmOpen(true)}>
            Supprimer mon compte
          </Button>
        )}
      </DangerHeader>

      {(apiError || pending) && (
        <Card.Body>
          <Flex $direction="column" $gap="1rem">
            {apiError && <Alert variant="danger">{apiError}</Alert>}

            {pending && (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Flex $direction="column" $gap="0.75rem">
                  {!apiError &&
                    (expiresIn === 0 ? (
                      <Alert variant="warning">Le code a expiré. Demandez-en un nouveau.</Alert>
                    ) : (
                      info && <Alert variant="info">{info}</Alert>
                    ))}

                  <TextField
                    label="Code de confirmation"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    hint={expiresIn > 0 ? `Expire dans ${formatDuration(expiresIn)}` : undefined}
                    error={errors.code?.message}
                    {...register('code')}
                  />

                  <Button type="submit" $variant="danger" $loading={isSubmitting} disabled={expiresIn === 0} $fullWidth>
                    Confirmer la suppression définitive
                  </Button>

                  <Flex $justify="space-between" $wrap="wrap" $gap="0.5rem">
                    <Button type="button" $variant="ghost" $size="sm" onClick={handleCancel}>
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      $variant="ghost"
                      $size="sm"
                      $loading={isRequesting}
                      disabled={resendIn > 0 || isRequesting}
                      onClick={sendCode}
                    >
                      {resendIn > 0 ? `Renvoyer le code (${resendIn}s)` : 'Renvoyer le code'}
                    </Button>
                  </Flex>
                </Flex>
              </form>
            )}
          </Flex>
        </Card.Body>
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmStart}
        title="Supprimer votre compte ?"
        message="La suppression est définitive : vos tâches, votre journal et vos fichiers seront supprimés. Un code de confirmation va vous être envoyé par e-mail."
        confirmLabel="Recevoir le code"
      />
    </DangerCard>
  );
};
