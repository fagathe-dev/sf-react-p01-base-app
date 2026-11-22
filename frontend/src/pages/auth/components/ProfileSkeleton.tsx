import { Card, Flex, Skeleton, SkeletonCircle, SkeletonGroup, SkeletonLine } from 'core-react/ui';
import React from 'react';
import { styled } from 'styled-components';
import { FieldGrid } from './ProfileForms.styles';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
  max-width: 48rem;
  margin-top: ${({ theme }) => theme.spacing[5]};
`;

const Grow = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Field: React.FC<{ label: string }> = ({ label }) => (
  <Flex $direction="column" $gap="0.375rem">
    <SkeletonLine $width={label} $height={10} />
    <Skeleton $variant="rounded" $height={40} />
  </Flex>
);

/** Chargement de « Mon profil » : en-tête, carte de résumé, onglets et formulaire d'informations. */
export const ProfileSkeleton: React.FC = () => (
  <SkeletonGroup label="Chargement du profil…">
    <Flex $align="center" $gap="0.75rem">
      <Skeleton $variant="rounded" $width={44} $height={44} />
      <Flex $direction="column" $gap="0.5rem">
        <SkeletonLine $width={180} $height={24} />
        <SkeletonLine $width={280} $height={12} />
      </Flex>
    </Flex>

    <Content>
      <Card>
        <Card.Body>
          <Flex $align="center" $gap="1.5rem">
            <SkeletonCircle $size={48} />
            <Grow>
              <SkeletonLine $width="40%" $height={20} />
              <SkeletonLine $width="60%" $height={12} />
            </Grow>
          </Flex>
        </Card.Body>
      </Card>

      <Flex $gap="1.5rem">
        <SkeletonLine $width={110} $height={14} />
        <SkeletonLine $width={90} $height={14} />
        <SkeletonLine $width={120} $height={14} />
      </Flex>

      <Card>
        <Card.Body>
          <Flex $direction="column" $gap="1rem">
            <SkeletonLine $width={200} $height={18} />
            <Field label="35%" />
            <FieldGrid>
              <Field label="30%" />
              <Field label="25%" />
            </FieldGrid>
          </Flex>
        </Card.Body>
      </Card>
    </Content>
  </SkeletonGroup>
);
