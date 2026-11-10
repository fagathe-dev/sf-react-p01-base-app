// src/pages/notes/components/NoteModal.tsx
import { getErrorMessage } from '@/services/apiError';
import { fetchTags } from '@/services/tag.api';
import { CreateNotePayload, Note } from '@/types/note.types';
import { ColorEnum, Tag } from '@/types/tag.types';
import { Icon } from '@/ui/components';
import { Alert } from '@/ui/components';
import { MarkdownEditor } from '@/ui/components';
import React, { useCallback, useEffect, useState } from 'react';
import { Backdrop, Box, EditorArea, TitleInput, Toolbar, TopRow } from './NoteModal.styles';
import { NoteModalColorPicker } from './NoteModalColorPicker';
import { NoteModalTagPicker } from './NoteModalTagPicker';

export const NoteModal: React.FC<{
  note?: Note | null;
  onClose: () => void;
  onSubmit: (payload: CreateNotePayload) => Promise<void>;
}> = ({ note, onClose, onSubmit }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [color, setColor] = useState<ColorEnum | null>(note?.color || null);
  const [is_pinned, setIsPinned] = useState(Boolean(note?.is_pinned));
  const [tagId, setTagId] = useState<string | null>(note?.tag?.id || null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activePicker, setActivePicker] = useState<'palette' | 'tag' | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetchTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim() && !content.trim()) {
      onClose();
      return;
    }
    try {
      setSubmitError(null);
      await onSubmit({
        title: title.trim() || null,
        content: content.trim() || null,
        color,
        is_pinned,
        tag: tagId,
      });
      onClose();
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Erreur lors de l’enregistrement de la note.'));
    }
  }, [title, content, color, is_pinned, tagId, onSubmit, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activePicker) {
          setActivePicker(null);
          return;
        }
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePicker, handleSave]);

  return (
    <Backdrop onClick={handleSave}>
      <Box
        $color={color}
        onClick={(e) => {
          e.stopPropagation();
          setActivePicker(null);
        }}
      >
        <TopRow>
          <TitleInput placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button
            type="button"
            onClick={() => setIsPinned(!is_pinned)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            title={is_pinned ? 'Détacher' : 'Épingler'}
          >
            <Icon name={is_pinned ? 'pin' : 'pin-outline'} size={18} />
          </button>
        </TopRow>

        {/* Éditeur Markdown de core-react : barre d'outils, raccourcis et onglets Écrire / Aperçu */}
        <EditorArea>
          <MarkdownEditor
            aria-label="Contenu de la note"
            placeholder="Rédigez votre note en Markdown…"
            value={content}
            onChange={setContent}
            rows={14}
            autoFocus
          />
        </EditorArea>

        {submitError && (
          <div style={{ padding: '0 16px 8px' }}>
            <Alert variant="danger" onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          </div>
        )}

        <Toolbar>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <NoteModalColorPicker
              selectedColor={color}
              onSelectColor={setColor}
              isOpen={activePicker === 'palette'}
              onToggle={() => setActivePicker((p) => (p === 'palette' ? null : 'palette'))}
              onClose={() => setActivePicker(null)}
            />
            <NoteModalTagPicker
              tags={tags}
              selectedTagId={tagId}
              onSelectTag={setTagId}
              isOpen={activePicker === 'tag'}
              onToggle={() => setActivePicker((p) => (p === 'tag' ? null : 'tag'))}
              onClose={() => setActivePicker(null)}
            />
          </div>

          <button
            type="button"
            onClick={submitError ? onClose : handleSave}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            {submitError ? 'Fermer sans enregistrer' : 'Fermer'}
          </button>
        </Toolbar>
      </Box>
    </Backdrop>
  );
};
