import { Skeleton, SkeletonGroup, SkeletonLine } from '@/ui/components';
import React from 'react';
import styled from 'styled-components';

// Même cadre que TagList
const ListContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.background.surface};
`;

// Mêmes marges que TagListItem
const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
  gap: ${({ theme }) => theme.spacing[3]};

  &:last-child {
    border-bottom: none;
  }
`;

const Info = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  flex: 1;
  min-width: 0;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

// Pastille du tag, puis description éventuelle
const TAG_SHAPES = [
  { pill: 72, description: '40%' },
  { pill: 96 },
  { pill: 64, description: '55%' },
  { pill: 84, description: '30%' },
  { pill: 58 },
];

/** Chargement de la liste des tags : lignes fantômes dans le même cadre que TagList. */
export const TagListSkeleton: React.FC = () => (
  <SkeletonGroup label="Chargement des tags…">
    <ListContainer>
      {TAG_SHAPES.map((shape, index) => (
        <Row key={index}>
          <Info>
            <Skeleton $width={shape.pill} $height={22} $radius={999} />
            {shape.description && <SkeletonLine $width={shape.description} $height={10} />}
          </Info>
          <Actions>
            <Skeleton $variant="rectangular" $width={32} $height={32} />
            <Skeleton $variant="rectangular" $width={32} $height={32} />
          </Actions>
        </Row>
      ))}
    </ListContainer>
  </SkeletonGroup>
);
