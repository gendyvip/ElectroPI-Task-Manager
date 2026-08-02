import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10kb' }));

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
