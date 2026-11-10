import { deleteNote, fetchNotes, restoreNote } from '@/services/note.api';
import { Note } from '@/types/note.types';
import { Title } from '@/ui/components';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { NoteList, NoteListSkeleton } from './components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const NotesArchivePage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes('archived')
      .then(setNotes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container>
      <Title as="h2">Archives</Title>
      {loading ? (
        <NoteListSkeleton label="Chargement des archives…" />
      ) : (
        <NoteList
          notes={notes}
          variant="archived"
          emptyMessage="Aucune note archivée."
          onSelect={() => {}}
          onRestore={async (id) => {
            await restoreNote(id);
            setNotes((prev) => prev.filter((n) => n.id !== id));
          }}
          onDelete={async (id) => {
            await deleteNote(id, false);
            setNotes((prev) => prev.filter((n) => n.id !== id));
          }}
        />
      )}
    </Container>
  );
};
