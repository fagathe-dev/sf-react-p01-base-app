import { Skeleton, SkeletonCircle, SkeletonGroup, SkeletonLine } from 'core-react/ui';
import React from 'react';
import { styled } from 'styled-components';

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1.5]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

// Même pile que TodoList
const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

// Mêmes marges et bordure que TodoCard
const Card = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const TitleColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1.5]};
  flex: 1;
  min-width: 0;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

interface TodoShape {
  title: string;
  /** Échéance et étiquette affichées sous le titre */
  meta?: boolean;
}

// Deux sections de longueurs différentes, titres de longueurs variées
const SECTIONS: TodoShape[][] = [
  [{ title: '55%', meta: true }, { title: '70%' }, { title: '40%', meta: true }],
  [{ title: '65%' }, { title: '35%', meta: true }],
];

/** Chargement de « Ma journée » : sections de tâches fantômes, alignées sur TodoCard. */
export const TodoListSkeleton: React.FC = () => (
  <SkeletonGroup label="Chargement des tâches…">
    <Sections>
      {SECTIONS.map((todos, sectionIndex) => (
        <div key={sectionIndex}>
          <SectionHeader>
            <SkeletonCircle $size={15} />
            <SkeletonLine $width={96} $height={10} />
          </SectionHeader>
          <List>
            {todos.map((todo, index) => (
              <Card key={index}>
                <SkeletonCircle $size={20} />
                <TitleColumn>
                  <SkeletonLine $width={todo.title} $height={12} />
                  {todo.meta && (
                    <MetaRow>
                      <SkeletonLine $width={72} $height={9} />
                      <Skeleton $width={52} $height={16} $radius={999} />
                    </MetaRow>
                  )}
                </TitleColumn>
              </Card>
            ))}
          </List>
        </div>
      ))}
    </Sections>
  </SkeletonGroup>
);
