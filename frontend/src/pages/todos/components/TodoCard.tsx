import { TagBadge } from '@/components/TagBadge';
import { updateTodo } from '@/services/todo.api';
import { Todo } from '@/types/todo.types';
import { isoToDueDateCategory } from '@/utils/dueDate.resolver';
import { Icon, Text } from 'core-react/ui';
import { DateFormatter } from 'core-ts';
import React from 'react';
import { styled } from 'styled-components';

const Card = styled.div<{ $isDone: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.background.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  opacity: ${({ $isDone }) => ($isDone ? 0.65 : 1)};
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.base};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.shadows.focusRing};
  }
`;

const Check = styled.button<{ $isDone: boolean }>`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.375rem;
  height: 1.375rem;
  padding: 0;
  border: 1.5px solid ${({ $isDone, theme }) => ($isDone ? theme.colors.success.base : theme.colors.border.strong)};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ $isDone, theme }) => ($isDone ? theme.colors.success.base : 'transparent')};
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.success.base};
  }
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  min-width: 0;
`;

const Name = styled(Text)<{ $struck: boolean }>`
  text-decoration: ${({ $struck }) => ($struck ? 'line-through' : 'none')};
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2.5]};
`;

const MetaItem = styled.span<{ $danger?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ $danger, theme }) => ($danger ? theme.colors.danger.base : theme.colors.text.muted)};
`;

const Chevron = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.text.muted};
`;

interface TodoCardProps {
  todo: Todo;
  onTodoUpdated: (t: Todo) => void;
  onSelect: (t: Todo) => void;
}

export const TodoCard: React.FC<TodoCardProps> = ({ todo, onTodoUpdated, onSelect }) => {
  const isDone = Boolean(todo.isDone);
  const fileCount = todo.files?.length ?? 0;
  const commentCount = todo.comments?.length ?? 0;
  const isOverdue = Boolean(todo.dueDate) && isoToDueDateCategory(todo.dueDate) === 'overdue' && !isDone;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isDone;
    onTodoUpdated({ ...todo, isDone: next });
    try {
      await updateTodo(todo.id, { isDone: next });
    } catch {
      onTodoUpdated({ ...todo, isDone });
    }
  };

  return (
    <Card
      $isDone={isDone}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(todo)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        onSelect(todo);
      }}
      aria-label={`Ouvrir la tâche ${todo.name}`}
    >
      <Check
        type="button"
        $isDone={isDone}
        onClick={handleToggle}
        aria-pressed={isDone}
        aria-label={isDone ? 'Marquer comme à faire' : 'Marquer comme terminée'}
      >
        {isDone && <Icon name="check" size={14} />}
      </Check>

      <Body>
        <Name $size="sm" $weight="medium" $struck={isDone}>
          {todo.name}
        </Name>

        <Meta>
          {todo.tag && <TagBadge color={todo.tag.color}>{todo.tag.name}</TagBadge>}
          {todo.dueDate && (
            <MetaItem $danger={isOverdue}>
              <Icon name={isOverdue ? 'alert-circle-outline' : 'calendar'} size={14} />
              {DateFormatter.short(todo.dueDate)}
            </MetaItem>
          )}
          {fileCount > 0 && (
            <MetaItem title={`${fileCount} fichier(s)`}>
              <Icon name="paperclip" size={14} />
              {fileCount}
            </MetaItem>
          )}
          {commentCount > 0 && (
            <MetaItem title={`${commentCount} commentaire(s)`}>
              <Icon name="comment-text-outline" size={14} />
              {commentCount}
            </MetaItem>
          )}
        </Meta>
      </Body>

      <Chevron aria-hidden="true">
        <Icon name="chevron-right" size={18} />
      </Chevron>
    </Card>
  );
};
