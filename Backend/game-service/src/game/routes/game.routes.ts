/**
 * Game Routes
 * Single WebSocket endpoint for persistent connections
 */

import type { FastifyInstance } from 'fastify';
import { GameService } from '../service/game.service.js';
import { GameWebSocketController } from '../controller/game-websocket.controller.js';
import { GameHttpController } from '../controller/game-http.controller.js';
import { DatabaseService } from '../../plugins/db.service.js';

export async function registerGameRoutes(fastify: FastifyInstance) {
  const dbService = new DatabaseService();
  const gameService = new GameService(dbService);
  const wsController = new GameWebSocketController(gameService, dbService);
  const httpController = new GameHttpController(dbService);

  /**
   * WebSocket endpoint: ws://localhost:3005/ws/game
   * - One persistent connection per user
   * - Games are rooms that sockets join/leave dynamically
   * - x-user-id header from Gateway (authoritative identity)
   */
  fastify.get('/ws/game', { websocket: true }, async (socket, request) => {
    await wsController.handleConnection(socket, request);
  });

  /**
   * HTTP endpoints for stats
   */
  fastify.get<{ Params: { userId: string } }>('/api/stats/:userId', async (request, reply) => {
    return httpController.getUserStats(request, reply);
  });

  fastify.get<{ Params: { userId: string }; Querystring: { limit?: string } }>('/api/recent-games/:userId', async (request, reply) => {
    return httpController.getUserRecentGames(request, reply);
  });

  fastify.log.info('Game WebSocket route registered: /ws/game');
  fastify.log.info('Game HTTP routes registered: /api/stats/:userId, /api/recent-games/:userId');
}
