import { JOURNAL_TOKEN_KEY, useJournalStore } from '@/stores/journal.store';
import {
  CreateJournalPostPayload,
  JournalCounts,
  JournalPost,
  JournalPostFilters,
  JournalPostTab,
  JournalTag,
  JournalTagPayload,
  UnlockJournalPayload,
  UnlockJournalResponse,
  UpdateJournalPostPayload,
} from '@/types/journal.types';
import { buildJournalPostFormData } from '@/utils/journal';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';
import { sessionAppStorage } from './storage.service';

const POSTS_URL = '/journal/posts';
const TAGS_URL = '/journal/tags';

/**
 * En-tête X-JOURNAL-AUTH quand le journal est déverrouillé. Il n'est exigé que pour le contenu privé,
 * mais il est toujours envoyé s'il existe : les compteurs et les tags incluent alors le privé.
 */
const journalHeaders = (): Record<string, string> => {
  const token = (sessionAppStorage.get(JOURNAL_TOKEN_KEY) as string | null) ?? useJournalStore.getState().token;
  return token ? { 'X-JOURNAL-AUTH': token } : {};
};

/** 403 : jeton refusé ou expiré, on reverrouille l'onglet Privé. */
const lockOnForbidden = (status: number) => {
  if (status === 403 && useJournalStore.getState().isUnlocked) {
    useJournalStore.getState().lock();
  }
};

const request = async <T>(url: string, fallback: string, options: Parameters<typeof fetchAPI>[1] = {}): Promise<T> => {
  const res = await fetchAPI<T>(url, { ...options, headers: { ...journalHeaders(), ...(options.headers ?? {}) } });
  lockOnForbidden(res.status);
  if (!res.ok) throw toApiError(res, fallback);
  return res.data as T;
};

/** Vérifie le code secret et mémorise le jCodeToken (store + sessionStorage). */
export const unlockJournal = async (passcode: string): Promise<string> => {
  const payload: UnlockJournalPayload = { passcode };
  const res = await fetchAPI<UnlockJournalResponse>('/journal/unlock', { method: 'POST', body: payload });
  if (!res.ok) throw toApiError(res, 'Code secret incorrect.');

  useJournalStore.getState().unlock(res.data.jCodeToken);
  return res.data.jCodeToken;
};

export const fetchJournalPosts = async (tab: JournalPostTab, filters: JournalPostFilters = {}): Promise<JournalPost[]> => {
  const params = new URLSearchParams({ tab });
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  return (await request<JournalPost[]>(`${POSTS_URL}?${params}`, 'Impossible de charger le journal.')) ?? [];
};

export const fetchJournalCounts = (): Promise<JournalCounts> =>
  request<JournalCounts>(`${POSTS_URL}/counts`, 'Impossible de charger les compteurs du journal.');

/** Crée un post ou une suite (multipart pour les médias). Pour une suite, l'API renvoie le post racine complet. */
export const createJournalPost = (payload: CreateJournalPostPayload): Promise<JournalPost> =>
  request<JournalPost>(POSTS_URL, 'Erreur lors de la publication.', {
    method: 'POST',
    body: buildJournalPostFormData(payload),
  });

/** Modifie un post ; renvoie le post racine complet (suites comprises). */
export const updateJournalPost = (id: string, payload: UpdateJournalPostPayload): Promise<JournalPost> =>
  request<JournalPost>(`${POSTS_URL}/${id}`, 'Erreur lors de la modification.', { method: 'PATCH', body: payload });

export const toggleJournalPostFlag = (id: string, flag: 'bookmark' | 'pin' | 'toggle-private'): Promise<JournalPost> =>
  request<JournalPost>(`${POSTS_URL}/${id}/${flag}`, 'Action impossible sur ce post.', { method: 'POST' });

export const deleteJournalPost = (id: string): Promise<void> =>
  request<void>(`${POSTS_URL}/${id}`, 'Erreur lors de la suppression du post.', { method: 'DELETE' });

export const deleteJournalMedia = (postId: string, mediaId: string): Promise<void> =>
  request<void>(`${POSTS_URL}/${postId}/medias/${mediaId}`, 'Erreur lors de la suppression du média.', {
    method: 'DELETE',
  });

export const fetchJournalTags = async (): Promise<JournalTag[]> =>
  (await request<JournalTag[]>(TAGS_URL, 'Impossible de charger les tags du journal.')) ?? [];

export const createJournalTag = (payload: JournalTagPayload): Promise<JournalTag> =>
  request<JournalTag>(TAGS_URL, 'Erreur lors de la création du tag.', { method: 'POST', body: payload });

export const updateJournalTag = (id: string, payload: Partial<JournalTagPayload>): Promise<JournalTag> =>
  request<JournalTag>(`${TAGS_URL}/${id}`, 'Erreur lors de la modification du tag.', { method: 'PUT', body: payload });

export const deleteJournalTag = (id: string): Promise<void> =>
  request<void>(`${TAGS_URL}/${id}`, 'Erreur lors de la suppression du tag.', { method: 'DELETE' });
