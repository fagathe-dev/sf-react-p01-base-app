import { Badge, Flex, Title } from 'core-react/ui';
import React from 'react';
import { styled } from 'styled-components';

const Root = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const SectionTitle = styled(Title)`
  margin-bottom: 0;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
`;

interface SectionProps {
  title: string;
  /** Compteur affiché à côté du titre */
  count?: number;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Section titrée d'une page (ex. « En retard », « Épinglés »), avec compteur et actions optionnels.
 */
export const Section: React.FC<SectionProps> = ({ title, count, actions, children }) => (
  <Root>
    <Flex $align="center" $justify="space-between" $gap="0.5rem">
      <Flex $align="center" $gap="0.5rem">
        <SectionTitle as="h2">{title}</SectionTitle>
        {count !== undefined && (
          <Badge $variant="neutral" $pill>
            {count}
          </Badge>
        )}
      </Flex>
      {actions}
    </Flex>
    {children}
  </Root>
);
