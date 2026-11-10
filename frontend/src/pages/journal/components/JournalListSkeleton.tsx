import { Skeleton, SkeletonGroup, SkeletonLine, SkeletonText } from '@/ui/components';
import React from 'react';
import styled from 'styled-components';
import { JournalGrid } from './JournalGrid';
import { JournalQuill } from './JournalQuill';

const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, ${({ theme }) => theme.colors.primary.base} 20%, transparent);
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: color-mix(in srgb, ${({ theme }) => theme.colors.primary.base} 6%, transparent);
`;

const QuillBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: color-mix(in srgb, ${({ theme }) => theme.colors.primary.base} 12%, transparent);
  flex-shrink: 0;
  // La plume oscille : elle reste dans sa vignette
  overflow: hidden;
`;

const BannerText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  strong {
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.heading};
  }

  span {
    font-size: 12px;
    font-style: italic;
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

// Mêmes dimensions que JournalCard : le contenu chargé prend la place du squelette sans saut de mise en page
const SkeletonCard = styled.div`
  break-inside: avoid;
  page-break-inside: avoid;
  margin-bottom: 16px;
  width: 100%;
  min-height: 155px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: 16px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DateBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const Footer = styled.div`
  padding-top: 8px;
  border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

interface CardShape {
  titleWidth: string;
  /** Largeurs des lignes d'aperçu du texte */
  lines: string[];
  hasMedia?: boolean;
}

// Variété de formes pour un rendu en colonnes crédible (titres, longueurs de texte, médias)
const CARD_SHAPES: CardShape[] = [
  { titleWidth: '70%', lines: ['100%', '92%', '64%'] },
  { titleWidth: '45%', lines: ['100%', '58%'], hasMedia: true },
  { titleWidth: '60%', lines: ['100%', '88%', '95%', '40%'] },
  { titleWidth: '80%', lines: ['100%', '72%'] },
  { titleWidth: '50%', lines: ['96%', '100%', '55%'], hasMedia: true },
  { titleWidth: '65%', lines: ['100%', '84%', '70%'] },
];

const JournalCardSkeleton: React.FC<CardShape> = ({ titleWidth, lines, hasMedia }) => (
  <SkeletonCard>
    <Header>
      <DateBlock>
        <SkeletonLine $width={26} $height={10} />
        <Skeleton $variant="rectangular" $width={30} $height={20} />
      </DateBlock>
      <SkeletonLine $width={titleWidth} $height={16} style={{ flex: 1 }} />
      <Skeleton $variant="rectangular" $width={38} $height={38} />
    </Header>

    {hasMedia && <Skeleton $variant="rounded" $height={140} />}

    <SkeletonText widths={lines} />

    <Footer>
      <SkeletonLine $width="40%" />
    </Footer>
  </SkeletonCard>
);

/**
 * Chargement de la liste du journal (approche hybride) : bandeau avec plume animée, qui confirme que le journal
 * est en cours d'ouverture, au-dessus d'un squelette des cartes qui annonce déjà la structure de la page.
 */
export const JournalListSkeleton: React.FC = () => (
  <SkeletonGroup label="Ouverture de votre journal…">
    <Banner aria-hidden="true">
      <QuillBox>
        <JournalQuill size="sm" />
      </QuillBox>
      <BannerText>
        <strong>Ouverture de votre journal…</strong>
        <span>Vos pensées et souvenirs arrivent.</span>
      </BannerText>
    </Banner>

    <JournalGrid>
      {CARD_SHAPES.map((shape, index) => (
        <JournalCardSkeleton key={index} {...shape} />
      ))}
    </JournalGrid>
  </SkeletonGroup>
);
