import { createTag, deleteTag, fetchTags, updateTag } from '@/services/tag.api';
import { CreateTagPayload, Tag } from '@/types/tag.types';
import { Button, ConfirmDialog, EmptyState, Flex, Icon, Text, useToast } from 'core-react/ui';
import { useEffect, useState } from 'react';
import { styled } from 'styled-components';
import { TagFormModal, TagList, TagListSkeleton } from './components';

const Toolbar = styled(Flex).attrs({ $align: 'center', $justify: 'space-between', $wrap: 'wrap', $gap: '0.75rem' })`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

type FormState = { mode: 'create' } | { mode: 'edit'; tag: Tag } | null;

/** Onglet « Tags » de la page Tâches : création, modification (modale) et suppression (confirmation). */
export const TagManager = () => {
  const { toast, success, error } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<Tag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTags = () =>
    fetchTags()
      .then(setTags)
      .catch(() => toast({ message: 'Impossible de charger les tags.', variant: 'danger' }))
      .finally(() => setIsLoading(false));

  useEffect(() => {
    // Chargement initial ; `toast` est stable (fonction du store)
    fetchTags()
      .then(setTags)
      .catch(() => toast({ message: 'Impossible de charger les tags.', variant: 'danger' }))
      .finally(() => setIsLoading(false));
  }, [toast]);

  const handleSubmit = async (data: CreateTagPayload) => {
    if (form?.mode === 'edit') {
      await updateTag(form.tag.id, data);
      success('Tag mis à jour.');
    } else {
      await createTag(data);
      success('Tag créé.');
    }
    setForm(null);
    await loadTags();
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      setIsDeleting(true);
      await deleteTag(toDelete.id);
      setTags((prev) => prev.filter((t) => t.id !== toDelete.id));
      success('Tag supprimé.');
    } catch {
      error('Impossible de supprimer ce tag.');
    } finally {
      setIsDeleting(false);
      setToDelete(null);
    }
  };

  const newTagButton = (
    <Button type="button" onClick={() => setForm({ mode: 'create' })}>
      <Icon name="plus" size={18} />
      Nouveau tag
    </Button>
  );

  return (
    <>
      <Toolbar>
        <Text $size="sm" $color="muted">
          Classez vos tâches par contexte, priorité ou projet.
        </Text>
        {tags.length > 0 && newTagButton}
      </Toolbar>

      {isLoading ? (
        <TagListSkeleton />
      ) : tags.length === 0 ? (
        <EmptyState
          icon="tag-multiple-outline"
          title="Aucun tag pour l'instant"
          description="Créez un premier tag pour regrouper et filtrer vos tâches."
          action={newTagButton}
        />
      ) : (
        <TagList tags={tags} onEdit={(tag) => setForm({ mode: 'edit', tag })} onDelete={setToDelete} />
      )}

      {form && (
        <TagFormModal
          key={form.mode === 'edit' ? form.tag.id : 'new'}
          isOpen
          initialData={
            form.mode === 'edit'
              ? { name: form.tag.name, description: form.tag.description, color: form.tag.color ?? 'blue' }
              : null
          }
          onSubmit={handleSubmit}
          onClose={() => setForm(null)}
        />
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer ce tag ?"
        message={`Le tag « ${toDelete?.name ?? ''} » sera retiré des tâches qui l'utilisent.`}
        confirmLabel="Supprimer"
        loading={isDeleting}
      />
    </>
  );
};
