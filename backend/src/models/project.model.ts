import { Document, Schema, Types, model } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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

projectSchema.index({ members: 1 });
projectSchema.index({ owner: 1 });

export const Project = model<IProject>('Project', projectSchema);
