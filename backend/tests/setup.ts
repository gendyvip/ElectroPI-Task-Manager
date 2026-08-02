import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  const uri = process.env.TEST_MONGODB_URI;

  if (uri) {
    await mongoose.connect(uri);
    return;
  }

  mongoServer = await MongoMemoryServer.create({
    binary: { version: '7.0.14' },
  });
  await mongoose.connect(mongoServer.getUri());
}, 600_000);

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
