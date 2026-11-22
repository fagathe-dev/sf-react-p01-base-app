import { Card, Flex, Text, Title } from 'core-react/ui';
import React from 'react';
import { styled } from 'styled-components';

const Heading = styled(Title)`
  margin-bottom: 0;
`;

const Header = styled(Card.Header)`
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const Footer = styled(Card.Footer)`
  justify-content: flex-end;
`;

interface SettingsCardProps {
  title: string;
  description?: React.ReactNode;
  /** Boutons du pied de carte (alignés à droite) */
  actions?: React.ReactNode;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  children?: React.ReactNode;
}

/**
 * Carte de réglage (page Profil) : en-tête, champs empilés et actions. Rendue dans un <form> si `onSubmit` est fourni.
 */
export const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, actions, onSubmit, children }) => {
  const content = (
    <>
      <Header>
        <Heading as="h3">{title}</Heading>
        {description && (
          <Text $size="sm" $color="muted">
            {description}
          </Text>
        )}
      </Header>
      {children && (
        <Card.Body>
          <Flex $direction="column" $gap="1rem">
            {children}
          </Flex>
        </Card.Body>
      )}
      {actions && <Footer>{actions}</Footer>}
    </>
  );

  // Pas de noValidate : les formulaires de profil s'appuient sur la validation native (required, minLength)
  return <Card>{onSubmit ? <form onSubmit={onSubmit}>{content}</form> : content}</Card>;
};
