import { api, setStoredToken } from '@/lib/api';
import type { ApiSuccess, User } from '@/types';
import type { LoginValues, RegisterValues } from '@/schemas';

interface AuthResponse {
  token: string;
  user: User;
}

export async function login(payload: LoginValues) {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/login', payload);
  setStoredToken(data.data.token);
  return data.data.user;
}

export async function register(payload: RegisterValues) {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/register', payload);
  setStoredToken(data.data.token);
  return data.data.user;
}

export async function logout() {
  try {
    await api.post<ApiSuccess<null>>('/auth/logout');
  } finally {
    setStoredToken(null);
  }
}

export async function getMe() {
  const { data } = await api.get<ApiSuccess<{ user: User }>>('/auth/me');
  return data.data.user;
}
