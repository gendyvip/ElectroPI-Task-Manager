import { NextFunction, Request, Response } from 'express';
import { MESSAGES } from '../constants';
import { UnauthorizedError } from '../errors';
import { User } from '../models/user.model';
import { verifyAccessToken } from '../utils/jwt';
import type { AuthUser } from '../types/auth';

export type { AuthUser };

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED);
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}
