import { ColorSwatchPicker } from '@/components/ColorSwatchPicker';
import { TagBadge } from '@/components/TagBadge';
import { getErrorMessage, getFieldErrors } from '@/services/apiError';
import { createJournalTag, deleteJournalTag, updateJournalTag } from '@/services/journal.api';
import { ColorEnum } from '@/types/tag.types';
import { JournalTag } from '@/types/journal.types';
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Flex,
  Icon,
  IconButton,
  Modal,
  Text,
  TextField,
  useToast,
} from 'core-react/ui';
import React, { useState } from 'react';
import { styled } from 'styled-components';

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
  }
`;

const PreviewLink = styled.button.attrs({ type: 'button' })`
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.base};
    text-decoration: underline;
  }
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

/* ---------------------------------------------------------------------------------------------- */

const TagModal: React.FC<{
  tag: JournalTag | null;
  onClose: () => void;
  onSaved: (tag: JournalTag) => void;
}> = ({ tag, onClose, onSaved }) => {
  const [name, setName] = useState(tag?.name ?? '');
  const [color, setColor] = useState<ColorEnum>(tag?.color ?? 'blue');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSaving(true);
      setError(null);
      setNameError(undefined);
      const payload = { name: name.trim(), color };
      onSaved(tag ? await updateJournalTag(tag.id, payload) : await createJournalTag(payload));
    } catch (err) {
      const fields = getFieldErrors(err);
      if (fields.name) setNameError(fields.name);
      else setError(getErrorMessage(err, 'Erreur lors de l’enregistrement du tag.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} maxWidth="30rem">
      <form onSubmit={submit}>
        <Modal.Header title={tag ? 'Modifier le tag' : 'Nouveau tag du journal'} onClose={onClose} />
        <Modal.Body>
          <Flex $direction="column" $gap="1rem">
            {error && <Alert variant="danger">{error}</Alert>}
            <Flex $align="center" $gap="0.75rem">
              <Text $size="xs" $weight="medium" $color="muted">
                Aperçu
              </Text>
              <TagBadge color={color}>{name.trim() || 'Nom du tag'}</TagBadge>
            </Flex>
            <TextField
              label="Nom"
              placeholder="Ex : Quotidien, Sport, Idées…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameError}
              maxLength={50}
              autoFocus
              required
            />
            <ColorSwatchPicker value={color} onChange={setColor} />
          </Flex>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" $variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" $loading={saving} disabled={!name.trim()}>
            {tag ? 'Enregistrer' : 'Créer le tag'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

/* ---------------------------------------------------------------------------------------------- */

interface JournalTagManagerProps {
  tags: JournalTag[];
  onChanged: () => void;
  /** Aperçu rapide : ouvre le Feed filtré sur ce tag */
  onPreview: (slug: string) => void;
}

/** Onglet « Tags » du journal : liste avec compteur de posts, création, modification, suppression. */
export const JournalTagManager: React.FC<JournalTagManagerProps> = ({ tags, onChanged, onPreview }) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState<JournalTag | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<JournalTag | null>(null);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteJournalTag(toDelete.id);
      toast({ message: 'Tag supprimé.', variant: 'success' });
      onChanged();
    } catch (err) {
      toast({ message: getErrorMessage(err, 'Erreur lors de la suppression.'), variant: 'danger' });
    } finally {
      setToDelete(null);
    }
  };

  const newButton = (
    <Button type="button" onClick={() => setEditing('new')}>
      <Icon name="plus" size={18} />
      Nouveau tag
    </Button>
  );

  return (
    <>
      <Toolbar>
        <Text $size="sm" $color="muted">
          Des tags propres au journal, indépendants de ceux des tâches.
        </Text>
        {tags.length > 0 && newButton}
      </Toolbar>

      {tags.length === 0 ? (
        <EmptyState icon="tag-multiple-outline" title="Aucun tag de journal" description="Créez des tags pour classer vos posts." action={newButton} />
      ) : (
        <Card>
          <List>
            {tags.map((tag) => (
              <Row key={tag.id}>
                <Flex $align="center" $gap="0.75rem" $wrap="wrap">
                  <TagBadge color={tag.color}>{tag.name}</TagBadge>
                  <PreviewLink onClick={() => onPreview(tag.slug)}>
                    {tag.postCount ?? 0} post{(tag.postCount ?? 0) > 1 ? 's' : ''} · voir
                  </PreviewLink>
                </Flex>
                <Flex $gap="0.25rem">
                  <IconButton name="pencil-outline" variant="ghost" size="sm" aria-label={`Modifier ${tag.name}`} onClick={() => setEditing(tag)} />
                  <IconButton name="trash-can-outline" variant="ghost" size="sm" aria-label={`Supprimer ${tag.name}`} onClick={() => setToDelete(tag)} />
                </Flex>
              </Row>
            ))}
          </List>
        </Card>
      )}

      {editing && (
        <TagModal
          key={editing === 'new' ? 'new' : editing.id}
          tag={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            toast({ message: 'Tag enregistré.', variant: 'success' });
            onChanged();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer ce tag ?"
        message={`« ${toDelete?.name ?? ''} » sera retiré des posts qui l'utilisent ; les posts sont conservés.`}
        confirmLabel="Supprimer"
      />
    </>
  );
};
