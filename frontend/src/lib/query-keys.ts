export const queryKeys = {
  me: ['auth', 'me'] as const,
  projects: (params?: Record<string, unknown>) => ['projects', params] as const,
  project: (id: string) => ['projects', id] as const,
  tasks: (projectId: string, params?: Record<string, unknown>) =>
    ['tasks', projectId, params] as const,
  task: (id: string) => ['tasks', 'detail', id] as const,
};
