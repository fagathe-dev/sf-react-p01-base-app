import { TodoComment } from '@/types/todo.types';
import { Avatar, Flex, IconButton, Text } from 'core-react/ui';
import { DateFormatter } from 'core-ts';
import React from 'react';
import { styled } from 'styled-components';

const Box = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1.5]};
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.background.body};
`;

const Content = styled(Text)`
  white-space: pre-wrap;
`;

export const TodoCommentCard: React.FC<{
  comment: TodoComment;
  onDelete: (id: string) => void;
}> = ({ comment, onDelete }) => (
  <Box>
    <Flex $align="center" $justify="space-between" $gap="0.5rem">
      <Flex $align="center" $gap="0.5rem">
        <Avatar name={comment.owner?.username || 'Moi'} src={comment.owner?.avatar || undefined} size="xs" />
        <Text $size="xs" $weight="semibold">
          {comment.owner?.username || 'Moi'}
        </Text>
        {comment.createdAt && (
          <Text $size="xs" $color="muted">
            {DateFormatter.short(comment.createdAt)}
          </Text>
        )}
      </Flex>
      <IconButton name="close" variant="ghost" size="sm" aria-label="Supprimer le commentaire" onClick={() => onDelete(comment.id)} />
    </Flex>
    <Content $size="sm">{comment.content}</Content>
  </Box>
);
