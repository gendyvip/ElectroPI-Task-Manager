import { Types } from 'mongoose';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../errors';
import { MESSAGES } from '../constants';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { User } from '../models/user.model';
import { buildPaginationMeta, PaginatedData } from '../utils/apiResponse';
import {
  getOwnerId,
  isProjectMember,
  ProjectDto,
  serializeProject,
} from '../utils/serialize';

const POPULATE = [
  { path: 'owner', select: 'name email' },
  { path: 'members', select: 'name email' },
];

export class ProjectService {
  async create(
    actorId: string,
    input: { name: string; description?: string },
  ): Promise<ProjectDto> {
    const project = await Project.create({
      name: input.name,
      description: input.description ?? '',
      owner: actorId,
      members: [actorId],
    });

    const populated = await Project.findById(project.id).populate(POPULATE);
    return serializeProject(populated!);
  }

  async getById(projectId: string, actorId: string): Promise<ProjectDto> {
    const project = await Project.findById(projectId).populate(POPULATE);
    if (!project) {
      throw new NotFoundError(MESSAGES.PROJECT.NOT_FOUND);
    }
    if (!isProjectMember(project, actorId)) {
      throw new ForbiddenError(MESSAGES.PROJECT.NOT_A_MEMBER);
    }
    return serializeProject(project);
  }

  async list(
    actorId: string,
    query: { page: number; limit: number; search?: string },
  ): Promise<PaginatedData<ProjectDto>> {
    const filter: Record<string, unknown> = {
      members: new Types.ObjectId(actorId),
    };

    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      Project.find(filter)
        .populate(POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit),
      Project.countDocuments(filter),
    ]);

    return {
      items: items.map(serializeProject),
      pagination: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async update(
    projectId: string,
    actorId: string,
    input: { name?: string; description?: string },
  ): Promise<ProjectDto> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError(MESSAGES.PROJECT.NOT_FOUND);
    }
    if (!isProjectMember(project, actorId)) {
      throw new ForbiddenError(MESSAGES.PROJECT.NOT_A_MEMBER);
    }

    if (input.name !== undefined) project.name = input.name;
    if (input.description !== undefined) project.description = input.description;
    await project.save();

    const populated = await Project.findById(project.id).populate(POPULATE);
    return serializeProject(populated!);
  }

  async remove(projectId: string, actorId: string): Promise<void> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError(MESSAGES.PROJECT.NOT_FOUND);
    }
    if (!isProjectMember(project, actorId)) {
      throw new ForbiddenError(MESSAGES.PROJECT.NOT_A_MEMBER);
    }

    await Task.deleteMany({ project: projectId });
    await Project.findByIdAndDelete(projectId);
  }

  async addMember(
    projectId: string,
    actorId: string,
    userId: string,
  ): Promise<ProjectDto> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError(MESSAGES.PROJECT.NOT_FOUND);
    }
    if (!isProjectMember(project, actorId)) {
      throw new ForbiddenError(MESSAGES.PROJECT.NOT_A_MEMBER);
    }
    if (isProjectMember(project, userId)) {
      throw new ConflictError(MESSAGES.PROJECT.MEMBER_EXISTS);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.AUTH.USER_NOT_FOUND);
    }

    project.members.push(new Types.ObjectId(userId));
    await project.save();

    const populated = await Project.findById(project.id).populate(POPULATE);
    return serializeProject(populated!);
  }

  async removeMember(
    projectId: string,
    actorId: string,
    memberId: string,
  ): Promise<ProjectDto> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError(MESSAGES.PROJECT.NOT_FOUND);
    }
    if (!isProjectMember(project, actorId)) {
      throw new ForbiddenError(MESSAGES.PROJECT.NOT_A_MEMBER);
    }
    if (getOwnerId(project) === memberId) {
      throw new BadRequestError(MESSAGES.PROJECT.CANNOT_REMOVE_OWNER);
    }
    if (!isProjectMember(project, memberId)) {
      throw new NotFoundError(MESSAGES.PROJECT.MEMBER_NOT_FOUND);
    }

    project.members = project.members.filter((id) => id.toString() !== memberId);
    await project.save();

    await Task.updateMany(
      { project: projectId, assignee: memberId },
      { $set: { assignee: null } },
    );

    const populated = await Project.findById(project.id).populate(POPULATE);
    return serializeProject(populated!);
  }
}

export const projectService = new ProjectService();
