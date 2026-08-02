import { Router, Request, Response } from 'express';
import { projectService } from '../services/project.service';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { ROLES } from '../constants';
import {
  addProjectMemberSchema,
  createProjectSchema,
  listProjectsSchema,
  projectIdParamsSchema,
  removeProjectMemberSchema,
  updateProjectSchema,
} from '../validators/project.validator';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants';
import { MESSAGES } from '../constants';
import { ForbiddenError, UnauthorizedError } from '../errors';
import { param } from '../utils/params';

const projectRouter = Router();

projectRouter.use(authenticate);

function requireAdmin(req: Request): void {
  if (!req.user) throw new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED);
  if (req.user.role !== ROLES.ADMIN) {
    throw new ForbiddenError(MESSAGES.PROJECT.FORBIDDEN);
  }
}

projectRouter.post(
  '/',
  authorize(ROLES.ADMIN),
  validate(createProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.create(req.user!.id, req.body);
    return sendSuccess(res, project, MESSAGES.PROJECT.CREATED, HTTP_STATUS.CREATED);
  }),
);

projectRouter.get(
  '/',
  validate(listProjectsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await projectService.list(req.user!.id, req.query as never);
    return sendSuccess(res, result, MESSAGES.PROJECT.LISTED);
  }),
);

projectRouter.get(
  '/:id',
  validate(projectIdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.getById(param(req.params.id), req.user!.id);
    return sendSuccess(res, project, MESSAGES.PROJECT.FETCHED);
  }),
);

projectRouter.patch(
  '/:id',
  validate(updateProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    requireAdmin(req);
    const project = await projectService.update(param(req.params.id), req.user!.id, req.body);
    return sendSuccess(res, project, MESSAGES.PROJECT.UPDATED);
  }),
);

projectRouter.delete(
  '/:id',
  validate(projectIdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    requireAdmin(req);
    await projectService.remove(param(req.params.id), req.user!.id);
    return sendSuccess(res, null, MESSAGES.PROJECT.DELETED);
  }),
);

projectRouter.post(
  '/:id/members',
  validate(addProjectMemberSchema),
  asyncHandler(async (req: Request, res: Response) => {
    requireAdmin(req);
    const project = await projectService.addMember(
      param(req.params.id),
      req.user!.id,
      req.body.userId,
    );
    return sendSuccess(res, project, MESSAGES.PROJECT.MEMBER_ADDED);
  }),
);

projectRouter.delete(
  '/:id/members/:userId',
  validate(removeProjectMemberSchema),
  asyncHandler(async (req: Request, res: Response) => {
    requireAdmin(req);
    const project = await projectService.removeMember(
      param(req.params.id),
      req.user!.id,
      param(req.params.userId),
    );
    return sendSuccess(res, project, MESSAGES.PROJECT.MEMBER_REMOVED);
  }),
);

export { projectRouter };
