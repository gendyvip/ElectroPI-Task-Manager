import { z } from 'zod';
import { objectIdSchema } from './common.validator';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(2000).optional().default(''),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      description: z.string().trim().max(2000).optional(),
    })
    .refine((data) => data.name !== undefined || data.description !== undefined, {
      message: 'At least one field must be provided',
    }),
});

export const projectIdParamsSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const listProjectsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(120).optional(),
  }),
});

export const addProjectMemberSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({ userId: objectIdSchema }),
});

export const removeProjectMemberSchema = z.object({
  params: z.object({ id: objectIdSchema, userId: objectIdSchema }),
});
