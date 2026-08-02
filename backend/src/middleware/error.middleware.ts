import { NextFunction, Request, Response } from 'express';
import { AppError, ConflictError, ValidationError } from '../errors';
import { HTTP_STATUS } from '../constants';
import { MESSAGES } from '../constants';
import { isProduction } from '../config/env';
import { sendError } from '../utils/apiResponse';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, HTTP_STATUS.NOT_FOUND));
}

function mapMongoError(err: unknown): AppError | null {
  if (!err || typeof err !== 'object') return null;

  const error = err as {
    name?: string;
    code?: number;
    keyValue?: Record<string, unknown>;
    errors?: Record<string, { message: string; path?: string }>;
  };

  if (error.code === 11000) {
    const fields = error.keyValue ? Object.keys(error.keyValue) : [];
    return new ConflictError(`${fields[0] ?? 'field'} is already in use`);
  }

  if (error.name === 'ValidationError' && error.errors) {
    return new ValidationError(
      MESSAGES.VALIDATION.FAILED,
      Object.values(error.errors).map((issue) => ({
        field: issue.path,
        message: issue.message,
      })),
    );
  }

  if (error.name === 'CastError') {
    return new ValidationError(MESSAGES.VALIDATION.FAILED, [
      { message: 'Invalid identifier format' },
    ]);
  }

  return null;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const finalError = mapMongoError(err) ?? err;

  if (finalError instanceof AppError) {
    sendError(res, finalError.message, finalError.statusCode, finalError.errors);
    return;
  }

  // eslint-disable-next-line no-console
  console.error(finalError);

  sendError(
    res,
    isProduction
      ? MESSAGES.COMMON.INTERNAL_ERROR
      : (finalError as Error)?.message || MESSAGES.COMMON.INTERNAL_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}
