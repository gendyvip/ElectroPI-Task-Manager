import { api } from '@/lib/api';
import type { ApiSuccess, Role } from '@/types';

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function searchUsers(q: string, limit = 10) {
  const { data } = await api.get<ApiSuccess<UserSearchResult[]>>('/users/search', {
    params: { q, limit },
  });
  return data.data;
}
