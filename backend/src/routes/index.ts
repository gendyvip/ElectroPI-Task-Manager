import { Router } from 'express';
import { authRouter } from './auth.routes';
import { projectRouter } from './project.routes';
import { projectTasksRouter, taskRouter } from './task.routes';
import { userRouter } from './user.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/projects/:projectId/tasks', projectTasksRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/tasks', taskRouter);

export { apiRouter };
