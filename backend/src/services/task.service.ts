import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../errors';
import { MESSAGES } from '../constants';
import { TASK_PRIORITIES } from '../constants';
import { TASK_STATUSES } from '../constants';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { User } from '../models/user.model';
import { buildPaginationMeta, PaginatedData } from '../utils/apiResponse';
import { isProjectMember, serializeTask, TaskDto } from '../utils/serialize';

const POPULATE = [
  { path: 'creator', select: 'name email' },
  { path: 'assignee', select: 'name email' },
];

export class TaskService {
  private async getAccessibleProject(projectId: string, actorId: string) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError(MESSAGES.TASK.PROJECT_NOT_FOUND);
    }
    if (!isProjectMember(project, actorId)) {
      throw new ForbiddenError(MESSAGES.PROJECT.NOT_A_MEMBER);
    }
    return project;
  }

  private async assertAssigneeIsMember(
    project: Awaited<ReturnType<typeof this.getAccessibleProject>>,
    assigneeId: string | null | undefined,
  ) {
    if (assigneeId == null) return;

    const user = await User.findById(assigneeId);
    if (!user) {
      throw new NotFoundError(MESSAGES.AUTH.USER_NOT_FOUND);
    }
    if (!isProjectMember(project, assigneeId)) {
      throw new BadRequestError(MESSAGES.TASK.ASSIGNEE_NOT_MEMBER);
    }
  }

  async create(
    projectId: string,
    actorId: string,
    input: {
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string | null;
      assignee?: string | null;
    },
  ): Promise<TaskDto> {
    const project = await this.getAccessibleProject(projectId, actorId);
    await this.assertAssigneeIsMember(project, input.assignee);

    const task = await Task.create({
      title: input.title,
      description: input.description ?? '',
      status: input.status ?? TASK_STATUSES.TODO,
      priority: input.priority ?? TASK_PRIORITIES.MEDIUM,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      creator: actorId,
      assignee: input.assignee ?? null,
      project: projectId,
    });

    const populated = await Task.findById(task.id).populate(POPULATE);
    return serializeTask(populated!);
  }

  async list(
    projectId: string,
    actorId: string,
    query: {
      page: number;
      limit: number;
      status?: string;
      priority?: string;
      assignee?: string;
    },
  ): Promise<PaginatedData<TaskDto>> {
    await this.getAccessibleProject(projectId, actorId);

    const filter: Record<string, unknown> = { project: projectId };
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.assignee) filter.assignee = query.assignee;

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      Task.find(filter)
        .populate(POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit),
      Task.countDocuments(filter),
    ]);

    return {
      items: items.map(serializeTask),
      pagination: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async getById(taskId: string, actorId: string): Promise<TaskDto> {
    const task = await Task.findById(taskId).populate(POPULATE);
    if (!task) {
      throw new NotFoundError(MESSAGES.TASK.NOT_FOUND);
    }
    await this.getAccessibleProject(task.project.toString(), actorId);
    return serializeTask(task);
  }

  async update(
    taskId: string,
    actorId: string,
    input: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string | null;
      assignee?: string | null;
    },
  ): Promise<TaskDto> {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new NotFoundError(MESSAGES.TASK.NOT_FOUND);
    }

    const project = await this.getAccessibleProject(task.project.toString(), actorId);

    if (input.assignee !== undefined) {
      await this.assertAssigneeIsMember(project, input.assignee);
    }

    if (input.title !== undefined) task.title = input.title;
    if (input.description !== undefined) task.description = input.description;
    if (input.status !== undefined) task.status = input.status as typeof task.status;
    if (input.priority !== undefined) task.priority = input.priority as typeof task.priority;
    if (input.dueDate !== undefined) {
      task.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }
    if (input.assignee !== undefined) {
      task.assignee = input.assignee as unknown as typeof task.assignee;
    }

    await task.save();
    const populated = await Task.findById(task.id).populate(POPULATE);
    return serializeTask(populated!);
  }

  async remove(taskId: string, actorId: string): Promise<void> {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new NotFoundError(MESSAGES.TASK.NOT_FOUND);
    }
    await this.getAccessibleProject(task.project.toString(), actorId);
    await Task.findByIdAndDelete(taskId);
  }
}

export const taskService = new TaskService();
