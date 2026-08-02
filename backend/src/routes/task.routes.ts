import { Router, Request, Response } from 'express';
import { taskService } from '../services/task.service';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createTaskSchema,
  listTasksSchema,
  taskIdParamsSchema,
  updateTaskSchema,
} from '../validators/task.validator';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants';
import { MESSAGES } from '../constants';
import { param } from '../utils/params';

const projectTasksRouter = Router({ mergeParams: true });
const taskRouter = Router();

projectTasksRouter.use(authenticate);
taskRouter.use(authenticate);

projectTasksRouter.post(
  '/',
  validate(createTaskSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.create(param(req.params.projectId), req.user!.id, req.body);
    return sendSuccess(res, task, MESSAGES.TASK.CREATED, HTTP_STATUS.CREATED);
  }),
);

projectTasksRouter.get(
  '/',
  validate(listTasksSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await taskService.list(
      param(req.params.projectId),
      req.user!.id,
      req.query as never,
    );
    return sendSuccess(res, result, MESSAGES.TASK.LISTED);
  }),
);

taskRouter.get(
  '/:id',
  validate(taskIdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.getById(param(req.params.id), req.user!.id);
    return sendSuccess(res, task, MESSAGES.TASK.FETCHED);
  }),
);

taskRouter.patch(
  '/:id',
  validate(updateTaskSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.update(param(req.params.id), req.user!.id, req.body);
    return sendSuccess(res, task, MESSAGES.TASK.UPDATED);
  }),
);

taskRouter.delete(
  '/:id',
  validate(taskIdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await taskService.remove(param(req.params.id), req.user!.id);
    return sendSuccess(res, null, MESSAGES.TASK.DELETED);
  }),
);

export { projectTasksRouter, taskRouter };
