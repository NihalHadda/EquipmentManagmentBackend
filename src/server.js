// src/server.js
import dotenv from 'dotenv';
import createApp from './app.js';
import connectDB from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not set. Please configure your .env');
  process.exit(1);
}

const app = createApp();

connectDB(MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}).catch(err => {
  console.error('MongoDB connection failed:', err);
});
