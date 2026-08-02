'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, type TaskValues } from '@/schemas';
import type { Project, Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  task?: Task | null;
  onSubmit: (values: TaskValues) => Promise<void>;
  onDelete?: () => void;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  project,
  task,
  onSubmit,
  onDelete,
}: TaskFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    values: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? 'TODO',
      priority: task?.priority ?? 'MEDIUM',
      dueDate: task?.dueDate ? task.dueDate.slice(0, 16) : '',
      assignee: task?.assignee?.id ?? '',
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'Create task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update task details' : `Add a task to ${project.name}`}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit({
              ...values,
              dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
              assignee: values.assignee || null,
            });
            onOpenChange(false);
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" aria-invalid={Boolean(errors.title)} {...register('title')} />
            {errors.title ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.title.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register('description')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                {...register('status')}
              >
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                {...register('priority')}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <select
                id="assignee"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                {...register('assignee')}
              >
                <option value="">Unassigned</option>
                {project.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="datetime-local" {...register('dueDate')} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {task && onDelete ? (
              <Button type="button" variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save task'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
