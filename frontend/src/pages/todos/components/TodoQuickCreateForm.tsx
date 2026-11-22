import { createTodo } from '@/services/todo.api';
import { Todo } from '@/types/todo.types';
import { Button, HelperText, Icon } from 'core-react/ui';
import React, { useState } from 'react';
import { styled } from 'styled-components';

const Form = styled.form`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2.5]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[2]} ${theme.spacing[2]} ${theme.spacing[4]}`};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background.surface};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  color: ${({ theme }) => theme.colors.text.muted};
  transition: border-color 0.15s ease;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary.base};
    color: ${({ theme }) => theme.colors.primary.base};
  }
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  min-height: 2.25rem;
  border: none;
  outline: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.heading};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

/** Barre de création rapide (Entrée pour ajouter). */
export const TodoQuickCreateForm: React.FC<{ onCreated: (t: Todo) => void }> = ({ onCreated }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value || loading) return;

    try {
      setLoading(true);
      setError(null);
      onCreated(await createTodo({ name: value }));
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <Icon name="plus" size={20} />
        <Input
          aria-label="Nouvelle tâche"
          placeholder="Ajouter une tâche…"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          disabled={loading}
        />
        <Button type="submit" $size="sm" $loading={loading} disabled={!name.trim()}>
          Ajouter
        </Button>
      </Form>
      {error && <HelperText $state="invalid">{error}</HelperText>}
    </div>
  );
};
