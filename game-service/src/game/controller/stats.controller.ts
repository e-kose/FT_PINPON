import type { FastifyRequest, FastifyReply } from "fastify";
import type { StatsService } from "../service/stats.service.js";
import {
  leaderboardQuerySchema,
  type LeaderboardQueryInput
} from "../schemas/stats.schema.js";

export class StatsController {
  constructor(private statsService: StatsService) {}

  /**
   * Get user statistics
   * GET /game/stats/:userId
   */
  async getUserStats(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    const userId = parseInt(request.params.userId);
    const stats = this.statsService.getEnrichedUserStats(userId);

    if (!stats) {
      return reply.status(404).send({
        success: false,
        message: 'User statistics not found'
      });
    }

    return reply.send({
      success: true,
      data: stats
    });
  }

  /**
   * Get leaderboard
   * GET /game/leaderboard
   */
  async getLeaderboard(
    request: FastifyRequest<{ Querystring: LeaderboardQueryInput }>,
    reply: FastifyReply
  ) {
    const validatedQuery = leaderboardQuerySchema.parse(request.query);

    const leaderboard = this.statsService.getLeaderboard(
      validatedQuery.sort_by,
      validatedQuery.limit,
      validatedQuery.offset
    );

    // Enrich with additional data
    const enrichedLeaderboard = leaderboard.map((stats, index) => ({
      ...stats,
      rank: (validatedQuery.offset || 0) + index + 1,
      win_rate: this.statsService.calculateWinRate(stats),
      rank_tier_name: this.statsService.getRankTierName(stats.rank_points),
    }));

    return reply.send({
      success: true,
      data: enrichedLeaderboard,
      count: enrichedLeaderboard.length,
      sort_by: validatedQuery.sort_by
    });
  }

  /**
   * Get user ranking position
   * GET /game/stats/:userId/ranking
   */
  async getUserRanking(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    const userId = parseInt(request.params.userId);
    const position = this.statsService.getUserRanking(userId);

    if (position === null) {
      return reply.status(404).send({
        success: false,
        message: 'User not found in rankings'
      });
    }

    const stats = this.statsService.getUserStats(userId);

    return reply.send({
      success: true,
      data: {
        user_id: userId,
        position,
        rank_points: stats?.rank_points || 0,
        rank_tier: stats?.rank_tier || 'bronze',
        rank_tier_name: this.statsService.getRankTierName(stats?.rank_points || 0)
      }
    });
  }
}
