import { updateAvatar } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar, HelperText, Icon } from 'core-react/ui';
import React, { useRef, useState } from 'react';
import { styled } from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const Trigger = styled.button`
  position: relative;
  display: inline-flex;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radii.full};
  background: none;
  cursor: pointer;
  box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.background.surface}, 0 0 0 5px ${({ theme }) => theme.colors.primary.subtle};

  &:disabled {
    cursor: progress;
  }
`;

const Overlay = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  background-color: color-mix(in srgb, ${({ theme }) => theme.colors.black} 45%, transparent);
  color: ${({ theme }) => theme.colors.white};
  opacity: 0;
  transition: opacity 0.15s ease;

  ${Trigger}:hover &,
  ${Trigger}:focus-visible &,
  ${Trigger}:disabled & {
    opacity: 1;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

/** Avatar cliquable : ouvre le sélecteur de fichier et envoie la nouvelle photo. */
export const ChangeAvatarForm: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setUser(await updateAvatar(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'avatar");
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <Wrapper>
      <HiddenInput
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
      />

      <Trigger
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        aria-label="Changer la photo de profil"
        title="Changer la photo de profil"
      >
        <Avatar src={user.avatar ?? undefined} name={user.username} size="lg" />
        <Overlay aria-hidden="true">
          <Icon name={loading ? 'loading' : 'camera-outline'} size={20} spin={loading} />
        </Overlay>
      </Trigger>

      {error && <HelperText $state="invalid">{error}</HelperText>}
    </Wrapper>
  );
};
