import { ColorEnum, tagColors } from '@/types/tag.types';
import { HelperText, Label } from 'core-react/ui';
import React, { useId } from 'react';
import { styled } from 'styled-components';

const Palette = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[1.5]};
`;

const Swatch = styled.button<{ $color: ColorEnum }>`
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: 2px solid ${({ theme }) => theme.colors.background.surface};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ $color }) => tagColors[$color]};
  box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.border.default};
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;

  &:hover {
    transform: scale(1.1);
  }

  &[aria-checked='true'] {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.text.heading};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const COLOR_LABELS: Record<ColorEnum, string> = {
  red: 'Rouge',
  orange: 'Orange',
  yellow: 'Jaune',
  green: 'Vert',
  cyan: 'Cyan',
  blue: 'Bleu',
  purple: 'Pourpre',
  violet: 'Violet',
  fuchsia: 'Fuchsia',
  pink: 'Rose',
  slate: 'Ardoise',
  gray: 'Gris',
  stone: 'Pierre',
};

interface ColorSwatchPickerProps {
  label?: string;
  value: ColorEnum;
  onChange: (color: ColorEnum) => void;
  error?: string;
}

/** Choix d'une couleur de tag (pastilles façon Finder), accessible comme un groupe de boutons radio. */
export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({ label = 'Couleur', value, onChange, error }) => {
  const labelId = useId();

  return (
    <div>
      <Label id={labelId} as="span">
        {label}
      </Label>
      <Palette role="radiogroup" aria-labelledby={labelId}>
        {(Object.keys(tagColors) as ColorEnum[]).map((color) => (
          <Swatch
            key={color}
            type="button"
            role="radio"
            aria-checked={value === color}
            aria-label={COLOR_LABELS[color]}
            title={COLOR_LABELS[color]}
            $color={color}
            onClick={() => onChange(color)}
          />
        ))}
      </Palette>
      {error && <HelperText $state="invalid">{error}</HelperText>}
    </div>
  );
};
