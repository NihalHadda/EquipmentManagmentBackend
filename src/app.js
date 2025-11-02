const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const usersRouter = require('./routes/users');
const authRouter = require('./routes/authRoutes');

const createApp = () => {
  const app = express();

  // Middlewares
  app.use(morgan('dev'));
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/users', usersRouter);
  app.use('/api/auth', authRouter);

  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // 404 handler
  app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
};

module.exports = createApp;