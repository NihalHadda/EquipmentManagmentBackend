const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRouter = require('./routes/authRoutes');
const usersRouter = require('./routes/userRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');

const createApp = () => {
  const app = express();

  // Middlewares
  app.use(morgan('dev'));
  
  // CORS configuré pour le frontend sur port 5173
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }));
  
  // Augmenter la limite pour les images base64
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Routes
  app.use('/api/users', usersRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/equipments', equipmentRoutes); // ✅ Route équipements

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