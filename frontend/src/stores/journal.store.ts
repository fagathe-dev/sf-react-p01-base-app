import { fetchJournalSecurityStatus } from '@/services/auth.api';
import { sessionAppStorage } from '@/services/storage.service';
import { JournalSecurityStatus } from '@/types/auth.types';
import { create } from 'zustand';

export const JOURNAL_TOKEN_KEY = 'ffr.v4_jtkn';

interface JournalState {
  token: string | null;
  isUnlocked: boolean;
  /** Configuration de la protection (null tant qu'elle n'est pas chargée) */
  security: JournalSecurityStatus | null;
  unlock: (token: string) => void;
  lock: () => void;
  syncSession: () => void;
  setSecurity: (security: JournalSecurityStatus) => void;
  loadSecurity: () => Promise<void>;
}

export const useJournalStore = create<JournalState>((set) => ({
  token: (sessionAppStorage.get(JOURNAL_TOKEN_KEY) as string) || null,
  isUnlocked: Boolean(sessionAppStorage.get(JOURNAL_TOKEN_KEY)),
  security: null,

  unlock: (token: string) => {
    sessionAppStorage.set(JOURNAL_TOKEN_KEY, token);
    set({ token, isUnlocked: true });
  },

  lock: () => {
    sessionAppStorage.remove(JOURNAL_TOKEN_KEY);
    set({ token: null, isUnlocked: false });
  },

  syncSession: () => {
    const current = (sessionAppStorage.get(JOURNAL_TOKEN_KEY) as string) || null;
    set({ token: current, isUnlocked: Boolean(current) });
  },

  setSecurity: (security) => set({ security }),

  loadSecurity: async () => {
    try {
      set({ security: await fetchJournalSecurityStatus() });
    } catch {
      // Par prudence, on considère la protection active : l'onglet Privé demandera le code
      set({ security: { hasPasscode: true, lockEnabled: true, lockActive: true } });
    }
  },
}));

/** Protection par code effective (code défini + protection activée). Par défaut active tant que non chargée. */
export const selectLockActive = (state: JournalState): boolean => state.security?.lockActive ?? true;

/** Le contenu privé est lisible : protection inactive, ou journal déverrouillé. */
export const selectCanSeePrivate = (state: JournalState): boolean => !selectLockActive(state) || state.isUnlocked;
