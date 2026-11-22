import { getErrorMessage } from '@/services/apiError';
import { requestPasswordReset } from '@/services/auth.api';
import { AuthCard } from '@/components/AuthCard';
import { Alert, Button, Link, Text, TextField } from 'core-react/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.email("Format d'e-mail invalide").min(1, "L'adresse e-mail est obligatoire"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: ForgotPasswordFormData) => {
    setApiError(null);
    try {
      const { message } = await requestPasswordReset(email.trim());
      setSuccessMessage(message);
    } catch (err) {
      setApiError(getErrorMessage(err, 'Impossible de traiter la demande de réinitialisation.'));
    }
  };

  return (
    <AuthCard
      title="Mot de passe oublié"
      subtitle="Nous vous enverrons un lien pour en choisir un nouveau."
      footer={<Link href="/login">Retour à la connexion</Link>}
    >
        {successMessage ? (
          <>
            <Alert variant="success">{successMessage}</Alert>
            <Text $size="sm" $color="muted">
              Le lien est valable 24 heures et ne peut être utilisé qu'une seule fois. Pensez à vérifier vos courriers
              indésirables.
            </Text>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {apiError && <Alert variant="danger">{apiError}</Alert>}

            <TextField
              label="Adresse e-mail"
              type="email"
              autoComplete="email"
              placeholder="Ex : john@example.com"
              hint="Saisissez l'adresse de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe."
              error={errors.email?.message}
              {...register('email')}
            />

            <Button type="submit" $loading={isSubmitting} $fullWidth>
              Envoyer le lien de réinitialisation
            </Button>
          </form>
        )}
    </AuthCard>
  );
};
