import { Document, Schema, model } from 'mongoose';
import { ROLES, Role } from '../constants';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 255, unique: true },
    password: { type: String, required: true, select: false, minlength: 8 },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.MEMBER },
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
        delete transformed.password;
        return transformed;
      },
    },
  },
);

export const User = model<IUser>('User', userSchema);
