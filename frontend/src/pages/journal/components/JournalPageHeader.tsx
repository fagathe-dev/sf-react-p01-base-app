import { Breadcrumb, Button, Icon, SegmentedControl } from '@/ui/components';
import React from 'react';
import styled from 'styled-components';

export type JournalViewMode = 'preview' | 'edit';

const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const ActionsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

interface JournalPageHeaderProps {
  entryTitle?: string | null;
  entryUrl?: string;
  mode: JournalViewMode;
  onModeChange: (mode: JournalViewMode) => void;
  onDelete?: () => void;
  isCreate?: boolean;
}

const VIEW_OPTIONS: { value: JournalViewMode; label: string; icon: string }[] = [
  { value: 'preview', label: 'Aperçu', icon: 'eye-outline' },
  { value: 'edit', label: 'Rédaction', icon: 'pencil-outline' },
];

export const JournalPageHeader: React.FC<JournalPageHeaderProps> = ({
  entryTitle,
  entryUrl,
  mode,
  onModeChange,
  onDelete,
  isCreate = false,
}) => {
  const breadcrumbItems = isCreate
    ? [
        { label: 'Mon Journal', to: '/journal', icon: 'notebook-outline' },
        { label: 'Nouvelle entrée', active: true },
      ]
    : mode === 'edit'
      ? [
          { label: 'Mon Journal', to: '/journal', icon: 'notebook-outline' },
          { label: entryTitle || 'Entrée sans titre', to: entryUrl },
          { label: 'Rédaction', active: true },
        ]
      : [
          { label: 'Mon Journal', to: '/journal', icon: 'notebook-outline' },
          { label: entryTitle || 'Entrée sans titre', active: true },
        ];

  return (
    <HeaderRow>
      <Breadcrumb items={breadcrumbItems} />

      <ActionsGroup>
        <SegmentedControl
          aria-label="Vue de l'entrée"
          size="sm"
          options={VIEW_OPTIONS}
          value={mode}
          onChange={(nextMode: JournalViewMode) => onModeChange(nextMode)}
        />

        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            style={{ color: '#e7000b' }}
            onClick={onDelete}
            title="Supprimer cette entrée"
          >
            <Icon name="trash-can-outline" size={16} />
          </Button>
        )}
      </ActionsGroup>
    </HeaderRow>
  );
};
