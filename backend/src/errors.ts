import { HTTP_STATUS, HttpStatusCode } from './constants';

export interface FieldError {
  field?: string;
  message: string;
}

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly errors?: FieldError[];

  constructor(
    message: string,
    statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: FieldError[],
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, errors?: FieldError[]) {
    super(message, HTTP_STATUS.BAD_REQUEST, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors: FieldError[]) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
  }
}
