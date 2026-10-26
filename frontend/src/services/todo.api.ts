// src/services/todo.api.ts
import {
  CreateTodoPayload,
  Todo,
  TodoComment,
  UpdateTodoPayload,
} from '@/types/todo.types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

export const fetchTodos = async (): Promise<Todo[]> => {
  const res = await fetchAPI<Todo[]>('/todos');
  if (!res.ok) throw toApiError(res, 'Erreur lors du chargement des tâches.');
  return res.data ?? [];
};

export const createTodo = async (payload: CreateTodoPayload): Promise<Todo> => {
  const res = await fetchAPI<Todo>('/todos', {
    method: 'POST',
    body: payload,
  });
  if (!res.ok) throw toApiError(res, 'Erreur lors de la création de la tâche.');
  return res.data;
};

export const updateTodo = async (
  id: string,
  payload: UpdateTodoPayload | FormData
): Promise<Todo> => {
  const res = await fetchAPI<Todo>(`/todos/${id}`, {
    method: 'POST',
    body: payload,
  });
  if (!res.ok) throw toApiError(res, 'Erreur lors de la mise à jour de la tâche.');
  return res.data;
};

export const deleteTodo = async (id: string): Promise<void> => {
  const res = await fetchAPI(`/todos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw toApiError(res, 'Erreur lors de la suppression de la tâche.');
};

export const deleteTodoFile = async (todoId: string, fileId: string): Promise<void> => {
  const res = await fetchAPI(`/todos/${todoId}/files/${fileId}`, { method: 'DELETE' });
  if (!res.ok) throw toApiError(res, 'Erreur lors de la suppression du fichier.');
};

export const addTodoComment = async (todoId: string, content: string): Promise<TodoComment> => {
  const res = await fetchAPI<TodoComment>(`/todos/${todoId}/comments`, {
    method: 'POST',
    body: { content },
  });
  if (!res.ok) throw toApiError(res, "Erreur lors de l'ajout du commentaire.");
  return res.data;
};

export const deleteTodoComment = async (todoId: string, commentId: string): Promise<void> => {
  const res = await fetchAPI(`/todos/${todoId}/comments/${commentId}`, { method: 'DELETE' });
  if (!res.ok) throw toApiError(res, 'Erreur lors de la suppression du commentaire.');
};