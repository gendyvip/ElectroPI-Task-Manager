import { Response } from 'express';
import { HTTP_STATUS, HttpStatusCode } from '../constants';
import { FieldError } from '../errors';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode: HttpStatusCode = HTTP_STATUS.OK,
): Response {
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendError(
  res: Response,
  message: string,
  statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors?: FieldError[],
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && errors.length > 0 ? { errors } : {}),
  });
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: totalPages > 0 && page < totalPages,
    hasPrevPage: page > 1 && totalPages > 0,
  };
}
