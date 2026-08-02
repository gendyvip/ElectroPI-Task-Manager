import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../constants';
import { UnauthorizedError } from '../errors';
import { MESSAGES } from '../constants';

export interface JwtPayload {
  sub: string;
  role: Role;
  email: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === 'string' || !decoded.sub || !decoded.role || !decoded.email) {
      throw new UnauthorizedError(MESSAGES.AUTH.TOKEN_INVALID);
    }

    return {
      sub: String(decoded.sub),
      role: decoded.role as Role,
      email: String(decoded.email),
    };
  } catch {
    throw new UnauthorizedError(MESSAGES.AUTH.TOKEN_INVALID);
  }
}
