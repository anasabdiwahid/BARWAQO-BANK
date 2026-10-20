import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`
=====================================================
  BARWAQO BANK — Core Banking System Online
  Mode: ${process.env.NODE_ENV || 'development'}
  Port: ${PORT}
  API:  http://localhost:${PORT}/api/health
  Brand Colors: Red (#D71920) & Black (#111111)
=====================================================
    `);
  });
};

startServer().catch((err) => {
  console.error('[CRITICAL] Server startup failure:', err);
  process.exit(1);
});

