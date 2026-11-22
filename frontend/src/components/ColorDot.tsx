import { ColorEnum, tagColors } from '@/types/tag.types';
import { styled } from 'styled-components';

/** Petite pastille ronde de la couleur d'un tag (couleur issue de l'API, neutre par défaut). */
export const ColorDot = styled.span<{ $color?: ColorEnum | null; $size?: string }>`
  display: inline-block;
  flex-shrink: 0;
  width: ${({ $size }) => $size ?? '0.625rem'};
  height: ${({ $size }) => $size ?? '0.625rem'};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ $color, theme }) => ($color ? tagColors[$color] : theme.colors.border.strong)};
`;
