import { CreateTagPayload, Tag, UpdateTagPayload } from '@/types/tag.types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

export const fetchTags = async (): Promise<Tag[]> => {
  const res = await fetchAPI<Tag[]>('/tags');
  if (!res.ok) throw toApiError(res, 'Erreur lors de la récupération des tags.');
  return res.data ?? [];
};

export const fetchTagById = async (id: string): Promise<Tag> => {
  const res = await fetchAPI<Tag>(`/tags/${id}`);
  if (!res.ok) throw toApiError(res, 'Tag introuvable.');
  return res.data;
};

export const createTag = async (dto: CreateTagPayload): Promise<Tag> => {
  const res = await fetchAPI<Tag>('/tags', {
    method: 'POST',
    body: dto,
  });
  if (!res.ok) throw toApiError(res, 'Erreur lors de la création du tag.');
  return res.data;
};

export const updateTag = async (
  id: string,
  dto: UpdateTagPayload
): Promise<Tag> => {
  const res = await fetchAPI<Tag>(`/tags/${id}`, {
    method: 'PUT',
    body: dto,
  });
  if (!res.ok) throw toApiError(res, 'Erreur lors de la mise à jour du tag.');
  return res.data;
};

export const deleteTag = async (id: string): Promise<void> => {
  const res = await fetchAPI(`/tags/${id}`, { method: 'DELETE' });
  if (!res.ok) throw toApiError(res, 'Erreur lors de la suppression du tag.');
};
