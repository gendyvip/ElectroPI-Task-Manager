import { Types } from 'mongoose';
import { IUser } from '../models/user.model';
import { IProject } from '../models/project.model';
import { ITask } from '../models/task.model';
import { Role } from '../constants';
import { TaskPriority } from '../constants';
import { TaskStatus } from '../constants';

type PopulatedUser = Pick<IUser, 'name' | 'email'> & { _id: Types.ObjectId; id?: string };

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummaryDto {
  id: string;
  name: string;
  email: string;
}

export interface ProjectDto {
  id: string;
  name: string;
  description: string;
  owner: UserSummaryDto;
  members: UserSummaryDto[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskDto {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  creator: UserSummaryDto;
  assignee: UserSummaryDto | null;
  project: string;
  createdAt: string;
  updatedAt: string;
}

function toUserSummary(user: PopulatedUser | Types.ObjectId | string): UserSummaryDto {
  if (typeof user === 'string') {
    return { id: user, name: '', email: '' };
  }
  if (user instanceof Types.ObjectId) {
    return { id: user.toString(), name: '', email: '' };
  }
  return {
    id: user.id ?? user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

export function serializeUser(user: IUser): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function serializeProject(project: IProject): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    owner: toUserSummary(project.owner as unknown as PopulatedUser | Types.ObjectId),
    members: ((project.members ?? []) as unknown as Array<PopulatedUser | Types.ObjectId>).map(
      toUserSummary,
    ),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function serializeTask(task: ITask): TaskDto {
  const assigneeRaw = task.assignee as unknown as PopulatedUser | Types.ObjectId | null | undefined;
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    creator: toUserSummary(task.creator as unknown as PopulatedUser | Types.ObjectId),
    assignee: assigneeRaw == null ? null : toUserSummary(assigneeRaw),
    project:
      typeof task.project === 'string'
        ? task.project
        : (task.project as Types.ObjectId).toString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function isProjectMember(project: IProject, userId: string): boolean {
  const ownerId =
    project.owner instanceof Types.ObjectId
      ? project.owner.toString()
      : String((project.owner as { _id?: Types.ObjectId; id?: string }).id ?? (project.owner as { _id?: Types.ObjectId })._id);
  if (ownerId === userId) return true;
  return (project.members ?? []).some((member) => {
    if (member instanceof Types.ObjectId) return member.toString() === userId;
    const populated = member as unknown as { _id?: Types.ObjectId; id?: string };
    return (populated.id ?? populated._id?.toString()) === userId;
  });
}

export function getOwnerId(project: IProject): string {
  if (project.owner instanceof Types.ObjectId) return project.owner.toString();
  const owner = project.owner as unknown as { _id?: Types.ObjectId; id?: string };
  return owner.id ?? owner._id?.toString() ?? '';
}
