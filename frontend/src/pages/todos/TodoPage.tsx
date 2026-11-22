import { PageHeader } from '@/components/PageHeader';
import { TagManager } from '@/pages/tags';
import { SegmentedControl } from 'core-react/ui';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { TodoBoard } from './components';

type TodoTab = 'day' | 'tags';

const TABS: Array<{ value: TodoTab; label: string; icon: string }> = [
  { value: 'day', label: 'Ma journée', icon: 'format-list-checks' },
  { value: 'tags', label: 'Tags', icon: 'tag-outline' },
];

const formatToday = (): string => {
  const label = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/**
 * Module Tâches : onglet « Ma journée » (liste des tâches) et onglet « Tags » (gestion des tags des tâches).
 * L'onglet courant est porté par l'URL (/todos?tab=tags) pour pouvoir y revenir ou le partager.
 */
export const TodoPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: TodoTab = searchParams.get('tab') === 'tags' ? 'tags' : 'day';

  const changeTab = (next: TodoTab) => setSearchParams(next === 'day' ? {} : { tab: next }, { replace: true });

  return (
    <>
      <PageHeader
        title="Tâches"
        description={tab === 'day' ? formatToday() : 'Les étiquettes qui servent à classer et filtrer vos tâches.'}
        icon="format-list-checks"
        actions={<SegmentedControl aria-label="Vue des tâches" options={TABS} value={tab} onChange={changeTab} />}
      />

      {tab === 'day' ? <TodoBoard /> : <TagManager />}
    </>
  );
};
