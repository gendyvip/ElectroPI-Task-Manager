import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { ValidationError } from '../errors';
import { MESSAGES } from '../constants';

export function validate(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if (parsed.query !== undefined) {
        req.query = parsed.query as Request['query'];
      }
      if (parsed.params !== undefined) {
        req.params = parsed.params as Request['params'];
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ValidationError(
            MESSAGES.VALIDATION.FAILED,
            error.errors.map((issue) => ({
              field:
                issue.path
                  .filter((part) => part !== 'body' && part !== 'query' && part !== 'params')
                  .join('.') || undefined,
              message: issue.message,
            })),
          ),
        );
        return;
      }
      next(error);
    }
  };
}
