/**
 * Game Routes
 * Single WebSocket endpoint for persistent connections
 */

import type { FastifyInstance } from 'fastify';
import { GameService } from '../service/game.service.js';
import { GameWebSocketController } from '../controller/game-websocket.controller.js';

export async function registerGameRoutes(fastify: FastifyInstance) {
  const gameService = new GameService();
  const wsController = new GameWebSocketController(gameService);

  /**
   * WebSocket endpoint: ws://localhost:3005/ws/game
   * - One persistent connection per user
   * - Games are rooms that sockets join/leave dynamically
   * - x-user-id header from Gateway (authoritative identity)
   */
  fastify.get('/ws/game', { websocket: true }, async (socket, request) => {
    await wsController.handleConnection(socket, request);
  });

  fastify.log.info('Game WebSocket route registered: /ws/game');
}
