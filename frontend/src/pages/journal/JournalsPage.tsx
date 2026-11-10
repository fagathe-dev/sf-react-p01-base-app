import { useJournalAutoLock } from '@/hooks/useJournalAutoLock';
import { fetchEntries, updateEntry } from '@/services/journal.api';
import { useJournalStore } from '@/stores/journal.store';
import { Entry } from '@/types/journal.types';
import { Button } from '@/ui/components';
import { Title } from '@/ui/components';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { JournalCard, JournalGrid, JournalListSkeleton, JournalLockScreen } from './components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const JournalsPage: React.FC = () => {
  const isUnlocked = useJournalStore((state) => state.isUnlocked);
  useJournalAutoLock();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      setEntries(await fetchEntries());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      loadData();
    }
  }, [isUnlocked]);

  const { pinned, others } = useMemo(
    () => ({
      pinned: entries.filter((e) => e.is_pinned),
      others: entries.filter((e) => !e.is_pinned),
    }),
    [entries]
  );

  const handleTogglePin = async (entry: Entry) => {
    const next = !entry.is_pinned;
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, is_pinned: next } : e)));
    try {
      await updateEntry(entry.id, { isPinned: next });
    } catch {
      // Rollback : l'API a refusé la modification
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, is_pinned: !next } : e)));
    }
  };

  if (!isUnlocked) {
    return <JournalLockScreen onSuccess={loadData} />;
  }

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title as="h2">Mon Journal intime</Title>
        <Button onClick={() => navigate('/journal/new')}>Nouvelle entrée</Button>
      </div>

      {loading ? (
        <JournalListSkeleton />
      ) : (
        <>
          {pinned.length > 0 && (
            <div>
              <Title as="h4" style={{ marginBottom: 12 }}>
                Épinglées
              </Title>
              <JournalGrid>
                {pinned.map((e) => (
                  <JournalCard key={e.id} entry={e} onTogglePin={handleTogglePin} />
                ))}
              </JournalGrid>
            </div>
          )}

          <div>
            {pinned.length > 0 && (
              <Title as="h4" style={{ marginBottom: 12 }}>
                Autres entrées
              </Title>
            )}
            <JournalGrid>
              {others.map((e) => (
                <JournalCard key={e.id} entry={e} onTogglePin={handleTogglePin} />
              ))}
            </JournalGrid>
          </div>
        </>
      )}
    </Container>
  );
};
