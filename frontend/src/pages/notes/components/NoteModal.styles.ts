import { tagColors } from '@/types/tag.types';
import styled from 'styled-components';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: ${({ theme }) => theme.spacing[4]};
`;

const Box = styled.div<{ $color?: string | null }>`
  width: 100%;
  max-width: 650px;
  background-color: ${({ $color, theme }) =>
    $color
      ? `color-mix(in srgb, ${tagColors[$color as keyof typeof tagColors]} 20\%,${theme.colors.background.surface})`
      : theme.colors.background.surface};
  border: 1px solid
    ${({ $color, theme }) =>
      $color ? `${tagColors[$color as keyof typeof tagColors]}50` : theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  display: flex;
  flex-direction: column;
  position: relative;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 4px;
`;

const TitleInput = styled.input`
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  background: transparent;
  border: none;
  outline: none;
  color: ${({ theme }) => theme.colors.text.heading};
`;

// Zone de l'éditeur Markdown (core-react) : marges alignées sur le titre
const EditorArea = styled.div`
  padding: 4px 16px 12px;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
`;

export { Backdrop, Box, EditorArea, TitleInput, Toolbar, TopRow };
