import { Tag } from '@/types/tag.types';
import { Card } from 'core-react/ui';
import React from 'react';
import { styled } from 'styled-components';
import { TagListItem } from './TagListItem';

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

interface TagListProps {
  tags: Tag[];
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
}

export const TagList: React.FC<TagListProps> = ({ tags, onEdit, onDelete }) => (
  <Card>
    <List>
      {tags.map((tag) => (
        <TagListItem key={tag.id} tag={tag} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </List>
  </Card>
);
