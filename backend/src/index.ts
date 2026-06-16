import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { registerHandlers } from './game/handlers';
import { GameManager } from './game/GameManager';
import { createGameRoutes } from './routes/game';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from 'shared';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Get config from environment
const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Middleware
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Create Redis client
const redis = new Redis(REDIS_URL);

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

// Game manager (Redis-backed with in-memory cache)
const gameManager = new GameManager(redis);

// REST API routes
app.use('/api', createGameRoutes(gameManager));

// Create typed Socket.io server with CORS
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// Register all socket event handlers
registerHandlers(io, gameManager);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io ready for connections`);
});

// Export for testing
export { app, io, redis, gameManager };