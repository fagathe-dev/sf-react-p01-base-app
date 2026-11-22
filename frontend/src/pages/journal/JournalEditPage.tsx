import { useJournalAutoLock } from '@/hooks/useJournalAutoLock';
import { deleteEntry, fetchEntryById, updateEntry } from '@/services/journal.api';
import { useJournalStore } from '@/stores/journal.store';
import { Entry, UpdateEntryPayload } from '@/types/journal.types';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  JournalForm,
  JournalFormSkeleton,
  JournalLockScreen,
  JournalPageHeader,
  JournalViewMode,
} from './components';

export const JournalEditPage: React.FC = () => {
  const isUnlocked = useJournalStore((state) => state.isUnlocked);
  useJournalAutoLock();

  const { journalId } = useParams<{ journalId: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;

  useEffect(() => {
    if (journalId && isUnlocked) {
      fetchEntryById(journalId)
        .then(setEntry)
        .finally(() => setLoading(false));
    }
  }, [journalId, isUnlocked]);

  const handleUpdate = async (payload: UpdateEntryPayload) => {
    if (!journalId) return;
    try {
      setSaving(true);
      const updated = await updateEntry(journalId, payload);
      setEntry(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!journalId || !window.confirm('Supprimer définitivement cette entrée ?')) return;
    await deleteEntry(journalId);
    navigate('/journal');
  };

  const handleModeChange = (nextMode: JournalViewMode) => {
    if (nextMode === 'preview' && journalId) {
      navigate(`/journal/${journalId}`);
    }
  };

  if (!isUnlocked) {
    return <JournalLockScreen />;
  }

  if (loading) return <JournalFormSkeleton />;
  if (!entry) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <JournalPageHeader
        entryTitle={entry.title}
        entryUrl={`/journal/${entry.id}`}
        mode="edit"
        onModeChange={handleModeChange}
        onDelete={handleDelete}
      />
      <JournalForm
        key={entry.id}
        isEdit
        initialEntry={entry}
        mode="edit"
        onSubmit={handleUpdate}
        onCancel={() => navigate(from ?? `/journal/${journalId}`)}
        loading={saving}
      />
    </div>
  );
};
