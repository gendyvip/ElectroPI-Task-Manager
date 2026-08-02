import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants';
import { MESSAGES } from '../constants';
import { UnauthorizedError } from '../errors';

const authRouter = Router();

authRouter.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    return sendSuccess(
      res,
      { token: result.token, user: result.user },
      MESSAGES.AUTH.REGISTER_SUCCESS,
      HTTP_STATUS.CREATED,
    );
  }),
);

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    return sendSuccess(
      res,
      { token: result.token, user: result.user },
      MESSAGES.AUTH.LOGIN_SUCCESS,
    );
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (_req: Request, res: Response) => {
    return sendSuccess(res, null, MESSAGES.AUTH.LOGOUT_SUCCESS);
  }),
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED);
    }
    const user = await authService.getMe(req.user.id);
    return sendSuccess(res, { user }, MESSAGES.COMMON.SUCCESS);
  }),
);

export { authRouter };
