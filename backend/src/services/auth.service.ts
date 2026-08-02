import { ConflictError, NotFoundError, UnauthorizedError } from '../errors';
import { MESSAGES } from '../constants';
import { ROLES } from '../constants';
import { User } from '../models/user.model';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import { serializeUser, UserDto } from '../utils/serialize';

export class AuthService {
  async register(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: UserDto }> {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw new ConflictError(MESSAGES.AUTH.EMAIL_IN_USE);
    }

    const user = await User.create({
      name: input.name,
      email: input.email,
      password: await hashPassword(input.password),
      role: ROLES.MEMBER,
    });

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { token, user: serializeUser(user) };
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: UserDto }> {
    const user = await User.findOne({ email: input.email }).select('+password');
    if (!user) {
      throw new UnauthorizedError(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const isValid = await comparePassword(input.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { token, user: serializeUser(user) };
  }

  async getMe(userId: string): Promise<UserDto> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.AUTH.USER_NOT_FOUND);
    }
    return serializeUser(user);
  }
}

export const authService = new AuthService();
