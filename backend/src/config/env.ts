import path from 'path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv({ path: path.resolve(__dirname, '../../.env') });
loadDotenv();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('1d'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    SEED_ADMIN_EMAIL: z.string().email().default('admin@taskmanager.local'),
    SEED_ADMIN_PASSWORD: z.string().min(8).default('Admin@12345'),
    SEED_ADMIN_NAME: z.string().min(1).default('System Admin'),
  })
  .superRefine((data, ctx) => {
    if (
      data.NODE_ENV === 'production' &&
      (data.JWT_SECRET.includes('change-me') || data.JWT_SECRET.includes('dev-jwt'))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JWT_SECRET must be a strong production secret',
        path: ['JWT_SECRET'],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`Invalid environment variables:\n${formatted}`);
  process.exit(1);
  throw new Error('Invalid environment variables');
}

export const env: Env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
