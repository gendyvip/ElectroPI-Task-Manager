'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, MoreHorizontal, Plus, Search, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import * as projectService from '@/services/project.service';
import type { Project } from '@/types';
import type { ProjectValues } from '@/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectFormDialog } from '@/components/project/project-form-dialog';
import { ConfirmDialog } from '@/components/project/confirm-dialog';

export function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: 8,
      search: debouncedSearch || undefined,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const,
    }),
    [page, debouncedSearch],
  );

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(params),
    queryFn: () => projectService.listProjects(params),
  });

  const createMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: async () => {
      toast.success('Project created');
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProjectValues }) =>
      projectService.updateProject(id, values),
    onSuccess: async () => {
      toast.success('Project updated');
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: projectService.deleteProject,
    onSuccess: async () => {
      toast.success('Project deleted');
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const items = projectsQuery.data?.items ?? [];
  const isInitialLoading = projectsQuery.isLoading;
  const isSearching = projectsQuery.isFetching && !projectsQuery.isLoading;

  return (
    <div className="flex min-h-full flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Browse and manage projects you belong to.
          </p>
        </div>
        {isAdmin ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New project
          </Button>
        ) : null}
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 pr-10 pl-9"
          placeholder="Search by name..."
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          aria-label="Search projects"
        />
        <div className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center">
          {isSearching ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
          ) : search ? (
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={() => {
                setPage(1);
                setSearch('');
              }}
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1">
        {isInitialLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="space-y-4 rounded-2xl border border-border bg-card/90 p-4"
              >
                <div className="space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : projectsQuery.isError ? (
          <EmptyState
            title="Failed to load projects"
            description={getErrorMessage(projectsQuery.error)}
            action={
              <Button variant="outline" onClick={() => projectsQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            title={debouncedSearch ? 'No matching projects' : 'No projects found'}
            description={
              debouncedSearch
                ? 'Try a different search term.'
                : isAdmin
                  ? 'Create your first project to get started.'
                  : 'Ask an admin to add you to a project.'
            }
            action={
              !debouncedSearch && isAdmin ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" />
                  Create project
                </Button>
              ) : null
            }
          />
        ) : (
          <div
            className={`grid gap-4 sm:grid-cols-2 ${isSearching ? 'opacity-60 transition-opacity' : ''}`}
          >
            {items.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm transition hover:border-primary/30"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-lg font-semibold hover:text-primary"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {project.description || 'No description'}
                    </p>
                  </div>
                  {isAdmin ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label="Project actions" />
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(project)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(project)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{project.members.length} members</Badge>
                  <Badge variant="outline">Owner: {project.owner.name}</Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" render={<Link href={`/projects/${project.id}`} />}>
                    Open
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {projectsQuery.data?.pagination ? (
        <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
          <p>
            Page {projectsQuery.data.pagination.page} of{' '}
            {projectsQuery.data.pagination.totalPages || 1}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!projectsQuery.data.pagination.hasPrevPage}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!projectsQuery.data.pagination.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <ProjectFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create project"
        description="You will become owner and member automatically."
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
      />

      <ProjectFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="Edit project"
        defaultValues={
          editing
            ? { name: editing.name, description: editing.description }
            : undefined
        }
        onSubmit={async (values) => {
          if (!editing) return;
          await updateMutation.mutateAsync({ id: editing.id, values });
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete project?"
        description="This deletes the project and all of its tasks."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleting) {
            await deleteMutation.mutateAsync(deleting.id);
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
