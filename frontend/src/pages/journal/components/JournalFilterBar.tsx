import { ColorDot } from '@/components/ColorDot';
import { FilterChip, FilterChipRow } from '@/components/FilterChip';
import { JournalTag } from '@/types/journal.types';
import { Icon, Input, InputGroup } from 'core-react/ui';
import React from 'react';
import { styled } from 'styled-components';

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

interface JournalFilterBarProps {
  tags: JournalTag[];
  activeSlug: string | null;
  onTagChange: (slug: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

/** Recherche instantanée (contenu et suites) et filtre rapide par pastilles de tags. */
export const JournalFilterBar: React.FC<JournalFilterBarProps> = ({ tags, activeSlug, onTagChange, search, onSearchChange }) => (
  <Root>
    <InputGroup leftAddon={<Icon name="magnify" size={18} />}>
      <Input
        type="search"
        aria-label="Rechercher dans le journal"
        placeholder="Rechercher dans vos posts…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </InputGroup>

    {tags.length > 0 && (
      <FilterChipRow role="toolbar" aria-label="Filtrer par tag">
        <FilterChip aria-pressed={activeSlug === null} onClick={() => onTagChange(null)}>
          Tous
        </FilterChip>
        {tags.map((tag) => {
          const active = tag.slug === activeSlug;
          return (
            <FilterChip key={tag.id} aria-pressed={active} onClick={() => onTagChange(active ? null : tag.slug)}>
              <ColorDot $color={tag.color} />
              {tag.name}
            </FilterChip>
          );
        })}
      </FilterChipRow>
    )}
  </Root>
);
