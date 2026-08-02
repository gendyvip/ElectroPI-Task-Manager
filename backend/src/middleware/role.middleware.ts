import { NextFunction, Request, Response } from 'express';
import { MESSAGES } from '../constants';
import { Role } from '../constants';
import { ForbiddenError, UnauthorizedError } from '../errors';

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError(MESSAGES.AUTH.FORBIDDEN));
      return;
    }

    next();
  };
}
