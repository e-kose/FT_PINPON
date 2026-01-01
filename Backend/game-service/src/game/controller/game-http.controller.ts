/**
 * HTTP Controller for Game Stats
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { DatabaseService } from '../../plugins/db.service.js';

export class GameHttpController {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * GET /api/stats/:userId
   * Get user game statistics
   */
  public async getUserStats(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply): Promise<void> {
    const { userId } = request.params;

    if (!userId) {
      return reply.status(400).send({ error: 'User ID is required' });
    }

    try {
      const stats = this.dbService.getUserStats(userId);
      return reply.send({
        userId,
        stats: {
          wins: stats.wins,
          losses: stats.losses,
          totalGames: stats.totalGames,
          winRate: Math.round(stats.winRate * 100) / 100, // Round to 2 decimal places
        },
      });
    } catch (error: any) {
      request.log.error({ error, userId }, 'Failed to get user stats');
      return reply.status(500).send({ error: 'Failed to retrieve user stats' });
    }
  }

  /**
   * GET /api/recent-games/:userId
   * Get user recent games
   */
  public async getUserRecentGames(request: FastifyRequest<{ Params: { userId: string }; Querystring: { limit?: string } }>, reply: FastifyReply): Promise<void> {
    const { userId } = request.params;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;

    if (!userId) {
      return reply.status(400).send({ error: 'User ID is required' });
    }

    try {
      const games = this.dbService.getUserRecentGames(userId, limit);
      return reply.send({
        userId,
        games,
      });
    } catch (error: any) {
      request.log.error({ error, userId }, 'Failed to get recent games');
      return reply.status(500).send({ error: 'Failed to retrieve recent games' });
    }
  }
}
