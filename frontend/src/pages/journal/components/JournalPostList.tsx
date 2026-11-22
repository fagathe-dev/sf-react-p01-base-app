import { Section } from '@/components/Section';
import { JournalPost, JournalTag } from '@/types/journal.types';
import { Card, EmptyState, Flex, SkeletonCircle, SkeletonGroup, SkeletonLine, SkeletonText } from 'core-react/ui';
import React from 'react';
import { styled } from 'styled-components';
import { JournalPostCard } from './JournalPostCard';

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

/** Chargement : cartes fantômes alignées sur JournalPostCard. */
export const JournalPostListSkeleton: React.FC = () => (
  <SkeletonGroup label="Chargement des posts…">
    <List>
      {[0, 1, 2].map((key) => (
        <Card key={key}>
          <Card.Body>
            <Flex $direction="column" $gap="1rem">
              <Flex $align="center" $gap="0.75rem">
                <SkeletonCircle $size={40} />
                <Flex $direction="column" $gap="0.375rem">
                  <SkeletonLine $width={120} $height={12} />
                  <SkeletonLine $width={180} $height={10} />
                </Flex>
              </Flex>
              <SkeletonText lines={3} />
            </Flex>
          </Card.Body>
        </Card>
      ))}
    </List>
  </SkeletonGroup>
);

interface JournalPostListProps {
  posts: JournalPost[];
  tags: JournalTag[];
  isUnlocked: boolean;
  showYearsAgo?: boolean;
  empty: { icon: string; title: string; description?: string };
  onChange: (root: JournalPost) => void;
  onDelete: (id: string) => void;
}

/** Posts d'un onglet : épinglés en tête (section dédiée), puis les autres du plus récent au plus ancien. */
export const JournalPostList: React.FC<JournalPostListProps> = ({ posts, empty, ...cardProps }) => {
  if (posts.length === 0) {
    return <EmptyState icon={empty.icon} title={empty.title} description={empty.description} />;
  }

  const pinned = posts.filter((p) => p.is_pinned);
  const others = posts.filter((p) => !p.is_pinned);
  const renderList = (items: JournalPost[]) => (
    <List>
      {items.map((post) => (
        <JournalPostCard key={post.id} post={post} {...cardProps} />
      ))}
    </List>
  );

  if (pinned.length === 0) return renderList(others);

  return (
    <Flex $direction="column" $gap="1.5rem">
      <Section title="Épinglés" count={pinned.length}>
        {renderList(pinned)}
      </Section>
      {others.length > 0 && (
        <Section title="Fil" count={others.length}>
          {renderList(others)}
        </Section>
      )}
    </Flex>
  );
};
