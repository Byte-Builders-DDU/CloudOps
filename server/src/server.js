import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { initializeSocket } from './services/socketService.js';
import prisma from './models/prisma.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
};
initializeSocket(server, corsOptions);

// Start server
server.listen(PORT, async () => {
  console.log(`
  ======================================================
  🚀 CloudOps Backend Platform Server is Running
  📡 Local Address: http://localhost:${PORT}
  🔌 Socket.IO: Initialized and listening for telemetry
  🗄️ Database: SQLite via Prisma ORM
  ======================================================
  `);

  try {
    await prisma.$connect();
    console.log('✅ Connected to SQLite database successfully.');
  } catch (error) {
    console.error('❌ Database connection failure:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  server.close(() => {
    console.log('🛑 CloudOps server terminated gracefully.');
    process.exit(0);
  });
});
