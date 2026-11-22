import { createJournalPost } from '@/services/journal.api';
import { useAuthStore } from '@/stores/auth.store';
import { JournalLocation, JournalPost, JournalTag, MoodEnum } from '@/types/journal.types';
import { Alert, Avatar, Badge, Button, Card, Flex, Icon, MarkdownEditor, Text } from 'core-react/ui';
import React, { useCallback, useState } from 'react';
import { styled } from 'styled-components';
import {
  JournalLocationButton,
  JournalMediaButton,
  JournalMediaThumbs,
  JournalMoodPicker,
  JournalTagPicker,
} from './JournalComposerControls';

// La Card du kit coupe son contenu (overflow: hidden) : les menus (humeur) doivent pouvoir déborder
const ComposerCard = styled(Card)`
  overflow: visible;
`;

const Body = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const Main = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  min-width: 0;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
  padding-top: ${({ theme }) => theme.spacing[3]};
  border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

const Hint = styled(Text)`
  ${({ theme }) => theme.media.down('sm')} {
    display: none;
  }
`;

const PREVIEW_ACTIONS = ['bold', 'italic', 'code', 'separator', 'ul', 'link'] as const;

interface JournalComposerProps {
  tags: JournalTag[];
  /** Publication dans l'onglet Privé (exige le code secret) */
  isPrivate?: boolean;
  /** Ajout d'une suite à ce post (mode compact, sans tags ni lieu) */
  parentId?: string;
  onPublished: (post: JournalPost) => void;
  onCancel?: () => void;
}

/**
 * Éditeur de post : Markdown (barre d'outils et aperçu du kit), tags, humeur, lieu et médias.
 * Ctrl/Cmd + Entrée publie. Pour une suite, l'API renvoie le post racine complet.
 */
export const JournalComposer: React.FC<JournalComposerProps> = ({ tags, isPrivate = false, parentId, onPublished, onCancel }) => {
  const user = useAuthStore((state) => state.user);
  const isReply = Boolean(parentId);

  const [content, setContent] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [mood, setMood] = useState<MoodEnum | null>(null);
  const [location, setLocation] = useState<JournalLocation | null>(null);
  const [medias, setMedias] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Remonter le composant de lieu le réinitialise après publication
  const [resetKey, setResetKey] = useState(0);

  const canPublish = (content.trim() !== '' || medias.length > 0) && !submitting;
  const handleLocation = useCallback((value: JournalLocation | null) => setLocation(value), []);

  const publish = async () => {
    if (!canPublish) return;
    try {
      setSubmitting(true);
      setError(null);
      const post = await createJournalPost({ content: content.trim(), mood, tagIds, location, medias, parentId, isPrivate });
      setContent('');
      setTagIds([]);
      setMood(null);
      setLocation(null);
      setMedias([]);
      setResetKey((key) => key + 1);
      onPublished(post);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la publication.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      publish();
    }
  };

  return (
    <ComposerCard $elevation={isReply ? 'none' : 'sm'}>
      <Card.Body>
        <Body onKeyDown={handleKeyDown}>
          {!isReply && <Avatar name={user?.username ?? 'Moi'} src={user?.avatar ?? undefined} size="base" />}

          <Main>
            {isPrivate && !isReply && (
              <Flex $align="center" $gap="0.5rem">
                <Badge $variant="primary" $pill>
                  <Icon name="lock-outline" size={12} /> Privé
                </Badge>
                <Text $size="xs" $color="muted">
                  Visible uniquement avec votre code secret.
                </Text>
              </Flex>
            )}

            {error && (
              <Alert variant="danger" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <MarkdownEditor
              aria-label={isReply ? 'Ajouter une suite' : 'Nouveau post'}
              placeholder={isReply ? 'Ajouter une suite…' : 'Qu’avez-vous en tête aujourd’hui ?'}
              value={content}
              onChange={setContent}
              rows={isReply ? 2 : 4}
              actions={[...PREVIEW_ACTIONS]}
              autoFocus={isReply}
            />

            <JournalMediaThumbs files={medias} onRemove={(index) => setMedias((prev) => prev.filter((_, i) => i !== index))} />
            {!isReply && <JournalTagPicker tags={tags} value={tagIds} onChange={setTagIds} />}

            <Toolbar>
              <Flex $align="center" $gap="0.25rem" $wrap="wrap">
                <JournalMoodPicker value={mood} onChange={setMood} />
                {!isReply && <JournalLocationButton key={resetKey} value={location} onChange={handleLocation} />}
                <JournalMediaButton onAdd={(files) => setMedias((prev) => [...prev, ...files])} />
              </Flex>

              <Flex $align="center" $gap="0.5rem">
                <Hint $size="xs" $color="muted">
                  Ctrl + Entrée
                </Hint>
                {onCancel && (
                  <Button type="button" $variant="ghost" $size="sm" onClick={onCancel}>
                    Annuler
                  </Button>
                )}
                <Button type="button" $size="sm" $loading={submitting} disabled={!canPublish} onClick={publish}>
                  <Icon name="send" size={16} />
                  {isReply ? 'Ajouter la suite' : 'Publier'}
                </Button>
              </Flex>
            </Toolbar>
          </Main>
        </Body>
      </Card.Body>
    </ComposerCard>
  );
};
