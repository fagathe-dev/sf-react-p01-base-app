import { useJournalAutoLock } from '@/hooks/useJournalAutoLock';
import { createEntry, updateEntry } from '@/services/journal.api';
import { useJournalStore } from '@/stores/journal.store';
import { UpdateEntryPayload } from '@/types/journal.types';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JournalForm, JournalLockScreen, JournalPageHeader, JournalViewMode } from './components';

export const JournalCreatePage: React.FC = () => {
  const isUnlocked = useJournalStore((state) => state.isUnlocked);
  useJournalAutoLock();

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<JournalViewMode>('edit');
  const navigate = useNavigate();

  const handleCreate = async (payload: UpdateEntryPayload, autoCreatedEntryId?: string | null) => {
    try {
      setLoading(true);
      const saved = autoCreatedEntryId
        ? await updateEntry(autoCreatedEntryId, payload)
        : await createEntry(payload);
      navigate(`/journal/${saved.id}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return <JournalLockScreen onSuccess={() => {}} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <JournalPageHeader isCreate mode={mode} onModeChange={setMode} />
      <JournalForm
        mode={mode}
        onSubmit={handleCreate}
        onCancel={() => navigate('/journal')}
        loading={loading}
      />
    </div>
  );
};
