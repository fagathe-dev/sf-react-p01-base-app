import { Skeleton, SkeletonCircle, SkeletonGroup, SkeletonLine } from '@/ui/components';
import React from 'react';
import styled from 'styled-components';

// Mêmes conteneurs que ProfilePage
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 820px;
  width: 100%;
`;

const ProfileBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  flex-wrap: wrap;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-width: 200px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TabRow = styled(Row)`
  gap: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

// Même carte que FormCard (ProfileForms.styles)
const FormCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  max-width: 640px;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const Field: React.FC<{ label: string }> = ({ label }) => (
  <Column style={{ gap: 6, minWidth: 0 }}>
    <SkeletonLine $width={label} $height={10} />
    <Skeleton $variant="rectangular" $height={40} />
  </Column>
);

/** Chargement de « Mon Profil » : bandeau (avatar, nom, rôle), onglets et formulaire d'informations. */
export const ProfileSkeleton: React.FC = () => (
  <SkeletonGroup label="Chargement du profil…">
    <PageContainer>
      <SkeletonLine $width={160} $height={26} />

      <ProfileBanner>
        <SkeletonCircle $size={76} />
        <Column>
          <Row>
            <SkeletonLine $width="45%" $height={20} />
            <Skeleton $width={88} $height={20} $radius={999} />
          </Row>
          <SkeletonLine $width="60%" $height={12} />
        </Column>
      </ProfileBanner>

      <TabRow>
        <SkeletonLine $width={110} $height={14} />
        <SkeletonLine $width={160} $height={14} />
        <SkeletonLine $width={100} $height={14} />
      </TabRow>

      <FormCard>
        <SkeletonLine $width={180} $height={16} />
        <Field label="35%" />
        <FieldGrid>
          <Field label="30%" />
          <Field label="25%" />
        </FieldGrid>
        <Row style={{ justifyContent: 'flex-end' }}>
          <Skeleton $width={130} $height={38} $radius={8} />
        </Row>
      </FormCard>
    </PageContainer>
  </SkeletonGroup>
);
