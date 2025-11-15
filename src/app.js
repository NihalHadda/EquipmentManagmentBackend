const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import des routes
const usersRouter = require('./routes/userRoutes');
const authRouter = require('./routes/authRoutes');

const createApp = () => {
  const app = express();

  // Middlewares globaux
  app.use(morgan('dev'));
  app.use(cors());
  app.use(express.json());

  // Routes principales
  app.use('/api/users', usersRouter);
  app.use('/api/auth', authRouter);

  // Route de test
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // Gestion des erreurs 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Gestion des erreurs serveur
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
};

module.exports = createApp;