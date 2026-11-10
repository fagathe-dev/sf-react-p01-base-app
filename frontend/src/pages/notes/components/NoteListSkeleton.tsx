import { Skeleton, SkeletonGroup, SkeletonLine, SkeletonText } from '@/ui/components';
import React from 'react';
import styled from 'styled-components';

// Même grille que NoteList
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
`;

// Mêmes marges et bordure que NoteCard
const Card = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[3.5]} ${theme.spacing[4]}`};
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2.5]};
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: ${({ theme }) => theme.spacing[2]};
  border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

// Longueurs variées d'une carte à l'autre : un squelette trop régulier paraît artificiel
const NOTE_SHAPES = [
  { title: '60%', lines: ['100%', '94%', '70%'] },
  { title: '45%', lines: ['100%', '55%'] },
  { title: '70%', lines: ['100%', '88%', '100%', '40%'] },
  { title: '50%', lines: ['92%', '65%'] },
  { title: '65%', lines: ['100%', '80%', '50%'] },
  { title: '40%', lines: ['100%', '75%'] },
];
const DEFAULT_SHAPE = { title: '50%', lines: ['100%', '70%'] };

interface NoteListSkeletonProps {
  /** Nombre de cartes affichées (défaut : 6) */
  count?: number;
  label?: string;
}

/** Chargement d'une liste de notes : cartes fantômes dans la même grille que NoteList. */
export const NoteListSkeleton: React.FC<NoteListSkeletonProps> = ({ count = 6, label = 'Chargement des notes…' }) => (
  <SkeletonGroup label={label}>
    <Grid>
      {Array.from({ length: count }, (_, index) => {
        const shape = NOTE_SHAPES[index % NOTE_SHAPES.length] ?? DEFAULT_SHAPE;
        return (
          <Card key={index}>
            <Body>
              <SkeletonLine $width={shape.title} $height={14} />
              <SkeletonText widths={shape.lines} $lineHeight={10} $gap={8} />
            </Body>
            <Footer>
              <Skeleton $width={56} $height={18} $radius={999} />
              <SkeletonLine $width={64} $height={10} />
            </Footer>
          </Card>
        );
      })}
    </Grid>
  </SkeletonGroup>
);
