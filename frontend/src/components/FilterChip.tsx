import { styled } from 'styled-components';

/**
 * Puce cliquable à bascule (filtres par tag, échéances…). L'état actif passe par `aria-pressed`,
 * ce qui le rend lisible par les lecteurs d'écran et sert de sélecteur de style.
 */
export const FilterChip = styled.button.attrs({ type: 'button' })`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1.5]};
  padding: ${({ theme }) => `${theme.spacing[1.5]} ${theme.spacing[3]}`};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.pill};
  background-color: ${({ theme }) => theme.colors.background.surface};
  color: ${({ theme }) => theme.colors.text.body};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.12s ease, background-color 0.12s ease, color 0.12s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.hover};
  }

  &[aria-pressed='true'] {
    border-color: ${({ theme }) => theme.colors.primary.base};
    background-color: ${({ theme }) => theme.colors.primary.subtle};
    color: ${({ theme }) => theme.colors.primary.dark};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** Rangée de puces, défilable horizontalement sur petit écran. */
export const FilterChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;
