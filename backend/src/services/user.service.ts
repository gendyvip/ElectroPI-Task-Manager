import { User } from '../models/user.model';
import { Role } from '../constants';

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export class UserService {
  async search(q: string, limit = 10): Promise<UserSearchResult[]> {
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(filter).select('name email role').limit(limit).sort({ name: 1 });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  }
}

export const userService = new UserService();
