import { Entry, MOOD_META } from '@/types/journal.types';
import { Icon, Title } from '@/ui/components';
import { convertMarkdownToHtml } from 'core-ts';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as S from './JournalCard.styles';

interface PreviewMediaItem {
  id: string;
  url: string;
  kind: 'image' | 'video' | 'audio';
  alt?: string;
}

const extractEntryExcerpt = (entry: Entry): string => {
  if (entry.blocks && entry.blocks.length > 0) {
    const sorted = [...entry.blocks].sort((a, b) => a.position - b.position);
    for (const block of sorted) {
      if (block.type === 'text' && typeof block.data?.content === 'string' && block.data.content.trim()) {
        return block.data.content.trim();
      }
      if (block.type === 'quote' && typeof block.data?.text === 'string' && block.data.text.trim()) {
        return `« ${block.data.text.trim()} »`;
      }
    }
  }
  return entry.content?.trim() ?? '';
};

const extractEntryMedias = (entry: Entry): PreviewMediaItem[] => {
  const items: PreviewMediaItem[] = [];
  const seenUrls = new Set<string>();

  if (entry.blocks && entry.blocks.length > 0) {
    const sorted = [...entry.blocks].sort((a, b) => a.position - b.position);
    sorted.forEach((block, bIdx) => {
      if (block.type === 'image' && typeof block.data?.url === 'string' && block.data.url) {
        if (!seenUrls.has(block.data.url)) {
          seenUrls.add(block.data.url);
          items.push({
            id: block.id || `b-img-${bIdx}`,
            url: block.data.url,
            kind: 'image',
            alt: typeof block.data.alt === 'string' ? block.data.alt : entry.title || 'Illustration',
          });
        }
      } else if (block.type === 'video' && typeof block.data?.url === 'string' && block.data.url) {
        if (!seenUrls.has(block.data.url)) {
          seenUrls.add(block.data.url);
          items.push({
            id: block.id || `b-vid-${bIdx}`,
            url: block.data.url,
            kind: 'video',
          });
        }
      } else if (block.type === 'gallery' && Array.isArray(block.data?.images)) {
        block.data.images.forEach((img: { id?: string; url?: string; alt?: string }, gIdx: number) => {
          if (typeof img?.url === 'string' && img.url && !seenUrls.has(img.url)) {
            seenUrls.add(img.url);
            items.push({
              id: img.id || `b-gal-${bIdx}-${gIdx}`,
              url: img.url,
              kind: 'image',
              alt: img.alt || entry.title || 'Galerie',
            });
          }
        });
      }
    });
  }

  (entry.entryMedia || []).forEach((media) => {
    if (!seenUrls.has(media.filePath)) {
      seenUrls.add(media.filePath);
      items.push({
        id: media.id,
        url: media.filePath,
        kind: media.mimeType.startsWith('image/')
          ? 'image'
          : media.mimeType.startsWith('video/')
            ? 'video'
            : 'audio',
        alt: media.originalName,
      });
    }
  });

  return items;
};

export const JournalCard: React.FC<{
  entry: Entry;
  onTogglePin?: (entry: Entry) => void;
}> = ({ entry, onTogglePin }) => {
  const navigate = useNavigate();
  const isPinned = Boolean(entry.is_pinned);

  const dateObj = new Date(entry.created_at);
  const monthStr = dateObj.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
  const dayStr = dateObj.getDate();

  const medias = useMemo(() => extractEntryMedias(entry), [entry]);
  const visibleMedias = medias.slice(0, 3);
  const extraCount = Math.max(0, medias.length - 3);

  const previewHtml = useMemo(() => {
    const rawExcerpt = extractEntryExcerpt(entry);
    return rawExcerpt ? convertMarkdownToHtml(rawExcerpt.split(/\s+/).slice(0, 35).join(' ')) : '';
  }, [entry]);

  const moodMeta = entry.mood ? MOOD_META[entry.mood] : null;

  const locationLabel = entry.location
    ? [entry.location.city, entry.location.country].filter(Boolean).join(', ') || entry.location.name
    : null;

  const renderMedia = (media: PreviewMediaItem) => {
    if (media.kind === 'image') {
      return <img src={media.url} alt={media.alt || ''} loading="lazy" />;
    }
    if (media.kind === 'video') {
      return <video src={media.url} muted preload="metadata" />;
    }
    return <Icon name="music-note-outline" size={28} />;
  };

  return (
    <S.Card $color={entry.color} onClick={() => navigate(`/journal/${entry.id}`)}>
      <S.Header>
        <S.HeaderLeft>
          <S.DateBlock>
            <span>{monthStr}</span>
            <span>{dayStr}</span>
          </S.DateBlock>
          {entry.title && (
            <Title as="h4" style={{ margin: 0, fontSize: 17 }}>
              {entry.title}
            </Title>
          )}
        </S.HeaderLeft>

        <S.Actions>
          {moodMeta && <S.MoodBadge title={moodMeta.label}>{moodMeta.emoji}</S.MoodBadge>}
          <S.ActionBtn
            type="button"
            title="Modifier"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/journal/${entry.id}/edit`, { state: { from: '/journal' } });
            }}
          >
            <Icon name="pencil-outline" size={16} />
          </S.ActionBtn>
          {onTogglePin && (
            <S.ActionBtn
              type="button"
              $active={isPinned}
              title={isPinned ? 'Détacher' : 'Épingler'}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(entry);
              }}
            >
              <Icon name={isPinned ? 'pin' : 'pin-outline'} size={16} />
            </S.ActionBtn>
          )}
        </S.Actions>
      </S.Header>

      {visibleMedias.length > 0 && (
        <S.MediaMosaic $count={visibleMedias.length}>
          {visibleMedias.map((m) => (
            <S.MediaItem key={m.id}>{renderMedia(m)}</S.MediaItem>
          ))}
        </S.MediaMosaic>
      )}

      {extraCount > 0 && (
        <S.ExtraMediaBtn>
          <Icon name="image-plus" size={16} />
          <span>
            Voir {extraCount} média{extraCount > 1 ? 's' : ''} supplémentaire
            {extraCount > 1 ? 's' : ''}
          </span>
        </S.ExtraMediaBtn>
      )}

      {previewHtml && <S.PreviewText dangerouslySetInnerHTML={{ __html: previewHtml }} />}

      {locationLabel && (
        <S.Footer>
          <S.LocationBadge title={entry.location?.name || locationLabel}>
            <Icon name="map-marker-outline" size={14} />
            <span>{locationLabel}</span>
          </S.LocationBadge>
        </S.Footer>
      )}
    </S.Card>
  );
};
