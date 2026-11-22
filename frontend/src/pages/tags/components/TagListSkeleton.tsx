import { Card, Flex, Skeleton, SkeletonGroup, SkeletonLine } from 'core-react/ui';
import React from 'react';
import { styled } from 'styled-components';

// Mêmes marges que TagListItem
const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
  }
`;

// Pastille du tag, puis description éventuelle
const TAG_SHAPES = [
  { pill: 72, description: '40%' },
  { pill: 96 },
  { pill: 64, description: '55%' },
  { pill: 84, description: '30%' },
  { pill: 58 },
];

/** Chargement de la liste des tags : lignes fantômes dans la même carte que TagList. */
export const TagListSkeleton: React.FC = () => (
  <SkeletonGroup label="Chargement des tags…">
    <Card>
      {TAG_SHAPES.map((shape, index) => (
        <Row key={index}>
          <Flex $align="center" $gap="0.75rem">
            <Skeleton $width={shape.pill} $height={22} $radius={999} />
            {shape.description && <SkeletonLine $width={180} $height={10} />}
          </Flex>
          <Flex $gap="0.25rem">
            <Skeleton $variant="rounded" $width={32} $height={32} />
            <Skeleton $variant="rounded" $width={32} $height={32} />
          </Flex>
        </Row>
      ))}
    </Card>
  </SkeletonGroup>
);
