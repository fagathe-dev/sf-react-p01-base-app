import { TagSelectDropdown } from '@/pages/tags/components';
import { fetchTags } from '@/services/tag.api';
import { addTodoComment, deleteTodoComment, deleteTodoFile, updateTodo } from '@/services/todo.api';
import { Tag } from '@/types/tag.types';
import { Todo, UpdateTodoPayload } from '@/types/todo.types';
import { Alert, Button, Drawer, Flex, Icon, Label, MarkdownEditor, Text } from 'core-react/ui';
import { DateFormatter } from 'core-ts';
import React, { useEffect, useState } from 'react';
import { styled } from 'styled-components';
import { TodoCommentCard } from './TodoCommentCard';
import { TodoCommentForm } from './TodoCommentForm';
import { TodoDueDateSelector } from './TodoDueDateSelector';
import { TodoFileList } from './TodoFileList';

const NameInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[1]} 0`};
  border: none;
  border-bottom: 2px solid transparent;
  outline: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.heading};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};

  &:focus {
    border-bottom-color: ${({ theme }) => theme.colors.primary.base};
  }
`;

const Field = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Footer = styled(Drawer.Footer)`
  justify-content: space-between;
`;

/** Champ du volet : libellé du kit puis contenu. */
const DrawerField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Field>
    <Label as="h3">{label}</Label>
    {children}
  </Field>
);

interface TodoEditFormProps {
  todo: Todo;
  onClose: () => void;
  onUpdated: (t: Todo) => void;
  onDelete: (todo: Todo) => void;
}

/**
 * Volet latéral (Drawer du kit) d'une tâche : enregistrement automatique à la sortie des champs.
 * Le parent le monte avec `key={todo.id}` : ouvrir une autre tâche repart de champs neufs.
 */
export const TodoEditForm: React.FC<TodoEditFormProps> = ({ todo, onClose, onUpdated, onDelete }) => {
  const [name, setName] = useState(todo.name);
  const [desc, setDesc] = useState(todo.description || '');
  const [tags, setTags] = useState<Tag[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  const run = async (action: () => Promise<void>, fallback: string) => {
    try {
      setErrorMessage(null);
      await action();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : fallback);
    }
  };

  const save = (payload: UpdateTodoPayload) =>
    run(async () => onUpdated(await updateTodo(todo.id, payload)), 'Erreur lors de la sauvegarde.');

  const handleUpload = (files: FileList) =>
    run(async () => {
      const data = new FormData();
      Array.from(files).forEach((f) => data.append('files[]', f));
      onUpdated(await updateTodo(todo.id, data));
    }, "Erreur lors de l'envoi du fichier.");

  const handleDeleteFile = (fileId: string) =>
    run(async () => {
      await deleteTodoFile(todo.id, fileId);
      onUpdated({ ...todo, files: (todo.files || []).filter((f) => f.id !== fileId) });
    }, 'Impossible de supprimer le fichier.');

  const handleAddComment = (content: string) =>
    run(async () => {
      const added = await addTodoComment(todo.id, content);
      onUpdated({ ...todo, comments: [...(todo.comments || []), added] });
    }, "Impossible d'ajouter le commentaire.");

  const handleDeleteComment = (commentId: string) =>
    run(async () => {
      await deleteTodoComment(todo.id, commentId);
      onUpdated({ ...todo, comments: (todo.comments || []).filter((c) => c.id !== commentId) });
    }, 'Impossible de supprimer le commentaire.');

  return (
    <Drawer isOpen onClose={onClose} width="28rem">
      <Drawer.Header title="Détails de la tâche" onClose={onClose} />

      <Drawer.Body>
        <Flex $direction="column" $gap="1.5rem">
          {errorMessage && (
            <Alert variant="danger" onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          <NameInput
            aria-label="Nom de la tâche"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name.trim() !== todo.name && save({ name: name.trim() })}
          />

          {/* Enregistré quand le focus quitte l'éditeur (pas sur sa barre d'outils) */}
          <div
            onBlur={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
              if (desc !== (todo.description || '')) save({ description: desc || null });
            }}
          >
            <MarkdownEditor
              aria-label="Description de la tâche"
              placeholder="Ajouter une note ou une description…"
              value={desc}
              onChange={setDesc}
              rows={5}
            />
          </div>

          <DrawerField label="Échéance">
            <TodoDueDateSelector dueDate={todo.dueDate} onChange={(dueDate) => save({ dueDate })} />
          </DrawerField>

          <DrawerField label="Tag">
            <TagSelectDropdown tags={tags} value={todo.tag?.id} onChange={(tag) => save({ tag })} />
          </DrawerField>

          <DrawerField label="Fichiers joints">
            <TodoFileList files={todo.files || []} onUpload={handleUpload} onDelete={handleDeleteFile} />
          </DrawerField>

          <DrawerField label={`Commentaires (${todo.comments?.length ?? 0})`}>
            {(todo.comments || []).map((comment) => (
              <TodoCommentCard key={comment.id} comment={comment} onDelete={handleDeleteComment} />
            ))}
            <TodoCommentForm onSubmit={handleAddComment} />
          </DrawerField>
        </Flex>
      </Drawer.Body>

      <Footer>
        <Text $size="xs" $color="muted">
          {todo.createdAt ? `Créée le ${DateFormatter.short(todo.createdAt)}` : ''}
        </Text>
        <Button type="button" $variant="ghost" $size="sm" onClick={() => onDelete(todo)}>
          <Icon name="trash-can-outline" size={16} />
          Supprimer
        </Button>
      </Footer>
    </Drawer>
  );
};
