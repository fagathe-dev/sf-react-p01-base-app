import { ColorDot } from '@/components/ColorDot';
import { Tag } from '@/types/tag.types';
import { Dropdown, Icon } from 'core-react/ui';
import React, { useMemo } from 'react';
import { styled } from 'styled-components';

const Root = styled(Dropdown)`
  display: block;
  width: 100%;

  & > div:first-child {
    display: flex;
  }
`;

const Trigger = styled.button.attrs({ type: 'button' })<{ $hasValue: boolean }>`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.background.surface};
  color: ${({ $hasValue, theme }) => ($hasValue ? theme.colors.text.heading : theme.colors.text.muted)};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.hover};
  }
`;

const Value = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

interface TagSelectDropdownProps {
  tags: Tag[];
  value?: string | null;
  onChange: (id: string | null) => void;
}

/** Choix d'un tag pour une tâche, avec sa pastille de couleur (Dropdown du kit). */
export const TagSelectDropdown: React.FC<TagSelectDropdownProps> = ({ tags, value, onChange }) => {
  const selected = useMemo(() => tags.find((t) => t.id === value), [tags, value]);

  return (
    <Root>
      <Dropdown.Trigger>
        <Trigger $hasValue={Boolean(selected)} aria-label={selected ? `Tag : ${selected.name}` : 'Choisir un tag'}>
          <Value>
            {selected && <ColorDot $color={selected.color} />}
            {selected ? selected.name : 'Associer un tag…'}
          </Value>
          <Icon name="chevron-down" size={16} />
        </Trigger>
      </Dropdown.Trigger>

      <Dropdown.Menu align="left" minWidth="100%">
        {tags.map((tag) => (
          <Dropdown.Item key={tag.id} icon={<ColorDot $color={tag.color} />} onClick={() => onChange(tag.id)}>
            {tag.name}
          </Dropdown.Item>
        ))}
        {value && (
          <>
            <Dropdown.Divider />
            <Dropdown.Item variant="danger" icon={<Icon name="close" size={16} />} onClick={() => onChange(null)}>
              Retirer le tag
            </Dropdown.Item>
          </>
        )}
      </Dropdown.Menu>
    </Root>
  );
};
