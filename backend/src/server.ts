import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`Shutting down (${signal})`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server');
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
