import { SettingsCard } from '@/components/SettingsCard';
import { updatePassword } from '@/services/auth.api';
import { Alert, Button, TextField } from 'core-react/ui';
import React, { useState } from 'react';
import { FieldGrid } from './ProfileForms.styles';

export const ChangePasswordForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    try {
      setLoading(true);
      setFeedback(null);
      const res = await updatePassword({ currentPassword, newPassword });
      setFeedback({ type: 'success', message: res.message || 'Mot de passe modifié avec succès.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsCard
      title="Modifier le mot de passe"
      description="8 caractères minimum, avec une majuscule, une minuscule et un chiffre."
      onSubmit={handleSubmit}
      actions={
        <Button
          type="submit"
          $loading={loading}
          disabled={!currentPassword || !newPassword || !confirmPassword}
        >
          Changer le mot de passe
        </Button>
      }
    >
      {feedback && <Alert variant={feedback.type === 'success' ? 'success' : 'danger'}>{feedback.message}</Alert>}

      <TextField id="current-password" label="Mot de passe actuel" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />

      <FieldGrid>
        <TextField id="new-password" label="Nouveau mot de passe" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />

        <TextField id="confirm-password" label="Confirmer le nouveau mot de passe" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
      </FieldGrid>
    </SettingsCard>
  );
};