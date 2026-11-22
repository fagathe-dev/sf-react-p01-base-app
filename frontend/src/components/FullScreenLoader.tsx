import { Loading } from 'core-react/ui';
import { styled } from 'styled-components';

const Screen = styled.div`
  display: grid;
  place-items: center;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background.body};
`;

/** Écran d'attente plein écran (vérification de session, déconnexion). */
export const FullScreenLoader = ({ label }: { label: string }) => (
  <Screen>
    <Loading size="lg" label={label} />
  </Screen>
);
