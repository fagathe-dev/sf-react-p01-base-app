import { FilterChip, FilterChipRow } from '@/components/FilterChip';
import { DueDateEnum } from '@/types/todo.types';
import { dueDateEnumToIso, isoToDueDateCategory } from '@/utils/dueDate.resolver';
import { Icon } from 'core-react/ui';
import React from 'react';

const OPTIONS: Array<{ key: DueDateEnum; label: string; icon: string }> = [
  { key: 'today', label: "Aujourd'hui", icon: 'calendar-today' },
  { key: 'tomorrow', label: 'Demain', icon: 'calendar-arrow-right' },
  { key: 'this_week', label: 'Cette semaine', icon: 'calendar-week' },
  { key: 'later', label: 'Plus tard', icon: 'calendar-clock' },
];

/** Échéance d'une tâche : un clic sur l'option active retire l'échéance. */
export const TodoDueDateSelector: React.FC<{
  dueDate: string | null;
  onChange: (isoDate: string | null) => void;
}> = ({ dueDate, onChange }) => {
  const current = isoToDueDateCategory(dueDate);

  return (
    <FilterChipRow role="group" aria-label="Échéance">
      {OPTIONS.map(({ key, label, icon }) => (
        <FilterChip
          key={key}
          aria-pressed={current === key}
          onClick={() => onChange(current === key ? null : dueDateEnumToIso(key))}
        >
          <Icon name={icon} size={14} />
          {label}
        </FilterChip>
      ))}
    </FilterChipRow>
  );
};
