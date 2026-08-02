import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase(uri = env.MONGODB_URI): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  const connection = await mongoose.connect(uri);
  // eslint-disable-next-line no-console
  console.log('Connected to MongoDB');
  return connection;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  // eslint-disable-next-line no-console
  console.log('Disconnected from MongoDB');
}
