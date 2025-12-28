import type { FastifyRequest, FastifyReply } from "fastify";
import type { GameService } from "../service/game.service.js";
import type { MatchmakingService } from "../service/matchmaking.service.js";
import type { InviteService } from "../service/invite.service.js";
import {
  createLocalGameSchema,
  updateGameScoreSchema,
  gameQuerySchema,
  type CreateLocalGameInput,
  type UpdateGameScoreInput,
  type GameQueryInput
} from "../schemas/game.schema.js";

export class GameController {
  constructor(
    private gameService: GameService,
    private matchmakingService: MatchmakingService,
    private inviteService: InviteService
  ) {}

  /**
   * Create a local game
   * POST /game/local/create
   */
  async createLocalGame(
    request: FastifyRequest<{ Body: CreateLocalGameInput }>,
    reply: FastifyReply
  ) {
    const validatedData = createLocalGameSchema.parse(request.body);

    const game = this.gameService.createLocalGame(
      validatedData.player1_nickname,
      validatedData.player2_nickname,
      validatedData.max_score
    );

    return reply.status(201).send({
      success: true,
      data: game,
      message: 'Local game created successfully'
    });
  }

  /**
   * Get game by ID
   * GET /game/:id
   */
  async getGame(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const game = this.gameService.getGameById(request.params.id);

    return reply.send({
      success: true,
      data: game
    });
  }

  /**
   * Get all games with filters
   * GET /game
   */
  async getGames(
    request: FastifyRequest<{ Querystring: GameQueryInput }>,
    reply: FastifyReply
  ) {
    const validatedQuery = gameQuerySchema.parse(request.query);

    const games = this.gameService.getGames({
      status: validatedQuery.status,
      game_mode: validatedQuery.game_mode,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
    });

    return reply.send({
      success: true,
      data: games,
      count: games.length
    });
  }

  /**
   * Get active games
   * GET /game/active
   */
  async getActiveGames(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const games = this.gameService.getGames({
      status: 'playing',
      limit: 50,
      offset: 0
    });

    return reply.send({
      success: true,
      data: games,
      count: games.length,
      total_active: this.gameService.getActiveGamesCount()
    });
  }

  /**
   * Get player's game history
   * GET /game/history/:userId
   */
  async getPlayerGames(
    request: FastifyRequest<{
      Params: { userId: string };
      Querystring: { limit?: number; offset?: number }
    }>,
    reply: FastifyReply
  ) {
    const userId = parseInt(request.params.userId);
    const { limit = 20, offset = 0 } = request.query;

    const games = this.gameService.getPlayerGames(userId, { limit, offset });

    return reply.send({
      success: true,
      data: games,
      count: games.length
    });
  }

  /**
   * Start a game
   * POST /game/:id/start
   */
  async startGame(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const game = this.gameService.startGame(request.params.id);

    return reply.send({
      success: true,
      data: game,
      message: 'Game started'
    });
  }

  /**
   * Update game score
   * PATCH /game/:id/score
   */
  async updateScore(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateGameScoreInput
    }>,
    reply: FastifyReply
  ) {
    const validatedData = updateGameScoreSchema.parse(request.body);

    const game = this.gameService.updateScore(
      request.params.id,
      validatedData.player1_score,
      validatedData.player2_score
    );

    return reply.send({
      success: true,
      data: game,
      message: 'Score updated'
    });
  }

  /**
   * Finish a game
   * POST /game/:id/finish
   */
  async finishGame(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const game = this.gameService.finishGame(request.params.id);

    return reply.send({
      success: true,
      data: game,
      message: 'Game finished',
      winner: game.winner_nickname || 'Draw'
    });
  }

  /**
   * Cancel a game
   * POST /game/:id/cancel
   */
  async cancelGame(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const game = this.gameService.cancelGame(request.params.id);

    return reply.send({
      success: true,
      data: game,
      message: 'Game cancelled'
    });
  }

  /**
   * Delete a game
   * DELETE /game/:id
   */
  async deleteGame(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      this.gameService.deleteGame(request.params.id);
      return reply.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(404).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  // ============================================================================
  // MATCHMAKING ENDPOINTS
  // ============================================================================

  /**
   * Join matchmaking queue
   * POST /game/matchmaking/join
   */
  async joinMatchmaking(
    request: FastifyRequest<{ Body: { nickname?: string; preferredMaxScore?: number } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.headers['x-user-id'] as string;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: 'User ID is required',
        });
      }

      const playerId = parseInt(userId, 10);
      if (isNaN(playerId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid User ID format',
        });
      }

      // Get nickname from body or use default
      const nickname = request.body?.nickname || `Player_${playerId}`;
      const preferredMaxScore = request.body?.preferredMaxScore || 11;

      request.log.info({ playerId, nickname }, 'User joining matchmaking queue');

      const result = this.matchmakingService.addToQueue({
        playerId,
        nickname,
        preferredMaxScore,
      });

      if (result.matched) {
        return reply.send({
          success: true,
          message: 'Match found!',
          data: {
            matched: true,
            game: result.game,
            opponent: {
              nickname: result.opponent?.nickname,
              playerId: result.opponent?.playerId,
            },
          },
        });
      }

      // Not matched yet, added to queue
      const status = this.matchmakingService.getQueueStatus(playerId);
      return reply.send({
        success: true,
        message: 'Joined matchmaking queue, waiting for opponent',
        data: {
          matched: false,
          position: status.position,
          queueSize: status.queueSize,
          estimatedWait: status.queueSize * 15, // rough estimate: 15 sec per position
        },
      });
    } catch (error) {
      request.log.error({ error }, 'Error joining matchmaking');
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Leave matchmaking queue
   * POST /game/matchmaking/leave
   */
  async leaveMatchmaking(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.headers['x-user-id'] as string;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: 'User ID is required',
        });
      }

      const playerId = parseInt(userId, 10);
      if (isNaN(playerId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid User ID format',
        });
      }

      request.log.info({ playerId }, 'User leaving matchmaking queue');

      const wasInQueue = this.matchmakingService.removeFromQueue(playerId);

      return reply.send({
        success: true,
        message: wasInQueue ? 'Left matchmaking queue' : 'You were not in the queue',
        data: {
          wasInQueue,
          queueSize: this.matchmakingService.getQueueSize(),
        },
      });
    } catch (error) {
      request.log.error({ error }, 'Error leaving matchmaking');
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Get matchmaking queue status
   * GET /game/matchmaking/status
   */
  async getMatchmakingStatus(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.headers['x-user-id'] as string;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: 'User ID is required',
        });
      }

      const playerId = parseInt(userId, 10);
      if (isNaN(playerId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid User ID format',
        });
      }

      const status = this.matchmakingService.getQueueStatus(playerId);

      return reply.send({
        success: true,
        data: {
          inQueue: status.inQueue,
          position: status.position || 0,
          waitTime: status.waitTime || 0,
          queueSize: status.queueSize,
        },
      });
    } catch (error) {
      request.log.error({ error }, 'Error getting matchmaking status');
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  // ============================================================================
  // INVITE ENDPOINTS (Chat → Game)
  // ============================================================================

  /**
   * Send a game invite
   * POST /game/invite/send
   */
  async sendInvite(
    request: FastifyRequest<{
      Body: {
        toUserId: number;
        toNickname?: string;
        maxScore?: number;
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.headers['x-user-id'] as string;
      const nickname = request.headers['x-user-nickname'] as string;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: 'User ID is required',
        });
      }

      const fromUserId = parseInt(userId, 10);
      if (isNaN(fromUserId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid User ID format',
        });
      }

      const { toUserId, toNickname, maxScore } = request.body;

      if (!toUserId || isNaN(toUserId)) {
        return reply.status(400).send({
          success: false,
          message: 'Target user ID is required',
        });
      }

      if (fromUserId === toUserId) {
        return reply.status(400).send({
          success: false,
          message: 'Cannot invite yourself',
        });
      }

      const invite = this.inviteService.createInvite({
        fromUserId,
        fromNickname: nickname || `Player_${fromUserId}`,
        toUserId,
        toNickname,
        maxScore,
      });

      request.log.info({ inviteId: invite.id, fromUserId, toUserId }, 'Game invite sent');

      return reply.status(201).send({
        success: true,
        message: 'Invite sent successfully',
        data: invite,
      });
    } catch (error) {
      request.log.error({ error }, 'Error sending game invite');
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Accept a game invite
   * POST /game/invite/:inviteId/accept
   */
  async acceptInvite(
    request: FastifyRequest<{ Params: { inviteId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.headers['x-user-id'] as string;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: 'User ID is required',
        });
      }

      const acceptorUserId = parseInt(userId, 10);
      if (isNaN(acceptorUserId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid User ID format',
        });
      }

      const { inviteId } = request.params;
      const result = this.inviteService.acceptInvite(inviteId, acceptorUserId);

      request.log.info(
        { inviteId, gameId: result.game.id, acceptorUserId },
        'Game invite accepted, game created'
      );

      // Try to notify connected WebSocket clients (if any)
      try {
        const wsClients: Map<string, Set<any>> | undefined = (request.server as any).wsClients;
        const message = {
          type: "game_started",
          data: {
            gameId: result.game.id,
            player1: {
              id: String(result.invite.from_user_id),
              nickname: result.invite.from_nickname,
            },
            player2: {
              id: String(result.invite.to_user_id),
              nickname: result.invite.to_nickname || `Player_${result.invite.to_user_id}`,
            },
            startTime: Date.now(),
          },
        };

        if (wsClients) {
          const notify = (userId: number) => {
            const set = wsClients.get(String(userId));
            if (!set) return;
            for (const ws of set) {
              try {
                ws.send(JSON.stringify(message));
              } catch (e) {
                // ignore send errors
              }
            }
          };

          notify(result.invite.from_user_id);
          notify(result.invite.to_user_id);
        }
      } catch (e) {
        request.log.warn({ err: e }, 'Failed to send websocket notifications for invite acceptance');
      }

      // Return the game and notification payload for caller
      return reply.send({
        success: true,
        message: 'Invite accepted, game started',
        data: {
          invite: result.invite,
          game: result.game,
          notification: result.notification,
        },
      });
    } catch (error) {
      request.log.error({ error }, 'Error accepting game invite');
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Decline a game invite
   * POST /game/invite/:inviteId/decline
   */
  async declineInvite(
    request: FastifyRequest<{ Params: { inviteId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.headers['x-user-id'] as string;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: 'User ID is required',
        });
      }

      const declinerId = parseInt(userId, 10);
      if (isNaN(declinerId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid User ID format',
        });
      }

      const { inviteId } = request.params;
      const invite = this.inviteService.declineInvite(inviteId, declinerId);

      request.log.info({ inviteId, declinerId }, 'Game invite declined');

      return reply.send({
        success: true,
        message: 'Invite declined',
        data: invite,
      });
    } catch (error) {
      request.log.error({ error }, 'Error declining game invite');
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Cancel a sent invite
   * POST /game/invite/:inviteId/cancel
   */
  async cancelInvite(
    request: FastifyRequest<{ Params: { inviteId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.headers['x-user-id'] as string;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: 'User ID is required',
        });
      }

      const cancellerId = parseInt(userId, 10);
      if (isNaN(cancellerId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid User ID format',
        });
      }

      const { inviteId } = request.params;
      const invite = this.inviteService.cancelInvite(inviteId, cancellerId);

      request.log.info({ inviteId, cancellerId }, 'Game invite cancelled');

      return reply.send({
        success: true,
        message: 'Invite cancelled',
        data: invite,
      });
    } catch (error) {
      request.log.error({ error }, 'Error cancelling game invite');
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Get pending invites for current user
   * GET /game/invite/pending
   */
  async getPendingInvites(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.headers['x-user-id'] as string;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: 'User ID is required',
        });
      }

      const playerId = parseInt(userId, 10);
      if (isNaN(playerId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid User ID format',
        });
      }

      const invites = this.inviteService.getPendingInvites(playerId);

      return reply.send({
        success: true,
        data: invites,
        count: invites.length,
      });
    } catch (error) {
      request.log.error({ error }, 'Error getting pending invites');
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Get sent invites by current user
   * GET /game/invite/sent
   */
  async getSentInvites(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.headers['x-user-id'] as string;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: 'User ID is required',
        });
      }

      const playerId = parseInt(userId, 10);
      if (isNaN(playerId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid User ID format',
        });
      }

      const invites = this.inviteService.getSentInvites(playerId);

      return reply.send({
        success: true,
        data: invites,
        count: invites.length,
      });
    } catch (error) {
      request.log.error({ error }, 'Error getting sent invites');
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }
}
