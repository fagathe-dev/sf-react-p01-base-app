import { Section } from '@/components/Section';
import { fetchTags } from '@/services/tag.api';
import { deleteTodo, fetchTodos } from '@/services/todo.api';
import { Tag } from '@/types/tag.types';
import { Todo } from '@/types/todo.types';
import { DueDateCategory, isoToDueDateCategory } from '@/utils/dueDate.resolver';
import { ConfirmDialog, EmptyState, useToast } from 'core-react/ui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { styled } from 'styled-components';
import { TodoEditForm } from './TodoEditForm';
import { TodoList } from './TodoList';
import { TodoListSkeleton } from './TodoListSkeleton';
import { TodoQuickCreateForm } from './TodoQuickCreateForm';
import { TodoTagFilterBar } from './TodoTagFilterBar';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
  max-width: 56rem;
  min-height: calc(100vh - 16rem);
`;

const BottomBar = styled.div`
  position: sticky;
  bottom: ${({ theme }) => theme.spacing[4]};
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing[3]};
  background: linear-gradient(to top, ${({ theme }) => theme.colors.background.body} 70%, transparent);
`;

// Ordre d'affichage : En retard → échéances proches → Sans échéance, puis Terminées tout en bas
const SECTIONS: Array<{ key: DueDateCategory; label: string }> = [
  { key: 'overdue', label: 'En retard' },
  { key: 'today', label: 'Aujourd’hui' },
  { key: 'tomorrow', label: 'Demain' },
  { key: 'this_week', label: 'Cette semaine' },
  { key: 'later', label: 'Plus tard' },
  { key: 'none', label: 'Sans échéance' },
];

type Grouped = Record<DueDateCategory | 'done', Todo[]>;

const groupTodos = (todos: Todo[]): Grouped => {
  const groups: Grouped = { overdue: [], today: [], tomorrow: [], this_week: [], later: [], none: [], done: [] };
  todos.forEach((todo) => {
    const key = todo.isDone ? 'done' : isoToDueDateCategory(todo.dueDate);
    (groups[key] ?? groups.none).push(todo);
  });
  return groups;
};

/** Onglet « Ma journée » : tâches groupées par échéance, filtre par tag, création rapide. */
export const TodoBoard: React.FC = () => {
  // `toast` est stable (fonction du store) ; success/error sont recréées à chaque rendu : hors dépendances d'effet
  const { toast, success, error } = useToast();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [usedTags, setUsedTags] = useState<Tag[]>([]);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [toDelete, setToDelete] = useState<Todo | null>(null);

  // Barre de filtres : uniquement les tags rattachés à au moins une tâche
  const refreshUsedTags = useCallback(() => {
    fetchTags({ usedIn: 'todos' })
      .then((tags) => {
        setUsedTags(tags);
        // Le tag filtré n'a plus de tâche : on revient à « Tous »
        setActiveTagId((current) => (current && !tags.some((t) => t.id === current) ? null : current));
      })
      .catch(() => setUsedTags([]));
  }, []);

  useEffect(() => {
    refreshUsedTags();
  }, [refreshUsedTags]);

  // L'état de chargement est posé par changeFilter (jamais de setState synchrone dans l'effet)
  const changeFilter = (tagId: string | null) => {
    if (tagId === activeTagId) return;
    setLoading(true);
    setActiveTagId(tagId);
  };

  useEffect(() => {
    let cancelled = false;
    fetchTodos({ tagId: activeTagId })
      .then((data) => !cancelled && setTodos(data))
      .catch(() => !cancelled && toast({ message: 'Impossible de charger les tâches.', variant: 'danger' }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [activeTagId, toast]);

  const matchesFilter = (todo: Todo) => activeTagId === null || todo.tag?.id === activeTagId;

  const handleUpdate = (updated: Todo) => {
    setTodos((prev) =>
      matchesFilter(updated) ? prev.map((t) => (t.id === updated.id ? updated : t)) : prev.filter((t) => t.id !== updated.id)
    );
    if (selectedTodo?.id === updated.id) setSelectedTodo(updated);
    refreshUsedTags();
  };

  const handleCreated = (created: Todo) => {
    if (matchesFilter(created)) {
      setTodos((prev) => [created, ...prev]);
    } else {
      success('Tâche créée : elle n’apparaît pas avec le filtre actif.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteTodo(toDelete.id);
      setTodos((prev) => prev.filter((t) => t.id !== toDelete.id));
      if (selectedTodo?.id === toDelete.id) setSelectedTodo(null);
      refreshUsedTags();
      success('Tâche supprimée.');
    } catch {
      error('Impossible de supprimer la tâche.');
    } finally {
      setToDelete(null);
    }
  };

  const grouped = useMemo(() => groupTodos(todos), [todos]);
  const openCount = todos.length - grouped.done.length;

  return (
    <>
      <Content>
        <TodoTagFilterBar tags={usedTags} activeTagId={activeTagId} onChange={changeFilter} />

        {loading ? (
          <TodoListSkeleton />
        ) : todos.length === 0 ? (
          <EmptyState
            icon="check-circle-outline"
            title={activeTagId ? 'Aucune tâche avec ce tag' : 'Rien à faire pour le moment'}
            description="Ajoutez une tâche avec la barre ci-dessous."
          />
        ) : (
          <>
            {SECTIONS.map(({ key, label }) => {
              const list = grouped[key];
              if (list.length === 0) return null;
              return (
                <Section key={key} title={label} count={list.length}>
                  <TodoList todos={list} onTodoUpdated={handleUpdate} onSelectTodo={setSelectedTodo} />
                </Section>
              );
            })}

            {openCount === 0 && (
              <EmptyState icon="check-all" title="Tout est fait !" description="Toutes les tâches de cette vue sont terminées." />
            )}

            {grouped.done.length > 0 && (
              <Section title="Terminées" count={grouped.done.length}>
                <TodoList todos={grouped.done} onTodoUpdated={handleUpdate} onSelectTodo={setSelectedTodo} />
              </Section>
            )}
          </>
        )}

        {!loading && (
          <BottomBar>
            <TodoQuickCreateForm onCreated={handleCreated} />
          </BottomBar>
        )}
      </Content>

      {selectedTodo && (
        <TodoEditForm
          key={selectedTodo.id}
          todo={selectedTodo}
          onClose={() => setSelectedTodo(null)}
          onUpdated={handleUpdate}
          onDelete={setToDelete}
        />
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer cette tâche ?"
        message={`« ${toDelete?.name ?? ''} » sera supprimée avec ses commentaires et ses fichiers.`}
        confirmLabel="Supprimer"
      />
    </>
  );
};
