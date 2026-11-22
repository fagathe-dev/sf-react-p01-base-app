import { Text, ThemeModeSwitcher } from 'core-react/ui';
import { Outlet } from 'react-router-dom';
import { styled } from 'styled-components';

const Root = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${({ theme }) => `${theme.spacing[7]} ${theme.spacing[4]}`};
  background:
    radial-gradient(60rem 30rem at 50% -10%, ${({ theme }) => theme.colors.primary.subtle}, transparent 70%),
    ${({ theme }) => theme.colors.background.body};
`;

const ThemeSwitch = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing[4]};
  right: ${({ theme }) => theme.spacing[4]};
`;

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
  user-select: none;
`;

const BrandMark = styled.img`
  width: 3rem;
  height: 3rem;
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const Content = styled.div`
  width: 100%;
  max-width: 26rem;
`;

/**
 * Mise en page des écrans publics (connexion, inscription, liens reçus par e-mail).
 */
export const AuthLayout = () => (
  <Root>
    <ThemeSwitch>
      <ThemeModeSwitcher size="sm" />
    </ThemeSwitch>

    <Brand>
      <BrandMark src="/images/logo.webp" alt="" />
      <Text $size="lg" $weight="bold">
        Mon espace
      </Text>
    </Brand>

    <Content>
      <Outlet />
    </Content>
  </Root>
);
