import { api } from '@/lib/api';
import type { ApiSuccess, Paginated, Task, TaskPriority, TaskStatus } from '@/types';
import type { TaskValues } from '@/schemas';

export interface ListTasksParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listTasks(projectId: string, params: ListTasksParams = {}) {
  const { data } = await api.get<ApiSuccess<Paginated<Task>>>(
    `/projects/${projectId}/tasks`,
    { params },
  );
  return data.data;
}

export async function createTask(projectId: string, payload: TaskValues) {
  const { data } = await api.post<ApiSuccess<Task>>(`/projects/${projectId}/tasks`, {
    title: payload.title,
    description: payload.description || '',
    status: payload.status,
    priority: payload.priority,
    dueDate: payload.dueDate || null,
    assignee: payload.assignee || null,
  });
  return data.data;
}

export async function updateTask(id: string, payload: Partial<TaskValues> & { status?: TaskStatus }) {
  const body: Record<string, unknown> = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.priority !== undefined) body.priority = payload.priority;
  if (payload.dueDate !== undefined) body.dueDate = payload.dueDate || null;
  if (payload.assignee !== undefined) body.assignee = payload.assignee || null;

  const { data } = await api.patch<ApiSuccess<Task>>(`/tasks/${id}`, body);
  return data.data;
}

export async function deleteTask(id: string) {
  const { data } = await api.delete<ApiSuccess<null>>(`/tasks/${id}`);
  return data;
}
