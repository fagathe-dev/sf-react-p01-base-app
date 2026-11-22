import { SettingsCard } from '@/components/SettingsCard';
import { updateProfile } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { Alert, Button, TextField } from 'core-react/ui';
import React, { useState } from 'react';
import { FieldGrid } from './ProfileForms.styles';

export const ChangeInformationsForm: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [username, setUsername] = useState(user?.username || '');
  const [firstname, setFirstname] = useState(user?.firstname || '');
  const [lastname, setLastname] = useState(user?.lastname || '');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      setLoading(true);
      setFeedback(null);
      const updated = await updateProfile({
        username: username.trim(),
        firstname: firstname.trim() || null,
        lastname: lastname.trim() || null,
      });
      setUser(updated);
      setFeedback({ type: 'success', message: 'Informations mises à jour avec succès.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsCard
      title="Informations personnelles"
      description="Votre nom d'utilisateur sert aussi d'identifiant de connexion."
      onSubmit={handleSubmit}
      actions={
        <Button type="submit" $loading={loading} disabled={!username.trim()}>
          Enregistrer les modifications
        </Button>
      }
    >
      {feedback && <Alert variant={feedback.type === 'success' ? 'success' : 'danger'}>{feedback.message}</Alert>}

      <TextField id="profile-username" label="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={90} />

      <FieldGrid>
        <TextField id="profile-firstname" label="Prénom" value={firstname} onChange={(e) => setFirstname(e.target.value)} placeholder="Votre prénom" maxLength={80} />

        <TextField id="profile-lastname" label="Nom" value={lastname} onChange={(e) => setLastname(e.target.value)} placeholder="Votre nom" maxLength={80} />
      </FieldGrid>
    </SettingsCard>
  );
};
