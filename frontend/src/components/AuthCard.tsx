import { Card, Flex, Text, Title } from 'core-react/ui';
import React from 'react';
import { styled } from 'styled-components';

const Header = styled(Card.Header)`
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[1]};
  border-bottom: none;
  padding-bottom: 0;
`;

const Heading = styled(Title)`
  margin-bottom: 0;
`;

const Footer = styled(Card.Footer)`
  justify-content: center;
`;

interface AuthCardProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Pied de carte centré (ex. lien « Retour à la connexion ») */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Carte des écrans publics : titre, sous-titre, contenu empilé et pied de carte.
 */
export const AuthCard: React.FC<AuthCardProps> = ({ title, subtitle, footer, children }) => (
  <Card $elevation="md">
    <Header>
      <Heading as="h2">{title}</Heading>
      {subtitle && (
        <Text $size="sm" $color="muted">
          {subtitle}
        </Text>
      )}
    </Header>
    <Card.Body>
      <Flex $direction="column" $gap="1rem">
        {children}
      </Flex>
    </Card.Body>
    {footer && (
      <Footer>
        <Text $size="sm">{footer}</Text>
      </Footer>
    )}
  </Card>
);
