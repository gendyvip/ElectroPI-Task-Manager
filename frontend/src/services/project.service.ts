import { api } from '@/lib/api';
import type { ApiSuccess, Paginated, Project } from '@/types';
import type { ProjectValues } from '@/schemas';

export interface ListProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listProjects(params: ListProjectsParams = {}) {
  const { data } = await api.get<ApiSuccess<Paginated<Project>>>('/projects', { params });
  return data.data;
}

export async function getProject(id: string) {
  const { data } = await api.get<ApiSuccess<Project>>(`/projects/${id}`);
  return data.data;
}

export async function createProject(payload: ProjectValues) {
  const { data } = await api.post<ApiSuccess<Project>>('/projects', {
    name: payload.name,
    description: payload.description || '',
  });
  return data.data;
}

export async function updateProject(id: string, payload: ProjectValues) {
  const { data } = await api.patch<ApiSuccess<Project>>(`/projects/${id}`, {
    name: payload.name,
    description: payload.description || '',
  });
  return data.data;
}

export async function deleteProject(id: string) {
  const { data } = await api.delete<ApiSuccess<null>>(`/projects/${id}`);
  return data;
}

export async function addProjectMember(projectId: string, userId: string) {
  const { data } = await api.post<ApiSuccess<Project>>(`/projects/${projectId}/members`, {
    userId,
  });
  return data.data;
}

export async function removeProjectMember(projectId: string, userId: string) {
  const { data } = await api.delete<ApiSuccess<Project>>(
    `/projects/${projectId}/members/${userId}`,
  );
  return data.data;
}
