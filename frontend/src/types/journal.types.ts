import { ColorEnum } from './tag.types';

export type MoodEnum =
  | 'angry'
  | 'anxious'
  | 'exhausted'
  | 'frustrated'
  | 'grateful'
  | 'happy'
  | 'lost'
  | 'hopeful'
  | 'in_love'
  | 'neutral'
  | 'motivated'
  | 'relaxed'
  | 'radiant'
  | 'sad'
  | 'stressed';

export const MOOD_META: Record<MoodEnum, { emoji: string; label: string }> = {
  radiant: { emoji: '🤩', label: 'Rayonnant' },
  happy: { emoji: '🙂', label: 'Heureux' },
  grateful: { emoji: '🙏', label: 'Reconnaissant' },
  in_love: { emoji: '😍', label: 'Amoureux' },
  motivated: { emoji: '💪', label: 'Motivé' },
  hopeful: { emoji: '🤞', label: "Plein d'espoir" },
  relaxed: { emoji: '😌', label: 'Détendu' },
  neutral: { emoji: '😐', label: 'Neutre' },
  lost: { emoji: '😕', label: 'Perdu' },
  exhausted: { emoji: '😫', label: 'Épuisé' },
  anxious: { emoji: '😟', label: 'Anxieux' },
  stressed: { emoji: '😰', label: 'Stressé' },
  sad: { emoji: '😔', label: 'Triste' },
  frustrated: { emoji: '😤', label: 'Frustré' },
  angry: { emoji: '😡', label: 'En colère' },
};

/** Onglets de /journal (?tab=) ; « tags » est géré côté front, « private » exige le code secret. */
export type JournalTab = 'feed' | 'memories' | 'bookmarks' | 'tags' | 'private';
/** Onglets qui listent des posts (valeurs acceptées par GET /api/journal/posts?tab=) */
export type JournalPostTab = Exclude<JournalTab, 'tags'>;

export interface JournalLocation {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  street?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface JournalMedia {
  id: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  type?: string | null;
  extension: string;
  size: number;
  createdAt: string;
}

export interface JournalTag {
  id: string;
  name: string;
  slug: string;
  color: ColorEnum;
  createdAt?: string;
  updatedAt?: string | null;
  /** Nombre de posts racines (publics seulement sans code secret) — GET /api/journal/tags */
  postCount?: number;
}

/** Les clés suivent la sérialisation de l'API (snake_case pour les champs du post). */
export interface JournalPost {
  id: string;
  content: string;
  mood: MoodEnum | null;
  color: ColorEnum | null;
  is_pinned: boolean;
  is_bookmarked: boolean;
  is_private: boolean;
  parent_id: string | null;
  location: JournalLocation | null;
  tags: JournalTag[];
  medias: JournalMedia[];
  /** Suites du post (un seul niveau) ; vide sur une suite */
  replies?: JournalPost[];
  created_at: string;
  updated_at: string | null;
}

export type JournalCounts = Partial<Record<JournalPostTab, number>>;

export interface JournalPostFilters {
  tag?: string | null;
  q?: string | null;
}

export interface CreateJournalPostPayload {
  content: string;
  mood?: MoodEnum | null;
  tagIds?: string[];
  location?: JournalLocation | null;
  parentId?: string | null;
  isPrivate?: boolean;
  medias?: File[];
}

export interface UpdateJournalPostPayload {
  content?: string;
  mood?: MoodEnum | null;
  tagIds?: string[];
  location?: JournalLocation | null;
}

export interface JournalTagPayload {
  name: string;
  color: ColorEnum;
}

export interface UnlockJournalPayload {
  passcode: string;
}

export interface UnlockJournalResponse {
  jCodeToken: string;
  message: string;
}
