import { TagBadge } from '@/components/TagBadge';
import { Tag } from '@/types/tag.types';
import { Flex, IconButton, Text } from 'core-react/ui';
import React from 'react';
import { styled } from 'styled-components';

const Row = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  transition: background-color 0.12s ease;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  }
`;

const Info = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  min-width: 0;
`;

interface TagListItemProps {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
}

export const TagListItem: React.FC<TagListItemProps> = ({ tag, onEdit, onDelete }) => (
  <Row>
    <Info>
      <TagBadge color={tag.color}>{tag.name}</TagBadge>
      {tag.description && (
        <Text $size="sm" $color="muted">
          {tag.description}
        </Text>
      )}
    </Info>
    <Flex $align="center" $gap="0.25rem">
      <IconButton name="pencil-outline" variant="ghost" size="sm" aria-label={`Modifier le tag ${tag.name}`} onClick={() => onEdit(tag)} />
      <IconButton name="trash-can-outline" variant="ghost" size="sm" aria-label={`Supprimer le tag ${tag.name}`} onClick={() => onDelete(tag)} />
    </Flex>
  </Row>
);
