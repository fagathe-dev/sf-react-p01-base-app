import { SettingsCard } from '@/components/SettingsCard';
import { updateEmail } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { Alert, Button, TextField } from 'core-react/ui';
import React, { useState } from 'react';

export const ChangeEmailForm: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || email.trim() === user?.email) return;

    try {
      setLoading(true);
      setFeedback(null);
      // L'adresse n'est modifiée qu'après le clic sur le lien reçu (voir ConfirmEmailChangePage)
      const { message } = await updateEmail({ email: email.trim() });
      setFeedback({ type: 'success', message });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : "Impossible de modifier l'adresse e-mail.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsCard
      title="Adresse e-mail"
      description="Un lien de confirmation sera envoyé à la nouvelle adresse."
      onSubmit={handleSubmit}
      actions={
        <Button type="submit" $loading={loading} disabled={!email.trim() || email.trim() === user?.email}>
          Mettre à jour l'e-mail
        </Button>
      }
    >
      {feedback && <Alert variant={feedback.type === 'success' ? 'success' : 'danger'}>{feedback.message}</Alert>}

      <TextField id="profile-email" label="Nouvelle adresse e-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
    </SettingsCard>
  );
};
