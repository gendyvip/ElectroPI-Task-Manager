import { Role } from '../constants';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}
