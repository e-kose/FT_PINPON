/**
 * Game Routes
 * Single WebSocket endpoint for persistent connections
 */

import type { FastifyInstance } from 'fastify';
import { GameWebSocketController } from '../controller/game-websocket.controller.js';
import { RoomManager } from '../engine/room.manager.js';
import { TournamentManager } from '../engine/tournament.manager.js';
import { GameRepository } from '../repository/game.repository.js';
import { getUserProfileSchema, getTournamentSchema } from './game.schemas.js';

const createSchema = (summary: string, schema: any) => ({
  tags: ["Game"],
  summary,
  ...schema,
});

export async function registerGameRoutes(fastify: FastifyInstance) {
  const roomManager = new RoomManager();
  const tournamentManager = new TournamentManager(roomManager);
  const gameRepository = new GameRepository(fastify.db);
  const wsController = new GameWebSocketController(roomManager, tournamentManager, gameRepository);

  /**
   * WebSocket endpoint: ws://localhost:3005/game/ws
   */
  fastify.get('/game/ws', { websocket: true }, async (socket, request) => {
    await wsController.handleConnection(socket, request);
  });

  /**
   * HTTP API: Get user profile
   */
  fastify.get(
    '/game/users/:userId/profile',
    { schema: createSchema("Get user profile with game statistics", getUserProfileSchema) },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };

      try {
        const profile = gameRepository.getUserProfile(userId);
        return { success: true, data: profile };
      } catch (err) {
        return reply.code(500).send({ success: false, error: 'Internal Server Error', message: (err as Error).message });
      }
    }
  );

  /**
   * HTTP API: Get tournament by ID
   */
  fastify.get(
    '/game/tournaments/:tournamentId',
    { schema: createSchema("Get tournament details by ID", getTournamentSchema) },
    async (request, reply) => {
      const { tournamentId } = request.params as { tournamentId: string };

      try {
        const tournament = gameRepository.getTournamentById(tournamentId);

        if (!tournament) {
          return reply.code(404).send({ success: false, error: 'Tournament not found' });
        }

        return { success: true, data: tournament };
      } catch (err) {
        return reply.code(500).send({ success: false, error: 'Internal Server Error', message: (err as Error).message });
      }
    }
  );

  fastify.log.info('Game WebSocket route registered: /game/ws');
  fastify.log.info('Game HTTP routes registered: /game/users/:userId/profile, /game/tournaments/:tournamentId');
}
