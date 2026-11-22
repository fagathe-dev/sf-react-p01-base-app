import { getErrorMessage } from '@/services/apiError';
import { createEntry, uploadEntryMedia } from '@/services/journal.api';
import { fetchTags } from '@/services/tag.api';
import {
  Entry,
  EntryBlock,
  EntryLocation,
  EntryMedia,
  MOOD_META,
  MoodEnum,
  UpdateEntryPayload,
} from '@/types/journal.types';
import { ColorEnum, Tag } from '@/types/tag.types';
import { Alert, Button, EmptyState, Icon } from '@/ui/components';
import { BlockCanvas, BlockList, type MediaUploadHandler, useBlocksState } from 'core-react/editor';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { JOURNAL_BLOCK_REGISTRY } from './JournalBlockRegistry';
import { JournalColorPicker } from './JournalColorPicker';
import * as S from './JournalForm.styles';
import { JournalLocationTrigger } from './JournalLocationTrigger';
import { JournalMediaManager, validateMediaFiles } from './JournalMediaManager';
import { JournalMoodModal } from './JournalMoodModal';
import { JournalViewMode } from './JournalPageHeader';
import { JournalTagPicker } from './JournalTagPicker';

interface JournalFormProps {
  initialEntry?: Entry | null;
  isEdit?: boolean;
  mode?: JournalViewMode;
  onSubmit: (payload: UpdateEntryPayload, autoCreatedEntryId?: string | null) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const buildInitialBlocks = (entry?: Entry | null, isEdit?: boolean): EntryBlock[] => {
  if (entry?.blocks && entry.blocks.length > 0) {
    return entry.blocks;
  }
  if (entry?.content && entry.content.trim() !== '') {
    return [
      {
        id: '',
        type: 'text',
        position: 1,
        data: { content: entry.content },
      },
    ];
  }
  if (!isEdit) {
    return [
      {
        id: '',
        type: 'text',
        position: 1,
        data: { content: '' },
      },
    ];
  }
  return [];
};

export const JournalForm: React.FC<JournalFormProps> = ({
  initialEntry,
  isEdit = false,
  mode = 'edit',
  onSubmit,
  onCancel,
  loading,
}) => {
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [mood, setMood] = useState<MoodEnum | null>(initialEntry?.mood || null);
  const [color, setColor] = useState<ColorEnum | null>(initialEntry?.color || null);
  const [tagId, setTagId] = useState<string | null>(initialEntry?.tag?.id || null);
  const [location, setLocation] = useState<EntryLocation | null>(initialEntry?.location || null);
  const [isPinned, setIsPinned] = useState(Boolean(initialEntry?.is_pinned));

  // Identifiant de l'entrée (existant ou créé à la volée lors d'un upload de média dans un bloc)
  const entryIdRef = useRef<string | null>(initialEntry?.id ?? null);

  const initialBlocks = useMemo(() => buildInitialBlocks(initialEntry, isEdit), [initialEntry, isEdit]);

  const {
    blocks,
    addBlock,
    updateBlock,
    moveBlock,
    reorderBlocks,
    removeBlock,
    toPayload,
  } = useBlocksState(JOURNAL_BLOCK_REGISTRY, initialBlocks);

  // États dédiés aux pièces jointes additionnelles
  const [existingMedias, setExistingMedias] = useState<EntryMedia[]>(initialEntry?.entryMedia || []);
  const [deletedMedias, setDeletedMedias] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [mediaErrors, setMediaErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [activePicker, setActivePicker] = useState<'palette' | 'tag' | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetchTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  const handleAddFiles = useCallback((files: File[]) => {
    const { valid, errors } = validateMediaFiles(files);
    if (errors.length > 0) {
      setMediaErrors(errors);
      setTimeout(() => setMediaErrors([]), 5000);
    }
    if (valid.length > 0) {
      setPendingFiles((prev) => [...prev, ...valid]);
    }
  }, []);

  /**
   * Téléversement de média déclenché par les blocs Image, Vidéo ou Galerie de BlockCanvas.
   * Si l'entrée est en cours de création (/journal/new) et n'a pas encore d'ID en base,
   * elle est créée à la volée afin de rattacher le média à son ID.
   */
  const handleBlockUpload = useCallback<MediaUploadHandler>(
    async (file: File) => {
      let targetId = entryIdRef.current;

      if (!targetId) {
        const created = await createEntry({
          title: title.trim() || 'Entrée sans titre',
          mood,
          color,
          tag: tagId,
          location,
          isPinned,
          blocks: toPayload(),
        });
        targetId = created.id;
        entryIdRef.current = created.id;
      }

      const uploadedMedia = await uploadEntryMedia(targetId, file);
      setExistingMedias((prev) => [uploadedMedia, ...prev]);

      return uploadedMedia.filePath;
    },
    [title, mood, color, tagId, location, isPinned, toPayload],
  );

  const submitForm = useCallback(async () => {
    setSubmitError(null);
    const blocksPayload = toPayload();

    try {
      await onSubmit(
        {
          title: title.trim() || null,
          blocks: blocksPayload,
          mood,
          color,
          tag: tagId,
          location,
          isPinned,
          ...(isEdit || entryIdRef.current ? { medias: pendingFiles, deletedMedias } : {}),
        },
        entryIdRef.current,
      );
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Erreur lors de l’enregistrement de l’entrée.'));
    }
  }, [toPayload, onSubmit, title, mood, color, tagId, location, isPinned, isEdit, pendingFiles, deletedMedias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  // Raccourci clavier Ctrl+S / Cmd+S
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!loading) {
          void submitForm();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loading, submitForm]);

  const currentMoodMeta = mood ? MOOD_META[mood] : null;
  const previewBlocks = useMemo(() => toPayload(), [toPayload]);

  return (
    <S.FormRoot $color={color} onSubmit={handleSubmit} onClick={() => setActivePicker(null)}>
      <S.TopBar>
        <S.TitleField placeholder="Titre de la page…" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button
          type="button"
          onClick={() => setIsPinned(!isPinned)}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: isPinned ? '#2563eb' : 'inherit',
          }}
          title={isPinned ? 'Détacher' : 'Épingler'}
        >
          <Icon name={isPinned ? 'pin' : 'pin-outline'} size={18} />
        </button>
      </S.TopBar>

      {mode === 'preview' ? (
        <S.PreviewArea>
          {previewBlocks.length === 0 ? (
            <EmptyState
              icon="text-box-outline"
              title="Aucun contenu"
              description="Cette page ne contient encore aucun bloc."
            />
          ) : (
            <BlockList registry={JOURNAL_BLOCK_REGISTRY} blocks={previewBlocks} />
          )}
        </S.PreviewArea>
      ) : (
        <S.EditorArea>
          <BlockCanvas
            registry={JOURNAL_BLOCK_REGISTRY}
            blocks={blocks}
            onAdd={addBlock}
            onChange={updateBlock}
            onMove={moveBlock}
            onReorder={reorderBlocks}
            onRemove={removeBlock}
            onUpload={handleBlockUpload}
            labels={{
              emptyTitle: 'Cette page ne contient encore aucun bloc',
              emptyDescription:
                "Ajoutez un premier bloc de texte, d'image, de vidéo, de galerie ou de citation ci-dessous.",
            }}
          />
        </S.EditorArea>
      )}

      {isEdit && (existingMedias.length > 0 || pendingFiles.length > 0) && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) handleAddFiles(Array.from(e.target.files));
              e.target.value = '';
            }}
          />
          <JournalMediaManager
            existingMedias={existingMedias}
            pendingFiles={pendingFiles}
            errors={mediaErrors}
            onRemovePending={(idx) => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}
            onRemoveExisting={(id) => {
              setExistingMedias((prev) => prev.filter((m) => m.id !== id));
              setDeletedMedias((prev) => [...prev, id]);
            }}
          />
        </>
      )}

      {submitError && (
        <S.FormError>
          <Alert variant="danger" onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        </S.FormError>
      )}

      <S.Toolbar>
        <S.ToolGroup>
          <S.ToolSquareBtn
            type="button"
            onClick={() => setShowMoodModal(true)}
            title={currentMoodMeta ? `Humeur : ${currentMoodMeta.label}` : 'Choisir une humeur'}
          >
            {currentMoodMeta ? (
              <span style={{ lineHeight: 1 }}>{currentMoodMeta.emoji}</span>
            ) : (
              <Icon name="emoticon-happy-outline" size={20} />
            )}
          </S.ToolSquareBtn>

          <JournalLocationTrigger value={location} onChange={setLocation} />

          <JournalTagPicker
            tags={tags}
            selectedTagId={tagId}
            onSelectTag={setTagId}
            isOpen={activePicker === 'tag'}
            onToggle={() => setActivePicker((p) => (p === 'tag' ? null : 'tag'))}
            onClose={() => setActivePicker(null)}
          />

          <JournalColorPicker
            selectedColor={color}
            onSelectColor={setColor}
            isOpen={activePicker === 'palette'}
            onToggle={() => setActivePicker((p) => (p === 'palette' ? null : 'palette'))}
            onClose={() => setActivePicker(null)}
          />
        </S.ToolGroup>

        <S.ToolGroup>
          <Button variant="ghost" type="button" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Enregistrer' : 'Créer l’entrée'}
          </Button>
        </S.ToolGroup>
      </S.Toolbar>

      {showMoodModal && <JournalMoodModal selected={mood} onSelect={setMood} onClose={() => setShowMoodModal(false)} />}
    </S.FormRoot>
  );
};
