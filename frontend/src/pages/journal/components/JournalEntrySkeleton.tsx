import { Skeleton, SkeletonCircle, SkeletonGroup, SkeletonLine, SkeletonText } from '@/ui/components';
import React from 'react';
import styled from 'styled-components';

// Mêmes conteneurs que JournalDetailsPage
const PageWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 980px;
  width: 100%;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
`;

const Heading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MetaRow = styled(Row)`
  gap: 16px;
  padding: 10px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border.default};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const MediaBox = styled(Skeleton).attrs({ $variant: 'rectangular' as const })`
  aspect-ratio: 4 / 3;
  height: auto;
`;

const BreadcrumbSkeleton: React.FC<{ second: string }> = ({ second }) => (
  <Row>
    <SkeletonLine $width={96} $height={10} />
    <SkeletonLine $width={8} $height={10} />
    <SkeletonLine $width={second} $height={10} />
  </Row>
);

/** Chargement de la lecture d'une entrée (/journal/:id) : date, titre, humeur, texte, médias. */
export const JournalEntrySkeleton: React.FC = () => (
  <SkeletonGroup label="Chargement de l'entrée…">
    <PageWrap>
      <BreadcrumbSkeleton second="160px" />

      <TopBar>
        <Heading>
          <SkeletonLine $width={140} $height={10} />
          <SkeletonLine $width="55%" $height={26} />
        </Heading>
        <Row>
          <Skeleton $variant="rectangular" $width={40} $height={36} />
          <Skeleton $variant="rectangular" $width={40} $height={36} />
        </Row>
      </TopBar>

      <MetaRow>
        <Row>
          <SkeletonCircle $size={18} />
          <SkeletonLine $width={70} $height={10} />
        </Row>
        <SkeletonLine $width={120} $height={10} />
      </MetaRow>

      <SkeletonText widths={['100%', '96%', '100%', '88%', '62%']} $lineHeight={13} $gap={12} />
      <SkeletonText widths={['100%', '92%', '45%']} $lineHeight={13} $gap={12} />

      <MediaGrid>
        <MediaBox />
        <MediaBox />
        <MediaBox />
      </MediaGrid>
    </PageWrap>
  </SkeletonGroup>
);

const FormBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
`;

const Toolbar = styled(Row)`
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

/** Chargement du formulaire d'une entrée (/journal/:id/edit) : titre, éditeur Markdown, barre d'outils. */
export const JournalFormSkeleton: React.FC = () => (
  <SkeletonGroup label="Chargement de l'entrée…">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BreadcrumbSkeleton second="220px" />

      <FormBox>
        <Row style={{ justifyContent: 'space-between' }}>
          <SkeletonLine $width="40%" $height={18} />
          <SkeletonCircle $size={18} />
        </Row>

        {/* Éditeur : onglets, barre de mise en forme, zone de saisie */}
        <Row>
          <SkeletonLine $width={56} $height={12} />
          <SkeletonLine $width={56} $height={12} />
        </Row>
        <Row>
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} $variant="rectangular" $width={28} $height={28} />
          ))}
        </Row>
        <Skeleton $variant="rectangular" $height={240} />

        <Toolbar>
          <Row>
            <Skeleton $variant="rectangular" $width={38} $height={38} />
            <SkeletonLine $width={110} $height={14} />
            <Skeleton $width={90} $height={38} $radius={8} />
            <Skeleton $variant="rectangular" $width={38} $height={38} />
          </Row>
          <Row>
            <SkeletonLine $width={60} $height={14} />
            <Skeleton $width={110} $height={38} $radius={8} />
          </Row>
        </Toolbar>
      </FormBox>
    </div>
  </SkeletonGroup>
);
