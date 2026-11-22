import { Button, Icon, Input } from 'core-react/ui';
import React, { useState } from 'react';
import { styled } from 'styled-components';

const Form = styled.form`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const TodoCommentForm: React.FC<{ onSubmit: (content: string) => Promise<void> }> = ({ onSubmit }) => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    try {
      setSubmitting(true);
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        aria-label="Nouveau commentaire"
        placeholder="Ajouter un commentaire…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button type="submit" $loading={submitting} disabled={!content.trim()} aria-label="Publier le commentaire">
        <Icon name="send" size={16} />
      </Button>
    </Form>
  );
};
