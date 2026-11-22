import { ColorDot } from '@/components/ColorDot';
import { FilterChip, FilterChipRow } from '@/components/FilterChip';
import { Tag } from '@/types/tag.types';
import React from 'react';

interface TodoTagFilterBarProps {
  /** Uniquement les tags rattachés à au moins une tâche (GET /api/tags?usedIn=todos) */
  tags: Tag[];
  activeTagId: string | null;
  onChange: (tagId: string | null) => void;
}

/**
 * Filtre des tâches par tag : « Tous » réinitialise ; un clic sur le tag actif le désélectionne.
 * Rien n'est affiché tant qu'aucun tag n'est utilisé.
 */
export const TodoTagFilterBar: React.FC<TodoTagFilterBarProps> = ({ tags, activeTagId, onChange }) => {
  if (tags.length === 0) return null;

  return (
    <FilterChipRow role="toolbar" aria-label="Filtrer les tâches par tag">
      <FilterChip aria-pressed={activeTagId === null} onClick={() => onChange(null)}>
        Tous
      </FilterChip>
      {tags.map((tag) => {
        const active = tag.id === activeTagId;
        return (
          <FilterChip key={tag.id} aria-pressed={active} onClick={() => onChange(active ? null : tag.id)}>
            <ColorDot $color={tag.color} />
            {tag.name}
          </FilterChip>
        );
      })}
    </FilterChipRow>
  );
};
