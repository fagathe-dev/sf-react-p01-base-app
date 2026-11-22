import { Flex, Icon, Text, Title } from 'core-react/ui';
import React from 'react';
import { styled } from 'styled-components';

const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
  padding-bottom: ${({ theme }) => theme.spacing[5]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

const Heading = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  min-width: 0;
`;

const IconBadge = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.primary.subtle};
  color: ${({ theme }) => theme.colors.primary.dark};
`;

const PageTitle = styled(Title)`
  margin-bottom: 0;
`;

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  icon?: string;
  /** Actions alignées à droite (boutons, filtres…) */
  actions?: React.ReactNode;
}

/**
 * En-tête commun à toutes les pages de l'espace connecté : icône, titre, description et actions.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon, actions }) => (
  <Header>
    <Heading>
      {icon && (
        <IconBadge aria-hidden="true">
          <Icon name={icon} size={22} />
        </IconBadge>
      )}
      <div>
        <PageTitle as="h1">{title}</PageTitle>
        {description && (
          <Text as="p" $size="sm" $color="muted">
            {description}
          </Text>
        )}
      </div>
    </Heading>
    {actions && (
      <Flex $align="center" $gap="0.5rem" $wrap="wrap">
        {actions}
      </Flex>
    )}
  </Header>
);
