import { z } from 'zod';
import { TASK_PRIORITY_VALUES } from '../constants';
import { TASK_STATUS_VALUES } from '../constants';
import { objectIdSchema } from './common.validator';

const dueDateSchema = z
  .union([
    z.string().refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid due date' }),
    z.null(),
  ])
  .optional();

export const createTaskSchema = z.object({
  params: z.object({ projectId: objectIdSchema }),
  body: z.object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(5000).optional().default(''),
    status: z.enum(TASK_STATUS_VALUES as [string, ...string[]]).optional(),
    priority: z.enum(TASK_PRIORITY_VALUES as [string, ...string[]]).optional(),
    dueDate: dueDateSchema,
    assignee: objectIdSchema.nullable().optional(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      title: z.string().trim().min(2).max(200).optional(),
      description: z.string().trim().max(5000).optional(),
      status: z.enum(TASK_STATUS_VALUES as [string, ...string[]]).optional(),
      priority: z.enum(TASK_PRIORITY_VALUES as [string, ...string[]]).optional(),
      dueDate: dueDateSchema,
      assignee: objectIdSchema.nullable().optional(),
    })
    .refine(
      (data) =>
        data.title !== undefined ||
        data.description !== undefined ||
        data.status !== undefined ||
        data.priority !== undefined ||
        data.dueDate !== undefined ||
        data.assignee !== undefined,
      { message: 'At least one field must be provided' },
    ),
});

export const taskIdParamsSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const listTasksSchema = z.object({
  params: z.object({ projectId: objectIdSchema }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    status: z.enum(TASK_STATUS_VALUES as [string, ...string[]]).optional(),
    priority: z.enum(TASK_PRIORITY_VALUES as [string, ...string[]]).optional(),
    assignee: objectIdSchema.optional(),
  }),
});
