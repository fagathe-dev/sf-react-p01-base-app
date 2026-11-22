import { JournalMedia } from '@/types/journal.types';
import { Image, Video } from 'core-react/ui';
import React from 'react';
import { styled } from 'styled-components';

const Grid = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: ${({ $count }) => ($count === 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))')};
  gap: ${({ theme }) => theme.spacing[2]};
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.md};
`;

const Audio = styled.audio`
  width: 100%;
  grid-column: 1 / -1;
`;

const isImage = (media: JournalMedia) => media.mimeType.startsWith('image/');
const isVideo = (media: JournalMedia) => media.mimeType.startsWith('video/');

/** Médias d'un post : images et vidéos en grille, audio en pleine largeur. */
export const JournalMediaGallery: React.FC<{ medias: JournalMedia[] }> = ({ medias }) => {
  if (medias.length === 0) return null;

  const visual = medias.filter((m) => isImage(m) || isVideo(m));

  return (
    <Grid $count={visual.length}>
      {medias.map((media) =>
        isImage(media) ? (
          <a key={media.id} href={media.filePath} target="_blank" rel="noopener noreferrer">
            <Image
              src={media.filePath}
              alt={media.originalName}
              loading="lazy"
              $fluid
              $fit="cover"
              $aspectRatio={visual.length === 1 ? '16/9' : '1/1'}
            />
          </a>
        ) : isVideo(media) ? (
          <Video key={media.id} src={media.filePath} controls preload="metadata" fluid aspectRatio="16/9" />
        ) : (
          <Audio key={media.id} src={media.filePath} controls preload="metadata" aria-label={media.originalName} />
        )
      )}
    </Grid>
  );
};
