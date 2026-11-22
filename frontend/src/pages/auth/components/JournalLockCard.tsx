import { SettingsCard } from '@/components/SettingsCard';
import { setJournalLock } from '@/services/auth.api';
import { useJournalStore } from '@/stores/journal.store';
import { Alert, Button, Flex, Modal, Text, TextField, ToggleField } from 'core-react/ui';
import React, { useState } from 'react';

/**
 * Interrupteur de la protection par code des contenus privés du journal.
 * Activer suffit d'un clic (un code doit exister) ; désactiver exige le code actuel (modale).
 */
export const JournalLockCard: React.FC = () => {
  const security = useJournalStore((state) => state.security);
  const setSecurity = useJournalStore((state) => state.setSecurity);
  const lockJournal = useJournalStore((state) => state.lock);

  const [askPasscode, setAskPasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const hasPasscode = Boolean(security?.hasPasscode);
  const enabled = Boolean(security?.lockEnabled);

  const apply = async (next: boolean, code?: string) => {
    try {
      setSaving(true);
      setFeedback(null);
      const status = await setJournalLock(next, code);
      setSecurity(status);
      // Nouvelle règle d'accès : on repart d'un journal verrouillé
      lockJournal();
      setAskPasscode(false);
      setPasscode('');
      setFeedback({ type: 'success', message: next ? 'Protection activée.' : 'Protection désactivée.' });
    } catch (err) {
      setFeedback({ type: 'danger', message: err instanceof Error ? err.message : 'Action impossible.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsCard
      title="Protection des contenus privés"
      description="Lorsqu’elle est active, l’onglet Privé du journal demande votre code secret et se reverrouille après 90 s d’inactivité."
    >
      {feedback && !askPasscode && <Alert variant={feedback.type}>{feedback.message}</Alert>}

      <ToggleField
        label={enabled ? 'Protection par code activée' : 'Protection par code désactivée'}
        checked={enabled}
        disabled={!security || !hasPasscode || saving}
        onChange={(e) => (e.target.checked ? apply(true) : setAskPasscode(true))}
      />
      {!hasPasscode && (
        <Text $size="sm" $color="muted">
          Définissez d’abord un code secret ci-dessus pour pouvoir activer la protection.
        </Text>
      )}

      <Modal isOpen={askPasscode} onClose={() => setAskPasscode(false)} maxWidth="26rem">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (passcode.trim()) apply(false, passcode);
          }}
        >
          <Modal.Header title="Désactiver la protection" onClose={() => setAskPasscode(false)} />
          <Modal.Body>
            <Flex $direction="column" $gap="1rem">
              {feedback?.type === 'danger' && <Alert variant="danger">{feedback.message}</Alert>}
              <Text $size="sm" $color="muted">
                Vos posts privés seront accessibles sans code. Confirmez avec votre code secret.
              </Text>
              <TextField
                label="Code secret"
                type="password"
                inputMode="numeric"
                maxLength={8}
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
              />
            </Flex>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" $variant="ghost" onClick={() => setAskPasscode(false)}>
              Annuler
            </Button>
            <Button type="submit" $variant="danger" $loading={saving} disabled={!passcode.trim()}>
              Désactiver
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </SettingsCard>
  );
};
