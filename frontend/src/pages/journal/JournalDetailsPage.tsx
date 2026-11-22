import { useJournalAutoLock } from '@/hooks/useJournalAutoLock';
import { deleteEntry, fetchEntryById } from '@/services/journal.api';
import { useJournalStore } from '@/stores/journal.store';
import { Entry, EntryMedia, MOOD_META } from '@/types/journal.types';
import { tagColors } from '@/types/tag.types';
import { Badge, Card, Divider, EmptyState, Icon, MarkdownViewer, Text, Title } from '@/ui/components';
import { BlockList } from 'core-react/editor';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  JOURNAL_BLOCK_REGISTRY,
  JournalEntrySkeleton,
  JournalLockScreen,
  JournalPageHeader,
  JournalViewMode,
} from './components';

const PageWrap = styled.article`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 980px;
  width: 100%;
`;

const ArticleBody = styled.div`
  max-width: 820px;
  margin: 0 auto;
  width: 100%;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.muted};
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const MediaBox = styled.div`
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const JournalDetailsPage: React.FC = () => {
  const isUnlocked = useJournalStore((state) => state.isUnlocked);
  useJournalAutoLock();

  const { journalId } = useParams<{ journalId: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!journalId || journalId === 'undefined') {
      setError('Identifiant invalide.');
      setLoading(false);
      return;
    }
    if (!isUnlocked) return;

    setLoading(true);
    fetchEntryById(journalId)
      .then(setEntry)
      .catch((err) => setError(err instanceof Error ? err.message : 'Introuvable'))
      .finally(() => setLoading(false));
  }, [journalId, isUnlocked]);

  const sortedBlocks = useMemo(
    () => [...(entry?.blocks ?? [])].sort((a, b) => a.position - b.position),
    [entry?.blocks],
  );

  const handleDelete = async () => {
    if (!journalId || !window.confirm('Supprimer définitivement cette entrée ?')) return;
    await deleteEntry(journalId);
    navigate('/journal');
  };

  const handleModeChange = (nextMode: JournalViewMode) => {
    if (nextMode === 'edit' && entry) {
      navigate(`/journal/${entry.id}/edit`);
    }
  };

  if (!isUnlocked) return <JournalLockScreen />;
  if (loading) return <JournalEntrySkeleton />;
  if (error || !entry) return <Text>{error || 'Entrée introuvable'}</Text>;

  const moodMeta = entry.mood ? MOOD_META[entry.mood] : null;
  const medias = entry.entryMedia || [];

  // N'affiche dans la grille de bas de page que les médias qui ne sont pas déjà référencés dans un bloc
  const blockUrls = new Set<string>();
  sortedBlocks.forEach((b) => {
    if (typeof b.data?.url === 'string' && b.data.url) blockUrls.add(b.data.url);
    if (Array.isArray(b.data?.images)) {
      b.data.images.forEach((img: { url?: string }) => {
        if (img?.url) blockUrls.add(img.url);
      });
    }
  });
  const orphanMedias = medias.filter((m) => !blockUrls.has(m.filePath));

  const renderMedia = (m: EntryMedia) => {
    if (m.mimeType.startsWith('image/')) {
      return <img src={m.filePath} alt={m.originalName} />;
    }
    if (m.mimeType.startsWith('video/')) {
      return <video src={m.filePath} controls />;
    }
    return <audio src={m.filePath} controls />;
  };

  return (
    <PageWrap>
      <JournalPageHeader
        entryTitle={entry.title}
        entryUrl={`/journal/${entry.id}`}
        mode="preview"
        onModeChange={handleModeChange}
        onDelete={handleDelete}
      />

      <Card elevation="sm">
        <Card.Body>
          <ArticleBody>
            <MetaRow>
              <Text size="xs" color="muted" weight="semibold" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                {new Date(entry.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>

              {moodMeta && (
                <Badge variant="neutral" pill>
                  <span style={{ fontSize: 14, marginRight: 4 }}>{moodMeta.emoji}</span>
                  {moodMeta.label}
                </Badge>
              )}

              {entry.tag && (
                <Badge
                  variant="neutral"
                  pill
                  color={entry.tag.color ? tagColors[entry.tag.color] : undefined}
                >
                  #{entry.tag.name}
                </Badge>
              )}

              {entry.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="map-marker-outline" size={15} />
                  <span>{entry.location.name}</span>
                </span>
              )}
            </MetaRow>

            <Title as="h1" style={{ marginTop: 8 }}>
              {entry.title || 'Entrée sans titre'}
            </Title>

            <Divider margin="1.25rem 0" />

            {sortedBlocks.length > 0 ? (
              <BlockList registry={JOURNAL_BLOCK_REGISTRY} blocks={sortedBlocks} />
            ) : entry.content ? (
              <MarkdownViewer breaks>{entry.content}</MarkdownViewer>
            ) : (
              <EmptyState
                icon="text-box-outline"
                title="Aucun contenu"
                description="Cette entrée ne contient encore aucun bloc."
              />
            )}

            {orphanMedias.length > 0 && (
              <MediaGrid>
                {orphanMedias.map((m) => (
                  <MediaBox key={m.id}>{renderMedia(m)}</MediaBox>
                ))}
              </MediaGrid>
            )}
          </ArticleBody>
        </Card.Body>
      </Card>
    </PageWrap>
  );
};
