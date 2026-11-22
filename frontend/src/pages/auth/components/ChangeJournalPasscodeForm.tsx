import { SettingsCard } from '@/components/SettingsCard';
import { updateJournalPasscode } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { useJournalStore } from '@/stores/journal.store';
import { Alert, Button, TextField } from 'core-react/ui';
import React, { useState } from 'react';
import { FieldGrid } from './ProfileForms.styles';

export const ChangeJournalPasscodeForm: React.FC = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const lockJournal = useJournalStore((state) => state.lock);
  const loadSecurity = useJournalStore((state) => state.loadSecurity);

  // Source de vérité : GET /account/journal-passcode/status (user.hasJournalPasscode n'est pas sérialisé)
  const hasPasscode = Boolean(useJournalStore((state) => state.security?.hasPasscode));

  const [currentPasscode, setCurrentPasscode] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passcode !== confirmPasscode) {
      setFeedback({
        type: 'error',
        message: 'Les nouveaux codes secrets ne correspondent pas.',
      });
      return;
    }

    try {
      setLoading(true);
      setFeedback(null);

      const res = await updateJournalPasscode({
        currentPasscode: hasPasscode ? currentPasscode : undefined,
        passcode,
      });

      setUser(res.user);
      lockJournal();
      await loadSecurity();

      setFeedback({
        type: 'success',
        message: res.message || 'Code secret du journal mis à jour avec succès.',
      });
      setCurrentPasscode('');
      setPasscode('');
      setConfirmPasscode('');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du code secret.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = !passcode || !confirmPasscode || passcode.length < 4 || (hasPasscode && !currentPasscode);

  return (
    <SettingsCard
      title="Code secret du journal"
      description={
        hasPasscode
          ? 'Modifiez le code secret (4 à 8 caractères) qui protège l’onglet Privé de votre journal. Le modifier reverrouille le journal.'
          : 'Configurez un code secret (4 à 8 caractères) pour verrouiller l’onglet Privé de votre journal.'
      }
      onSubmit={handleSubmit}
      actions={
        <Button type="submit" $loading={loading} disabled={isSubmitDisabled}>
          {hasPasscode ? 'Modifier le code secret' : 'Activer le code secret'}
        </Button>
      }
    >
      {feedback && <Alert variant={feedback.type === 'success' ? 'success' : 'danger'}>{feedback.message}</Alert>}

      {hasPasscode && (
        <TextField id="current-journal-passcode" label="Code secret actuel" type="password" value={currentPasscode} onChange={(e) => setCurrentPasscode(e.target.value)} maxLength={8} placeholder="••••" required />
      )}

      <FieldGrid>
        <TextField id="new-journal-passcode" label="Nouveau code secret" type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} minLength={4} maxLength={8} placeholder="4 à 8 caractères" required />

        <TextField id="confirm-journal-passcode" label="Confirmer le code secret" type="password" value={confirmPasscode} onChange={(e) => setConfirmPasscode(e.target.value)} minLength={4} maxLength={8} placeholder="••••" required />
      </FieldGrid>
    </SettingsCard>
  );
};
