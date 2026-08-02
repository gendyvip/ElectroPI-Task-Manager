export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

export const ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const TASK_STATUSES = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];
export const TASK_STATUS_VALUES = Object.values(TASK_STATUSES);

export const TASK_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[keyof typeof TASK_PRIORITIES];
export const TASK_PRIORITY_VALUES = Object.values(TASK_PRIORITIES);

export const MESSAGES = {
  AUTH: {
    REGISTER_SUCCESS: 'Registration successful',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'You do not have permission to perform this action',
    EMAIL_IN_USE: 'Email is already registered',
    USER_NOT_FOUND: 'User not found',
    TOKEN_INVALID: 'Invalid or expired token',
  },
  VALIDATION: {
    FAILED: 'Validation failed',
  },
  COMMON: {
    SUCCESS: 'Success',
    INTERNAL_ERROR: 'An unexpected error occurred',
    NOT_FOUND: 'Resource not found',
  },
  PROJECT: {
    CREATED: 'Project created successfully',
    UPDATED: 'Project updated successfully',
    DELETED: 'Project deleted successfully',
    FETCHED: 'Project fetched successfully',
    LISTED: 'Projects fetched successfully',
    NOT_FOUND: 'Project not found',
    MEMBER_ADDED: 'Member added successfully',
    MEMBER_REMOVED: 'Member removed successfully',
    MEMBER_EXISTS: 'User is already a project member',
    MEMBER_NOT_FOUND: 'User is not a project member',
    CANNOT_REMOVE_OWNER: 'Project owner cannot be removed from members',
    FORBIDDEN: 'You must be an admin member of this project',
    NOT_A_MEMBER: 'You are not a member of this project',
  },
  TASK: {
    CREATED: 'Task created successfully',
    UPDATED: 'Task updated successfully',
    DELETED: 'Task deleted successfully',
    FETCHED: 'Task fetched successfully',
    LISTED: 'Tasks fetched successfully',
    NOT_FOUND: 'Task not found',
    ASSIGNEE_NOT_MEMBER: 'Assignee must be a member of the project',
    PROJECT_NOT_FOUND: 'Project not found',
  },
} as const;
