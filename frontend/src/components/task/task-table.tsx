'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import * as taskService from '@/services/task.service';
import type { Project, Task, TaskPriority, TaskStatus } from '@/types';
import type { TaskValues } from '@/schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { TaskFormDialog } from '@/components/task/task-form-dialog';
import { ConfirmDialog } from '@/components/project/confirm-dialog';

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export function TaskTable({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [assignee, setAssignee] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const filters = {
    status: status || undefined,
    priority: priority || undefined,
    assignee: assignee || undefined,
    limit: 50,
  };

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks(project.id, filters),
    queryFn: () => taskService.listTasks(project.id, filters),
  });

  const createMutation = useMutation({
    mutationFn: (values: TaskValues) => taskService.createTask(project.id, values),
    onSuccess: async () => {
      toast.success('Task created');
      await queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TaskValues }) =>
      taskService.updateTask(id, values),
    onSuccess: async () => {
      toast.success('Task updated');
      await queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: async () => {
      toast.success('Task deleted');
      await queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const tasks = tasksQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Status</span>
            <select
              className="block h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus | '')}
            >
              <option value="">All</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Priority</span>
            <select
              className="block h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority | '')}
            >
              <option value="">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Assignee</span>
            <select
              className="block h-9 min-w-40 rounded-md border border-input bg-background px-2 text-sm"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="">All</option>
              {project.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          New task
        </Button>
      </div>

      {tasksQuery.isLoading ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border bg-muted/40 px-4 py-3">
            <Skeleton className="h-3 w-full max-w-md" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center gap-3 px-4 py-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-14" />
                  <Skeleton className="h-8 w-14" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : tasksQuery.isError ? (
        <EmptyState
          title="Could not load tasks"
          description={getErrorMessage(tasksQuery.error)}
        />
      ) : tasks.length === 0 ? (
        <EmptyState title="No tasks" description="Create a task or adjust filters." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{task.title}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {task.description || 'No description'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{STATUS_LABEL[task.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">{task.priority}</td>
                  <td className="px-4 py-3">{task.assignee?.name ?? 'Unassigned'}</td>
                  <td className="px-4 py-3">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(task);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleting(task)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={project}
        task={editing}
        onSubmit={async (values) => {
          if (editing) {
            await updateMutation.mutateAsync({ id: editing.id, values });
          } else {
            await createMutation.mutateAsync(values);
          }
        }}
        onDelete={
          editing
            ? () => {
                setDeleting(editing);
                setFormOpen(false);
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete task?"
        description="This action cannot be undone."
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
