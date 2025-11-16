// src/app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import usersRouter from './routes/userRoutes.js';
import authRouter from './routes/authRoutes.js';
import profileRouter from './routes/profile.js';

const createApp = () => {
  const app = express();

  // Middlewares
  app.use(morgan('dev'));
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/users', usersRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/profile', profileRouter);

  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // 404 handler
  app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
};

export default createApp;