'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import * as projectService from '@/services/project.service';
import * as userService from '@/services/user.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/page-loader';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/project/confirm-dialog';
import { TaskTable } from '@/components/task/task-table';
import { cn } from '@/lib/utils';

export function ProjectDetailsPage({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const [memberQuery, setMemberQuery] = useState('');
  const debouncedMemberQuery = useDebouncedValue(memberQuery, 300);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const projectQuery = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => projectService.getProject(projectId),
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: string) => projectService.addProjectMember(projectId, userId),
    onSuccess: async () => {
      toast.success('Member added');
      setMemberQuery('');
      setSelectedUserId('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const userSearchQuery = useQuery({
    queryKey: ['users', 'search', debouncedMemberQuery],
    queryFn: () => userService.searchUsers(debouncedMemberQuery, 8),
    enabled: debouncedMemberQuery.trim().length >= 1,
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => projectService.removeProjectMember(projectId, userId),
    onSuccess: async () => {
      toast.success('Member removed');
      await queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const project = projectQuery.data;
  const canManageMembers = Boolean(
    isAdmin && project && user && project.members.some((m) => m.id === user.id),
  );

  if (projectQuery.isLoading) return <PageLoader label="Loading project..." />;

  if (projectQuery.isError || !project) {
    return (
      <EmptyState
        title="Project unavailable"
        description={getErrorMessage(projectQuery.error, 'Project not found or access denied.')}
        action={
          <Button variant="outline" render={<Link href="/projects" />}>
            Back to projects
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{project.name}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {project.description || 'No description provided.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">{project.members.length} members</Badge>
          <Badge variant="outline">Owner: {project.owner.name}</Badge>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Members</h2>
        <div className="flex flex-wrap gap-2">
          {project.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
            >
              <span>{member.name}</span>
              {member.id === project.owner.id ? <Badge variant="outline">Owner</Badge> : null}
              {canManageMembers && member.id !== project.owner.id ? (
                <Button size="xs" variant="ghost" onClick={() => setRemovingMemberId(member.id)}>
                  Remove
                </Button>
              ) : null}
            </div>
          ))}
        </div>

            {canManageMembers ? (
          <div className="max-w-xl space-y-2">
            <Label htmlFor="member-search">Add member</Label>
            <div className="relative">
              <Input
                id="member-search"
                className="h-10 pr-9"
                value={memberQuery}
                onChange={(event) => {
                  setMemberQuery(event.target.value);
                  setSelectedUserId('');
                }}
                placeholder="Search by name or email"
                autoComplete="off"
              />
              {userSearchQuery.isFetching ? (
                <Loader2
                  className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                  aria-hidden
                />
              ) : null}
            </div>
            {userSearchQuery.isFetching && debouncedMemberQuery.trim().length >= 1 ? (
              <div className="space-y-1 rounded-lg border border-border bg-card p-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-9 w-full rounded-md" />
                ))}
              </div>
            ) : userSearchQuery.data && userSearchQuery.data.length > 0 ? (
              <ul className="rounded-lg border border-border bg-card p-1">
                {userSearchQuery.data
                  .filter((candidate) => !project.members.some((m) => m.id === candidate.id))
                  .map((candidate) => (
                    <li key={candidate.id}>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                          selectedUserId === candidate.id && 'bg-accent',
                        )}
                        onClick={() => {
                          setSelectedUserId(candidate.id);
                          setMemberQuery(`${candidate.name} <${candidate.email}>`);
                        }}
                      >
                        <span>
                          {candidate.name}
                          <span className="ml-2 text-muted-foreground">{candidate.email}</span>
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            ) : debouncedMemberQuery.trim().length >= 1 && !userSearchQuery.isFetching ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : null}
            <Button
              type="button"
              disabled={!selectedUserId || addMemberMutation.isPending}
              onClick={() => {
                if (selectedUserId) {
                  void addMemberMutation.mutateAsync(selectedUserId);
                }
              }}
            >
              Add member
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <TaskTable project={project} />
      </section>

      <ConfirmDialog
        open={Boolean(removingMemberId)}
        onOpenChange={(open) => {
          if (!open) setRemovingMemberId(null);
        }}
        title="Remove member?"
        description="They will lose access to this project and its tasks."
        confirmLabel="Remove"
        loading={removeMemberMutation.isPending}
        onConfirm={async () => {
          if (removingMemberId) {
            await removeMemberMutation.mutateAsync(removingMemberId);
            setRemovingMemberId(null);
          }
        }}
      />
    </div>
  );
}
