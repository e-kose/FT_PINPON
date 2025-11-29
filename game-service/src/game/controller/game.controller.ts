import type { FastifyRequest, FastifyReply } from "fastify";
import type { GameService } from "../service/game.service.js";
import {
  createLocalGameSchema,
  updateGameScoreSchema,
  gameQuerySchema,
  type CreateLocalGameInput,
  type UpdateGameScoreInput,
  type GameQueryInput
} from "../schemas/game.schema.js";

export class GameController {
  constructor(private gameService: GameService) {}

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
    this.gameService.deleteGame(request.params.id);

    return reply.status(204).send();
  }
}
