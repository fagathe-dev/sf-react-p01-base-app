import { ColorSwatchPicker } from '@/components/ColorSwatchPicker';
import { TagBadge } from '@/components/TagBadge';
import { ApiViolations, getErrorMessage, getFieldErrors } from '@/services/apiError';
import { ColorEnum, CreateTagPayload } from '@/types/tag.types';
import { Alert, Button, Flex, Modal, Text, TextField } from 'core-react/ui';
import React, { useState } from 'react';

interface TagFormModalProps {
  isOpen: boolean;
  /** Valeurs du tag modifié ; absent en création */
  initialData?: CreateTagPayload | null;
  onSubmit: (data: CreateTagPayload) => Promise<void>;
  onClose: () => void;
}

/**
 * Création ou modification d'un tag dans une modale. Monter la modale avec une `key` propre au tag édité
 * pour repartir des bonnes valeurs initiales.
 */
export const TagFormModal: React.FC<TagFormModalProps> = ({ isOpen, initialData, onSubmit, onClose }) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [color, setColor] = useState<ColorEnum>(initialData?.color ?? 'blue');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiViolations>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitError(null);
    setFieldErrors({});
    try {
      setIsSubmitting(true);
      await onSubmit({ name: name.trim(), description: description.trim() || null, color });
    } catch (err) {
      const violations = getFieldErrors(err);
      setFieldErrors(violations);
      // Message global uniquement si aucune erreur n'est rattachée à un champ du formulaire
      if (!violations.name && !violations.description && !violations.color) {
        setSubmitError(getErrorMessage(err, 'Erreur lors de l’enregistrement du tag.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="32rem">
      <form onSubmit={handleSubmit}>
        <Modal.Header title={initialData ? 'Modifier le tag' : 'Nouveau tag'} onClose={onClose} />
        <Modal.Body>
          <Flex $direction="column" $gap="1rem">
            {submitError && (
              <Alert variant="danger" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            <Flex $align="center" $gap="0.75rem">
              <Text $size="xs" $weight="medium" $color="muted">
                Aperçu
              </Text>
              <TagBadge color={color}>{name.trim() || 'Nom du tag'}</TagBadge>
            </Flex>

            <TextField
              label="Nom du tag"
              placeholder="Ex : Urgent, Maison…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={fieldErrors.name}
              maxLength={50}
              autoFocus
              required
            />
            <TextField
              label="Description"
              placeholder="À quoi sert ce tag ? (facultatif)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={fieldErrors.description}
            />
            <ColorSwatchPicker value={color} onChange={setColor} error={fieldErrors.color} />
          </Flex>
        </Modal.Body>
        <Modal.Footer>
          <Button $variant="ghost" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" $loading={isSubmitting} disabled={!name.trim()}>
            {initialData ? 'Enregistrer' : 'Créer le tag'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
