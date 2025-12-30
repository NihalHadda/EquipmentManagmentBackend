const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Routes
const usersRouter = require('./routes/userRoutes');
const authRouter = require('./routes/authRoutes');
const roleRouter = require('./routes/roleRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

const createApp = () => {
  const app = express();

  // =========================
  // Middlewares
  // =========================
  app.use(morgan('dev'));

  // CORS (frontend Vite)
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));

  // Body parser (images base64 incluses)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // =========================
  // Routes API
  // =========================
  app.use('/api/users', usersRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/roles', roleRouter);
  app.use('/api/equipments', equipmentRoutes);
  app.use('/api/reservations', reservationRoutes);

  // =========================
  // Health Check
  // =========================
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // =========================
  // 404 Handler
  // =========================
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // =========================
  // Global Error Handler
  // =========================
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
};

module.exports = createApp;
