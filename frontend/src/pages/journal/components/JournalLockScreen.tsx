import { unlockJournal } from '@/services/journal.api';
import { Alert, Button, Card, Icon, Text, TextField, Title } from 'core-react/ui';
import React, { useState } from 'react';
import { styled } from 'styled-components';

const Panel = styled(Card)`
  max-width: 24rem;
  margin: ${({ theme }) => `${theme.spacing[6]} auto`};
`;

const Body = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
`;

const LockBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.primary.subtle};
  color: ${({ theme }) => theme.colors.primary.dark};
`;

const Heading = styled(Title)`
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const PinField = styled.div`
  width: 100%;

  input {
    text-align: center;
    letter-spacing: 0.5em;
    font-size: ${({ theme }) => theme.typography.sizes.lg};
  }
`;

/** Déverrouillage de l'onglet Privé par le code secret (POST /api/journal/unlock). */
export const JournalLockScreen: React.FC<{ onUnlocked?: () => void }> = ({ onUnlocked }) => {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await unlockJournal(passcode);
      onUnlocked?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code secret incorrect.');
      setPasscode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel $elevation="md">
      <Body onSubmit={handleSubmit}>
        <LockBadge aria-hidden="true">
          <Icon name="lock-outline" size={28} />
        </LockBadge>
        <div>
          <Heading as="h2">Espace privé</Heading>
          <Text $size="sm" $color="muted">
            Saisissez votre code secret pour afficher vos posts privés.
          </Text>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <PinField>
          <TextField
            label="Code secret"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            autoFocus
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="••••"
          />
        </PinField>

        <Button type="submit" $loading={loading} disabled={!passcode.trim()} $fullWidth>
          <Icon name="key-outline" size={18} />
          Déverrouiller
        </Button>
      </Body>
    </Panel>
  );
};
