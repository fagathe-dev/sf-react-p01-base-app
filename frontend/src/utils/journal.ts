import type { CreateJournalPostPayload, JournalTab } from '@/types/journal.types';

const JOURNAL_TABS: JournalTab[] = ['feed', 'memories', 'bookmarks', 'tags', 'private'];

/** Onglet du journal lu dans l'URL (?tab=), « feed » par défaut. */
export const parseJournalTab = (value: string | null | undefined): JournalTab =>
  JOURNAL_TABS.includes(value as JournalTab) ? (value as JournalTab) : 'feed';

/**
 * Corps multipart d'un nouveau post (POST /api/journal/posts) : les tableaux sont envoyés en `champ[]`,
 * la localisation en JSON.
 */
export const buildJournalPostFormData = (payload: CreateJournalPostPayload): FormData => {
  const data = new FormData();
  data.append('content', payload.content);
  if (payload.mood) data.append('mood', payload.mood);
  if (payload.parentId) data.append('parentId', payload.parentId);
  if (payload.isPrivate) data.append('isPrivate', 'true');
  if (payload.location) data.append('location', JSON.stringify(payload.location));
  payload.tagIds?.forEach((id) => data.append('tagIds[]', id));
  payload.medias?.forEach((file) => data.append('medias[]', file, file.name));
  return data;
};

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** Date relative en français (« il y a 3 heures », « hier ») ; « à l'instant » sous une minute. */
export const formatRelativeDate = (iso: string, now: Date = new Date()): string => {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return formatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return "à l'instant";
};

/** Date complète pour l'infobulle (« samedi 22 novembre 2025 à 09:12 »). */
export const formatFullDate = (iso: string): string =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(iso));

/** Nombre d'années écoulées pour l'onglet Souvenirs (« Il y a 2 ans »). */
export const formatYearsAgo = (iso: string, now: Date = new Date()): string => {
  const years = now.getFullYear() - new Date(iso).getFullYear();
  return years <= 1 ? 'Il y a 1 an' : `Il y a ${years} ans`;
};
