import { getErrorMessage, getFieldErrors } from '@/services/apiError';
import { resetPassword } from '@/services/auth.api';
import { AuthCard } from '@/components/AuthCard';
import { Alert, Button, Link, TextField } from 'core-react/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { passwordSchema } from './authSchemas';

const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Page ouverte depuis le lien de l'e-mail « mot de passe oublié » (/reset-password?token=…).
 */
export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [apiError, setApiError] = useState<string | null>(
    token ? null : 'Le lien de réinitialisation est incomplet. Faites une nouvelle demande.'
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ password }: ResetPasswordFormData) => {
    setApiError(null);
    try {
      const { message } = await resetPassword({ token, password });
      setSuccessMessage(message);
    } catch (err) {
      const violations = getFieldErrors(err);
      if (violations.password) {
        setError('password', { message: violations.password });
      } else {
        setApiError(getErrorMessage(err, 'Erreur lors de la réinitialisation du mot de passe.'));
      }
    }
  };

  return (
    <AuthCard
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe que vous n'utilisez nulle part ailleurs."
      footer={<Link href="/forgot-password">Faire une nouvelle demande</Link>}
    >
        {successMessage ? (
          <>
            <Alert variant="success">{successMessage}</Alert>
            <Button href="/login" $fullWidth>
              Se connecter
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {apiError && <Alert variant="danger">{apiError}</Alert>}

            <TextField
              label="Nouveau mot de passe"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 car., 1 majuscule, 1 chiffre"
              error={errors.password?.message}
              {...register('password')}
            />

            <TextField
              label="Confirmer le mot de passe"
              type="password"
              autoComplete="new-password"
              placeholder="Retapez votre mot de passe"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" $loading={isSubmitting} disabled={!token} $fullWidth>
              Enregistrer le mot de passe
            </Button>
          </form>
        )}
    </AuthCard>
  );
};
