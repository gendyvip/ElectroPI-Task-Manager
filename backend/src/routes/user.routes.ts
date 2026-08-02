import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { MESSAGES } from '../constants';

const searchUsersSchema = z.object({
  query: z.object({
    q: z.string().trim().optional().default(''),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

const userRouter = Router();

userRouter.use(authenticate);

userRouter.get(
  '/search',
  validate(searchUsersSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = req.query as unknown as { q: string; limit: number };
    const users = await userService.search(q, limit);
    return sendSuccess(res, users, MESSAGES.COMMON.SUCCESS);
  }),
);

export { userRouter };
