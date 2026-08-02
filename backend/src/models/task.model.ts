import { Document, Schema, Types, model } from 'mongoose';
import { TASK_PRIORITIES, TaskPriority } from '../constants';
import { TASK_STATUSES, TaskStatus } from '../constants';

export interface ITask extends Document {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  creator: Types.ObjectId;
  assignee?: Types.ObjectId | null;
  project: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    status: {
      type: String,
      enum: Object.values(TASK_STATUSES),
      default: TASK_STATUSES.TODO,
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITIES),
      default: TASK_PRIORITIES.MEDIUM,
      required: true,
    },
    dueDate: { type: Date, default: null },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const transformed = ret as Record<string, unknown>;
        transformed.id = transformed._id;
        delete transformed._id;
        delete transformed.__v;
        return transformed;
      },
    },
  },
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ project: 1, priority: 1 });
taskSchema.index({ project: 1, assignee: 1 });

export const Task = model<ITask>('Task', taskSchema);
